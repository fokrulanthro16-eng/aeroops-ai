/**
 * ==============================================================================
 * AEROOPS AI — VC PITCH & DUE DILIGENCE SPARRING API ROUTE
 * Endpoint: POST /api/pitch-sim
 * Ultra-Low-Latency Multimodal Backend powered by Nebius Token Factory
 * Primary: deepseek-ai/DeepSeek-V4.1-Flash-1017 (738 Tok/s) with Multimodal Vision
 * Fallback: moonshotai/Kimi-K3.1-Pro / MiniMaxAI/MiniMax-M3.1-Flash
 * Automatic Deterministic Offline Fallback (< 15ms)
 * ==============================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import {
  evaluateDeterministicPitch,
  PitchEvaluationRequest,
  PitchEvaluationResult,
} from "@/lib/pitch-sim/deterministic-vc-engine";
import { AEROOPS_ARCH_SPEC } from "@/lib/pitch-sim/knowledge-vault";
import { getPersonaById, selectRespondingPersona, VCFacialState } from "@/lib/pitch-sim/personas";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  try {
    const body = (await req.json()) as PitchEvaluationRequest & {
      webcamFrameBase64?: string;
    };

    const {
      transcript = "",
      currentUtterance = "",
      elapsedSeconds = 20,
      activePersonaId = "jason-kraus",
      hostilityLevel = 3,
      isGauntletMode = true,
      webcamFrameBase64,
      history = [],
      interruptionHistory = [],
    } = body;

    const nebiusApiKey = process.env.NEBIUS_API_KEY || "";
    let nebiusBaseUrl = process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.us-north1.nebius.com/v1";
    if (nebiusBaseUrl.endsWith("/")) {
      nebiusBaseUrl = nebiusBaseUrl.slice(0, -1);
    }

    const activePersona = selectRespondingPersona(transcript, activePersonaId, isGauntletMode);

    // If no Nebius API key configured or transcript is empty, execute deterministic engine immediately
    if (!nebiusApiKey || nebiusApiKey.trim() === "" || !transcript.trim()) {
      const deterministicResult = evaluateDeterministicPitch({
        transcript,
        currentUtterance,
        elapsedSeconds,
        activePersonaId,
        hostilityLevel,
        isGauntletMode,
        webcamFrameBase64,
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

    // Prepare system prompt for Nebius Token Factory (DeepSeek V4.1 Flash)
    const systemPrompt = `
You are roleplaying as an active executive partner in the AeroOps AI VC Pitch & Due Diligence Sparring Boardroom on Sand Hill Road.
ACTIVE PERSONA:
- Name: ${activePersona.name} (${activePersona.shortName})
- Title: ${activePersona.title} at ${activePersona.firm}
- Specialty: ${activePersona.focusAreas.join("; ")}
- Hostility Level: ${hostilityLevel}/5 (1 = friendly discovery, 5 = hostile term-sheet grill)
- Tone: ${activePersona.voiceConfig.rate > 1 ? "rapid, high-pressure, numbers-driven" : "authoritative, exacting, aerospace specialist"}

AEROOPS AI v3.0 TECHNICAL CANON:
- Core Doctrine: "${AEROOPS_ARCH_SPEC.coreDoctrine.motto}"
- Safety Kernel: ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.rtos}, ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.language}, ${AEROOPS_ARCH_SPEC.layer1EdgeKernel.scheduling}, static memory, lock-free SPSC ring buffers, WCET < 0.85ms, 1,000Hz MAVLink v2 (STX 0xFD).
- Fleet Control Plane: Next.js 14, Venturi urban canyon micro-weather, battery C-rate thermal degradation.
- Certification: DO-178C DAL-B abort pathways, ARP4754A, SHA-256 Merkle blackbox audit ledger.
- Business Model: $1,200-$3,500 ARR/tail hybrid SaaS + flight hour fee; 82%+ gross margin; wedge is commercial BVLOS drone delivery under Part 108/135 waivers (NOT distant 2028 eVTOL).

SPARRING DIRECTIVES:
1. If founder says probabilistic AI makes flight control decisions or aborts, IMMEDIATELY INTERRUPT (wasInterrupted = true, vcFacialState = "LEANING_IN_INTERRUPT").
2. If founder uses hollow buzzwords (revolutionary, synergy, seamless certification, 100% safe), challenge aggressively.
3. If founder speaks > 40s with zero quantitative figures, call out ramble.
4. Multimodal Vision: If a webcam image is provided, evaluate the founder's eye contact with the camera lens, physical composure, whether they are reading off a hidden script, and executive confidence in visualPresenceComment and eyeContactAndPresence score (0-100).
5. Facial State: Select from "LISTENING", "SKEPTICAL_SQUINT", "TAKING_NOTES", "LEANING_IN_INTERRUPT", "NODDING_APPROVAL".

Return ONLY raw JSON strictly conforming to this schema (no markdown wrappers):
{
  "persona": "${activePersona.name}",
  "vcFacialState": "LISTENING" | "SKEPTICAL_SQUINT" | "TAKING_NOTES" | "LEANING_IN_INTERRUPT" | "NODDING_APPROVAL",
  "wasInterrupted": boolean,
  "interruptionReason": string | null,
  "visualPresenceComment": string | null,
  "vcResponseText": string (1-3 razor-sharp sentences in persona voice),
  "followUpTrap": string (one killer follow-up trap question),
  "liveScores": {
    "tdi": number (0-100),
    "rmr": number (0-100),
    "icv": number (0-100),
    "vcp": number (0-100),
    "eyeContactAndPresence": number (0-100)
  },
  "claimCritique": {
    "flaw": string | null,
    "winningPivot": string | null
  }
}
`;

    // Construct User Message (with optional Multimodal Webcam Frame)
    let userContent: unknown;

    if (webcamFrameBase64 && webcamFrameBase64.startsWith("data:image")) {
      userContent = [
        {
          type: "text",
          text: `FOUNDER TRANSCRIPT: "${transcript}"\nCURRENT UTTERANCE: "${currentUtterance || transcript}"\nELAPSED: ${elapsedSeconds}s\nEvaluate transcript and live webcam frame:`,
        },
        {
          type: "image_url",
          image_url: {
            url: webcamFrameBase64,
          },
        },
      ];
    } else {
      userContent = `FOUNDER TRANSCRIPT: "${transcript}"\nCURRENT UTTERANCE: "${currentUtterance || transcript}"\nELAPSED: ${elapsedSeconds}s\nEvaluate the founder's defense.`;
    }

    const modelsToTry = [
      "deepseek-ai/DeepSeek-V4.1-Flash-1017",
      "moonshotai/Kimi-K3.1-Pro",
      "MiniMaxAI/MiniMax-M3.1-Flash",
    ];

    let nebiusResponseText = "";
    let usedModel = modelsToTry[0];

    for (const modelName of modelsToTry) {
      try {
        const response = await fetch(`${nebiusBaseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${nebiusApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            temperature: 0.25,
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const completion = await response.json();
          nebiusResponseText = completion.choices?.[0]?.message?.content || "";
          usedModel = modelName;
          if (nebiusResponseText) break;
        } else {
          const errText = await response.text();
          console.warn(`[Nebius model ${modelName} returned status ${response.status}]:`, errText.slice(0, 200));
        }
      } catch (callError) {
        console.warn(`[Nebius model ${modelName} call failed]:`, callError);
      }
    }

    if (nebiusResponseText) {
      // Parse JSON from model output
      let cleanJson = nebiusResponseText.trim();
      if (cleanJson.startsWith("```json")) {
        cleanJson = cleanJson.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanJson.startsWith("```")) {
        cleanJson = cleanJson.replace(/^```/, "").replace(/```$/, "").trim();
      }

      try {
        const parsed = JSON.parse(cleanJson);
        const latencyMs = Math.round(performance.now() - startTime);

        const evaluationResult: PitchEvaluationResult = {
          persona: activePersona,
          vcFacialState: (parsed.vcFacialState as VCFacialState) || (parsed.wasInterrupted ? "LEANING_IN_INTERRUPT" : "LISTENING"),
          wasInterrupted: Boolean(parsed.wasInterrupted),
          interruptionReason: parsed.interruptionReason || null,
          visualPresenceComment: parsed.visualPresenceComment || null,
          vcResponseText: parsed.vcResponseText || "Let's dig into your unit economics and QNX determinism.",
          followUpTrap: parsed.followUpTrap || "What is your customer CAC payback period on those initial 400 tails?",
          liveScores: {
            tdi: Number(parsed.liveScores?.tdi ?? 70),
            rmr: Number(parsed.liveScores?.rmr ?? 70),
            icv: Number(parsed.liveScores?.icv ?? 68),
            vcp: Number(parsed.liveScores?.vcp ?? 78),
            composite: Math.round(
              (Number(parsed.liveScores?.tdi ?? 70) * 0.3 +
                Number(parsed.liveScores?.rmr ?? 70) * 0.3 +
                Number(parsed.liveScores?.icv ?? 68) * 0.25 +
                Number(parsed.liveScores?.vcp ?? 78) * 0.15)
            ),
            eyeContactAndPresence: Number(parsed.liveScores?.eyeContactAndPresence ?? 82),
          },
          claimCritique: {
            topic: "Boardroom Due Diligence",
            redFlag: parsed.claimCritique?.flaw || null,
            winningPivot:
              parsed.claimCritique?.winningPivot ||
              "Anchor in DO-178C DAL-B deterministic separation and $1,200-$3,500 ARR/tail.",
          },
          innerMonologue: parsed.innerMonologue || activePersona.secretMonologues.skeptical[0],
          latencyMs,
          source: "NEBIUS_DEEPSEEK_V4",
        };

        return NextResponse.json(evaluationResult, {
          headers: {
            "X-Execution-Engine": `Nebius-TokenFactory-${usedModel}`,
            "X-Engine-Latency-Ms": `${latencyMs}`,
          },
        });
      } catch (parseError) {
        console.warn("[Nebius JSON Parse Error, fallback to deterministic]:", parseError);
      }
    }

    // Fallback to deterministic offline engine
    const deterministicResult = evaluateDeterministicPitch({
      transcript,
      currentUtterance,
      elapsedSeconds,
      activePersonaId,
      hostilityLevel,
      isGauntletMode,
      webcamFrameBase64,
      history,
      interruptionHistory,
    });

    return NextResponse.json(deterministicResult, {
      headers: {
        "X-Execution-Engine": "AeroOps-Deterministic-Offline-Fallback",
        "X-Engine-Latency-Ms": `${deterministicResult.latencyMs}`,
      },
    });
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
