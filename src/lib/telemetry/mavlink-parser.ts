import { FlightPhase, InFlightTelemetry, RecommendedAction } from "@/types/aviation";

/**
 * ==============================================================================
 * AEROOPS AI v3.0 - MAVLink v2 Protocol Parser & Synthetic Stream Generator
 * Complies with MAVLink v2 Framing Protocol (STX: 0xFD)
 * Supported Message IDs:
 *   - HEARTBEAT (#0)
 *   - GLOBAL_POSITION_INT (#33)
 *   - BATTERY_STATUS (#147)
 * ==============================================================================
 */

export const MAVLINK_V2_STX = 0xfd;

// Message CRC_EXTRA lookup table
export const MAVLINK_MESSAGE_CRCS: Record<number, number> = {
  0: 50,    // HEARTBEAT
  33: 104,  // GLOBAL_POSITION_INT
  147: 154, // BATTERY_STATUS
};

export interface MavlinkV2Header {
  magic: number;
  payloadLength: number;
  incompatFlags: number;
  compatFlags: number;
  sequence: number;
  sysId: number;
  compId: number;
  messageId: number;
}

export interface MavlinkHeartbeatPayload {
  customMode: number;
  type: number;           // 29 = MAV_TYPE_VTOL_RESERVED / eVTOL
  autopilot: number;      // 12 = PX4 Autopilot, 3 = ArduPilot
  baseMode: number;       // 128 = MAV_MODE_FLAG_SAFETY_ARMED
  systemStatus: number;   // 4 = MAV_STATE_ACTIVE
  mavlinkVersion: number;
}

export interface MavlinkGlobalPositionPayload {
  timeBootMs: number;
  latDeg: number;         // Decimal degrees (converted from degE7)
  lonDeg: number;         // Decimal degrees (converted from degE7)
  altFt: number;          // Feet MSL (converted from mm)
  relativeAltFt: number;  // Feet AGL (converted from mm)
  vxKts: number;          // Groundspeed kts (converted from cm/s)
  vyKts: number;
  vzKts: number;
  groundSpeedKts: number;
  headingDeg: number;     // Degrees (converted from cdeg)
}

export interface MavlinkBatteryStatusPayload {
  batteryId: number;
  temperatureC: number;   // °C (converted from cdegC)
  voltagesMv: number[];
  currentAmps: number;    // Amperes (converted from cA)
  consumedMah: number;
  batteryRemainingPercent: number; // 0 - 100%
  instantaneousPowerKw: number;
}

export type MavlinkDecodedPacket =
  | { type: "HEARTBEAT"; header: MavlinkV2Header; payload: MavlinkHeartbeatPayload }
  | { type: "GLOBAL_POSITION_INT"; header: MavlinkV2Header; payload: MavlinkGlobalPositionPayload }
  | { type: "BATTERY_STATUS"; header: MavlinkV2Header; payload: MavlinkBatteryStatusPayload }
  | { type: "UNKNOWN"; header: MavlinkV2Header; rawPayload: Uint8Array };

// --- X.25 CRC-16 Accumulator for MAVLink ---
export function accumulateMavlinkCrc(byte: number, crc: number): number {
  let tmp = (byte ^ (crc & 0xff)) & 0xff;
  tmp = (tmp ^ (tmp << 4)) & 0xff;
  crc = ((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xffff;
  return crc;
}

export function computeMavlinkCrc(buffer: Uint8Array, crcExtra: number): number {
  let crc = 0xffff;
  // CRC excludes STX byte (starts at byte 1)
  for (let i = 1; i < buffer.length; ++i) {
    crc = accumulateMavlinkCrc(buffer[i], crc);
  }
  crc = accumulateMavlinkCrc(crcExtra, crc);
  return crc;
}

/**
 * Encodes a MAVLink v2 packet
 */
export function encodeMavlinkV2Packet(
  msgId: number,
  payload: Uint8Array,
  seq = 0,
  sysId = 1,
  compId = 1
): Uint8Array {
  const payloadLen = payload.length;
  const packetLen = 10 + payloadLen + 2;
  const packet = new Uint8Array(packetLen);

  packet[0] = MAVLINK_V2_STX;
  packet[1] = payloadLen;
  packet[2] = 0; // incompat_flags
  packet[3] = 0; // compat_flags
  packet[4] = seq & 0xff;
  packet[5] = sysId & 0xff;
  packet[6] = compId & 0xff;
  // 24-bit little endian msgid
  packet[7] = msgId & 0xff;
  packet[8] = (msgId >> 8) & 0xff;
  packet[9] = (msgId >> 16) & 0xff;

  // Copy payload
  packet.set(payload, 10);

  // Compute CRC
  const crcExtra = MAVLINK_MESSAGE_CRCS[msgId] ?? 0;
  const crc = computeMavlinkCrc(packet.subarray(0, 10 + payloadLen), crcExtra);

  // 16-bit little-endian CRC
  packet[10 + payloadLen] = crc & 0xff;
  packet[10 + payloadLen + 1] = (crc >> 8) & 0xff;

  return packet;
}

/**
 * Parses a raw MAVLink v2 byte buffer
 */
export function parseMavlinkV2Packet(data: Uint8Array): MavlinkDecodedPacket | null {
  if (data.length < 12) return null;
  if (data[0] !== MAVLINK_V2_STX) return null;

  const payloadLen = data[1];
  const totalExpectedLen = 10 + payloadLen + 2;
  if (data.length < totalExpectedLen) return null;

  const msgId = data[7] | (data[8] << 8) | (data[9] << 16);
  const header: MavlinkV2Header = {
    magic: data[0],
    payloadLength: payloadLen,
    incompatFlags: data[2],
    compatFlags: data[3],
    sequence: data[4],
    sysId: data[5],
    compId: data[6],
    messageId: msgId,
  };

  const payloadView = new DataView(data.buffer, data.byteOffset + 10, payloadLen);

  if (msgId === 0) {
    // HEARTBEAT (#0, length 9)
    const customMode = payloadView.getUint32(0, true);
    const type = payloadView.getUint8(4);
    const autopilot = payloadView.getUint8(5);
    const baseMode = payloadView.getUint8(6);
    const systemStatus = payloadView.getUint8(7);
    const mavlinkVersion = payloadView.getUint8(8);

    return {
      type: "HEARTBEAT",
      header,
      payload: {
        customMode,
        type,
        autopilot,
        baseMode,
        systemStatus,
        mavlinkVersion,
      },
    };
  }

  if (msgId === 33) {
    // GLOBAL_POSITION_INT (#33, length 28)
    const timeBootMs = payloadView.getUint32(0, true);
    const latE7 = payloadView.getInt32(4, true);
    const lonE7 = payloadView.getInt32(8, true);
    const altMm = payloadView.getInt32(12, true);
    const relAltMm = payloadView.getInt32(16, true);
    const vxCmS = payloadView.getInt16(20, true);
    const vyCmS = payloadView.getInt16(22, true);
    const vzCmS = payloadView.getInt16(24, true);
    const hdgCdeg = payloadView.getUint16(26, true);

    const groundSpeedCmS = Math.sqrt(vxCmS * vxCmS + vyCmS * vyCmS);
    const groundSpeedKts = Math.round((groundSpeedCmS * 0.0194384) * 10) / 10;

    return {
      type: "GLOBAL_POSITION_INT",
      header,
      payload: {
        timeBootMs,
        latDeg: latE7 / 1e7,
        lonDeg: lonE7 / 1e7,
        altFt: Math.round(altMm * 0.00328084),
        relativeAltFt: Math.round(relAltMm * 0.00328084),
        vxKts: Math.round(vxCmS * 0.0194384 * 10) / 10,
        vyKts: Math.round(vyCmS * 0.0194384 * 10) / 10,
        vzKts: Math.round(vzCmS * 0.0194384 * 10) / 10,
        groundSpeedKts,
        headingDeg: Math.round((hdgCdeg / 100) * 10) / 10,
      },
    };
  }

  if (msgId === 147) {
    // BATTERY_STATUS (#147, length 36)
    const consumedMah = payloadView.getInt32(0, true);
    const tempCdeg = payloadView.getInt16(8, true);
    const currentCa = payloadView.getInt16(30, true);
    const batteryId = payloadView.getUint8(32);
    const batteryRemaining = payloadView.getInt8(35);

    const voltagesMv: number[] = [];
    for (let i = 0; i < 10; ++i) {
      voltagesMv.push(payloadView.getUint16(10 + i * 2, true));
    }

    const currentAmps = currentCa / 100.0;
    const packVoltageV = voltagesMv.reduce((acc, v) => acc + (v > 0 ? v : 0), 0) / 1000.0;
    const instantaneousPowerKw = Math.round(packVoltageV * currentAmps * 0.001 * 10) / 10;

    return {
      type: "BATTERY_STATUS",
      header,
      payload: {
        batteryId,
        temperatureC: Math.round((tempCdeg / 100.0) * 10) / 10,
        voltagesMv,
        currentAmps: Math.round(currentAmps * 10) / 10,
        consumedMah,
        batteryRemainingPercent: batteryRemaining,
        instantaneousPowerKw,
      },
    };
  }

  return {
    type: "UNKNOWN",
    header,
    rawPayload: data.subarray(10, 10 + payloadLen),
  };
}

// ==============================================================================
// SYNTHETIC MAVLink v2 STREAM GENERATOR
// Produces realistic packets for browser telemetry simulation & test verification
// ==============================================================================

export function generateSyntheticHeartbeat(seq = 0): Uint8Array {
  const payload = new Uint8Array(9);
  const view = new DataView(payload.buffer);
  view.setUint32(0, 0, true); // custom_mode
  view.setUint8(4, 29);       // type: eVTOL
  view.setUint8(5, 12);       // autopilot: PX4
  view.setUint8(6, 128);      // base_mode: ARMED
  view.setUint8(7, 4);        // system_status: ACTIVE
  view.setUint8(8, 3);        // mavlink_version: 3
  return encodeMavlinkV2Packet(0, payload, seq);
}

export function generateSyntheticGlobalPosition(
  latDeg: number,
  lonDeg: number,
  altFt: number,
  groundSpeedKts: number,
  headingDeg: number,
  seq = 0
): Uint8Array {
  const payload = new Uint8Array(28);
  const view = new DataView(payload.buffer);

  const speedCmS = Math.round(groundSpeedKts / 0.0194384);
  const headingRad = (headingDeg * Math.PI) / 180;
  const vx = Math.round(speedCmS * Math.cos(headingRad));
  const vy = Math.round(speedCmS * Math.sin(headingRad));

  view.setUint32(0, Date.now() & 0xffffffff, true);
  view.setInt32(4, Math.round(latDeg * 1e7), true);
  view.setInt32(8, Math.round(lonDeg * 1e7), true);
  view.setInt32(12, Math.round(altFt / 0.00328084), true); // MSL mm
  view.setInt32(16, Math.round(altFt / 0.00328084), true); // AGL mm
  view.setInt16(20, vx, true);
  view.setInt16(22, vy, true);
  view.setInt16(24, 0, true);
  view.setUint16(26, Math.round(headingDeg * 100), true);

  return encodeMavlinkV2Packet(33, payload, seq);
}

export function generateSyntheticBatteryStatus(
  socPercent: number,
  tempC: number,
  currentAmps: number,
  seq = 0
): Uint8Array {
  const payload = new Uint8Array(36);
  const view = new DataView(payload.buffer);

  view.setInt32(0, 4500, true);                        // consumed_mah
  view.setInt32(4, 160000, true);                      // energy_consumed (hJ)
  view.setInt16(8, Math.round(tempC * 100), true);     // temperature (cdegC)

  // 10 Cell voltages in mV (~4000mV nominal)
  for (let i = 0; i < 10; ++i) {
    view.setUint16(10 + i * 2, 4000, true);
  }

  view.setInt16(30, Math.round(currentAmps * 100), true); // current_battery (cA)
  view.setUint8(32, 1);                                   // battery id
  view.setUint8(33, 1);                                   // battery_function
  view.setUint8(34, 1);                                   // type (LiPo)
  view.setInt8(35, Math.round(socPercent));               // battery_remaining %

  return encodeMavlinkV2Packet(147, payload, seq);
}

/**
 * Adapter converting decoded MAVLink stream telemetry into normalized InFlightTelemetry
 */
export function convertMavlinkToTelemetry(
  pos: MavlinkGlobalPositionPayload,
  battery: MavlinkBatteryStatusPayload,
  baselineTelemetry: InFlightTelemetry
): InFlightTelemetry {
  const updated: InFlightTelemetry = {
    ...baselineTelemetry,
    timestamp: Date.now(),
    currentAltitudeFt: pos.altFt,
    currentGroundSpeedKts: pos.groundSpeedKts,
    liveBatterySoc: battery.batteryRemainingPercent,
    batteryCellTempC: battery.temperatureC,
    instantaneousPowerKw: battery.instantaneousPowerKw,
    currentCoordinates: {
      lat: pos.latDeg,
      lon: pos.lonDeg,
    },
  };

  // Check QNX DO-178C deterministic safety limits
  if (battery.batteryRemainingPercent < 15) {
    updated.flightPhase = "DIVERTING";
    updated.recommendedAction = "EMERGENCY_LANDING";
    updated.diversionTargetIcao = "KSMO";
    updated.diversionReason = "MAVLink BATTERY_STATUS: Critical battery reserve depletion (< 15%). Immediate touchdown required.";
    updated.distanceToAlternateNm = 4.2;
  }

  return updated;
}
