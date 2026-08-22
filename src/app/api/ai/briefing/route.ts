import { NextRequest, NextResponse } from "next/server";
import { generateAIBriefing } from "@/lib/gemini";
import { FlightMission } from "@/types/aviation";

export async function POST(req: NextRequest) {
  try {
    const mission: FlightMission = await req.json();
    if (!mission || !mission.risk) {
      return NextResponse.json(
        { success: false, error: "Valid mission telemetry twin is required." },
        { status: 400 }
      );
    }

    const briefing = await generateAIBriefing(mission);
    return NextResponse.json({ success: true, data: briefing });
  } catch (error) {
    console.error("API AI Briefing Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}