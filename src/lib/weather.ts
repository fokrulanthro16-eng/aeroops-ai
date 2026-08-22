import { WeatherData, WindDecomposition } from "@/types/aviation";

export const FALLBACK_METAR_VECTORS: Record<string, WeatherData> = {
  KLAX: {
    station: "KLAX",
    timestamp: new Date().toISOString(),
    tempC: 18,
    dewpointC: 12,
    windSpeedKts: 8,
    windDirDeg: 250,
    windGustKts: 0,
    visibilitySm: 10,
    altimeterInHg: 29.92,
    cloudCeilingFt: 12000,
    flightCategory: "VFR",
    rawMetar: "KLAX 221100Z 25008KT 10SM FEW120 18/12 A2992 RMK AO2 SLP131",
    isSimulated: true,
  },
  KSFO: {
    station: "KSFO",
    timestamp: new Date().toISOString(),
    tempC: 14,
    dewpointC: 10,
    windSpeedKts: 22,
    windDirDeg: 290,
    windGustKts: 30,
    visibilitySm: 8,
    altimeterInHg: 30.01,
    cloudCeilingFt: 2500,
    flightCategory: "MVFR",
    rawMetar: "KSFO 221100Z 29022G30KT 8SM SCT025 14/10 A3001 RMK AO2",
    isSimulated: true,
  },
  KJFK: {
    station: "KJFK",
    timestamp: new Date().toISOString(),
    tempC: 6,
    dewpointC: 2,
    windSpeedKts: 16,
    windDirDeg: 340,
    windGustKts: 24,
    visibilitySm: 6,
    altimeterInHg: 29.85,
    cloudCeilingFt: 1800,
    flightCategory: "MVFR",
    rawMetar: "KJFK 221100Z 34016G24KT 6SM OVC018 06/02 A2985 RMK AO2",
    isSimulated: true,
  },
  EGLL: {
    station: "EGLL",
    timestamp: new Date().toISOString(),
    tempC: 11,
    dewpointC: 7,
    windSpeedKts: 10,
    windDirDeg: 210,
    windGustKts: 0,
    visibilitySm: 10,
    altimeterInHg: 30.15,
    cloudCeilingFt: 5000,
    flightCategory: "VFR",
    rawMetar: "EGLL 221100Z 21010KT 9999 FEW050 11/07 Q1021 NOSIG",
    isSimulated: true,
  },
};

/**
 * 2D Wind Vector Engine
 * Performs exact circular trigonometric decomposition of wind relative to flight route heading.
 */
export function decomposeWindVector(
  windSpeedKts: number,
  windDirDeg: number,
  routeHeadingDeg: number,
  airspeedKts: number,
  maxCrosswindLimitKts: number
): WindDecomposition {
  // Angle difference in radians
  const angleDiffRad = ((windDirDeg - routeHeadingDeg) * Math.PI) / 180;

  // Crosswind = |WindSpeed * sin(WindDir - RouteHeading)|
  const crosswindKts = Math.abs(windSpeedKts * Math.sin(angleDiffRad));

  // Headwind = WindSpeed * cos(WindDir - RouteHeading)
  // Positive = Headwind (opposing flight), Negative = Tailwind (assisting flight)
  const headwindKts = windSpeedKts * Math.cos(angleDiffRad);

  // Effective Ground Speed = max(5, Airspeed - Headwind)
  const rawGroundSpeed = airspeedKts - headwindKts;
  const groundSpeedKts = Math.max(5, Math.round(rawGroundSpeed * 10) / 10);

  // Wind Correction Angle: arcsin(Crosswind / Airspeed)
  const rawWca = Math.asin(Math.min(1, crosswindKts / Math.max(1, airspeedKts))) * (180 / Math.PI);
  const windCorrectionAngleDeg = Math.round(rawWca * 10) / 10;

  const isCrosswindExceeded = crosswindKts > maxCrosswindLimitKts;

  return {
    routeHeadingDeg,
    windSpeedKts: Math.round(windSpeedKts * 10) / 10,
    windDirDeg: Math.round(windDirDeg),
    crosswindKts: Math.round(crosswindKts * 10) / 10,
    headwindKts: Math.round(headwindKts * 10) / 10,
    groundSpeedKts,
    windCorrectionAngleDeg,
    isCrosswindExceeded,
  };
}

/**
 * Ingests live NOAA METAR from aviationweather.gov with strict 10s timeout and offline fallback.
 */
export async function fetchLiveMetar(icao: string): Promise<WeatherData> {
  const cleanIcao = icao.trim().toUpperCase();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://aviationweather.gov/api/data/metar?ids=${cleanIcao}&format=json`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AeroOps-AI/1.0 (Aviation Flight Safety Platform)" },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`NOAA API returned status ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      const parsed: WeatherData = {
        station: item.icaoId || cleanIcao,
        timestamp: item.reportTime || new Date().toISOString(),
        tempC: typeof item.temp === "number" ? item.temp : 15,
        dewpointC: typeof item.dewp === "number" ? item.dewp : 10,
        windSpeedKts: typeof item.wspd === "number" ? item.wspd : 10,
        windDirDeg: typeof item.wdir === "number" ? item.wdir : 0,
        windGustKts: typeof item.wgst === "number" ? item.wgst : 0,
        visibilitySm: typeof item.visib === "number" ? item.visib : (typeof item.visib === "string" ? parseFloat(item.visib) || 10 : 10),
        altimeterInHg: typeof item.altim === "number" ? item.altim / 100 : (item.altim ? item.altim : 29.92),
        cloudCeilingFt: item.cover === "CLR" || item.cover === "SKC" ? 25000 : (item.clouds?.[0]?.base || 10000),
        flightCategory: (item.fltcat as "VFR" | "MVFR" | "IFR" | "LIFR") || "VFR",
        rawMetar: item.rawOb || `${cleanIcao} LIVE METAR`,
        isSimulated: false,
      };
      return parsed;
    }

    throw new Error("Empty NOAA METAR response array");
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[Weather] Live METAR fetch failed for ${cleanIcao}, falling back to verified test vector:`, error);
    
    if (FALLBACK_METAR_VECTORS[cleanIcao]) {
      return FALLBACK_METAR_VECTORS[cleanIcao];
    }

    // Default synthetic fallback
    return {
      station: cleanIcao,
      timestamp: new Date().toISOString(),
      tempC: 15,
      dewpointC: 9,
      windSpeedKts: 12,
      windDirDeg: 270,
      windGustKts: 0,
      visibilitySm: 10,
      altimeterInHg: 29.92,
      cloudCeilingFt: 8000,
      flightCategory: "VFR",
      rawMetar: `${cleanIcao} 221100Z 27012KT 10SM CLR 15/09 A2992 [FALLBACK]`,
      isSimulated: true,
    };
  }
}
