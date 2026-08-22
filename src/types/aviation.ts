export type VerdictType = "GO" | "AMBER" | "NO_GO";

export interface AircraftSpecs {
  id: string;
  tailNumber: string;
  model: string;
  type: "eVTOL" | "FIXED_WING_ELECTRIC" | "HYBRID_TURBINE" | "LIGHT_AIRCRAFT";
  mtowKg: number;
  emptyWeightKg: number;
  maxPayloadKg: number;
  batteryCapacityKwh: number;
  basePowerHoverKw: number;
  basePowerCruiseKw: number;
  nominalCruiseSpeedKts: number;
  maxCrosswindKts: number;
  maxOperatingWindKts: number;
  minReserveSocPercent: number; // e.g. 25%
}

export interface Vertiport {
  id: string;
  icao: string;
  name: string;
  lat: number;
  lon: number;
  elevationFt: number;
  activeRunways: string[];
}

export interface WeatherData {
  station: string;
  timestamp: string;
  tempC: number;
  dewpointC: number;
  windSpeedKts: number;
  windDirDeg: number;
  windGustKts: number;
  visibilitySm: number;
  altimeterInHg: number;
  cloudCeilingFt: number;
  flightCategory: "VFR" | "MVFR" | "IFR" | "LIFR";
  rawMetar: string;
  isSimulated?: boolean;
}

export interface WindDecomposition {
  routeHeadingDeg: number;
  windSpeedKts: number;
  windDirDeg: number;
  crosswindKts: number;
  headwindKts: number; // positive = headwind, negative = tailwind
  groundSpeedKts: number;
  windCorrectionAngleDeg: number;
  isCrosswindExceeded: boolean;
}

export interface EnergyAnalysis {
  batteryCapacityKwh: number;
  initialSocPercent: number;
  tempDeratePercent: number; // e.g. 0.8% per deg < 10C
  usableCapacityKwh: number;
  payloadKg: number;
  hoverEnergyKwh: number;
  cruiseEnergyKwh: number;
  totalEnergyRequiredKwh: number;
  estimatedFlightTimeMin: number;
  projectedLandingSocPercent: number;
  reserveDeficitPercent: number; // if projected < minReserve
  pointOfNoReturnKm: number;
  totalDistanceKm: number;
  ponrTimelinePercent: number;
}

export interface AirspaceZone {
  id: string;
  name: string;
  type: "CLASS_B" | "CLASS_C" | "CLASS_D" | "TFR" | "PROHIBITED" | "RESTRICTED" | "CORRIDOR";
  centerLat: number;
  centerLon: number;
  radiusNm?: number;
  polygonCoords?: [number, number][]; // [lat, lon]
  floorFt: number;
  ceilingFt: number;
  isActive: boolean;
  severity: "CRITICAL" | "CAUTION" | "ADVISORY";
  description: string;
}

export interface AirspaceConflict {
  zoneId: string;
  zoneName: string;
  type: string;
  severity: "CRITICAL" | "CAUTION" | "ADVISORY";
  distanceToCorridorNm: number;
  isIntersecting: boolean;
  status: "CLEAR" | "AUTHORIZATION_REVIEW_REQUIRED" | "RESTRICTION_CONFLICT";
  details: string;
}

export interface HardSafetyGate {
  gateId: string;
  name: string;
  description: string;
  passed: boolean;
  severity: "FATAL_NO_GO" | "WARNING";
  telemetryValue: string;
  limitThreshold: string;
}

export interface RiskFactorScores {
  weather: number;    // 0-100 (weight 30%)
  energy: number;     // 0-100 (weight 25%)
  airspace: number;   // 0-100 (weight 20%)
  aircraft: number;   // 0-100 (weight 15%)
  route: number;      // 0-100 (weight 10%)
}

export interface RiskAssessment {
  compositeScore: number; // 0-100
  verdict: VerdictType;
  factors: RiskFactorScores;
  hardGates: HardSafetyGate[];
  failedGatesCount: number;
  evaluatedAt: string;
  confidenceScore: number;
}

export interface EvidenceAuditItem {
  id: string;
  subsystem: "WEATHER" | "ENERGY" | "AIRSPACE" | "AIRCRAFT" | "REGULATORY";
  parameter: string;
  observedValue: string;
  safetyEnvelope: string;
  status: "NOMINAL" | "MARGINAL" | "VIOLATION";
  sourceTag: string;
}

export interface AIBriefingPayload {
  executive_summary: string;
  primary_drivers: string[];
  critical_hazards: string[];
  mitigation_steps: string[];
  data_quality_notes: string[];
  voice_briefing_transcript: string;
  generated_at?: string;
  model_used?: string;
}

// -------------------------------------------------------------
// V2.0 EXTENSIONS: IN-FLIGHT OS, MICRO-WEATHER, CRYPTO & VERTIPORT OPS
// -------------------------------------------------------------

export type FlightPhase =
  | "PRE_DEPARTURE"
  | "CLIMB"
  | "CRUISE"
  | "DIVERTING"
  | "DESCENT"
  | "LANDED";

export interface InFlightTelemetry {
  timestamp: number;
  flightPhase: FlightPhase;
  distanceFlownKm: number;
  distanceRemainingKm: number;
  currentAltitudeFt: number;
  currentAirspeedKts: number;
  currentGroundSpeedKts: number;
  liveBatterySoc: number;
  theoreticalSoc: number;
  batteryCellTempC: number;
  instantaneousPowerKw: number;
  headwindDriftKt: number;
  crosswindDriftKt: number;
  inFlightPonrKm: number;
  isPastPonr: boolean;
  recommendedAction:
    | "CONTINUE_NOMINAL"
    | "HOLD"
    | "DIVERT_TO_ALTERNATE"
    | "EMERGENCY_LANDING";
  diversionTargetIcao?: string;
  diversionReason?: string;
  distanceToAlternateNm?: number;
  currentCoordinates: {
    lat: number;
    lon: number;
  };
}

export interface MicroWeatherSegment {
  segmentId: string;
  name: string;
  startKm: number;
  endKm: number;
  baseWindKt: number;
  canyonNarrowingFactor: number;
  buildingHeightRatio: number;
  amplifiedWindKt: number;
  turbulenceLevel: "LOW" | "MODERATE" | "SEVERE";
  hasVenturiAlert: boolean;
}

export interface VertiportPadSlot {
  padId: string;
  padName: string;
  status: "AVAILABLE" | "RESERVED" | "OCCUPIED";
  assignedCallsign?: string;
  chargerPowerKw: number;
  currentSocTargetPercent?: number;
  turnaroundTimerSec: number;
  estimatedClearTimeUtc: string;
}

export interface VertiportTurnaroundState {
  vertiportIcao: string;
  name: string;
  totalPads: number;
  availablePads: number;
  pads: VertiportPadSlot[];
  lockedSlotPadId?: string;
}

export interface BlackboxBlock {
  blockIndex: number;
  timestamp: number;
  isoTimestamp: string;
  eventType:
    | "PREFLIGHT_DISPATCH"
    | "TAKEOFF_INITIALIZATION"
    | "TELEMETRY_FRAME"
    | "PONR_CROSSING"
    | "WIND_SHEAR_ALERT"
    | "INFLIGHT_DIVERSION_TRIGGER"
    | "TOUCHDOWN_CLEARANCE";
  eventPayload: string;
  verdict: string;
  previousHash: string;
  blockHash: string;
}

export interface MerkleAuditLedger {
  rootHash: string;
  blockCount: number;
  isTamperProof: boolean;
  lastVerifiedIso: string;
  blocks: BlackboxBlock[];
}

export interface FlightMission {
  id: string;
  callsign: string;
  aircraft: AircraftSpecs;
  origin: Vertiport;
  destination: Vertiport;
  routeDistanceKm: number;
  routeHeadingDeg: number;
  plannedPayloadKg: number;
  initialSocPercent: number;
  mode: "LIVE" | "SIM" | "HYBRID";
  weather: WeatherData;
  wind: WindDecomposition;
  energy: EnergyAnalysis;
  airspaceConflicts: AirspaceConflict[];
  risk: RiskAssessment;
  evidence: EvidenceAuditItem[];
  aiBriefing?: AIBriefingPayload;

  // v2.0 Extensions
  microWeatherSegments?: MicroWeatherSegment[];
  vertiportOps?: VertiportTurnaroundState;
  blackboxLedger?: MerkleAuditLedger;
}
