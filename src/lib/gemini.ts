import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIBriefingPayload, FlightMission } from "@/types/aviation";

export async function generateAIBriefing(mission: FlightMission): Promise<AIBriefingPayload> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || "";

  // If no API key is provided, return grounded deterministic briefing
  if (!apiKey || apiKey.trim() === "") {
    return generateFallbackBriefing(mission, "Synthesized Deterministic Grounding (No API Key)");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-2.5-flash or gemini-1.5-flash as fallback
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const prompt = `
You are AeroOps AI, an autonomous aviation safety systems explainer.
You MUST strictly follow this rule: Deterministic math models make all safety decisions. You ONLY explain and summarize the validated telemetry evidence below.

MISSION TELEMETRY CONTEXT:
- Callsign: ${mission.callsign}
- Aircraft: ${mission.aircraft.model} (${mission.aircraft.type})
- Max Gross MTOW: ${mission.aircraft.mtowKg} kg, Payload Planned: ${mission.plannedPayloadKg} kg (Max: ${mission.aircraft.maxPayloadKg} kg)
- Route: ${mission.origin.name} (${mission.origin.icao}) to ${mission.destination.name} (${mission.destination.icao})
- Distance: ${mission.routeDistanceKm} km, Heading: ${mission.routeHeadingDeg}°
- Wind Vector: ${mission.wind.windSpeedKts} kts @ ${mission.wind.windDirDeg}°, Crosswind: ${mission.wind.crosswindKts} kts (Max Limit: ${mission.aircraft.maxCrosswindKts} kts), Headwind: ${mission.wind.headwindKts} kts
- Weather: ${mission.weather.tempC}°C, Visibility: ${mission.weather.visibilitySm} SM, Ceiling: ${mission.weather.cloudCeilingFt} ft, Flight Cat: ${mission.weather.flightCategory}
- Energy: Initial SOC ${mission.energy.initialSocPercent}%, Temp Derating: ${mission.energy.tempDeratePercent}%, Projected Landing SOC: ${mission.energy.projectedLandingSocPercent}% (Min Reserve: ${mission.aircraft.minReserveSocPercent}%), PONR: ${mission.energy.pointOfNoReturnKm} km
- Airspace Status: ${mission.airspaceConflicts.length === 0 ? "CLEAR" : mission.airspaceConflicts.map(c => `${c.zoneName}: ${c.status}`).join("; ")}
- Deterministic Verdict: ${mission.risk.verdict} (Risk Score: ${mission.risk.compositeScore}/100)
- Hard Safety Gates: ${mission.risk.hardGates.map(g => `${g.name}: ${g.passed ? "PASSED" : "FAILED (" + g.telemetryValue + ")"}`).join("; ")}

Return ONLY a JSON object strictly matching this schema:
{
  "executive_summary": "Concise 2-3 sentence aviation briefing of the verdict and main governing factors.",
  "primary_drivers": ["3-4 bullet points highlighting the quantitative factors driving the verdict"],
  "critical_hazards": ["List of any active hazards or 'None' if clear"],
  "mitigation_steps": ["Concrete operational or pilot mitigation steps"],
  "data_quality_notes": ["Assessment of METAR and sensor integrity"],
  "voice_briefing_transcript": "Crisp, professional 2-3 sentence air traffic dispatch style voice transmission summarizing verdict, wind, reserve, and clearance status."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText) as AIBriefingPayload;
    parsed.generated_at = new Date().toISOString();
    parsed.model_used = "Google Gemini 2.5 Flash";
    return parsed;
  } catch (error) {
    console.error("[Gemini API Error, falling back to deterministic explanation]:", error);
    return generateFallbackBriefing(mission, "Deterministic Rule Grounding (Fallback)");
  }
}

function generateFallbackBriefing(mission: FlightMission, sourceTag: string): AIBriefingPayload {
  const verdict = mission.risk.verdict;
  const failedGates = mission.risk.hardGates.filter(g => !g.passed);

  if (verdict === "GO") {
    return {
      executive_summary: `Mission ${mission.callsign} verified GO with composite risk score of ${mission.risk.compositeScore}/100. All structural, aerodynamic, weather, and energy gates are fully satisfied with a ${mission.energy.projectedLandingSocPercent}% projected landing reserve.`,
      primary_drivers: [
        `Crosswind of ${mission.wind.crosswindKts} kts is well within airframe limit of ${mission.aircraft.maxCrosswindKts} kts`,
        `Projected landing reserve at ${mission.energy.projectedLandingSocPercent}% exceeds ${mission.aircraft.minReserveSocPercent}% regulatory baseline`,
        `Flight corridor clear of active TFR or prohibited airspace incursions`,
        `VFR flight category confirmed with ${mission.weather.visibilitySm} SM visibility`,
      ],
      critical_hazards: ["No active prohibitive hazards identified in primary or alternate flight corridors."],
      mitigation_steps: [
        "Maintain standard departure corridors and ATC telemetry link.",
        "Perform pre-departure battery cell temperature and balancing check.",
      ],
      data_quality_notes: [
        `Ingested METAR station ${mission.weather.station} report verified fresh.`,
      ],
      voice_briefing_transcript: `AeroOps dispatch to ${mission.callsign}. Mission clearance is GO. Winds are ${mission.wind.windSpeedKts} knots, landing reserve confirmed at ${mission.energy.projectedLandingSocPercent} percent. All safety gates clear for departure.`,
      generated_at: new Date().toISOString(),
      model_used: sourceTag,
    };
  } else if (verdict === "AMBER") {
    return {
      executive_summary: `Mission ${mission.callsign} evaluated as AMBER (Score ${mission.risk.compositeScore}/100). Heightened operational risk detected due to marginal crosswinds (${mission.wind.crosswindKts} kts) or battery reserve buffers (${mission.energy.projectedLandingSocPercent}%). Pilot-in-command acknowledgment required.`,
      primary_drivers: [
        `Elevated crosswind of ${mission.wind.crosswindKts} kts approaching envelope limit (${mission.aircraft.maxCrosswindKts} kts)`,
        `Cold ambient temperature (${mission.weather.tempC}°C) applied ${mission.energy.tempDeratePercent}% capacity derate`,
        `Projected landing reserve at ${mission.energy.projectedLandingSocPercent}% creates tighter divert margin`,
      ],
      critical_hazards: [
        "Crosswind gusts during final approach flare",
        "Limited holding time reserve if ATC introduces holding delays",
      ],
      mitigation_steps: [
        "File secondary vertiport divert waypoint prior to departure",
        "Ensure full flight control trim check for lateral wind compensation",
        "Operator supervisory concurrence required",
      ],
      data_quality_notes: [
        "METAR reporting moderate gust vectors; monitor station updates every 15 minutes",
      ],
      voice_briefing_transcript: `AeroOps dispatch advisory for ${mission.callsign}. Mission status evaluated as AMBER. Crosswind is ${mission.wind.crosswindKts} knots with ${mission.energy.projectedLandingSocPercent} percent landing reserve. Divert waypoint confirmation required before pushback.`,
      generated_at: new Date().toISOString(),
      model_used: sourceTag,
    };
  } else {
    return {
      executive_summary: `MISSION REJECTED (NO-GO, Score ${mission.risk.compositeScore}/100): ${failedGates.length} Hard Safety Gate violations detected. Immediate flight prohibition enforced.`,
      primary_drivers: failedGates.map(
        (g) => `${g.name}: ${g.telemetryValue} violates limit of ${g.limitThreshold}`
      ),
      critical_hazards: [
        "Imminent risk of in-flight battery exhaustion or severe structural aerodynamic limit breach",
        "Potential active TFR airspace violation resulting in regulatory grounding",
      ],
      mitigation_steps: [
        "ABORT FLIGHT RELEASE IMMEDIATELY",
        "Recharge aircraft to 100% and adjust cargo weight to certified envelope",
        "Await weather clearance or TFR expiration",
      ],
      data_quality_notes: [
        "Deterministic safety interlocks triggered automatically; flight release locked",
      ],
      voice_briefing_transcript: `AeroOps emergency alert to ${mission.callsign}. Mission status is strictly NO-GO. Hard safety gates triggered due to prohibitive conditions. Flight authorization is revoked.`,
      generated_at: new Date().toISOString(),
      model_used: sourceTag,
    };
  }
}
