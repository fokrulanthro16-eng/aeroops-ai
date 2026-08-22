import { PRESET_SCENARIOS, buildScenario1Nominal, buildScenario2Amber, buildScenario3Severe } from "../lib/simulation/scenarios";

async function runE2EVerification() {
  console.log("===============================================================");
  console.log("   AERTOPS AI — AUTOMATED E2E & HTTP VERIFICATION SUITE");
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

  // Test 1: Root Cockpit Page GET 200
  console.log("\n1. Testing Frontend Route Rendering:");
  try {
    const resHome = await fetch(`${BASE_URL}/`);
    verify(resHome.status === 200, "Root Dashboard (/) returned HTTP 200 OK");
    const html = await resHome.text();
    verify(html.includes("AERTOPS") || html.includes("MISSION"), "Root page contains AeroOps Cockpit HTML");
  } catch (e) {
    verify(false, `Root page fetch failed: ${(e as Error).message}`);
  }

  // Test 2: Fleet Twin Page GET 200
  try {
    const resFleet = await fetch(`${BASE_URL}/fleet`);
    verify(resFleet.status === 200, "Fleet Twin Dashboard (/fleet) returned HTTP 200 OK");
    const htmlFleet = await resFleet.text();
    verify(htmlFleet.includes("FLEET") || htmlFleet.includes("Vertiport"), "Fleet page contains vertiport twins");
  } catch (e) {
    verify(false, `Fleet page fetch failed: ${(e as Error).message}`);
  }

  // Test 3: Scenario 1 Nominal Verification
  console.log("\n2. Testing Scenario 1 (Nominal / GO 🟢):");
  const s1 = buildScenario1Nominal();
  verify(s1.risk.verdict === "GO", "Scenario 1 verdict is strictly GO");
  verify(s1.risk.failedGatesCount === 0, "Scenario 1 has 0 failed hard gates");
  verify(s1.energy.projectedLandingSocPercent >= 25, `Scenario 1 reserve SOC is ${s1.energy.projectedLandingSocPercent}% (>= 25% requirement)`);
  verify(s1.wind.crosswindKts < s1.aircraft.maxCrosswindKts, `Scenario 1 crosswind (${s1.wind.crosswindKts} kts) within limit (${s1.aircraft.maxCrosswindKts} kts)`);

  // Test 4: Scenario 2 Edge Case Verification
  console.log("\n3. Testing Scenario 2 (Edge Case / AMBER 🟠):");
  const s2 = buildScenario2Amber();
  verify(s2.risk.verdict === "AMBER", "Scenario 2 verdict is AMBER");
  verify(s2.energy.tempDeratePercent > 0, `Scenario 2 cold derate active (-${s2.energy.tempDeratePercent}% capacity)`);
  verify(s2.wind.crosswindKts > 15, `Scenario 2 high crosswind component (${s2.wind.crosswindKts} kts)`);

  // Test 5: Scenario 3 Severe Hazard Verification
  console.log("\n4. Testing Scenario 3 (Severe Hazard / NO-GO 🔴):");
  const s3 = buildScenario3Severe();
  verify(s3.risk.verdict === "NO_GO", "Scenario 3 verdict is strictly NO-GO");
  verify(s3.risk.failedGatesCount >= 3, `Scenario 3 triggers ${s3.risk.failedGatesCount} fatal hard gate failures`);
  verify(s3.airspaceConflicts.some(c => c.status === "RESTRICTION_CONFLICT"), "Scenario 3 has active TFR restriction conflict");

  // Test 6: API /api/analyze Endpoint
  console.log("\n5. Testing /api/analyze Dynamic Engine API:");
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
    const data = await analyzeRes.json();
    verify(data.success === true, "/api/analyze responded with success=true");
    verify(data.data.risk.verdict === "GO", `/api/analyze computed verdict: ${data.data.risk.verdict}`);
    verify(data.data.energy.pointOfNoReturnKm > 0, `Dynamic PONR computed: ${data.data.energy.pointOfNoReturnKm} km`);
  } catch (e) {
    verify(false, `/api/analyze failed: ${(e as Error).message}`);
  }

  // Test 7: API /api/ai/briefing Endpoint
  console.log("\n6. Testing /api/ai/briefing Grounded AI Explainer API:");
  try {
    const aiRes = await fetch(`${BASE_URL}/api/ai/briefing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s1),
    });
    verify(aiRes.status === 200, "/api/ai/briefing returned HTTP 200");
    const aiData = await aiRes.json();
    verify(aiData.success === true, "/api/ai/briefing returned success=true");
    verify(typeof aiData.data.executive_summary === "string", "AI payload includes structured executive_summary");
    verify(Array.isArray(aiData.data.primary_drivers), "AI payload includes primary_drivers array");
    verify(typeof aiData.data.voice_briefing_transcript === "string", "AI payload includes voice_briefing_transcript");
    console.log(`   AI Model Used: ${aiData.data.model_used}`);
    console.log(`   Sample Voice Transmission: "${aiData.data.voice_briefing_transcript}"`);
  } catch (e) {
    verify(false, `/api/ai/briefing failed: ${(e as Error).message}`);
  }

  // Test 8: API /api/weather Live NOAA METAR Endpoint
  console.log("\n7. Testing /api/weather NOAA METAR Ingestion:");
  try {
    const wxRes = await fetch(`${BASE_URL}/api/weather?icao=KLAX`);
    verify(wxRes.status === 200, "/api/weather?icao=KLAX returned HTTP 200");
    const wxData = await wxRes.json();
    verify(wxData.success === true, "/api/weather returned valid METAR object");
    verify(wxData.data.station === "KLAX", `Ingested weather station: ${wxData.data.station}`);
    console.log(`   Station: ${wxData.data.station}, Temp: ${wxData.data.tempC}°C, Wind: ${wxData.data.windSpeedKts} kts @ ${wxData.data.windDirDeg}°`);
  } catch (e) {
    verify(false, `/api/weather failed: ${(e as Error).message}`);
  }

  console.log("\n===============================================================");
  console.log(`E2E AUDIT RESULTS: ${passCount} VERIFIED, ${failCount} FAILED`);
  console.log("===============================================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    console.log("All AeroOps AI end-to-end scenarios & APIs are 100% verified!");
    process.exit(0);
  }
}

runE2EVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});