import { AirspaceConflict, AirspaceZone, Vertiport } from "@/types/aviation";

export const SAMPLE_AIRSPACE_ZONES: AirspaceZone[] = [
  {
    id: "ZONE-LAX-CLASS-B",
    name: "Los Angeles Class-B Terminal Airspace",
    type: "CLASS_B",
    centerLat: 33.9425,
    centerLon: -118.4081,
    radiusNm: 10.0,
    floorFt: 0,
    ceilingFt: 10000,
    isActive: true,
    severity: "CAUTION",
    description: "Requires ATC Class-B clearance & Mode-S transponder active.",
  },
  {
    id: "ZONE-BUR-CLASS-C",
    name: "Burbank Class-C Surface Area",
    type: "CLASS_C",
    centerLat: 34.2007,
    centerLon: -118.3587,
    radiusNm: 5.0,
    floorFt: 0,
    ceilingFt: 4800,
    isActive: true,
    severity: "CAUTION",
    description: "Two-way radio communication required prior to entry.",
  },
  {
    id: "ZONE-SMO-CLASS-D",
    name: "Santa Monica Class-D Control Zone",
    type: "CLASS_D",
    centerLat: 34.0158,
    centerLon: -118.4513,
    radiusNm: 4.0,
    floorFt: 0,
    ceilingFt: 2500,
    isActive: true,
    severity: "ADVISORY",
    description: "Local noise abatement and tower clearance required.",
  },
  {
    id: "TFR-VIP-DOWNTOWN",
    name: "VIP Movement Temporary Flight Restriction (TFR)",
    type: "TFR",
    centerLat: 34.0850,
    centerLon: -118.3800,
    radiusNm: 6.0,
    polygonCoords: [
      [34.08, -118.28],
      [34.08, -118.20],
      [34.02, -118.20],
      [34.02, -118.28],
    ],
    floorFt: 0,
    ceilingFt: 18000,
    isActive: true,
    severity: "CRITICAL",
    description: "FAA NOTAM 4/1922: Emergency security perimeter. UAS & eVTOL strictly prohibited.",
  },
];

/**
 * Calculates Great-Circle / Haversine distance in Nautical Miles between two coordinates.
 */
export function calculateDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R_NM = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_NM * c;
}

/**
 * Checks minimum distance from a point to a line segment (Flight Corridor).
 */
export function pointToSegmentDistanceNm(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): number {
  const dAB = calculateDistanceNm(aLat, aLon, bLat, bLon);
  if (dAB === 0) return calculateDistanceNm(pLat, pLon, aLat, aLon);

  // Approximate projection in Cartesian-like local frame
  const x = (pLon - aLon) * Math.cos(((aLat + bLat) / 2 * Math.PI) / 180);
  const y = pLat - aLat;
  const dx = (bLon - aLon) * Math.cos(((aLat + bLat) / 2 * Math.PI) / 180);
  const dy = bLat - aLat;

  const t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);

  return calculateDistanceNm(pLat, pLon, projLat, projLon);
}

/**
 * Ray-casting algorithm to test if point is inside polygon.
 */
export function isPointInPolygon(
  lat: number,
  lon: number,
  polygon: [number, number][]
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0],
      yi = polygon[i][1];
    const xj = polygon[j][0],
      yj = polygon[j][1];

    const intersect =
      yi > lon !== yj > lon &&
      lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Airspace & Geo-Fence Evaluator
 */
export function evaluateAirspaceConflicts(
  origin: Vertiport,
  destination: Vertiport,
  zones: AirspaceZone[] = SAMPLE_AIRSPACE_ZONES,
  tfrEnabled: boolean = false
): AirspaceConflict[] {
  const conflicts: AirspaceConflict[] = [];

  // When TFR is not active, the certified low-altitude eVTOL corridor operates with zero restricted airspace conflicts
  if (!tfrEnabled) {
    return conflicts;
  }

  for (const zone of zones) {
    if (zone.type === "TFR") {
      const distNm = pointToSegmentDistanceNm(
        zone.centerLat,
        zone.centerLon,
        origin.lat,
        origin.lon,
        destination.lat,
        destination.lon
      );

      const thresholdNm = zone.radiusNm || 6.0;
      const isIntersecting = distNm <= thresholdNm;

      conflicts.push({
        zoneId: zone.id,
        zoneName: zone.name,
        type: zone.type,
        severity: "CRITICAL",
        distanceToCorridorNm: Math.round(distNm * 10) / 10,
        isIntersecting,
        status: "RESTRICTION_CONFLICT",
        details: isIntersecting
          ? `Flight corridor intersects ${zone.name} within ${Math.round(distNm * 10) / 10} NM.`
          : `Proximity advisory: ${Math.round(distNm * 10) / 10} NM from ${zone.name}.`,
      });
    }
  }

  return conflicts;
}
