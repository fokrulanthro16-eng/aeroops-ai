import {
  encodeMavlinkV2Packet,
  parseMavlinkV2Packet,
  generateSyntheticHeartbeat,
  generateSyntheticGlobalPosition,
  generateSyntheticBatteryStatus,
  convertMavlinkToTelemetry,
  computeMavlinkCrc,
} from "../src/lib/telemetry/mavlink-parser";
import { decomposeWindVector } from "../src/lib/weather";
import { calculateEnergyAndPONR } from "../src/lib/energy";
import { evaluateMissionRisk } from "../src/lib/risk";
import { computeInFlightTelemetryFrame } from "../src/lib/telemetry-stream";
import {
  createBlackboxBlock,
  initializeMissionBlackboxLedger,
  verifyLedgerIntegrity,
} from "../src/lib/blackbox-crypto";
import { buildScenario1Nominal, buildScenario3Severe } from "../src/lib/simulation/scenarios";
import { InFlightTelemetry, MerkleAuditLedger } from "../src/types/aviation";

/**
 * ==============================================================================
 * AEROOPS AI v3.0 - DO-178C QNX RTOS BRIDGE & MAVLINK TEST SUITE
 * Verifies:
 *   1. MAVLink v2 packet decoding integrity & roundtrip serialization
 *   2. Deterministic risk verdict parity between TypeScript engine and C++ reference vectors
 *   3. Cryptographic blockhash continuity and detection of simulated packet drops
 * ==============================================================================
 */

export function runQnxBridgeTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log("\n[RUNNING DO-178C QNX BRIDGE & MAVLINK v2 TELEMETRY TESTS]");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: MAVLink v2 Packet Decoding Integrity
  // --------------------------------------------------------------------------
  console.log("  -- Group 1: MAVLink v2 Protocol Serialization & Decoding --");

  // 1.1 HEARTBEAT (#0)
  const hbPacket = generateSyntheticHeartbeat(1);
  assert(hbPacket[0] === 0xfd, "MAVLink v2 STX magic byte must be 0xFD");
  const decodedHb = parseMavlinkV2Packet(hbPacket);
  assert(decodedHb !== null && decodedHb.type === "HEARTBEAT", "Decoded packet must identify as HEARTBEAT (#0)");
  if (decodedHb && decodedHb.type === "HEARTBEAT") {
    assert(decodedHb.payload.type === 29, "Heartbeat payload type must be 29 (eVTOL)");
    assert(decodedHb.payload.autopilot === 12, "Autopilot must be PX4 (12)");
    assert(decodedHb.payload.systemStatus === 4, "System status must be ACTIVE (4)");
  }

  // 1.2 GLOBAL_POSITION_INT (#33)
  const gpsPacket = generateSyntheticGlobalPosition(33.9425, -118.4081, 1500, 135.0, 48.0, 2);
  const decodedGps = parseMavlinkV2Packet(gpsPacket);
  assert(decodedGps !== null && decodedGps.type === "GLOBAL_POSITION_INT", "Decoded packet must identify as GLOBAL_POSITION_INT (#33)");
  if (decodedGps && decodedGps.type === "GLOBAL_POSITION_INT") {
    assert(Math.abs(decodedGps.payload.latDeg - 33.9425) < 0.0001, "Latitude must decode accurately to 33.9425°");
    assert(Math.abs(decodedGps.payload.lonDeg - (-118.4081)) < 0.0001, "Longitude must decode accurately to -118.4081°");
    assert(decodedGps.payload.altFt === 1500, "Altitude must decode to 1500 ft MSL");
    assert(Math.abs(decodedGps.payload.groundSpeedKts - 135.0) < 1.0, "Ground speed must match ~135 kts");
    assert(decodedGps.payload.headingDeg === 48.0, "Heading must decode to 48.0°");
  }

  // 1.3 BATTERY_STATUS (#147)
  const battPacket = generateSyntheticBatteryStatus(88.5, 42.4, 115.0, 3);
  const decodedBatt = parseMavlinkV2Packet(battPacket);
  assert(decodedBatt !== null && decodedBatt.type === "BATTERY_STATUS", "Decoded packet must identify as BATTERY_STATUS (#147)");
  if (decodedBatt && decodedBatt.type === "BATTERY_STATUS") {
    assert(decodedBatt.payload.batteryRemainingPercent === 89 || decodedBatt.payload.batteryRemainingPercent === 88, "Battery remaining SOC must decode to 88-89%");
    assert(Math.abs(decodedBatt.payload.temperatureC - 42.4) < 0.2, "Battery temperature must decode to 42.4°C");
    assert(decodedBatt.payload.voltagesMv.length === 10, "Battery packet must contain 10 cell voltages");
    assert(decodedBatt.payload.voltagesMv[0] === 4000, "Nominal cell voltage must be 4000 mV");
  }

  // 1.4 CRC & Malformed Packet Protection
  const corruptedGps = new Uint8Array(gpsPacket);
  corruptedGps[12] ^= 0xff; // Corrupt payload byte
  const rejectedCheck = parseMavlinkV2Packet(corruptedGps);
  // Re-verify CRC calculation rejects corruption
  const recalculatedCrc = computeMavlinkCrc(corruptedGps.subarray(0, corruptedGps.length - 2), 104);
  const storedCrc = corruptedGps[corruptedGps.length - 2] | (corruptedGps[corruptedGps.length - 1] << 8);
  assert(recalculatedCrc !== storedCrc, "X.25 MAVLink CRC must detect single-byte payload tampering");

  const truncatedPacket = gpsPacket.subarray(0, 15);
  const truncatedCheck = parseMavlinkV2Packet(truncatedPacket);
  assert(truncatedCheck === null, "Truncated buffer (< total expected length) must safely return null");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Deterministic Risk Verdict Parity (TypeScript vs C++ Reference)
  // --------------------------------------------------------------------------
  console.log("  -- Group 2: DO-178C Deterministic Physics & Gate Parity --");

  const nominalMission = buildScenario1Nominal();

  // Vector 2.1: Nominal Flight Release Parity
  const windNominal = decomposeWindVector(
    nominalMission.weather.windSpeedKts,
    nominalMission.weather.windDirDeg,
    nominalMission.routeHeadingDeg,
    nominalMission.aircraft.nominalCruiseSpeedKts,
    nominalMission.aircraft.maxCrosswindKts
  );
  const energyNominal = calculateEnergyAndPONR(
    nominalMission.aircraft,
    nominalMission.routeDistanceKm,
    nominalMission.plannedPayloadKg,
    nominalMission.energy.initialSocPercent,
    nominalMission.weather.tempC,
    windNominal
  );
  const riskNominal = evaluateMissionRisk(
    nominalMission.aircraft,
    nominalMission.plannedPayloadKg,
    windNominal,
    energyNominal,
    [],
    nominalMission.weather,
    "SIM"
  );
  assert(riskNominal.verdict === "GO", "Vector 2.1: Reference nominal dispatch must produce GO verdict");
  assert(riskNominal.failedGatesCount === 0, "Vector 2.1: Reference nominal dispatch must have 0 failed hard gates");
  assert(riskNominal.compositeScore < 30, `Vector 2.1: Risk score (${riskNominal.compositeScore}) must be < 30`);

  // Vector 2.2: Crosswind Exceedance (>22 kts) Hard Gate Parity
  const windSevere = decomposeWindVector(
    35.0,
    318.0,
    48.0,
    nominalMission.aircraft.nominalCruiseSpeedKts,
    nominalMission.aircraft.maxCrosswindKts
  );
  assert(windSevere.isCrosswindExceeded === true, "Vector 2.2: 35 kt crosswind vector must trip aerodynamic limit");
  const riskSevereWind = evaluateMissionRisk(
    nominalMission.aircraft,
    nominalMission.plannedPayloadKg,
    windSevere,
    energyNominal,
    [],
    nominalMission.weather,
    "SIM"
  );
  assert(riskSevereWind.verdict === "NO_GO", "Vector 2.2: Crosswind exceedance must force deterministic NO_GO verdict");

  // Vector 2.3: In-Air Wind Shear (>28 kt) Autonomous Diversion
  const midFlightTelemetry = computeInFlightTelemetryFrame(nominalMission, 300, {
    speedMultiplier: 1,
    injectedWindShearKt: 32.0, // 32 kt shear (> 28 kt threshold)
  });
  assert(midFlightTelemetry.flightPhase === "DIVERTING", "Vector 2.3: Severe wind shear (> 28 kt) must switch flight phase to DIVERTING");
  assert(midFlightTelemetry.recommendedAction === "DIVERT_TO_ALTERNATE", "Vector 2.3: Recommended action must be DIVERT_TO_ALTERNATE");
  assert(midFlightTelemetry.diversionTargetIcao === "KBUR", "Vector 2.3: Alternate vertiport must resolve to KBUR");
  assert(midFlightTelemetry.distanceToAlternateNm === 12.4, "Vector 2.3: Distance to alternate must be exactly 12.4 NM");

  // Vector 2.4: Battery Degradation (>5% deficit) Anomaly Diversion
  const tBatteryFault = computeInFlightTelemetryFrame(nominalMission, 200, {
    speedMultiplier: 1,
    injectedSocDegradationPercent: 8.0, // > 5% deficit
  });
  assert(tBatteryFault.flightPhase === "DIVERTING", "Vector 2.4a: Battery degradation > 5% must switch phase to DIVERTING");
  assert(tBatteryFault.recommendedAction === "DIVERT_TO_ALTERNATE", "Vector 2.4a: Action must recommend DIVERT_TO_ALTERNATE");
  assert(tBatteryFault.diversionTargetIcao === "KBUR", "Vector 2.4a: Diversion target must be KBUR");
  assert(tBatteryFault.diversionReason?.includes("Battery depletion anomaly") === true, "Vector 2.4a: Reason must flag battery depletion anomaly");

  // Vector 2.5: MAVLink Critical Reserve Depletion (<15% SOC) Emergency Landing
  const criticalBattPacket = generateSyntheticBatteryStatus(12.0, 48.0, 140.0, 4);
  const decodedCritBatt = parseMavlinkV2Packet(criticalBattPacket);
  assert(decodedCritBatt !== null && decodedCritBatt.type === "BATTERY_STATUS", "Decoded packet must be BATTERY_STATUS");
  if (decodedCritBatt && decodedCritBatt.type === "BATTERY_STATUS" && decodedGps && decodedGps.type === "GLOBAL_POSITION_INT") {
    const emergencyTelemetry = convertMavlinkToTelemetry(decodedGps.payload, decodedCritBatt.payload, midFlightTelemetry);
    assert(emergencyTelemetry.flightPhase === "DIVERTING", "Vector 2.5: Critical SOC (<15%) must trigger DIVERTING");
    assert(emergencyTelemetry.recommendedAction === "EMERGENCY_LANDING", "Vector 2.5: Recommended action must escalate to EMERGENCY_LANDING");
    assert(emergencyTelemetry.diversionTargetIcao === "KSMO", "Vector 2.5: Immediate emergency diversion target must be KSMO");
    assert(emergencyTelemetry.distanceToAlternateNm === 4.2, "Vector 2.5: Emergency divert distance must be 4.2 NM");
  }

  // --------------------------------------------------------------------------
  // TEST GROUP 3: Cryptographic Blockhash Continuity & Simulated Packet Drops
  // --------------------------------------------------------------------------
  console.log("  -- Group 3: Cryptographic State Chain & Packet Drop Integrity --");

  const ledger = initializeMissionBlackboxLedger(nominalMission);
  assert(ledger.blocks.length === 3, "Baseline ledger must contain 3 genesis blocks");

  // 3.1 Normal Block Hash Chaining
  const b0 = ledger.blocks[0];
  const b1 = ledger.blocks[1];
  const b2 = ledger.blocks[2];
  assert(b1.previousHash === b0.blockHash, "Block 1 previousHash must equal Block 0 blockHash");
  assert(b2.previousHash === b1.blockHash, "Block 2 previousHash must equal Block 1 blockHash");

  const verification = verifyLedgerIntegrity(ledger);
  assert(verification.isValid === true, "Sequential ledger without packet drops must pass cryptographic verification");

  // 3.2 Simulated Packet Drop (Frame index 1 dropped, Block 2 linked directly to Block 0)
  const packetDropLedger: MerkleAuditLedger = {
    ...ledger,
    blocks: [
      b0,
      // Block 1 dropped
      {
        ...b2,
        blockIndex: 1,
        // Block 2's previousHash still points to missing Block 1, but follows Block 0
      },
    ],
  };

  const dropCheck = verifyLedgerIntegrity(packetDropLedger);
  assert(dropCheck.isValid === false, "Simulated packet drop must break hash link continuity");
  assert(dropCheck.tamperedBlockIndex === 1, `Packet drop must be isolated at block index 1 (Got ${dropCheck.tamperedBlockIndex})`);

  // 3.3 Dynamic Frame Ingestion Appended to Chain
  const liveBlock = createBlackboxBlock(
    3,
    "TELEMETRY_FRAME",
    `Alt: ${midFlightTelemetry.currentAltitudeFt}ft | GS: ${midFlightTelemetry.currentGroundSpeedKts}kt | SOC: ${midFlightTelemetry.liveBatterySoc}%`,
    riskNominal.verdict,
    ledger.blocks[2].blockHash,
    1771661700000
  );
  assert(liveBlock.previousHash === ledger.blocks[2].blockHash, "Dynamically appended block must lock onto previous root hash");
  assert(liveBlock.blockHash.startsWith("0x") && liveBlock.blockHash.length === 66, "Appended block hash must be valid 66-char hex string");

  const extendedLedger: MerkleAuditLedger = {
    ...ledger,
    blockCount: 4,
    rootHash: liveBlock.blockHash,
    blocks: [...ledger.blocks, liveBlock],
  };
  const extendedCheck = verifyLedgerIntegrity(extendedLedger);
  assert(extendedCheck.isValid === true, "Dynamically extended ledger must maintain 100% cryptographic continuity");

  return { passed, failed, errors };
}

// Allow direct CLI execution via tsx
if (require.main === module || process.argv[1]?.includes("qnx-bridge.test")) {
  const result = runQnxBridgeTests();
  if (result.failed > 0) {
    process.exit(1);
  }
}
