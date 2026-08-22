export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PRESET_SCENARIOS } from "@/lib/simulation/scenarios";

export async function GET() {
  try {
    const dbMissions = await prisma.mission.findMany({
      include: { aircraft: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      data: dbMissions,
      presets: PRESET_SCENARIOS,
    });
  } catch (error) {
    console.error("API Missions GET Error:", error);
    return NextResponse.json({
      success: true,
      data: [],
      presets: PRESET_SCENARIOS,
      warning: "Database offline, using in-memory preset scenarios.",
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mission = await prisma.mission.create({
      data: {
        callsign: body.callsign,
        aircraftId: body.aircraftId,
        originIcao: body.originIcao,
        destIcao: body.destIcao,
        distanceKm: body.distanceKm,
        routeHeadingDeg: body.routeHeadingDeg,
        payloadKg: body.payloadKg,
        initialSocPercent: body.initialSocPercent,
        verdict: body.verdict,
        riskScore: body.riskScore,
        mode: body.mode || "SIM",
        weatherJson: JSON.stringify(body.weather),
        windJson: JSON.stringify(body.wind),
        energyJson: JSON.stringify(body.energy),
        airspaceJson: JSON.stringify(body.airspaceConflicts),
        riskFactorsJson: JSON.stringify(body.riskFactors),
        hardGatesJson: JSON.stringify(body.hardGates),
        evidenceJson: JSON.stringify(body.evidence),
        aiBriefingJson: body.aiBriefing ? JSON.stringify(body.aiBriefing) : null,
      },
    });

    return NextResponse.json({ success: true, data: mission });
  } catch (error) {
    console.error("API Missions POST Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}