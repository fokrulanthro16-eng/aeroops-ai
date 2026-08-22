import { FlightMission, FlightPhase, InFlightTelemetry } from "@/types/aviation";

export interface TelemetrySimulationConfig {
  speedMultiplier: number;
  injectedWindShearKt?: number;
  injectedSocDegradationPercent?: number;
  forceDivert?: boolean;
}

export function computeInFlightTelemetryFrame(
  mission: FlightMission,
  elapsedSeconds: number,
  config: TelemetrySimulationConfig = { speedMultiplier: 1 }
): InFlightTelemetry {
  const totalDistanceKm = mission.routeDistanceKm;
  const nominalGroundSpeedKts = Math.max(10, mission.wind.groundSpeedKts);
  // Ground speed in km/h = kts * 1.852
  const groundSpeedKmh = nominalGroundSpeedKts * 1.852;
  const totalFlightTimeSeconds = (totalDistanceKm / groundSpeedKmh) * 3600;

  // Effective progress scaled by speedMultiplier
  const virtualElapsedSec = elapsedSeconds * (config.speedMultiplier || 1);
  const progressRatio = Math.min(1.0, Math.max(0, virtualElapsedSec / Math.max(1, totalFlightTimeSeconds)));

  const distanceFlownKm = Math.min(totalDistanceKm, Math.round(totalDistanceKm * progressRatio * 10) / 10);
  const distanceRemainingKm = Math.max(0, Math.round((totalDistanceKm - distanceFlownKm) * 10) / 10);

  // 1. Initial Phase Determination
  let flightPhase: FlightPhase = "PRE_DEPARTURE";
  let altitudeFt = 0;

  if (progressRatio === 0) {
    flightPhase = "PRE_DEPARTURE";
    altitudeFt = 0;
  } else if (progressRatio < 0.15) {
    flightPhase = "CLIMB";
    altitudeFt = Math.round(progressRatio * 10000);
  } else if (progressRatio >= 0.85 && progressRatio < 1.0) {
    flightPhase = "DESCENT";
    altitudeFt = Math.max(0, Math.round((1 - progressRatio) * 10000));
  } else if (progressRatio >= 1.0) {
    flightPhase = "LANDED";
    altitudeFt = 0;
  } else {
    flightPhase = "CRUISE";
    altitudeFt = 1500;
  }

  // 2. Battery & Thermal Depletion Model
  const initialSoc = mission.energy.initialSocPercent;
  const totalProjectedBurnSoc = initialSoc - mission.energy.projectedLandingSocPercent;
  
  // Theoretical SOC along linear burn
  const theoreticalSoc = Math.max(0, Math.round((initialSoc - totalProjectedBurnSoc * progressRatio) * 10) / 10);

  // Injected degradation
  const socDegrade = config.injectedSocDegradationPercent || 0;
  const liveBatterySoc = Math.max(0, Math.round((theoreticalSoc - socDegrade) * 10) / 10);

  // Cell Temperature (°C)
  const baseTempC = mission.weather.tempC;
  const climbThermalBoost = flightPhase === "CLIMB" ? 14 : flightPhase === "CRUISE" ? 9 : 2;
  const batteryCellTempC = Math.round((baseTempC + 15 + climbThermalBoost + progressRatio * 4) * 10) / 10;

  // Instantaneous Power (kW)
  const instantaneousPowerKw =
    flightPhase === "CLIMB"
      ? Math.round(mission.aircraft.basePowerHoverKw * 0.9)
      : flightPhase === "CRUISE"
      ? Math.round(mission.aircraft.basePowerCruiseKw * 1.05)
      : flightPhase === "DESCENT"
      ? Math.round(mission.aircraft.basePowerCruiseKw * 0.5)
      : 0;

  // 3. Wind Drift & Micro-Turbulence
  const injectedWindShear = config.injectedWindShearKt || 0;
  const headwindDriftKt = Math.round((mission.wind.headwindKts + injectedWindShear * 0.7) * 10) / 10;
  const crosswindDriftKt = Math.round((mission.wind.crosswindKts + injectedWindShear * 0.3) * 10) / 10;

  // 4. Dynamic In-Air PONR Recalculation
  const initialPonr = mission.energy.pointOfNoReturnKm;
  const inFlightPonrKm = initialPonr;
  const isPastPonr = distanceFlownKm >= initialPonr;

  // 5. In-Air Autonomous Rerouting Engine
  let recommendedAction: InFlightTelemetry["recommendedAction"] = "CONTINUE_NOMINAL";
  let diversionTargetIcao: string | undefined = undefined;
  let diversionReason: string | undefined = undefined;
  let distanceToAlternateNm: number | undefined = undefined;

  const socDeficit = theoreticalSoc - liveBatterySoc;
  const isSevereWindShear = injectedWindShear > 28;

  const canDivert = progressRatio > 0 && flightPhase !== "LANDED";

  if (canDivert && (config.forceDivert || socDeficit >= 5 || isSevereWindShear)) {
    flightPhase = "DIVERTING";
    recommendedAction = "DIVERT_TO_ALTERNATE";
    diversionTargetIcao = "KBUR"; // Burbank SkyLink Alternate
    diversionReason =
      socDeficit >= 5
        ? `Battery depletion anomaly: live SOC (${liveBatterySoc}%) is ${socDeficit.toFixed(1)}% below theoretical curve.`
        : `Critical wind shear (${injectedWindShear} kts) detected past Point of No Return.`;
    distanceToAlternateNm = 12.4;
  } else if (canDivert && liveBatterySoc < 15) {
    flightPhase = "DIVERTING";
    recommendedAction = "EMERGENCY_LANDING";
    diversionTargetIcao = "KSMO";
    diversionReason = "Critical battery reserve depletion (< 15% SOC). Immediate precautionary touchdown required.";
    distanceToAlternateNm = 4.2;
  }

  // Interpolated GPS Coordinates
  const oLat = mission.origin.lat;
  const oLon = mission.origin.lon;
  const dLat = mission.destination.lat;
  const dLon = mission.destination.lon;

  const curLat = Math.round((oLat + (dLat - oLat) * progressRatio) * 10000) / 10000;
  const curLon = Math.round((oLon + (dLon - oLon) * progressRatio) * 10000) / 10000;

  return {
    timestamp: Date.now(),
    flightPhase,
    distanceFlownKm,
    distanceRemainingKm,
    currentAltitudeFt: altitudeFt,
    currentAirspeedKts: mission.aircraft.nominalCruiseSpeedKts,
    currentGroundSpeedKts: Math.max(5, nominalGroundSpeedKts - headwindDriftKt),
    liveBatterySoc,
    theoreticalSoc,
    batteryCellTempC,
    instantaneousPowerKw,
    headwindDriftKt,
    crosswindDriftKt,
    inFlightPonrKm,
    isPastPonr,
    recommendedAction,
    diversionTargetIcao,
    diversionReason,
    distanceToAlternateNm,
    currentCoordinates: {
      lat: curLat,
      lon: curLon,
    },
  };
}