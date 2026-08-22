export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMetar } from "@/lib/weather";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const icao = searchParams.get("icao") || "KLAX";

    const weather = await fetchLiveMetar(icao);
    return NextResponse.json({ success: true, data: weather });
  } catch (error) {
    console.error("API Weather Error:", error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}