import { NextRequest, NextResponse } from "next/server";
import { decomposeWindVector } from "@/lib/weather";
import { calculateEnergyAndPONR } from "@/lib/energy";
import { evaluateAirspaceConflicts } from "@/lib/airspace";
import { compileEvidenceAudit, evaluateMissionRisk } from "@/lib/risk";
import { AircraftSpecs, Vertiport, WeatherData } from "@/types/aviation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      aircraft,
      origin,
      destination,
      routeDistanceKm,
      routeHeadingDeg,
      plannedPayloadKg,
      initialSocPercent,
      weather,
      mode = "SIM",
      enableTfr = false,
    }: {
      aircraft: AircraftSpecs;
      origin: Vertiport;
      destination: Vertiport;
      routeDistanceKm: number;
      routeHeadingDeg: number;
      plannedPayloadKg: number;
      initialSocPercent: number;
      weather: WeatherData;
      mode?: "LIVE" | "SIM" | "HYBRID";
      enableTfr?: boolean;
    } = body;

    if (!aircraft || !origin || !destination || !weather) {
      return NextResponse.json(
        { success: false, error: "Missing mandatory mission parameters." },
        { status: 400 }
      );
    }

    // 1. Decompose wind vector
    const wind = decomposeWindVector(
      weather.windSpeedKts,
      weather.windDirDeg,
      routeHeadingDeg,
      aircraft.nominalCruiseSpeedKts,
      aircraft.maxCrosswindKts
    );

    // 2. Calculate aerodynamic energy & dynamic PONR
    const energy = calculateEnergyAndPONR(
      aircraft,
      routeDistanceKm,
      plannedPayloadKg,
      initialSocPercent,
      weather.tempC,
      wind
    );

    // 3. Evaluate airspace conflicts
    const airspaceConflicts = evaluateAirspaceConflicts(
      origin,
      destination,
      undefined,
      enableTfr
    );

    // 4. Evaluate hard safety gates & 5-factor risk model
    const risk = evaluateMissionRisk(
      aircraft,
      plannedPayloadKg,
      wind,
      energy,
      airspaceConflicts,
      weather,
      mode
    );

    // 5. Compile traceable evidence audit
    const evidence = compileEvidenceAudit(
      aircraft,
      plannedPayloadKg,
      weather,
      wind,
      energy,
      airspaceConflicts
    );

    return NextResponse.json({
      success: true,
      data: {
        wind,
        energy,
        airspaceConflicts,
        risk,
        evidence,
      },
    });
  } catch (error) {
    console.error("API Analyze Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}