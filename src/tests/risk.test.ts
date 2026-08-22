import {
  evaluateHardGates,
  calculate5FactorRiskScores,
  evaluateMissionRisk,
} from "../lib/risk";
import { decomposeWindVector } from "../lib/weather";
import { calculateEnergyAndPONR } from "../lib/energy";
import { MOCK_AIRCRAFT_FLEET, MOCK_VERTIPORTS } from "../lib/simulation/scenarios";
import { AirspaceConflict, WeatherData } from "@/types/aviation";

export function runRiskTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log("\n[RUNNING HARD SAFETY GATES & RISK MODEL TESTS]");
  const aircraft = MOCK_AIRCRAFT_FLEET[0]; // MTOW 2450kg, Max Payload 450kg, Max Crosswind 22kts
  const origin = MOCK_VERTIPORTS[0];
  const dest = MOCK_VERTIPORTS[1];

  const nominalWeather: WeatherData = {
    station: "KLAX",
    timestamp: new Date().toISOString(),
    tempC: 20,
    dewpointC: 12,
    windSpeedKts: 8,
    windDirDeg: 270,
    windGustKts: 0,
    visibilitySm: 10,
    altimeterInHg: 29.92,
    cloudCeilingFt: 10000,
    flightCategory: "VFR",
    rawMetar: "KLAX VFR TEST",
    isSimulated: true,
  };

  const nominalWind = decomposeWindVector(8, 270, 360, 110, 22);
  const nominalEnergy = calculateEnergyAndPONR(aircraft, 40, 200, 95, 20, nominalWind);
  const noConflicts: AirspaceConflict[] = [];

  // Test 1: Nominal Flight should PASS all hard gates and yield GO
  const nominalAssessment = evaluateMissionRisk(
    aircraft,
    200,
    nominalWind,
    nominalEnergy,
    noConflicts,
    nominalWeather,
    "SIM"
  );
  assert(
    nominalAssessment.verdict === "GO",
    `Nominal flight must result in GO verdict (Got ${nominalAssessment.verdict})`
  );
  assert(
    nominalAssessment.failedGatesCount === 0,
    `Nominal flight must have 0 failed hard gates (Got ${nominalAssessment.failedGatesCount})`
  );
  assert(
    nominalAssessment.compositeScore < 30,
    `Nominal composite risk score must be < 30 (Got ${nominalAssessment.compositeScore})`
  );

  // Test 2: MTOW / Max Payload Exceedance Hard Gate Failure
  const heavyPayload = 550; // Max is 450
  const heavyGates = evaluateHardGates(
    aircraft,
    heavyPayload,
    nominalWind,
    nominalEnergy,
    noConflicts,
    nominalWeather,
    "SIM"
  );
  const mtowGate = heavyGates.find((g) => g.gateId === "GATE-01-MTOW");
  assert(
    mtowGate?.passed === false,
    `Overweight payload (550kg vs 450kg) must fail GATE-01-MTOW`
  );

  // Test 3: Critical TFR Intersection Hard Gate Failure
  const tfrConflicts: AirspaceConflict[] = [
    {
      zoneId: "TFR-01",
      zoneName: "VIP TFR",
      type: "TFR",
      severity: "CRITICAL",
      distanceToCorridorNm: 0.5,
      isIntersecting: true,
      status: "RESTRICTION_CONFLICT",
      details: "TFR Intersection",
    },
  ];
  const tfrAssessment = evaluateMissionRisk(
    aircraft,
    200,
    nominalWind,
    nominalEnergy,
    tfrConflicts,
    nominalWeather,
    "SIM"
  );
  assert(
    tfrAssessment.verdict === "NO_GO",
    `Active TFR conflict must FORCE verdict to NO_GO (Got ${tfrAssessment.verdict})`
  );
  assert(
    tfrAssessment.hardGates.find((g) => g.gateId === "GATE-03-AIRSPACE-TFR")?.passed === false,
    `Active TFR must fail GATE-03-AIRSPACE-TFR`
  );

  // Test 4: Crosswind Limit Hard Gate Failure
  const severeWind = decomposeWindVector(35, 90, 360, 110, 22); // 35 kt crosswind vs 22 kt limit
  const crosswindAssessment = evaluateMissionRisk(
    aircraft,
    200,
    severeWind,
    nominalEnergy,
    noConflicts,
    nominalWeather,
    "SIM"
  );
  assert(
    crosswindAssessment.verdict === "NO_GO",
    `Exceeded crosswind (35 kts vs 22 kts) must yield NO_GO (Got ${crosswindAssessment.verdict})`
  );
  assert(
    crosswindAssessment.hardGates.find((g) => g.gateId === "GATE-04-CROSSWIND-LIMIT")?.passed === false,
    `Exceeded crosswind must fail GATE-04-CROSSWIND-LIMIT`
  );

  // Test 5: 5-Factor Risk Weighting Calculation
  const factors = calculate5FactorRiskScores(
    nominalWeather,
    nominalWind,
    nominalEnergy,
    noConflicts,
    aircraft,
    200
  );
  assert(
    factors.weather >= 0 && factors.weather <= 100,
    `Weather risk factor must be in range 0-100 (Got ${factors.weather})`
  );
  assert(
    factors.energy >= 0 && factors.energy <= 100,
    `Energy risk factor must be in range 0-100 (Got ${factors.energy})`
  );

  return { passed, failed, errors };
}