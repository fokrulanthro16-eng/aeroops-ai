import { AircraftSpecs, EnergyAnalysis, WindDecomposition } from "@/types/aviation";

/**
 * Aerodynamic Energy & Dynamic Point of No Return (PONR) Engine
 * Implements:
 * 1. Temperature derating: 0.8% capacity penalty per degree Celsius below 10°C
 * 2. Hover and Cruise mass scaling: non-linear aerodynamic power curve
 * 3. Dynamic PONR: calculates the exact nautical miles / km outbound where the aircraft
 *    can safely turn around and fly back to origin against current headwind vectors while
 *    preserving the mandated reserve SOC.
 */
export function calculateEnergyAndPONR(
  aircraft: AircraftSpecs,
  distanceKm: number,
  payloadKg: number,
  initialSocPercent: number,
  ambientTempC: number,
  wind: WindDecomposition
): EnergyAnalysis {
  // 1. Temperature Derating
  let tempDeratePercent = 0;
  if (ambientTempC < 10) {
    const degreesBelow10 = 10 - ambientTempC;
    tempDeratePercent = Math.min(30, degreesBelow10 * 0.8); // max 30% derate
  }

  const effectiveNominalCapacityKwh =
    aircraft.batteryCapacityKwh * (1 - tempDeratePercent / 100);
  const usableCapacityKwh =
    effectiveNominalCapacityKwh * (initialSocPercent / 100);

  // 2. Mass & Aerodynamic Power Scaling
  const totalMassKg = aircraft.emptyWeightKg + payloadKg;
  const massRatio = Math.max(0.5, totalMassKg / aircraft.mtowKg);

  // Hover power scales with mass^1.5 for momentum disc theory
  const effectiveHoverPowerKw = aircraft.basePowerHoverKw * Math.pow(massRatio, 1.5);
  // Cruise power scales linearly with mass induced drag
  const effectiveCruisePowerKw = aircraft.basePowerCruiseKw * (0.5 + 0.5 * massRatio);

  // Takeoff & landing hover duration (e.g. 2.5 min each = 5 min total hover)
  const totalHoverHours = 5 / 60;
  const hoverEnergyKwh = effectiveHoverPowerKw * totalHoverHours;

  // Flight time based on ground speed
  // Distance in nautical miles: 1 km = 0.539957 NM
  const distanceNm = distanceKm * 0.539957;
  const outboundGroundSpeedKts = Math.max(10, wind.groundSpeedKts);
  const outboundFlightTimeHours = distanceNm / outboundGroundSpeedKts;
  const estimatedFlightTimeMin = Math.round((outboundFlightTimeHours * 60 + 5) * 10) / 10;

  const cruiseEnergyKwh = effectiveCruisePowerKw * outboundFlightTimeHours;
  const totalEnergyRequiredKwh = hoverEnergyKwh + cruiseEnergyKwh;

  // Projected landing SOC
  const energyRemainingKwh = usableCapacityKwh - totalEnergyRequiredKwh;
  const rawProjectedSoc = (energyRemainingKwh / effectiveNominalCapacityKwh) * 100;
  const projectedLandingSocPercent = Math.round(rawProjectedSoc * 10) / 10;

  // Reserve deficit against aircraft's minimum reserve (e.g., 25%)
  const minReservePercent = aircraft.minReserveSocPercent || 25.0;
  const reserveDeficitPercent =
    projectedLandingSocPercent < minReservePercent
      ? Math.round((minReservePercent - projectedLandingSocPercent) * 10) / 10
      : 0;

  // 3. Dynamic Point of No Return (PONR) Calculation
  // In an outbound leg with ground speed V_out and return leg with ground speed V_ret (opposing wind):
  // Return heading = (routeHeading + 180) % 360
  // Return headwind = -outbound headwind
  const returnGroundSpeedKts = Math.max(
    10,
    aircraft.nominalCruiseSpeedKts + wind.headwindKts
  );

  // Max energy allowable for outbound + return cruise:
  // Usable battery minus hover energy minus reserve energy
  const reserveEnergyKwh = effectiveNominalCapacityKwh * (minReservePercent / 100);
  const availableCruiseEnergyKwh = Math.max(
    0,
    usableCapacityKwh - hoverEnergyKwh - reserveEnergyKwh
  );

  // Energy burn per NM outbound: effectiveCruisePowerKw / V_out
  const energyPerNmOut = effectiveCruisePowerKw / outboundGroundSpeedKts;
  // Energy burn per NM return: effectiveCruisePowerKw / V_ret
  const energyPerNmRet = effectiveCruisePowerKw / returnGroundSpeedKts;

  // Total energy to fly x NM outbound and x NM return = x * (energyPerNmOut + energyPerNmRet)
  // Therefore max outbound distance x = availableCruiseEnergyKwh / (energyPerNmOut + energyPerNmRet)
  const maxOutboundDistanceNm =
    availableCruiseEnergyKwh / (energyPerNmOut + energyPerNmRet);
  const calculatedPonrKm = maxOutboundDistanceNm / 0.539957;

  // Cap PONR to total distance and ensure non-negative
  const pointOfNoReturnKm = Math.min(
    distanceKm,
    Math.max(0, Math.round(calculatedPonrKm * 10) / 10)
  );

  const ponrTimelinePercent =
    distanceKm > 0
      ? Math.min(100, Math.max(0, Math.round((pointOfNoReturnKm / distanceKm) * 100)))
      : 0;

  return {
    batteryCapacityKwh: aircraft.batteryCapacityKwh,
    initialSocPercent: Math.round(initialSocPercent * 10) / 10,
    tempDeratePercent: Math.round(tempDeratePercent * 10) / 10,
    usableCapacityKwh: Math.round(usableCapacityKwh * 10) / 10,
    payloadKg: Math.round(payloadKg * 10) / 10,
    hoverEnergyKwh: Math.round(hoverEnergyKwh * 10) / 10,
    cruiseEnergyKwh: Math.round(cruiseEnergyKwh * 10) / 10,
    totalEnergyRequiredKwh: Math.round(totalEnergyRequiredKwh * 10) / 10,
    estimatedFlightTimeMin,
    projectedLandingSocPercent,
    reserveDeficitPercent,
    pointOfNoReturnKm,
    totalDistanceKm: distanceKm,
    ponrTimelinePercent,
  };
}
