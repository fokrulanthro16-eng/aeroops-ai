import { FlightMission, MicroWeatherSegment } from "@/types/aviation";

/**
 * Urban Canyon Venturi Wind Field Modeler
 * Evaluates high-density skyscraper corridors and canyon-induced aerodynamic turbulence:
 * AmplifiedWind = BaseWind * (1 + CanyonNarrowingFactor * BuildingHeightRatio)
 */

export function calculateVenturiWindAmplification(
  baseWindKt: number,
  canyonNarrowingFactor: number, // 0.1 to 0.8 (degree of street/building pinch)
  buildingHeightRatio: number   // 0.2 to 2.5 (building height relative to flight corridor)
): { amplifiedWindKt: number; amplificationRatio: number } {
  const amplificationMultiplier = 1 + canyonNarrowingFactor * buildingHeightRatio;
  const amplifiedWindKt = Math.round(baseWindKt * amplificationMultiplier * 10) / 10;
  const amplificationRatio = Math.round(amplificationMultiplier * 100) / 100;
  return { amplifiedWindKt, amplificationRatio };
}

export function generateCorridorMicroWeatherSegments(
  mission: FlightMission
): MicroWeatherSegment[] {
  const baseWind = mission.weather.windSpeedKts;
  const totalDist = mission.routeDistanceKm;

  // Segment 1: Coastal Vertiport Ascent Corridor (KLAX Coast)
  const seg1Venturi = calculateVenturiWindAmplification(baseWind, 0.15, 0.4);
  
  // Segment 2: Downtown / High-Rise Urban Canyon Sector (Wilshire / Century City)
  const seg2Venturi = calculateVenturiWindAmplification(baseWind, 0.65, 1.8);
  
  // Segment 3: Valley Descent Approach (Burbank / SkyLink Hub)
  const seg3Venturi = calculateVenturiWindAmplification(baseWind, 0.35, 0.8);

  const segments: MicroWeatherSegment[] = [
    {
      segmentId: "SEG-01-COASTAL",
      name: "Coastal Boundary Layer & Ascent",
      startKm: 0,
      endKm: Math.round(totalDist * 0.3 * 10) / 10,
      baseWindKt: baseWind,
      canyonNarrowingFactor: 0.15,
      buildingHeightRatio: 0.4,
      amplifiedWindKt: seg1Venturi.amplifiedWindKt,
      turbulenceLevel: seg1Venturi.amplifiedWindKt > 25 ? "MODERATE" : "LOW",
      hasVenturiAlert: false,
    },
    {
      segmentId: "SEG-02-URBAN-CANYON",
      name: "High-Rise Urban Canyon (Venturi Channel)",
      startKm: Math.round(totalDist * 0.3 * 10) / 10,
      endKm: Math.round(totalDist * 0.7 * 10) / 10,
      baseWindKt: baseWind,
      canyonNarrowingFactor: 0.65,
      buildingHeightRatio: 1.8,
      amplifiedWindKt: seg2Venturi.amplifiedWindKt,
      turbulenceLevel: seg2Venturi.amplifiedWindKt > 30 ? "SEVERE" : seg2Venturi.amplifiedWindKt > 20 ? "MODERATE" : "LOW",
      hasVenturiAlert: seg2Venturi.amplifiedWindKt > 22,
    },
    {
      segmentId: "SEG-03-VALLEY-APPROACH",
      name: "Verdugo Foothills & Vertiport Ingress",
      startKm: Math.round(totalDist * 0.7 * 10) / 10,
      endKm: totalDist,
      baseWindKt: baseWind,
      canyonNarrowingFactor: 0.35,
      buildingHeightRatio: 0.8,
      amplifiedWindKt: seg3Venturi.amplifiedWindKt,
      turbulenceLevel: seg3Venturi.amplifiedWindKt > 25 ? "MODERATE" : "LOW",
      hasVenturiAlert: false,
    },
  ];

  return segments;
}