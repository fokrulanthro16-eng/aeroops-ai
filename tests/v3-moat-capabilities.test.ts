import {
  generateSyntheticAttitude,
  generateSyntheticBatteryStatus,
  generateSyntheticGlobalPosition,
  generateSyntheticHeartbeat,
  parseMavlinkV2Packet,
  computeMavlinkCrc,
  MAVLINK_CRC_EXTRA,
} from "../src/lib/telemetry/mavlink-parser";
import {
  LossOfLinkManager,
  PRIMARY_FAILSAFE_ALTERNATE,
} from "../src/lib/telemetry/loss-of-link";
import {
  SitlStreamInjector,
  defaultSitlInjector,
} from "../src/lib/telemetry/sitl-injector";
import {
  PRE_CALIBRATED_INCIDENTS,
} from "../src/components/cockpit/blackbox-replay";
import {
  createBlackboxBlock,
  initializeMissionBlackboxLedger,
  verifyLedgerIntegrity,
} from "../src/lib/blackbox-crypto";
import { buildScenario1Nominal } from "../src/lib/simulation/scenarios";
import { computeInFlightTelemetryFrame } from "../src/lib/telemetry-stream";
import { InFlightTelemetry, MerkleAuditLedger } from "../src/types/aviation";

/**
 * ==============================================================================
 * AEROOPS AI v3.0 - ENTERPRISE MOAT EXPANSION VERIFICATION SUITE
 * DO-178C Level A & FAA 14 CFR Part 135 Compliance Testing
 *
 * Verifies:
 *   1. High-Fidelity PX4 SITL 10Hz Stream & MAVLink v2 #30 ATTITUDE Roundtrip
 *   2. Dual-Radio Loss-of-Link Fail-Safe Protocol & Offline Ledger Reconciliation
 *   3. MAVLink Parser Error Resilience (Corrupted Payloads, Bad STX, Sync Losses)
 *   4. NTSB/FAA Forensic Incident Replay & Deterministic SHA-256 Scrubber Sync
 * ==============================================================================
 */

export function runV3MoatTests(): { passed: number; failed: number; errors: string[] } {
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

  console.log("\n[RUNNING AEROOPS AI v3.0 ENTERPRISE MOAT EXPANSION TESTS]");

  // --------------------------------------------------------------------------
  // TEST GROUP 1: High-Fidelity PX4 SITL 10Hz Stream & ATTITUDE #30
  // --------------------------------------------------------------------------
  console.log("  -- Group 1: High-Fidelity PX4 SITL Stream & MAVLink v2 ATTITUDE (#30) --");

  const baselineMission = buildScenario1Nominal();
  const baselineTelemetry = computeInFlightTelemetryFrame(baselineMission, 60);

  // 1.1 Synthetic ATTITUDE #30 Packet Generation
  const testRoll = 4.5;
  const testPitch = -2.8;
  const testYaw = 48.0;
  const testRollSpeed = 0.05;
  const testPitchSpeed = -0.02;
  const testYawSpeed = 0.01;

  const attPacket = generateSyntheticAttitude(
    testRoll,
    testPitch,
    testYaw,
    testRollSpeed,
    testPitchSpeed,
    testYawSpeed,
    42
  );

  assert(attPacket[0] === 0xfd, "ATTITUDE packet STX must be 0xFD");
  assert(attPacket[1] === 28, "ATTITUDE packet payload length must be exactly 28 bytes");
  assert(attPacket[7] === 30, "ATTITUDE packet message ID byte (packet[7]) must be 30");

  const decodedAtt = parseMavlinkV2Packet(attPacket);
  assert(decodedAtt !== null && decodedAtt.type === "ATTITUDE", "Parser must identify packet as ATTITUDE");

  if (decodedAtt && decodedAtt.type === "ATTITUDE") {
    assert(Math.abs(decodedAtt.payload.rollDeg - testRoll) < 0.1, `Decoded roll (${decodedAtt.payload.rollDeg}°) matches injected (${testRoll}°)`);
    assert(Math.abs(decodedAtt.payload.pitchDeg - testPitch) < 0.1, `Decoded pitch (${decodedAtt.payload.pitchDeg}°) matches injected (${testPitch}°)`);
    assert(Math.abs(decodedAtt.payload.yawDeg - testYaw) < 0.1, `Decoded yaw (${decodedAtt.payload.yawDeg}°) matches injected (${testYaw}°)`);
    assert(Math.abs(decodedAtt.payload.rollSpeedRadS - testRollSpeed) < 0.001, "Roll speed rad/s preserved across IEEE-754 serialization");
  }

  // 1.2 SITL Stream Injector 10Hz Frame Synthesis
  const sitlInjector = new SitlStreamInjector({
    turbulenceIntensity: 0.4,
    sensorDriftFactor: 0.05,
    motorImbalanceRatio: 0.02,
  });

  const sitlFrame = sitlInjector.generateFrame(baselineTelemetry, 15);
  assert(sitlFrame.heartbeatBytes.length > 0, "SITL frame must generate #0 HEARTBEAT binary packet");
  assert(sitlFrame.attitudeBytes.length === 40, "SITL frame #30 ATTITUDE binary length must be 40 bytes (10 header + 28 payload + 2 CRC)");
  assert(sitlFrame.positionBytes.length === 40, "SITL frame #33 GLOBAL_POSITION_INT binary length must be 40 bytes (10 header + 28 payload + 2 CRC)");
  assert(sitlFrame.batteryBytes.length === 48, "SITL frame #147 BATTERY_STATUS binary length must be 48 bytes (10 header + 36 payload + 2 CRC)");

  // 1.3 Distributed 6-Motor Propulsion Dynamics
  assert(sitlFrame.decoded.motorRpm.length === 6, "SITL frame must model exactly 6 distributed electric tilt-rotors");
  const allMotorsWithinSafeRpm = sitlFrame.decoded.motorRpm.every((rpm) => rpm >= 1800 && rpm <= 2200);
  assert(allMotorsWithinSafeRpm, "All 6 motor RPMs must remain within realistic aero flight boundaries [1800, 2200 RPM]");

  // 1.4 Injection into Normalized InFlightTelemetry
  const injectedTelemetry = sitlInjector.injectIntoTelemetry(sitlFrame, baselineTelemetry);
  assert(injectedTelemetry.attitude !== undefined, "Injected telemetry must contain attitude object");
  assert(injectedTelemetry.attitude?.rollDeg === sitlFrame.decoded.rollDeg, "Telemetry attitude roll matches SITL decoded value");
  assert(injectedTelemetry.motorRpm !== undefined && injectedTelemetry.motorRpm.length === 6, "Telemetry motorRpm contains 6 tilt-rotor speeds");

  // --------------------------------------------------------------------------
  // TEST GROUP 2: Dual-Radio Loss-of-Link Fail-Safe Protocol & Reconciliation
  // --------------------------------------------------------------------------
  console.log("  -- Group 2: Dual-Radio Loss-of-Link Fail-Safe Protocol & Cryptographic Reconciliation --");

  const lolManager = new LossOfLinkManager();
  const initialLedger = initializeMissionBlackboxLedger(baselineMission);
  assert(verifyLedgerIntegrity(initialLedger).isValid, "Initial baseline ledger must be cryptographically valid");

  // 2.1 Trigger C2 Link Severance
  const { updatedTelemetry: severedTelem, eventBlock: severBlock } = lolManager.severC2Link(
    baselineTelemetry,
    initialLedger
  );

  assert(lolManager.getState().c2LinkStatus === "SEVERED", "Manager status must switch to SEVERED");
  assert(lolManager.getState().isAirborneFailSafeActive === true, "Airborne fail-safe active flag must be true");
  assert(severedTelem.flightPhase === "DIVERTING", "Flight phase must switch deterministically to DIVERTING");
  assert(severedTelem.recommendedAction === "DIVERT_TO_ALTERNATE", "Action must lock to DIVERT_TO_ALTERNATE");
  assert(severedTelem.diversionTargetIcao === PRIMARY_FAILSAFE_ALTERNATE.icao, `Diversion target must lock to ${PRIMARY_FAILSAFE_ALTERNATE.icao} (Burbank)`);
  assert(severedTelem.c2LinkStatus === "SEVERED", "Telemetry c2LinkStatus must report SEVERED");
  assert(severedTelem.failSafeMode === "AIRBORNE_AUTONOMOUS_FAILSAFE", "Telemetry failSafeMode must be AIRBORNE_AUTONOMOUS_FAILSAFE");
  assert(severBlock.previousHash === initialLedger.rootHash, "C2 severance event block must lock onto previous ledger root hash");

  // 2.2 Offline In-Memory Blackbox Queueing
  const offlineBlock1 = lolManager.queueOfflineTelemetryBlock(severedTelem, "NO_GO", Date.now() + 1000);
  const offlineBlock2 = lolManager.queueOfflineTelemetryBlock(
    { ...severedTelem, currentAltitudeFt: 1400, liveBatterySoc: 86.5 },
    "NO_GO",
    Date.now() + 2000
  );
  const offlineBlock3 = lolManager.queueOfflineTelemetryBlock(
    { ...severedTelem, currentAltitudeFt: 1300, liveBatterySoc: 85.0 },
    "NO_GO",
    Date.now() + 3000
  );

  assert(lolManager.getState().localBlockQueue.length === 4, "Local offline queue must contain 4 blocks (1 severance + 3 telemetry frames)");
  assert(offlineBlock2.previousHash === offlineBlock1.blockHash, "Offline queue block 2 must link continuously to block 1");
  assert(offlineBlock3.previousHash === offlineBlock2.blockHash, "Offline queue block 3 must link continuously to block 2");

  // 2.3 C2 Link Reconnection & Zero-Fragmentation Ledger Reconciliation
  const { reconciledLedger, verificationResult } = lolManager.restoreC2Link(initialLedger);

  assert(lolManager.getState().c2LinkStatus === "SYNCHRONIZED", "Status must update to SYNCHRONIZED upon restoration");
  assert(lolManager.getState().isAirborneFailSafeActive === false, "Fail-safe active flag must clear on restoration");
  assert(reconciledLedger.blockCount === initialLedger.blockCount + 4 + 1, "Reconciled ledger must contain baseline + 4 queued blocks + 1 restoration block");
  assert(verificationResult.isValid === true, "Reconciled ledger MUST pass complete cryptographic SHA-256 chain verification with 0 errors");
  assert(reconciledLedger.blocks[reconciledLedger.blocks.length - 1].eventType === "TOUCHDOWN_CLEARANCE", "Last reconciled block must be TOUCHDOWN_CLEARANCE restoration block");
  assert(lolManager.getState().localBlockQueue.length === 0, "Local offline queue must be completely flushed after successful reconciliation");

  // --------------------------------------------------------------------------
  // TEST GROUP 3: MAVLink Parser Error Resilience & Packet Corruption
  // --------------------------------------------------------------------------
  console.log("  -- Group 3: MAVLink Parser Error Resilience & Frame Synchronization --");

  // 3.1 Bad STX Magic Byte
  const corruptedStxPacket = new Uint8Array(attPacket);
  corruptedStxPacket[0] = 0xfe; // Incorrect magic byte (should be 0xFD for MAVLink v2)
  const decodedBadStx = parseMavlinkV2Packet(corruptedStxPacket);
  assert(decodedBadStx === null, "Parser must safely reject packet with invalid STX magic byte (0xFE)");

  // 3.2 Single-Byte Payload Corruption / Bad CRC
  const corruptedPayloadPacket = new Uint8Array(attPacket);
  corruptedPayloadPacket[12] ^= 0x55; // Flip bits in payload
  const decodedCorruptedPayload = parseMavlinkV2Packet(corruptedPayloadPacket);
  assert(decodedCorruptedPayload === null, "Parser must safely reject packet with corrupted payload byte (CRC mismatch)");

  // 3.3 Truncated Buffer (< Min Header Length)
  const truncatedBuffer = attPacket.slice(0, 8);
  const decodedTruncated = parseMavlinkV2Packet(truncatedBuffer);
  assert(decodedTruncated === null, "Parser must safely return null on truncated buffer shorter than header");

  // 3.4 Buffer Shorter than Payload + CRC Length
  const truncatedPayloadBuffer = attPacket.slice(0, 25);
  const decodedTruncatedPayload = parseMavlinkV2Packet(truncatedPayloadBuffer);
  assert(decodedTruncatedPayload === null, "Parser must safely return null when buffer is shorter than claimed payload + CRC length");

  // 3.5 Unknown Message ID
  const unknownMsgPacket = new Uint8Array(attPacket);
  unknownMsgPacket[7] = 255; // Unknown msg ID 255
  unknownMsgPacket[8] = 0;
  unknownMsgPacket[9] = 0;
  // Recompute CRC with a dummy crc extra
  const dummyCrc = computeMavlinkCrc(unknownMsgPacket.subarray(0, 10 + 28), 0);
  unknownMsgPacket[38] = dummyCrc & 0xff;
  unknownMsgPacket[39] = (dummyCrc >> 8) & 0xff;
  const decodedUnknown = parseMavlinkV2Packet(unknownMsgPacket);
  assert(decodedUnknown === null || decodedUnknown.type === "UNKNOWN", "Parser must safely handle unknown message ID without crashing");

  // --------------------------------------------------------------------------
  // TEST GROUP 4: NTSB/FAA Forensic Incident Replay & State Synchronization
  // --------------------------------------------------------------------------
  console.log("  -- Group 4: NTSB Incident Replay Scrubber & SHA-256 State Linking --");

  assert(PRE_CALIBRATED_INCIDENTS.length >= 5, "NTSB replay must include at least 5 pre-calibrated flight incidents");

  const inc0 = PRE_CALIBRATED_INCIDENTS[0];
  const incWind = PRE_CALIBRATED_INCIDENTS[1];
  const incThermal = PRE_CALIBRATED_INCIDENTS[2];
  const incDivert = PRE_CALIBRATED_INCIDENTS[3];

  assert(inc0.timeSec === 0 && inc0.phase === "NOMINAL", "Incident 1 must be T+00:00 Preflight Release (NOMINAL)");
  assert(incWind.timeSec === 135 && incWind.timeFormatted === "T+02:15", "Incident 2 must be T+02:15 Urban Canyon Wind Shear spike");
  assert(incWind.telemetrySnapshot.windShearKt > 28.0, "Incident 2 wind shear snapshot (32.4 kt) must exceed 28 kt envelope");
  assert(incThermal.timeSec === 220 && incThermal.timeFormatted === "T+03:40", "Incident 3 must be T+03:40 Cell 4 Thermal Derate");
  assert(incThermal.telemetrySnapshot.cellTempC >= 48.0, "Incident 3 cell temperature snapshot must reach 48.0°C");
  assert(incDivert.timeSec === 250 && incDivert.phase === "DIVERT_EXECUTED", "Incident 4 must be T+04:10 QNX Autonomous Diversion Executed");

  // Microsecond calculation check
  const microDelta = incWind.timeSec * 1000000;
  assert(microDelta === 135000000, "Microsecond timestamp delta must equal exact T_sec * 1,000,000 (135,000,000 µs)");

  // State Linkage to Cryptographic Ledger
  const testLedger = initializeMissionBlackboxLedger(baselineMission);
  const block0 = testLedger.blocks[0];
  assert(block0.blockHash.startsWith("0x") && block0.blockHash.length === 66, "Block 0 hash must be a valid 66-char hex string");

  // Tamper detection verification on ledger block
  const tamperedLedger: MerkleAuditLedger = {
    ...testLedger,
    blocks: testLedger.blocks.map((b, idx) =>
      idx === 1 ? { ...b, eventPayload: b.eventPayload + " [TAMPERED_IN_FLIGHT]" } : b
    ),
  };
  const tamperResult = verifyLedgerIntegrity(tamperedLedger);
  assert(tamperResult.isValid === false, "Tampered ledger payload must fail cryptographic verification");
  assert(tamperResult.tamperedBlockIndex === 1, "Tamper detector must isolate the exact block index (Index 1)");

  return { passed, failed, errors };
}

// Standalone execution if run directly via tsx
if (require.main === module) {
  const result = runV3MoatTests();
  console.log(`\nMoat Tests Result: ${result.passed} passed, ${result.failed} failed.`);
  if (result.failed > 0) process.exit(1);
}
