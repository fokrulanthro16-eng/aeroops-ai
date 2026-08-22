import { computeInFlightTelemetryFrame } from "../lib/telemetry-stream";
import { buildScenario1Nominal } from "../lib/simulation/scenarios";

export function runTelemetryTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      errors.push(message);
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  console.log("\n[RUNNING IN-FLIGHT TELEMETRY & DIVERSION ENGINE TESTS]");
  const mission = buildScenario1Nominal();

  // Test 1: Pre-Departure initial state (t = 0)
  const t0 = computeInFlightTelemetryFrame(mission, 0);
  assert(
    t0.flightPhase === "PRE_DEPARTURE",
    `Initial telemetry state at t=0 must be PRE_DEPARTURE (Got ${t0.flightPhase})`
  );
  assert(
    t0.distanceFlownKm === 0,
    `Initial distance flown must be 0 km (Got ${t0.distanceFlownKm})`
  );
  assert(
    t0.liveBatterySoc === mission.energy.initialSocPercent,
    `Initial live battery SOC must match departure SOC ${mission.energy.initialSocPercent}% (Got ${t0.liveBatterySoc}%)`
  );

  // Test 2: Climb and Cruise Progression (t = 300s)
  const tMid = computeInFlightTelemetryFrame(mission, 300);
  assert(
    tMid.flightPhase === "CLIMB" || tMid.flightPhase === "CRUISE",
    `Mid-flight phase must be CLIMB or CRUISE (Got ${tMid.flightPhase})`
  );
  assert(
    tMid.distanceFlownKm > 0 && tMid.distanceFlownKm < mission.routeDistanceKm,
    `Mid-flight distance (${tMid.distanceFlownKm} km) must be within 0 to ${mission.routeDistanceKm} km`
  );
  assert(
    tMid.liveBatterySoc < mission.energy.initialSocPercent,
    `Mid-flight live SOC (${tMid.liveBatterySoc}%) must decay below initial (${mission.energy.initialSocPercent}%)`
  );
  assert(
    tMid.batteryCellTempC > mission.weather.tempC,
    `Active battery cell temperature (${tMid.batteryCellTempC}°C) must exceed ambient (${mission.weather.tempC}°C)`
  );

  // Test 3: Injected Severe Wind Shear Past PONR Triggering Autonomous Diversion
  const tShear = computeInFlightTelemetryFrame(mission, 350, {
    speedMultiplier: 1,
    injectedWindShearKt: 32, // > 28 kt severe wind shear
  });
  assert(
    tShear.flightPhase === "DIVERTING",
    `Severe wind shear (> 28 kts) past PONR must trigger DIVERTING state (Got ${tShear.flightPhase})`
  );
  assert(
    tShear.recommendedAction === "DIVERT_TO_ALTERNATE",
    `Autonomous diversion must recommend DIVERT_TO_ALTERNATE (Got ${tShear.recommendedAction})`
  );
  assert(
    tShear.diversionTargetIcao === "KBUR",
    `Alternate diversion target must be Burbank Vertiport KBUR (Got ${tShear.diversionTargetIcao})`
  );

  // Test 4: Injected Battery Degradation Anomaly Triggering Diversion
  const tBatteryFault = computeInFlightTelemetryFrame(mission, 200, {
    speedMultiplier: 1,
    injectedSocDegradationPercent: 8, // > 5% deficit
  });
  assert(
    tBatteryFault.flightPhase === "DIVERTING",
    `Battery degradation > 5% must initiate autonomous diversion (Got ${tBatteryFault.flightPhase})`
  );
  assert(
    tBatteryFault.diversionReason?.includes("Battery depletion anomaly") === true,
    `Diversion reason must flag battery depletion anomaly`
  );

  return { passed, failed, errors };
}