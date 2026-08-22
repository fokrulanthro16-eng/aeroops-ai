import { decomposeWindVector } from "../lib/weather";
import { calculateEnergyAndPONR } from "../lib/energy";
import { MOCK_AIRCRAFT_FLEET } from "../lib/simulation/scenarios";

export function runPhysicsTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log("\n[RUNNING PHYSICS & WIND VECTOR TESTS]");

  // Test 1: Direct Headwind (Route 360, Wind from 360 at 20 kts)
  const headwindResult = decomposeWindVector(20, 360, 360, 100, 25);
  assert(
    Math.abs(headwindResult.headwindKts - 20) < 0.1,
    `Direct headwind should be ~20 kts (Got ${headwindResult.headwindKts})`
  );
  assert(
    Math.abs(headwindResult.crosswindKts - 0) < 0.1,
    `Direct headwind should have ~0 crosswind (Got ${headwindResult.crosswindKts})`
  );
  assert(
    Math.abs(headwindResult.groundSpeedKts - 80) < 0.1,
    `Ground speed should be 100 - 20 = 80 kts (Got ${headwindResult.groundSpeedKts})`
  );

  // Test 2: Pure 90-degree Crosswind (Route 360, Wind from 090 at 20 kts)
  const crosswindResult = decomposeWindVector(20, 90, 360, 100, 25);
  assert(
    Math.abs(crosswindResult.crosswindKts - 20) < 0.1,
    `90-degree wind should yield full 20 kt crosswind (Got ${crosswindResult.crosswindKts})`
  );
  assert(
    Math.abs(crosswindResult.headwindKts - 0) < 0.1,
    `90-degree wind should have 0 headwind (Got ${crosswindResult.headwindKts})`
  );
  assert(
    !crosswindResult.isCrosswindExceeded,
    `20 kt crosswind should not exceed 25 kt limit`
  );

  // Test 3: Exceeded Crosswind (Wind 30 kts at 90 deg, Limit 22 kts)
  const exceededResult = decomposeWindVector(30, 90, 360, 100, 22);
  assert(
    exceededResult.isCrosswindExceeded === true,
    `30 kt crosswind must trigger crosswind exceedance flag`
  );

  // Test 4: Cold Temperature Battery Derating (< 10°C)
  console.log("\n[RUNNING BATTERY & PONR ENERGY TESTS]");
  const aircraft = MOCK_AIRCRAFT_FLEET[0]; // 180 kWh
  const energyCold = calculateEnergyAndPONR(
    aircraft,
    50,
    200,
    100,
    0, // 0°C => 10 degrees below 10 => 8% derate
    headwindResult
  );
  assert(
    Math.abs(energyCold.tempDeratePercent - 8.0) < 0.1,
    `At 0°C, temperature derate should be exactly 8.0% (Got ${energyCold.tempDeratePercent}%)`
  );
  assert(
    energyCold.usableCapacityKwh < aircraft.batteryCapacityKwh,
    `Usable capacity (${energyCold.usableCapacityKwh} kWh) must be less than nominal (${aircraft.batteryCapacityKwh} kWh)`
  );

  // Test 5: Dynamic Point of No Return (PONR) Calculation
  assert(
    energyCold.pointOfNoReturnKm > 0 && energyCold.pointOfNoReturnKm <= 50,
    `Dynamic PONR (${energyCold.pointOfNoReturnKm} km) must be between 0 and route distance (50 km)`
  );
  assert(
    energyCold.ponrTimelinePercent > 0 && energyCold.ponrTimelinePercent <= 100,
    `PONR timeline percentage (${energyCold.ponrTimelinePercent}%) must be within 0-100%`
  );

  return { passed, failed, errors };
}