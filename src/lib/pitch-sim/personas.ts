/**
 * ==============================================================================
 * AEROOPS AI — MULTI-PERSONA ADVERSARIAL STATE MACHINE
 * Version: 3.0 Enterprise Architecture Specification
 * Defines the 4 specialized investor/auditor personas with distinct psychological
 * profiles, voice signatures, hostility scalers, and trap question matrices.
 * ==============================================================================
 */

export interface VCPersona {
  id: string;
  name: string;
  shortName: string;
  title: string;
  firm: string;
  avatarIcon: string; // lucide icon identifier
  themeColor: string; // hex
  themeBorder: string; // tailwind border
  themeBg: string; // tailwind bg
  themeText: string; // tailwind text
  voiceConfig: {
    pitch: number; // 0.1 to 2.0 (1.0 default)
    rate: number; // 0.1 to 2.0 (1.0 default)
    lang: string;
  };
  focusAreas: string[];
  keyInquiryTopics: string[];
  provocations: string[]; // keywords that trigger this persona in Gauntlet mode
  defaultHostility: number; // 1 (Friendly) to 5 (Hostile)
  trapQuestions: {
    hostility: number;
    question: string;
    expectedEvidence: string[];
    killerFollowUp: string;
  }[];
  interjectionPhrases: {
    ramble: string;
    boundary: string;
    buzzword: string;
    dodge: string;
  };
  secretMonologues: {
    positive: string[];
    skeptical: string[];
    alarmed: string[];
  };
}

export const VC_PERSONAS: VCPersona[] = [
  {
    id: "jason-kraus",
    name: "Jason Kraus Archetype",
    shortName: "Jason Kraus",
    title: "Early-Stage Venture Catalyst",
    firm: "Prepare 4 VC / Angel Syndicate",
    avatarIcon: "Sparkles",
    themeColor: "#38bdf8", // Sky
    themeBorder: "border-sky-500/40",
    themeBg: "bg-sky-950/30",
    themeText: "text-sky-400",
    voiceConfig: {
      pitch: 1.05,
      rate: 1.08,
      lang: "en-US",
    },
    focusAreas: [
      "Commercial Wedge & GTM Speed",
      "Founder-Market Fit & Narrative Clarity",
      "Pilot-to-Paid Conversion Velocity",
      "Immediate Cash Efficiency Before 2028 eVTOL",
    ],
    keyInquiryTopics: [
      "Why AeroOps AI wins today instead of waiting for eVTOL certification",
      "Customer discovery with commercial drone fleets",
      "First 12-month path to $1M ARR",
      "SaaS license adoption friction",
    ],
    provocations: [
      "evtol",
      "2028",
      "2030",
      "passenger",
      "urban air mobility",
      "air taxi",
      "future market",
      "partnership",
      "mou",
      "pipeline",
    ],
    defaultHostility: 3,
    trapQuestions: [
      {
        hostility: 2,
        question:
          "Tell me about your early customer conversations. Who is paying you today, and what specific operational headache forced them to sign?",
        expectedEvidence: ["Commercial drone delivery", "inspection fleets", "Part 107 waivers", "paid pilot"],
        killerFollowUp: "Is that an LOI with zero financial commitment or real contracted recurring revenue?",
      },
      {
        hostility: 3,
        question:
          "You are building a QNX C++ kernel, which sounds expensive and slow to certify—how do you get to $1M ARR in the next 12 months with existing commercial drone operators before a single eVTOL carries a paying passenger?",
        expectedEvidence: ["$1,200-$3,500 ARR/tail", "450 tails", "Part 108 BVLOS", "immediate drone delivery wedge"],
        killerFollowUp: "What is your customer CAC payback period on those initial 400 tails?",
      },
      {
        hostility: 5,
        question:
          "I've seen 20 pitch decks claiming eVTOL is a trillion-dollar TAM. Most of those startups will die before FAA Type Certification. Why shouldn't I just wait 3 years until the hardware OEMs actually certify before backing you?",
        expectedEvidence: ["Wedge in Part 108 BVLOS drones today", "software-only recurring license", "agnostic to airframe OEM"],
        killerFollowUp: "If an OEM builds their own dispatch UI, why do they need AeroOps AI?",
      },
    ],
    interjectionPhrases: {
      ramble: "Jason cutting in—you've spent 40 seconds giving me background philosophy. Give me the concrete commercial traction number right now.",
      boundary: "Wait—hold up. If you're saying AI makes decisions, you just exploded your certification timeline by 5 years. Clarify that immediately.",
      buzzword: "You just used three buzzwords in a row without naming a single paying customer or vehicle class. What is your actual commercial product?",
      dodge: "I asked for your specific path to $1M ARR in 12 months. Give me the number of tails and the ARR per tail, no hand-waving.",
    },
    secretMonologues: {
      positive: [
        "They understand the wedge. Targeting Part 108 delivery drones first is smart capital efficiency.",
        "Clear pricing model. $1,200 to $3,500/tail gives a clean math path to $1M ARR.",
        "Founder knows how to frame aerospace for early-stage venture investors.",
      ],
      skeptical: [
        "Sounds like an R&D grant project pretending to be a commercial SaaS business.",
        "If they rely on 2028 air taxis, they will run out of cash before Series B.",
        "They are avoiding naming their pilot customer cohort.",
      ],
      alarmed: [
        "Zero commercial urgency. They think tech elegance replaces customer checks.",
        "Total red flag: quoting a trillion-dollar TAM without an immediate 12-month wedge.",
      ],
    },
  },
  {
    id: "series-a-vc",
    name: "Hard-Nosed Deep-Tech VC Partner",
    shortName: "Series A VC",
    title: "General Partner, Deep Tech & Defense",
    firm: "Apex Horizon Ventures ($450M AUM)",
    avatarIcon: "ShieldAlert",
    themeColor: "#f59e0b", // Amber
    themeBorder: "border-amber-500/40",
    themeBg: "bg-amber-950/30",
    themeText: "text-amber-400",
    voiceConfig: {
      pitch: 0.95,
      rate: 1.15,
      lang: "en-US",
    },
    focusAreas: [
      "Unit Economics & Gross Margin Structure",
      "LLM Inference & Telemetry Cloud COGS",
      "Defensibility Against Anduril, Shield AI & Palantir",
      "18-to-24 Month Aerospace Sales Cycles",
    ],
    keyInquiryTopics: [
      "ARR per tail unit economics breakdown",
      "Gross margin compression under 1,000Hz telemetry floods",
      "Competitive moat vs Palantir Skywise & Anduril Lattice",
      "Net revenue retention (NRR) and CAC payback",
    ],
    provocations: [
      "pricing",
      "margin",
      "cost",
      "cloud",
      "cogs",
      "anduril",
      "palantir",
      "shield ai",
      "competition",
      "sales cycle",
      "unit economics",
      "burn",
    ],
    defaultHostility: 4,
    trapQuestions: [
      {
        hostility: 3,
        question:
          "Walk me through your exact ARR per tail and gross margin structure. If an operator runs 500 flight hours a month per drone, does your Gemini 2.5 Flash token cost eat your SaaS margin?",
        expectedEvidence: ["82%+ gross margin", "edge C++ kernel filters telemetry", "Gemini called only on state delta triggers", "$0.04/hr inference"],
        killerFollowUp: "What happens to your cloud AWS bill when an operator scales from 10 to 500 drones?",
      },
      {
        hostility: 4,
        question:
          "Anduril has Lattice, Shield AI has Hivemind, and Palantir is pushing Skywise into commercial aviation. Why won't Palantir or Honeywell crush you with an in-house module?",
        expectedEvidence: ["BlackBerry QNX 8.0 embedded safety kernel", "DO-178C DAL-B partition", "independent neutral broker across mixed fleets"],
        killerFollowUp: "Do you have any patents on your C++ lock-free deterministic arbitration engine?",
      },
      {
        hostility: 5,
        question:
          "Aerospace enterprise sales cycles are notoriously 18 to 24 months long. With your current runway, you have 14 months of cash. How do you survive the pilot evaluation purgatory?",
        expectedEvidence: ["Software-only deployment", "non-intrusive MAVLink integration", "converting drone operators in under 6 months"],
        killerFollowUp: "What is your signed pipeline value that can close in under 90 days?",
      },
    ],
    interjectionPhrases: {
      ramble: "Let's stop right there. I don't need adjectives, I need unit economics. What is your software gross margin and what is your CAC payback period?",
      boundary: "Hold up. If your AI model is touching flight aborts, your insurance underwriter will refuse coverage. Address that liability immediately.",
      buzzword: "Calling your tech 'revolutionary' doesn't answer my question about Anduril Lattice. Explain your defensive moat right now.",
      dodge: "You've spoken 80 words without stating a single dollar figure or percentage. Give me the exact ARR per tail.",
    },
    secretMonologues: {
      positive: [
        "Edge filtering is smart. Decoupling 1,000Hz telemetry from cloud LLM calls protects their 80%+ gross margin.",
        "They actually understand aerospace sales cycles—targeting Part 108 operators sidesteps Boeing's 2-year procurement.",
        "Clean unit economics. $2,400/tail with low COGS is a scalable Series A thesis.",
      ],
      skeptical: [
        "They haven't modeled LLM token egress costs under fleet scaling.",
        "They claim no competition, which means they don't know who Anduril or Skydio are.",
        "Looks like a 40% gross margin business disguised as an 80% SaaS play.",
      ],
      alarmed: [
        "Zero financial rigor. They have no idea what their AWS cloud compute bill will look like.",
        "Fatal blindspot: Palantir already has contracts with the exact same defense and commercial primes.",
      ],
    },
  },
  {
    id: "faa-der-auditor",
    name: "Skeptical FAA DER / Regulatory Auditor",
    shortName: "FAA DER Auditor",
    title: "Designated Engineering Representative (DER)",
    firm: "Avionics Safety & Certification Advisory (DO-178C Specialist)",
    avatarIcon: "Scale",
    themeColor: "#ef4444", // Crimson
    themeBorder: "border-red-500/40",
    themeBg: "bg-red-950/30",
    themeText: "text-red-400",
    voiceConfig: {
      pitch: 0.9,
      rate: 0.95,
      lang: "en-US",
    },
    focusAreas: [
      "DO-178C / DO-254 / ARP4754A DAL Boundaries",
      "Deterministic vs Probabilistic Memory & Temporal Isolation",
      "Legal Liability & Remote Pilot in Command (RPIC) Attribution",
      "DO-330 Tool Qualification & Loss-of-Link Fail-Safe",
    ],
    keyInquiryTopics: [
      "Proof that Gemini LLM cannot mutate flight actuation thresholds",
      "SHA-256 hash-chaining and post-incident crash forensics",
      "Design Assurance Level (DAL-B vs DAL-C) allocation",
      "Hazard mitigation during complete loss of C2 telemetry link",
    ],
    provocations: [
      "safety",
      "certify",
      "certification",
      "faa",
      "easa",
      "do-178c",
      "dal",
      "liability",
      "abort",
      "hallucination",
      "der",
      "audit",
      "compliance",
      "part 108",
      "part 135",
    ],
    defaultHostility: 4,
    trapQuestions: [
      {
        hostility: 3,
        question:
          "If your Gemini 2.5 Flash layer hallucinates a benign weather summary while the deterministic engine flags a marginal amber warning, and the RPIC dispatches the aircraft into a shear zone, who holds legal liability—and how do you prove temporal and memory isolation under DO-178C?",
        expectedEvidence: ["Isolated read-only advisory partition", "SHA-256 blackbox ledger", "deterministic state decides verdict", "RPIC dispatch sheet retains cryptographic hash"],
        killerFollowUp: "Under DO-330, how is your Gemini serialization layer qualified so it cannot corrupt the safety-critical memory space?",
      },
      {
        hostility: 4,
        question:
          "Explain your Design Assurance Level (DAL) allocation. Which specific software components are designated DAL-B, and how do you demonstrate bidirectional traceability to ARP4754A system safety assessments?",
        expectedEvidence: ["DAL-B for flight abort & safety gates", "DAL-C for pre-flight dispatch", "read-only isolation for Gemini", "DO-178C table A-3 verification"],
        killerFollowUp: "How do you achieve structural coverage (MC/DC) on your C++20 deterministic kernel?",
      },
      {
        hostility: 5,
        question:
          "During an unrecoverable C2 command-and-control datalink drop over a populated urban corridor, what guarantees that the aircraft follows a deterministic fail-safe diversion rather than waiting on cloud inference?",
        expectedEvidence: ["Autonomous edge execution on QNX 8.0", "zero cloud dependency for in-flight aborts", "pre-computed point of no return (PONR)"],
        killerFollowUp: "What is your physical hardware watchdog timeout in microseconds?",
      },
    ],
    interjectionPhrases: {
      ramble: "Auditor interrupting. You are meandering into generalities. State your exact DO-178C Design Assurance Level and partition strategy.",
      boundary: "Hold on—stop right there! Did you just tell me a probabilistic LLM is in your safety-critical decision loop? Explain your deterministic boundary immediately.",
      buzzword: "Saying your platform is '100% safe' or 'effortlessly certifiable' is an immediate FAA audit failure. What is your DO-178C verification artifact package?",
      dodge: "You evaded my question on temporal isolation. How do you guarantee the AI thread never starves the deterministic safety watchdog?",
    },
    secretMonologues: {
      positive: [
        "They respect the doctrine: Deterministic Decides, AI Explains. That is certifiable.",
        "Proper separation between DAL-B deterministic state engine and non-critical advisory partition.",
        "SHA-256 hash-chained telemetry solves our Part 135 post-incident forensic requirements.",
      ],
      skeptical: [
        "Founder casually mixed AI prediction with safety aborts. Huge regulatory liability.",
        "They haven't considered DO-330 tool qualification for their data parser.",
        "If the RPIC acts on a hallucinated briefing, who goes to federal court?",
      ],
      alarmed: [
        "GROUND THE AIRCRAFT: They think a neural network can decide Go/No-Go for commercial passenger airspace.",
        "This would be rejected at the first FAA DER preliminary hazard review.",
      ],
    },
  },
  {
    id: "qnx-architect",
    name: "Principal Embedded Systems Architect",
    shortName: "QNX Architect",
    title: "Chief Embedded Systems & RTOS Fellow",
    firm: "Ex-BlackBerry QNX / Raytheon Avionics",
    avatarIcon: "Cpu",
    themeColor: "#10b981", // Emerald
    themeBorder: "border-emerald-500/40",
    themeBg: "bg-emerald-950/30",
    themeText: "text-emerald-400",
    voiceConfig: {
      pitch: 1.0,
      rate: 1.05,
      lang: "en-US",
    },
    focusAreas: [
      "QNX 8.0 Neutrino RTOS Microkernel IPC Overhead",
      "Priority Inversion & Adaptive CPU Partitioning",
      "Deterministic Worst-Case Execution Time (WCET < 1ms)",
      "Lock-Free Ring Buffers & Zero Heap Fragmentation",
    ],
    keyInquiryTopics: [
      "p99 IPC message-passing latency under 1,000Hz MAVLink bursts",
      "Eliminating runtime malloc/free in C++20 edge kernel",
      "Serial/WebSocket bridge jitter between QNX core and Next.js control plane",
      "Hardware watchdog starvation prevention",
    ],
    provocations: [
      "qnx",
      "rtos",
      "kernel",
      "c++",
      "latency",
      "ipc",
      "mavlink",
      "memory",
      "heap",
      "ring buffer",
      "wcet",
      "microkernel",
      "burst",
      "hardware",
    ],
    defaultHostility: 4,
    trapQuestions: [
      {
        hostility: 3,
        question:
          "Under a 1,000Hz MAVLink v2 telemetry burst across 50 concurrent tails, what is your p99 IPC latency inside QNX Neutrino, and how do you guarantee the Gemini serialization thread never starves the safety-critical watchdog?",
        expectedEvidence: ["QNX adaptive partitioning", "POSIX PSE52 real-time priority", "lock-free SPSC ring buffers", "sub-millisecond WCET"],
        killerFollowUp: "What specific QNX message-passing primitive are you using: MsgSend/MsgReceive or asynchronous pulses?",
      },
      {
        hostility: 4,
        question:
          "C++20 has powerful abstractions, but runtime exceptions and dynamic heap allocation ruin DO-178C certification. How do you enforce static memory allocation post-boot across your safety kernel?",
        expectedEvidence: ["Zero dynamic heap post-boot", "custom fixed-capacity memory arenas", "no exceptions (-fno-exceptions)", "static ring buffers"],
        killerFollowUp: "How do you verify stack depth to prevent overflow on nested state machine transitions?",
      },
      {
        hostility: 5,
        question:
          "You're bridging an embedded QNX C++ core with a Next.js 14 web control plane. What is your serial/WebSocket bridge jitter, and what happens when the browser WebSocket thread lags by 300ms during an active urban wind shear event?",
        expectedEvidence: ["Edge autonomy on QNX", "browser is monitor-only", "loss of bridge does not affect edge abort", "deterministic local fail-safe"],
        killerFollowUp: "Does your telemetry parser validate MAVLink v2 CRC_EXTRA bytes on every single packet?",
      },
    ],
    interjectionPhrases: {
      ramble: "Architect cutting in. Stop hand-waving about algorithms. What is your verified worst-case execution time under load?",
      boundary: "Stop! You just implied your AI thread has write access to the actuator control bus. In an RTOS, that violates memory isolation.",
      buzzword: "Don't tell me your architecture is 'ultra-low latency'. Tell me the exact microsecond IPC latency and your buffer overrun policy.",
      dodge: "You didn't give me your p99 latency number under MAVLink burst. Is it sub-millisecond or not?",
    },
    secretMonologues: {
      positive: [
        "Finally, someone who understands static memory allocation in avionics. No heap post-boot is the only way.",
        "QNX adaptive partitioning with lock-free SPSC buffers is the textbook solution for 1,000Hz MAVLink ingest.",
        "They treat the web browser as a monitor, keeping the real-time safety loop firmly on the RTOS.",
      ],
      skeptical: [
        "They probably don't know the difference between QNX MsgSend and ChannelCreate.",
        "Smells like they built a standard Node.js server and slapped a QNX logo on their pitch deck.",
        "If they don't profile stack memory usage, they will crash in flight.",
      ],
      alarmed: [
        "DISASTER: They have no memory isolation between the telemetry logger and the safety loop.",
        "They haven't tested priority inversion under packet floods.",
      ],
    },
  },
];

/**
 * Returns a persona by id
 */
export function getPersonaById(id: string): VCPersona {
  const found = VC_PERSONAS.find((p) => p.id === id);
  return found || VC_PERSONAS[0];
}

/**
 * Selects which persona should speak or interrupt in Gauntlet mode based on
 * the content of the founder's statement.
 */
export function selectRespondingPersona(
  transcript: string,
  currentPersonaId: string,
  isGauntletMode: boolean
): VCPersona {
  if (!isGauntletMode) {
    return getPersonaById(currentPersonaId);
  }

  const lower = transcript.toLowerCase();

  // Score each persona based on provocation keywords in the transcript
  let bestScore = -1;
  let bestPersona: VCPersona = getPersonaById(currentPersonaId);

  for (const persona of VC_PERSONAS) {
    let score = 0;
    for (const kw of persona.provocations) {
      if (lower.includes(kw)) {
        score += 2;
      }
    }

    // Give a slight bonus if they are the current speaker to prevent erratic jumping
    if (persona.id === currentPersonaId) {
      score += 0.5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestPersona = persona;
    }
  }

  // If no specific provocation detected, rotate or maintain current
  return bestPersona;
}
