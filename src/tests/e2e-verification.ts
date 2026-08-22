import { PRESET_SCENARIOS, buildScenario1Nominal, buildScenario2Amber, buildScenario3Severe } from "../lib/simulation/scenarios";
import { computeInFlightTelemetryFrame } from "../lib/telemetry-stream";
import { calculateVenturiWindAmplification } from "../lib/micro-weather";
import { verifyLedgerIntegrity } from "../lib/blackbox-crypto";

async function runE2EVerification() {
  console.log("===============================================================");
  console.log("   AERTOPS AI v2.0 — E2E & ENTERPRISE VERIFICATION SUITE");
  console.log("===============================================================");

  let passCount = 0;
  let failCount = 0;

  function verify(condition: boolean, title: string) {
    if (condition) {
      passCount++;
      console.log(`  [PASS] ✓ ${title}`);
    } else {
      failCount++;
      console.error(`  [FAIL] ✗ ${title}`);
    }
  }

  const BASE_URL = "http://localhost:3000";

  // 1. Frontend Route Rendering
  console.log("\n1. Testing Frontend Route Rendering:");
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    verify(resHome.status === 200, "Root Dashboard (/) returned HTTP 200 OK");
    const html = await resHome.text();
    verify(html.includes("AERTOPS") || html.includes("MISSION"), "Root page contains AeroOps Cockpit HTML");
  } catch (e) {
    verify(false, `Root page fetch failed: ${(e as Error).message}`);
  }

  try {
    const resFleet = await fetch(`${BASE_URL}/fleet`);
    verify(resFleet.status === 200, "Fleet Twin Dashboard (/fleet) returned HTTP 200 OK");
  } catch (e) {
    verify(false, `Fleet page fetch failed: ${(e as Error).message}`);
  }

  // 2. Preset Scenarios (v1 + v2 augmented)
  console.log("\n2. Testing Preset Mission Scenarios:");
  const s1 = buildScenario1Nominal();
  verify(s1.risk.verdict === "GO", "Scenario 1 verdict is GO");
  verify(s1.blackboxLedger !== undefined, "Scenario 1 includes SHA-256 Merkle audit ledger");
  verify(s1.vertiportOps?.lockedSlotPadId !== undefined, "Scenario 1 has locked vertiport arrival slot");

  const s2 = buildScenario2Amber();
  verify(s2.risk.verdict === "AMBER", "Scenario 2 verdict is AMBER");
  verify(s2.microWeatherSegments?.length === 3, "Scenario 2 includes 3 urban micro-weather segments");

  const s3 = buildScenario3Severe();
  verify(s3.risk.verdict === "NO_GO", "Scenario 3 verdict is NO-GO");

  // 3. v2 In-Flight Telemetry & Diversion Engine
  console.log("\n3. Testing v2.0 In-Flight Telemetry & Diversion Calculus:");
  const tMid = computeInFlightTelemetryFrame(s1, 250);
  verify(tMid.flightPhase === "CLIMB" || tMid.flightPhase === "CRUISE", `In-flight phase: ${tMid.flightPhase}`);
  verify(tMid.batteryCellTempC > s1.weather.tempC, `Cell temp (${tMid.batteryCellTempC}°C) tracks above ambient`);

  const tDivert = computeInFlightTelemetryFrame(s1, 300, {
    speedMultiplier: 1,
    injectedWindShearKt: 32,
  });
  verify(tDivert.flightPhase === "DIVERTING", "In-air wind shear triggers DIVERTING state");
  verify(tDivert.diversionTargetIcao === "KBUR", "Alternate diversion target locked to KBUR");

  // 4. v2 Urban Canyon Venturi Modeler
  console.log("\n4. Testing Urban Canyon Venturi Modeler:");
  const venturi = calculateVenturiWindAmplification(15, 0.6, 1.5);
  verify(venturi.amplifiedWindKt === 28.5, `Venturi calculation: 15kt base -> ${venturi.amplifiedWindKt}kt amplified (amplification ratio ${venturi.amplificationRatio}x)`);

  // 5. v2 Cryptographic Merkle Ledger Verification
  console.log("\n5. Testing Cryptographic Blackbox Ledger:");
  const ledgerAudit = verifyLedgerIntegrity(s1.blackboxLedger!);
  verify(ledgerAudit.isValid === true, "Mission blackbox SHA-256 Merkle chain is 100% valid");

  // 6. Dynamic APIs
  console.log("\n6. Testing Dynamic Endpoints:");
  try {
    const analyzeRes = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aircraft: s1.aircraft,
        origin: s1.origin,
        destination: s1.destination,
        routeDistanceKm: s1.routeDistanceKm,
        routeHeadingDeg: s1.routeHeadingDeg,
        plannedPayloadKg: s1.plannedPayloadKg,
        initialSocPercent: s1.initialSocPercent,
        weather: s1.weather,
        mode: "SIM",
        enableTfr: false,
      }),
    });
    verify(analyzeRes.status === 200, "/api/analyze returned HTTP 200");
  } catch (e) {
    verify(false, `/api/analyze failed: ${(e as Error).message}`);
  }

  console.log("\n===============================================================");
  console.log(`E2E AUDIT RESULTS: ${passCount} VERIFIED, ${failCount} FAILED`);
  console.log("===============================================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log("All AeroOps AI v2.0 Enterprise systems & APIs verified!");
    process.exit(0);
  }
}

runE2EVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});