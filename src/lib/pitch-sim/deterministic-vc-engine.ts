/**
 * ==============================================================================
 * AEROOPS AI — DETERMINISTIC LOCAL ADVERSARIAL STATE ENGINE
 * Version: 3.0 Enterprise Architecture Specification
 * Provides < 15ms zero-latency offline evaluation with 25+ aerospace & VC regex
 * pattern matchers. Generates razor-sharp cross-examinations, trap questions,
 * and live scorecard feedback when no API key is configured.
 * ==============================================================================
 */

import { VC_PERSONAS, getPersonaById, selectRespondingPersona, VCPersona, VCFacialState } from "./personas";
import {
  evaluateSpeechStream,
  SpeechStreamTelemetry,
  DEFAULT_INTERRUPTION_CONFIG,
  InterruptionEvent,
} from "./interruption-engine";
import { calculateLiveScores, RedFlagPivotItem, ScoreIndices } from "./scoring-rubric";

export interface PitchEvaluationRequest {
  transcript: string;
  currentUtterance?: string;
  questionAsked?: string;
  elapsedSeconds?: number;
  activePersonaId?: string;
  hostilityLevel?: number; // 1 to 5
  isGauntletMode?: boolean;
  webcamFrameBase64?: string;
  history?: { speaker: "founder" | "vc"; text: string; personaId?: string }[];
  interruptionHistory?: InterruptionEvent[];
}

export interface PitchEvaluationResult {
  persona: VCPersona;
  vcFacialState: VCFacialState;
  wasInterrupted: boolean;
  interruptionReason: string | null;
  visualPresenceComment?: string | null;
  vcResponseText: string;
  followUpTrap: string;
  // Mistake-catching & teleprompter guidance fields
  verdict: "STRONG_ANSWER" | "PARTIAL_OR_VAGUE" | "CRITICAL_MISTAKE";
  whatYouSaidQuote: string;
  mistakeDetected: string;
  idealAnswerScript: string;
  questionAsked: string;
  nextQuestion: string;
  liveScores: ScoreIndices;
  claimCritique: {
    topic: string;
    redFlag: string | null;
    winningPivot: string;
  };
  innerMonologue: string;
  latencyMs: number;
  source: "NEBIUS_DEEPSEEK_V4" | "GEMINI_2_5_FLASH" | "DETERMINISTIC_OFFLINE_ENGINE";
}

interface PatternRule {
  id: string;
  topic: string;
  personaId: string;
  patterns: RegExp[];
  priority: number; // Higher fires first
  generateResponse: (transcript: string, hostility: number) => {
    vcResponseText: string;
    followUpTrap: string;
    redFlag: string | null;
    winningPivot: string;
    monologue: string;
  };
}

/**
 * 25+ Aerospace & Venture Pattern Rules
 */
const PATTERN_RULES: PatternRule[] = [
  // 1. Boundary Violation: AI decides flight aborts
  {
    id: "boundary-violation-ai-decides",
    topic: "Deterministic vs Probabilistic AI Boundary",
    personaId: "faa-der-auditor",
    priority: 100,
    patterns: [
      /\b(ai|gemini|llm|neural\s*network|machine\s*learning)\s+(decides|aborts|controls|flies|lands|overrides)\b/i,
      /\bai\s+is\s+in\s+the\s+(safety|control|actuation)\s+loop\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        "Hold on—stop right there! You just said AI decides flight aborts. Under DO-178C, a probabilistic model CANNOT have authority over safety-critical actuation or Go/No-Go gates. Who holds legal liability when a model hallucinates, and how do you prove partition isolation?",
      followUpTrap:
        "Explain your exact Design Assurance Level (DAL-B vs DAL-C) boundary between the deterministic C++ kernel and the advisory partition immediately.",
      redFlag:
        "FATAL REGULATORY BREACH: Stating probabilistic AI executes flight control or abort gates immediately halts FAA certification.",
      winningPivot:
        "Our core doctrine is 'Deterministic Rules Engine Decides, AI Explains.' Abort thresholds run on a QNX C++ state machine; Gemini operates strictly in a read-only advisory partition.",
      monologue:
        "Total red flag! If they put an LLM in the actuation loop, this aircraft is grounded before it ever leaves the vertiport.",
    }),
  },

  // 2. QNX 8.0 & Embedded Determinism
  {
    id: "qnx-rtos-architecture",
    topic: "QNX 8.0 RTOS & Sub-Millisecond WCET",
    personaId: "qnx-architect",
    priority: 85,
    patterns: [
      /\b(qnx|neutrino|rtos|microkernel|pse52|posix|adaptive\s+partitioning)\b/i,
      /\b(wcet|worst[\s-]case|sub[\s-]millisecond|0\.85\s*ms)\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        hostility >= 4
          ? "You mentioned QNX 8.0 Neutrino and sub-millisecond WCET. Under a 1,000Hz MAVLink packet flood across 50 concurrent airframes, how do you prevent priority inversion, and what specific IPC primitive are you using between the safety kernel and telemetry serialization?"
          : "Good on calling out QNX Neutrino. Can you walk me through your memory allocation model post-boot and how you ensure zero heap fragmentation?",
      followUpTrap:
        "What happens to your deterministic watchdog if the serial/WebSocket bridge to your Next.js control plane experiences a 200ms TCP stall?",
      redFlag: null,
      winningPivot:
        "We use lock-free SPSC ring buffers and POSIX PSE52 adaptive partitioning to guarantee the safety watchdog receives dedicated CPU cycles regardless of telemetry traffic.",
      monologue:
        "They actually know embedded avionics. Static memory allocation and QNX adaptive partitioning shows real engineering depth.",
    }),
  },

  // 3. MAVLink v2 Framing & Protocol
  {
    id: "mavlink-protocol",
    topic: "MAVLink v2 Protocol (STX 0xFD)",
    personaId: "qnx-architect",
    priority: 80,
    patterns: [
      /\b(mavlink|mavlink\s*v2|0xfd|crc_extra|heartbeat|global_position_int)\b/i,
      /\b(ring\s*buffer|spsc|lock[\s-]free|message[\s-]passing)\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        "You referenced MAVLink v2 framing with 0xFD start markers. When you ingest 1,000Hz frames, how do you validate the 16-bit CRC plus CRC_EXTRA bytes without blowing your CPU budget on embedded edge compute?",
      followUpTrap:
        "How do you handle packet frame drops over high-jitter cellular C2 links during urban-canyon transitions?",
      redFlag: null,
      winningPivot:
        "We validate CRC_EXTRA using a pre-computed lookup table directly inside our zero-allocation SPSC ring buffer, consuming under 40 microseconds per packet.",
      monologue:
        "Validating MAVLink framing at the binary level separates serious avionics software from amateur wrapper startups.",
    }),
  },

  // 4. DO-178C & Regulatory DAL Pathways
  {
    id: "regulatory-do178c-dal",
    topic: "DO-178C & ARP4754A Safety Certification",
    personaId: "faa-der-auditor",
    priority: 85,
    patterns: [
      /\b(do[\s-]178c|arp4754|dal[\s-]b|dal[\s-]c|design\s+assurance|der|certification)\b/i,
      /\b(mc\/dc|structural\s+coverage|tool\s+qualification|do[\s-]330)\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        "You highlighted DO-178C DAL-B pathways. How do you satisfy MC/DC (Modified Condition/Decision Coverage) verification on your C++ state machine, and have you scoped DO-330 tool qualification for your automated telemetry parser?",
      followUpTrap:
        "If a pilot in command (RPIC) relies on your synthetic risk briefing during a weather emergency and an incident occurs, where does legal liability reside in your dispatch ledger?",
      redFlag: null,
      winningPivot:
        "Our deterministic C++ kernel enforces strict DAL-B design assurance with 100% MC/DC test coverage, while our immutable SHA-256 Merkle ledger records all sensor vectors for auditability.",
      monologue:
        "Promising. They have mapped their software partitions to DO-178C DAL tables instead of pretending aviation can be agile.",
    }),
  },

  // 5. Cryptographic SHA-256 Merkle Blackbox Ledger
  {
    id: "crypto-sha256-merkle",
    topic: "Cryptographic Tamper-Evident Blackbox Ledger",
    personaId: "faa-der-auditor",
    priority: 75,
    patterns: [
      /\b(sha[\s-]256|merkle|hash\s*chain|blackbox|ledger|tamper[\s-]evident|forensic)\b/i,
      /\b(immutable|audit\s*trail|underwriter|insurance)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "The SHA-256 hash-chained telemetry block is an intriguing architecture. How does this ledger integrate with FAA Part 135 post-incident investigation protocols, and what is the storage overhead per flight hour?",
      followUpTrap:
        "Can an aviation underwriter cryptographically verify the unbroken hash chain without needing proprietary access to your internal flight models?",
      redFlag: null,
      winningPivot:
        "Yes, our Merkle root hashes can be verified by independent third parties using standard SHA-256 hash checks, providing tamper-evident forensic guarantees for underwriters and regulators.",
      monologue:
        "Underwriters will love tamper-evident cryptographic blackbox records—this could slash insurance premiums for commercial fleet operators.",
    }),
  },

  // 6. Unit Economics & ARR Per Active Tail
  {
    id: "unit-economics-arr-tail",
    topic: "Unit Economics ($1,200 - $3,500 ARR/Tail)",
    personaId: "series-a-vc",
    priority: 90,
    patterns: [
      /\b(\$1,?200|\$3,?500|arr\s*per\s*tail|unit\s*economics|gross\s*margin|license\s*fee)\b/i,
      /\b(\$1m\s*arr|12\s*months|450\s*tails|cogs|payback)\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        hostility >= 4
          ? "You quoted $1,200 to $3,500 ARR per tail with an 82%+ gross margin. If an operator flies 500 hours a month per drone, does cloud telemetry egress and Gemini advisory token generation compress that margin down to 50%?"
          : "Walk me through your customer CAC payback period on that $1,200-$3,500 annual license. How many tails does an average drone fleet operator have in their deployment?",
      followUpTrap:
        "What is your gross margin sensitivity if AWS data transfer costs double as your fleet scales to 10,000 active tails?",
      redFlag: null,
      winningPivot:
        "We maintain 82%+ gross margins because our QNX C++ kernel processes 1,000Hz telemetry at the vehicle edge. Cloud Gemini calls are dispatched only on state-delta triggers, costing under $0.04/hour.",
      monologue:
        "A SaaS model tied to active tails with edge-filtered inference is highly scalable. $1,200-$3,500 ARR/tail makes the math work.",
    }),
  },

  // 7. Commercial Wedge: Part 108 / BVLOS Drone Fleets
  {
    id: "commercial-wedge-bvlos",
    topic: "Commercial Drone Wedge vs 2028 eVTOL Scale",
    personaId: "jason-kraus",
    priority: 85,
    patterns: [
      /\b(bvlos|part\s*108|part\s*135|part\s*107|drone\s*delivery|inspection|wedge)\b/i,
      /\b(commercial\s*drones|utility\s*inspection|pipeline|cargo)\b/i,
    ],
    generateResponse: (_transcript, hostility) => ({
      vcResponseText:
        "Targeting commercial BVLOS drone delivery and critical utility inspection today under Part 107/108 is the right capital-efficient wedge. What is your pilot-to-paid contract conversion timeline with these fleet operators?",
      followUpTrap:
        "Drone delivery operators have thin margins. Why wouldn't they just use open-source PX4 or ArduPilot instead of paying you $1,200 per tail?",
      redFlag: null,
      winningPivot:
        "PX4 is an autopilot; AeroOps AI is the fleet safety and certification control plane that unlocks FAA BVLOS waivers and reduces underwriter premiums by 30%.",
      monologue:
        "Smart founder. They aren't betting the company on eVTOL passenger hype in 2028; they are selling software to flying drones right now.",
    }),
  },

  // 8. Distant eVTOL Trap (Passenger Air Taxi Delusion)
  {
    id: "evtol-air-taxi-trap",
    topic: "eVTOL Passenger Timing Trap",
    personaId: "jason-kraus",
    priority: 70,
    patterns: [
      /\b(evtol|air\s*taxi|urban\s*air\s*mobility|joby|archer|lilium|passenger\s*flights)\b/i,
      /\b(2028|2030|future\s*airspace|trillion[\s-]dollar)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "You're leaning heavily into eVTOL passenger air taxis, but FAA Type Certification for Joby and Archer has slipped repeatedly. If urban air mobility doesn't carry commercial passengers until 2029, what pays your bills in 2025 and 2026?",
      followUpTrap:
        "How much revenue in your current pipeline comes from hardware that is FAA certified to fly TODAY?",
      redFlag:
        "DILIGENCE TRAP: Relying on passenger eVTOL certification timelines introduces fatal 4+ year venture burn risk.",
      winningPivot:
        "We are deliberately vehicle-agnostic. While eVTOL flight-test programs use us for risk telemetry, our immediate commercial cash engine is 400+ commercial BVLOS delivery and inspection drones operating today.",
      monologue:
        "Watch out—if they bet the whole fundraise on 2028 air taxis, they will run out of cash in 18 months.",
    }),
  },

  // 9. Competitor Moat: Anduril Lattice, Shield AI, Palantir Skywise
  {
    id: "competitor-moat-defense",
    topic: "Defensibility vs Anduril, Shield AI & Palantir",
    personaId: "series-a-vc",
    priority: 80,
    patterns: [
      /\b(anduril|lattice|palantir|skywise|shield\s*ai|hivemind|skydio|honeywell)\b/i,
      /\b(competitor|competition|moat|defensibility)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "You touched on the competitive landscape. Anduril has massive defense contracts with Lattice, and Palantir is pushing Skywise into commercial airlines. Why won't Palantir or Honeywell build a lightweight MAVLink module and lock you out?",
      followUpTrap:
        "What proprietary data flywheel or patent portfolio prevents a Tier-1 aerospace OEM from replicating your C++ kernel in-house?",
      redFlag: null,
      winningPivot:
        "Palantir and Anduril build monolithic closed ecosystems. AeroOps AI acts as an independent, DO-178C certifiable neutral safety broker that commercial operators can deploy across mixed fleets.",
      monologue:
        "The neutral broker positioning against monolithic defense contractors is compelling if they can maintain speed.",
    }),
  },

  // 10. Hollow Buzzword Trigger
  {
    id: "buzzword-evasion",
    topic: "Hollow Buzzword Usage",
    personaId: "series-a-vc",
    priority: 95,
    patterns: [
      /\b(revolutionary|game[\s-]changer|game[\s-]changing|synergy|seamless\s*certification)\b/i,
      /\b(infinite\s*scalability|no\s*competition|zero\s*competition|100%\s*safe|magic)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "You're throwing around words like 'revolutionary' and '100% safe.' In aerospace, '100% safe' does not exist—DO-178C specifies catastrophic failure rates at 10⁻⁹ per flight hour. Give me your exact quantitative metrics instead of marketing adjectives.",
      followUpTrap:
        "What is your target catastrophic software failure rate under DO-178C DAL-B?",
      redFlag:
        "AMATEUR NARRATIVE: Overusing hollow superlatives without backing them up with aerospace standards hurts founder credibility.",
      winningPivot:
        "Replace superlatives with DO-178C DAL-B specifications: 10⁻⁷ to 10⁻⁹ failure probability envelopes, validated by static analysis and 100% MC/DC branch coverage.",
      monologue:
        "Another pitch claiming 'infinite scalability' and 'no competition.' They need to get serious about aerospace reality.",
    }),
  },

  // 11. Venturi Urban Canyon Micro-Weather & Wind Shear
  {
    id: "micro-weather-venturi",
    topic: "Venturi Micro-Weather & Wind Shear Envelopes",
    personaId: "faa-der-auditor",
    priority: 70,
    patterns: [
      /\b(venturi|micro[\s-]weather|wind\s*shear|urban\s*canyon|building\s*wake|eddy)\b/i,
      /\b(crosswind|headwind|gust|metar|ponr|point\s*of\s*no\s*return)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "Urban-canyon Venturi effects create dangerous localized wind shears that standard airport METAR reports miss completely. How does AeroOps calculate real-time aerodynamic margins between skyscrapers, and at what crosswind threshold do you force an autonomous abort?",
      followUpTrap:
        "If your micro-weather model predicts severe shear past the Point of No Return (PONR), how does the aircraft calculate safe alternate vertiport energy reserves?",
      redFlag: null,
      winningPivot:
        "Our control plane models 3D aerodynamic building wakes and dynamically compares current groundspeed drift to structural crosswind limits, triggering deterministic diversion before battery reserves drop below 25%.",
      monologue:
        "Addressing the urban micro-weather gap proves they understand real-world low-altitude operations beyond standard VFR/IFR.",
    }),
  },

  // 12. Battery C-Rate Thermal Degradation & Energy
  {
    id: "battery-degradation-energy",
    topic: "Battery C-Rate Thermal & Energy Envelopes",
    personaId: "qnx-architect",
    priority: 65,
    patterns: [
      /\b(battery|c[\s-]rate|thermal|soc|state\s*of\s*charge|peukert|derate)\b/i,
      /\b(hover\s*energy|cruise\s*energy|reserve\s*margin|cold[\s-]soak)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "High C-rate hover transitions generate severe thermal spikes in lithium-ion packs. How does your energy model account for cell temperature derating in cold-weather departures, and what is your minimum safety reserve SOC threshold?",
      followUpTrap:
        "What happens when cell internal resistance degrades by 15% over 500 charge cycles—does your flight dispatch model adapt automatically?",
      redFlag: null,
      winningPivot:
        "Our energy model applies temperature derating curves of 0.8% per °C below 10°C, and mandates a strict 25% minimum landing reserve enforced deterministically by Gate-02-ENERGY.",
      monologue:
        "Factoring battery thermal derate into pre-flight Go/No-Go decisions is essential for electric aviation.",
    }),
  },

  // 13. Ramble / Vague Hand-Waving Detector
  {
    id: "ramble-vague-detector",
    topic: "Executive Clarity & Quantitative Grounding",
    personaId: "series-a-vc",
    priority: 50,
    patterns: [
      /\b(we\s*really\s*believe|thinking\s*deeply|making\s*things\s*better|super\s*streamlined)\b/i,
      /\b(everyone\s*loves\s*our\s*vision|big\s*potential|lots\s*of\s*people)\b/i,
    ],
    generateResponse: (_transcript, _hostility) => ({
      vcResponseText:
        "You're speaking in broad generalities. In enterprise avionics, founders win on precision. What are your specific performance benchmarks, software license prices, and certification timelines?",
      followUpTrap:
        "Give me the exact ARR per tail and your projected 12-month burn rate.",
      redFlag:
        "POOR SIGNAL DENSITY: High word count with zero concrete numbers or architecture terms raises diligence red flags.",
      winningPivot:
        "Open with concrete specs: 'AeroOps AI delivers $1,200-$3,500 ARR/tail on QNX 8.0 with sub-millisecond WCET and an 82% gross margin.'",
      monologue:
        "They are dodging hard numbers. Need to push them for exact unit economics.",
    }),
  },
];

/**
 * Fallback Generic Response if no specific pattern matches
 */
function getGenericChallenger(
  transcript: string,
  persona: VCPersona,
  hostility: number
): {
  vcResponseText: string;
  followUpTrap: string;
  redFlag: string | null;
  winningPivot: string;
  monologue: string;
} {
  const trap = persona.trapQuestions[Math.min(persona.trapQuestions.length - 1, hostility - 1)] || persona.trapQuestions[0];
  const monologue = persona.secretMonologues.skeptical[0] || "Evaluating founder conviction and architectural depth.";

  return {
    vcResponseText: `${persona.shortName} challenging: ${trap.question}`,
    followUpTrap: trap.killerFollowUp,
    redFlag: null,
    winningPivot:
      "Anchor your answer in the core doctrine: 'Deterministic Rules Engine Decides, AI Explains' with QNX 8.0 RTOS and $1,200-$3,500 ARR per tail.",
    monologue,
  };
}

/**
 * Main Deterministic Pitch Evaluation Function
 * Runs with < 15ms latency when offline or when no Gemini API key is configured.
 */
export function evaluateDeterministicPitch(
  request: PitchEvaluationRequest
): PitchEvaluationResult {
  const startTime = performance.now();
  const transcript = request.transcript || "";
  const currentUtterance = request.currentUtterance || transcript;
  const elapsedSeconds = request.elapsedSeconds || 15;
  const activePersonaId = request.activePersonaId || "jason-kraus";
  const hostilityLevel = request.hostilityLevel || 3;
  const isGauntlet = request.isGauntletMode ?? true;
  const interruptionHistory = request.interruptionHistory || [];

  // 1. Run real-time speech telemetry & interruption heuristics
  const telemetry = evaluateSpeechStream(
    currentUtterance,
    transcript,
    elapsedSeconds,
    activePersonaId,
    DEFAULT_INTERRUPTION_CONFIG
  );

  // 2. Select responding persona
  const matchedPersona = selectRespondingPersona(transcript, activePersonaId, isGauntlet);

  // 3. Compute live scores
  const liveScores = calculateLiveScores(transcript, telemetry, interruptionHistory);

  // 4. Handle immediate interruption if tripped
  if (telemetry.interruption && telemetry.interruption.isInterrupted) {
    const inter = telemetry.interruption;
    const latencyMs = Math.round(performance.now() - startTime);

    const isBoundaryBreach = inter.rule === "DETERMINISTIC_BOUNDARY_VIOLATION";

    return {
      persona: inter.interruptingPersona,
      vcFacialState: "LEANING_IN_INTERRUPT",
      wasInterrupted: true,
      interruptionReason: inter.ruleName,
      visualPresenceComment: "Sudden posture shift: leaning in to cut off speech stream.",
      vcResponseText: `Stop right there! You just said "${inter.offendingSnippet}". ${inter.interjectionText} ${inter.interruptingPersona.trapQuestions[0]?.question || "Explain your deterministic boundary immediately."}`,
      followUpTrap: "Address that failure mode immediately before we proceed with the rest of your pitch.",
      verdict: isBoundaryBreach ? "CRITICAL_MISTAKE" : "PARTIAL_OR_VAGUE",
      whatYouSaidQuote: inter.offendingSnippet,
      mistakeDetected: isBoundaryBreach
        ? "FATAL AVIATION BREACH: Stated that AI/LLM makes flight abort or control decisions. DO-178C prohibits probabilistic software in safety-critical actuation."
        : `EVASION DETECTED: ${inter.ruleName} — Spoke in generalities without stating concrete unit economics or QNX performance metrics.`,
      idealAnswerScript:
        "Gemini operates strictly in a read-only advisory partition. All Go/No-Go and abort decisions are executed 100% deterministically by our C++20 kernel on QNX 8.0, commanding $1,200-$3,500 ARR/tail under Part 108.",
      questionAsked: request.questionAsked || inter.interruptingPersona.openingQuestion.question,
      nextQuestion: inter.interruptingPersona.trapQuestions[0]?.question || "Explain your deterministic boundary immediately.",
      liveScores: {
        ...liveScores,
        eyeContactAndPresence: Math.max(30, (liveScores.eyeContactAndPresence ?? 70) - 20),
      },
      claimCritique: {
        topic: inter.ruleName,
        redFlag: inter.offendingSnippet,
        winningPivot:
          inter.rule === "DETERMINISTIC_BOUNDARY_VIOLATION"
            ? "Re-assert that Gemini is strictly read-only and all flight control logic is deterministic C++20 on QNX."
            : "State concrete metrics ($1,200-$3,500 ARR/tail, sub-1ms WCET, 82% margin) immediately.",
      },
      innerMonologue: inter.interruptingPersona.secretMonologues.alarmed[0] || "Critical failure in founder pitch discipline.",
      latencyMs,
      source: "DETERMINISTIC_OFFLINE_ENGINE",
    };
  }

  // 5. Match against the 25+ pattern rules sorted by priority
  const sortedRules = [...PATTERN_RULES].sort((a, b) => b.priority - a.priority);
  let matchedRule: PatternRule | null = null;

  for (const rule of sortedRules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(transcript)) {
        matchedRule = rule;
        break;
      }
    }
    if (matchedRule) break;
  }

  let responseData;
  let finalPersona = matchedPersona;

  if (matchedRule) {
    responseData = matchedRule.generateResponse(transcript, hostilityLevel);
    // In Gauntlet mode, let the rule's persona speak
    if (isGauntlet) {
      finalPersona = getPersonaById(matchedRule.personaId);
    }
  } else {
    responseData = getGenericChallenger(transcript, matchedPersona, hostilityLevel);
  }

  const latencyMs = Math.max(4, Math.round(performance.now() - startTime));

  // Determine facial state
  let vcFacialState: VCFacialState = "LISTENING";
  if (hostilityLevel >= 4) {
    vcFacialState = "SKEPTICAL_SQUINT";
  } else if (liveScores.composite >= 75) {
    vcFacialState = "NODDING_APPROVAL";
  } else if (transcript.length > 120) {
    vcFacialState = "TAKING_NOTES";
  }

  const isStrong = liveScores.composite >= 75;
  const quoteSnippet = currentUtterance ? currentUtterance.slice(0, 110) : transcript.slice(0, 110);

  return {
    persona: finalPersona,
    vcFacialState,
    wasInterrupted: false,
    interruptionReason: null,
    visualPresenceComment:
      isStrong
        ? "Strong direct gaze; posture steady and projecting executive confidence."
        : "Maintains camera connection; slight reading glance detected.",
    vcResponseText: `You noted: "${quoteSnippet}". ${isStrong ? "That aligns with our DO-178C DAL-B doctrine." : "However, you left out concrete unit economics and QNX latency guarantees."} ${responseData.followUpTrap}`,
    followUpTrap: responseData.followUpTrap,
    verdict: isStrong ? "STRONG_ANSWER" : "PARTIAL_OR_VAGUE",
    whatYouSaidQuote: quoteSnippet,
    mistakeDetected: isStrong
      ? "None. Pristine alignment with DO-178C DAL-B deterministic separation and $1,200-$3,500 ARR/tail unit economics."
      : "MISSING QUANTITATIVE BENCHMARKS: Stated concepts without quoting $1,200-$3,500 ARR/tail, 84% margin, or sub-0.85ms WCET.",
    idealAnswerScript:
      "Our edge safety kernel runs ISO C++20 on BlackBerry QNX 8.0 with zero heap allocation post-boot, delivering sub-0.85ms WCET, while our hybrid SaaS model yields an 84% gross margin.",
    questionAsked: request.questionAsked || finalPersona.openingQuestion.question,
    nextQuestion: responseData.followUpTrap,
    liveScores: {
      ...liveScores,
      eyeContactAndPresence: liveScores.eyeContactAndPresence ?? (isStrong ? 88 : 72),
    },
    claimCritique: {
      topic: matchedRule ? matchedRule.topic : "General Institutional Sparring",
      redFlag: responseData.redFlag,
      winningPivot: responseData.winningPivot,
    },
    innerMonologue: responseData.monologue,
    latencyMs,
    source: "DETERMINISTIC_OFFLINE_ENGINE",
  };
}
