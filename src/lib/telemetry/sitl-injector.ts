import {
  generateSyntheticAttitude,
  generateSyntheticBatteryStatus,
  generateSyntheticGlobalPosition,
  generateSyntheticHeartbeat,
  MavlinkAttitudePayload,
  MavlinkBatteryStatusPayload,
  MavlinkGlobalPositionPayload,
  parseMavlinkV2Packet,
  convertMavlinkToTelemetry,
} from "./mavlink-parser";
import { InFlightTelemetry } from "@/types/aviation";

/**
 * ==============================================================================
 * AEROOPS AI v3.0 - High-Fidelity PX4/MAVLink SITL Stream Injector
 * Models 10Hz Hardware-in-the-Loop (HITL) / Software-in-the-Loop (SITL)
 * autopilot binary stream with aerodynamic atmospheric turbulence noise,
 * gyro rate drift, and distributed electric motor RPM dynamics.
 *
 * MAVLink Messages:
 *   - #0  HEARTBEAT (eVTOL type 29, PX4 autopilot 12, ARMED)
 *   - #30 ATTITUDE (Pitch, Roll, Yaw angles and rate derivatives)
 *   - #33 GLOBAL_POSITION_INT (GPS coordinates, MSL altitude, velocity vector)
 *   - #147 BATTERY_STATUS (Pack voltages, cell temperatures, current draw)
 * ==============================================================================
 */

export interface SitlNoiseConfig {
  turbulenceIntensity: number; // 0.0 (smooth) to 1.0 (severe gust)
  sensorDriftFactor: number;   // Rate gyro drift coefficient
  motorImbalanceRatio: number; // Aero asymmetry across distributed rotors
}

export interface DecodedSitlTelemetry {
  timestampMs: number;
  sequence: number;
  rollDeg: number;
  pitchDeg: number;
  yawDeg: number;
  rollRateDps: number;
  pitchRateDps: number;
  yawRateDps: number;
  motorRpm: number[]; // 6 distributed tilt-rotors
  latDeg: number;
  lonDeg: number;
  altFt: number;
  groundSpeedKts: number;
  batterySoc: number;
  batteryTempC: number;
  currentAmps: number;
  instantaneousPowerKw: number;
}

export interface SitlBinaryFrame {
  sequence: number;
  heartbeatBytes: Uint8Array;
  attitudeBytes: Uint8Array;
  positionBytes: Uint8Array;
  batteryBytes: Uint8Array;
  decoded: DecodedSitlTelemetry;
}

// Pseudo-random Gaussian turbulence generator (Box-Muller transform)
function gaussianRandom(mean = 0, stdev = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

export class SitlStreamInjector {
  private sequence = 0;
  private noiseConfig: SitlNoiseConfig;
  private baseHeadingDeg = 48.0;

  constructor(config: Partial<SitlNoiseConfig> = {}) {
    this.noiseConfig = {
      turbulenceIntensity: config.turbulenceIntensity ?? 0.35,
      sensorDriftFactor: config.sensorDriftFactor ?? 0.05,
      motorImbalanceRatio: config.motorImbalanceRatio ?? 0.02,
    };
  }

  /**
   * Generates a 10Hz synthetic binary SITL packet frame with high-frequency turbulence noise
   */
  public generateFrame(
    baselineTelemetry: InFlightTelemetry,
    elapsedSec: number
  ): SitlBinaryFrame {
    this.sequence = (this.sequence + 1) & 0xffff;
    const seqByte = this.sequence & 0xff;

    // 1. Aerodynamic Attitude Perturbations (Wind Gusts & Turbulence)
    const turbulence = this.noiseConfig.turbulenceIntensity;
    const timeFactor = elapsedSec * 1.5;

    // Harmonically coupled atmospheric oscillation + Gaussian wind noise
    const rollOscillation = Math.sin(timeFactor * 1.2) * 2.5 * turbulence;
    const rollNoise = gaussianRandom(0, 0.8) * turbulence;
    const rollDeg = Math.round((rollOscillation + rollNoise) * 10) / 10;

    const pitchOscillation = Math.cos(timeFactor * 0.9) * 1.8 * turbulence;
    const pitchNoise = gaussianRandom(0, 0.5) * turbulence;
    // Add forward cruise pitch tilt (-3° nominal)
    const pitchDeg = Math.round((-3.0 + pitchOscillation + pitchNoise) * 10) / 10;

    const yawOscillation = Math.sin(timeFactor * 0.4) * 1.2 * turbulence;
    const yawDeg = Math.round(((this.baseHeadingDeg + yawOscillation) % 360) * 10) / 10;

    // Rates (deg/s converted to rad/s)
    const rollRateDps = Math.round((Math.cos(timeFactor * 1.2) * 3.0 * turbulence) * 10) / 10;
    const pitchRateDps = Math.round((-Math.sin(timeFactor * 0.9) * 2.0 * turbulence) * 10) / 10;
    const yawRateDps = Math.round((Math.cos(timeFactor * 0.4) * 1.0 * turbulence) * 10) / 10;

    const degToRad = Math.PI / 180;
    const rollSpeedRadS = rollRateDps * degToRad;
    const pitchSpeedRadS = pitchRateDps * degToRad;
    const yawSpeedRadS = yawRateDps * degToRad;

    // 2. Distributed Electric Tilt-Rotor RPM (6 Motors)
    // Base cruise RPM: ~1950 RPM; differential thrust balances aerodynamic roll/pitch moments
    const baseRpm = 1950;
    const motorRpm = [
      Math.round(baseRpm + rollDeg * 12 + pitchDeg * 8 + gaussianRandom(0, 5)), // Motor 1 Front Left
      Math.round(baseRpm - rollDeg * 12 + pitchDeg * 8 + gaussianRandom(0, 5)), // Motor 2 Front Right
      Math.round(baseRpm + rollDeg * 8 + gaussianRandom(0, 6)),                  // Motor 3 Mid Left
      Math.round(baseRpm - rollDeg * 8 + gaussianRandom(0, 6)),                  // Motor 4 Mid Right
      Math.round(baseRpm + rollDeg * 10 - pitchDeg * 10 + gaussianRandom(0, 5)), // Motor 5 Aft Left
      Math.round(baseRpm - rollDeg * 10 - pitchDeg * 10 + gaussianRandom(0, 5)), // Motor 6 Aft Right
    ];

    // 3. Synthesize MAVLink v2 Binary Packets
    const heartbeatBytes = generateSyntheticHeartbeat(seqByte);

    const attitudeBytes = generateSyntheticAttitude(
      rollDeg,
      pitchDeg,
      yawDeg,
      rollSpeedRadS,
      pitchSpeedRadS,
      yawSpeedRadS,
      seqByte
    );

    const positionBytes = generateSyntheticGlobalPosition(
      baselineTelemetry.currentCoordinates.lat,
      baselineTelemetry.currentCoordinates.lon,
      baselineTelemetry.currentAltitudeFt,
      baselineTelemetry.currentGroundSpeedKts,
      yawDeg,
      seqByte
    );

    const batteryBytes = generateSyntheticBatteryStatus(
      baselineTelemetry.liveBatterySoc,
      baselineTelemetry.batteryCellTempC,
      125.0 + Math.abs(rollDeg * 2), // Amps
      seqByte
    );

    // 4. Verify roundtrip through MAVLink parser
    const decodedAtt = parseMavlinkV2Packet(attitudeBytes);
    const decodedPos = parseMavlinkV2Packet(positionBytes);
    const decodedBatt = parseMavlinkV2Packet(batteryBytes);

    const attPayload = decodedAtt?.type === "ATTITUDE" ? decodedAtt.payload : null;
    const posPayload = decodedPos?.type === "GLOBAL_POSITION_INT" ? decodedPos.payload : null;
    const battPayload = decodedBatt?.type === "BATTERY_STATUS" ? decodedBatt.payload : null;

    const decoded: DecodedSitlTelemetry = {
      timestampMs: Date.now(),
      sequence: this.sequence,
      rollDeg: attPayload ? attPayload.rollDeg : rollDeg,
      pitchDeg: attPayload ? attPayload.pitchDeg : pitchDeg,
      yawDeg: attPayload ? attPayload.yawDeg : yawDeg,
      rollRateDps,
      pitchRateDps,
      yawRateDps,
      motorRpm,
      latDeg: posPayload ? posPayload.latDeg : baselineTelemetry.currentCoordinates.lat,
      lonDeg: posPayload ? posPayload.lonDeg : baselineTelemetry.currentCoordinates.lon,
      altFt: posPayload ? posPayload.altFt : baselineTelemetry.currentAltitudeFt,
      groundSpeedKts: posPayload ? posPayload.groundSpeedKts : baselineTelemetry.currentGroundSpeedKts,
      batterySoc: battPayload ? battPayload.batteryRemainingPercent : baselineTelemetry.liveBatterySoc,
      batteryTempC: battPayload ? battPayload.temperatureC : baselineTelemetry.batteryCellTempC,
      currentAmps: battPayload ? battPayload.currentAmps : 125,
      instantaneousPowerKw: battPayload ? battPayload.instantaneousPowerKw : baselineTelemetry.instantaneousPowerKw,
    };

    return {
      sequence: this.sequence,
      heartbeatBytes,
      attitudeBytes,
      positionBytes,
      batteryBytes,
      decoded,
    };
  }

  /**
   * Adapts a decoded SITL frame into a fully normalized InFlightTelemetry object
   */
  public injectIntoTelemetry(
    frame: SitlBinaryFrame,
    baseline: InFlightTelemetry
  ): InFlightTelemetry {
    return {
      ...baseline,
      timestamp: frame.decoded.timestampMs,
      currentAltitudeFt: frame.decoded.altFt,
      currentGroundSpeedKts: frame.decoded.groundSpeedKts,
      liveBatterySoc: frame.decoded.batterySoc,
      batteryCellTempC: frame.decoded.batteryTempC,
      instantaneousPowerKw: frame.decoded.instantaneousPowerKw,
      currentCoordinates: {
        lat: frame.decoded.latDeg,
        lon: frame.decoded.lonDeg,
      },
      attitude: {
        rollDeg: frame.decoded.rollDeg,
        pitchDeg: frame.decoded.pitchDeg,
        yawDeg: frame.decoded.yawDeg,
        rollRateDps: frame.decoded.rollRateDps,
        pitchRateDps: frame.decoded.pitchRateDps,
        yawRateDps: frame.decoded.yawRateDps,
      },
      motorRpm: frame.decoded.motorRpm,
    };
  }
}

export const defaultSitlInjector = new SitlStreamInjector();
