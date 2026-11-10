/**
 * ==============================================================================
 * AEROOPS AI — VC PITCH & DUE DILIGENCE SPARRING API ROUTE
 * Endpoint: POST /api/pitch-sim
 * Hybrid streaming & evaluation route with Google Gemini 2.5 Flash and automatic
 * deterministic offline fallback (< 15ms) when no API key is configured.
 * ==============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  evaluateDeterministicPitch,
  PitchEvaluationRequest,
  PitchEvaluationResult,
} from "@/lib/pitch-sim/deterministic-vc-engine";
import { AEROOPS_ARCH_SPEC, THESIS_PILLARS } from "@/lib/pitch-sim/knowledge-vault";
import { getPersonaById, selectRespondingPersona } from "@/lib/pitch-sim/personas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = (await req.json()) as PitchEvaluationRequest;
    const {
      transcript = "",
      currentUtterance = "",
      elapsedSeconds = 20,
      activePersonaId = "jason-kraus",
      hostilityLevel = 3,
      isGauntletMode = true,
      history = [],
      interruptionHistory = [],
    } = body;

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
      process.env.GOOGLE_GENAI_API_KEY ||
      "";

    // If no API key configured or transcript is empty, execute deterministic engine immediately
    if (!apiKey || apiKey.trim() === "" || !transcript.trim()) {
      const deterministicResult = evaluateDeterministicPitch({
        transcript,
        currentUtterance,
        elapsedSeconds,
        activePersonaId,
        hostilityLevel,
        isGauntletMode,
        history,
        interruptionHistory,
      });

      return NextResponse.json(deterministicResult, {
        headers: {
          "X-Execution-Engine": "AeroOps-Deterministic-Offline-v3",
          "X-Engine-Latency-Ms": `${deterministicResult.latencyMs}`,
        },
      });
    }

    // Attempt Gemini 2.5 Flash invocation
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const activePersona = selectRespondingPersona(transcript, activePersonaId, isGauntletMode);

      const systemPrompt = `
You are roleplaying as the active investor/auditor in the AeroOps AI VC Pitch & Due Diligence Sparring Simulator.
ACTIVE PERSONA:
- Name: ${activePersona.name} (${activePersona.shortName})
- Title: ${activePersona.title} at ${activePersona.firm}
- Focus: ${activePersona.focusAreas.join("; ")}
- Hostility Level: ${hostilityLevel}/5 (1 = friendly discovery, 5 = hostile term-sheet grill)
- Tone: ${activePersona.voiceConfig.rate > 1 ? "rapid, high pressure" : "authoritative, exacting, technical"}

AUTHORITATIVE ARCHITECTURAL CONTEXT (AeroOps AI v3.0):
- Core Doctrine: "${AEROOPS_ARCH_SPEC.coreDoctrine.motto}"
- Safety Kernel: ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.rtos}, ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.language}, ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.scheduling}, static memory, lock-free SPSC ring buffers, WCET < 0.85ms, 1,000Hz MAVLink v2 (STX 0xFD).
- Control Plane: Next.js 14, Venturi urban canyon micro-weather, battery C-rate thermal degradation, C2 link loss models.
- Certification: DO-178C DAL-B abort pathways, ARP4754A, SHA-256 Merkle audit blackbox ledger.
- Business Model: $1,200-$3,500 ARR/tail hybrid SaaS + flight hour fee; 82%+ gross margin; wedge is commercial BVLOS drone delivery & utility inspection under Part 108/135 waivers (NOT distant 2028 eVTOL).

CRITICAL SPARRING RULES:
1. If founder says probabilistic AI makes flight control decisions or aborts, IMMEDIATELY INTERRUPT (wasInterrupted = true).
2. If founder uses hollow buzzwords (revolutionary, synergy, seamless certification, 100% safe), challenge aggressively.
3. If founder speaks > 40s with zero quantitative numbers, call out ramble.
4. Otherwise, challenge them on technical rigor, unit economics, or certification.

Respond ONLY with valid JSON conforming to this schema:
{
  "wasInterrupted": boolean,
  "interruptionReason": string or null,
  "vcResponseText": string (1-3 razor-sharp, punchy sentences in character),
  "followUpTrap": string (one killer follow-up trap question),
  "liveScores": {
    "tdi": number (0-100),
    "rmr": number (0-100),
    "icv": number (0-100),
    "vcp": number (0-100),
    "composite": number (0-100)
  },
  "claimCritique": {
    "topic": string,
    "redFlag": string or null,
    "winningPivot": string
  },
  "innerMonologue": string (what the investor is secretly thinking in real-time)
}
`;

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const userPrompt = `
FOUNDER'S TRANSCRIPT SO FAR:
"${transcript}"

CURRENT UTTERANCE:
"${currentUtterance || transcript}"

SESSION METRICS:
- Elapsed Seconds: ${elapsedSeconds}
- Word Count: ${(currentUtterance || transcript).split(/\s+/).length}
- Prior Interruptions Count: ${interruptionHistory.length}

Evaluate the pitch as ${activePersona.name} and return the JSON evaluation.
`;

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: userPrompt },
      ]);

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      const latencyMs = Math.round(performance.now() - startTime);

      const evaluationResult: PitchEvaluationResult = {
        persona: activePersona,
        wasInterrupted: Boolean(parsed.wasInterrupted),
        interruptionReason: parsed.interruptionReason || null,
        vcResponseText: parsed.vcResponseText || "Let's dig deeper into your unit economics.",
        followUpTrap: parsed.followUpTrap || "What is your customer CAC payback period?",
        liveScores: {
          tdi: Number(parsed.liveScores?.tdi ?? 65),
          rmr: Number(parsed.liveScores?.rmr ?? 65),
          icv: Number(parsed.liveScores?.icv ?? 65),
          vcp: Number(parsed.liveScores?.vcp ?? 75),
          composite: Number(parsed.liveScores?.composite ?? 67),
        },
        claimCritique: {
          topic: parsed.claimCritique?.topic || "Architectural Diligence",
          redFlag: parsed.claimCritique?.redFlag || null,
          winningPivot:
            parsed.claimCritique?.winningPivot ||
            "Anchor your answer in DO-178C DAL-B deterministic separation and $1,200-$3,500 ARR per tail.",
        },
        innerMonologue: parsed.innerMonologue || "Assessing founder technical credibility.",
        latencyMs,
        source: "GEMINI_2_5_FLASH",
      };

      return NextResponse.json(evaluationResult, {
        headers: {
          "X-Execution-Engine": "Google-Gemini-2.5-Flash",
          "X-Engine-Latency-Ms": `${latencyMs}`,
        },
      });
    } catch (geminiError) {
      console.warn(
        "[Gemini API fallback to deterministic engine]:",
        geminiError instanceof Error ? geminiError.message : geminiError
      );

      // Seamless fallback to deterministic engine
      const deterministicResult = evaluateDeterministicPitch({
        transcript,
        currentUtterance,
        elapsedSeconds,
        activePersonaId,
        hostilityLevel,
        isGauntletMode,
        history,
        interruptionHistory,
      });

      return NextResponse.json(deterministicResult, {
        headers: {
          "X-Execution-Engine": "AeroOps-Deterministic-Offline-Fallback",
          "X-Engine-Latency-Ms": `${deterministicResult.latencyMs}`,
        },
      });
    }
  } catch (error) {
    console.error("[Pitch Sim API Error]:", error);

    const fallback = evaluateDeterministicPitch({
      transcript: "General architectural overview.",
      activePersonaId: "jason-kraus",
      hostilityLevel: 3,
    });

    return NextResponse.json(fallback, { status: 200 });
  }
}
