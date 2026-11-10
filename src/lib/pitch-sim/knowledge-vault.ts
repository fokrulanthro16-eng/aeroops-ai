/**
 * ==============================================================================
 * AEROOPS AI — DOMAIN KNOWLEDGE VAULT & VENTURE DUE DILIGENCE KERNEL
 * Version: 3.0 Enterprise Architecture Specification
 * Authoritative Technical Specification for VC Pitch & Due Diligence Sparring
 * ==============================================================================
 */

export interface ThesisPillar {
  id: string;
  name: string;
  code: string;
  category: "SAFETY_ARCHITECTURE" | "REGULATORY" | "COMMERCIAL" | "EMBEDDED_SYSTEMS";
  requiredTerms: string[];
  description: string;
  defenseScript: string;
}

export interface AeroOpsArchitectureSpec {
  coreDoctrine: {
    motto: string;
    summary: string;
    deterministicIsolation: string;
    aiRole: string;
    safetyStandard: string;
    dalTarget: string;
  };
  layer1EdgeKernel: {
    rtos: string;
    language: string;
    scheduling: string;
    memoryModel: string;
    ipcMechanism: string;
    wcetTargetMs: number;
    telemetryCapacityHz: number;
  };
  layer2FleetControlPlane: {
    framework: string;
    telemetryProtocol: string;
    mavlinkStx: string;
    weatherModeling: string;
    batteryModeling: string;
    c2LinkModeling: string;
  };
  cryptographicAudit: {
    hashAlgorithm: string;
    blockStructure: string[];
    regulatoryAlignment: string[];
  };
  commercialModel: {
    wedgeMarket: string;
    secondaryMarket: string;
    pricingModel: string;
    arrPerTailRange: string;
    flightHourFee: string;
    targetGrossMargin: string;
    salesCycleMonths: string;
    paybackMonths: number;
    firstYearArrTarget: string;
  };
}

export const AEROOPS_ARCH_SPEC: AeroOpsArchitectureSpec = {
  coreDoctrine: {
    motto: "Deterministic Rules Engine Decides, AI Explains.",
    summary:
      "Safety-critical Go/No-Go flight readiness and in-flight autonomous diversion thresholds are computed 100% deterministically via verifiable mathematical state machines. Gemini 2.5 Flash operates strictly in an isolated, read-only advisory partition to synthesize natural-language briefings and post-incident summaries. It NEVER mutates state, actuation, or flight abort gates.",
    deterministicIsolation:
      "Physical and logical memory partition isolation complying with DO-178C / ARP4754A. The deterministic safety kernel executes within dedicated CPU budgets, preventing any advisory LLM serialization thread from consuming safety-critical compute.",
    aiRole:
      "Advisory natural language synthesizer. Consumes verified SHA-256 hash-chained telemetry blocks and deterministic decision matrices to generate dispatcher briefings, pilot risk digests, and operational explanations.",
    safetyStandard: "FAA / EASA DO-178C, DO-254, ARP4754A, DO-330 Tool Qualification",
    dalTarget: "DAL-B for in-flight abort & envelope protection; DAL-C for pre-flight dispatch gate validation",
  },
  layer1EdgeKernel: {
    rtos: "BlackBerry QNX 8.0 Neutrino RTOS",
    language: "Deterministic ISO C++20 (No dynamic heap allocation post-boot)",
    scheduling: "POSIX PSE52 Real-Time Scheduling with Adaptive Partitioning",
    memoryModel: "Static pre-allocated memory pools; zero runtime heap fragmentation",
    ipcMechanism: "Lock-free single-producer single-consumer (SPSC) ring buffers and QNX synchronous message-passing",
    wcetTargetMs: 0.85, // Worst-Case Execution Time < 1ms
    telemetryCapacityHz: 1000, // Ingest up to 1,000 Hz MAVLink v2 frames per core
  },
  layer2FleetControlPlane: {
    framework: "Next.js 14 / TypeScript (App Router, Edge Runtime & WebSockets)",
    telemetryProtocol: "MAVLink v2 Protocol (STX: 0xFD) binary packet framing",
    mavlinkStx: "0xFD",
    weatherModeling: "Venturi urban-canyon micro-weather shear models & building wake eddy simulations",
    batteryModeling: "Dynamic Peukert C-rate thermal degradation curves & cold-soak recovery envelopes",
    c2LinkModeling: "Fresnel-zone link-budget decay & cellular/satellite handover latency models",
  },
  cryptographicAudit: {
    hashAlgorithm: "SHA-256 Merkle Audit Ledger",
    blockStructure: [
      "previous_block_hash",
      "monotonic_hardware_timestamp_ns",
      "mavlink_state_vector",
      "rule_evaluation_bitmap",
      "actuator_command_hash",
    ],
    regulatoryAlignment: [
      "FAA 14 CFR Part 108 (BVLOS Final Rulemaking Pathway)",
      "FAA 14 CFR Part 135 Commercial On-Demand Air Carrier Operations",
      "Aviation Underwriter Telemetry Warranty & Tamper-Evident Post-Incident Forensics",
    ],
  },
  commercialModel: {
    wedgeMarket: "Commercial BVLOS drone delivery, critical utility inspection, and early eVTOL flight-test corridors",
    secondaryMarket: "Part 135 autonomous regional air cargo & urban air mobility (UAM) passenger operations (2028+)",
    pricingModel: "Hybrid: Annual Recurring License per Active Airframe/Tail + Flight Hour Mission Intelligence Fee",
    arrPerTailRange: "$1,200 (Class 1-2 Delivery Drones) to $3,500+ (Class 3-4 Heavy Cargo & eVTOL)",
    flightHourFee: "$2.50 to $8.00 per logged autonomous flight hour",
    targetGrossMargin: "82% - 86% (Edge C++ kernel offloads inference; Gemini LLM calls batched on state delta triggers)",
    salesCycleMonths: "6 to 9 months for commercial fleet operators (vs 18-24 months for legacy aerospace OEMs)",
    paybackMonths: 8,
    firstYearArrTarget: "$1.2M ARR across 450 initial commercial delivery & inspection tails",
  },
};

/**
 * The 8 Core Thesis Pillars required for institutional venture readiness
 */
export const THESIS_PILLARS: ThesisPillar[] = [
  {
    id: "pillar-1",
    name: "DO-178C & ARP4754A DAL Alignment",
    code: "DO-178C / DAL",
    category: "REGULATORY",
    requiredTerms: ["do-178c", "dal", "arp4754", "certification", "dal-b", "dal-c", "safety gate"],
    description: "Clear articulation of deterministic safety assurance vs probabilistic software partitions.",
    defenseScript:
      "Our flight control envelope and Go/No-Go abort mechanisms adhere to DO-178C DAL-B pathways. The deterministic rules engine operates strictly independently of any probabilistic AI models.",
  },
  {
    id: "pillar-2",
    name: "BlackBerry QNX 8.0 Neutrino Kernel",
    code: "QNX 8.0 RTOS",
    category: "EMBEDDED_SYSTEMS",
    requiredTerms: ["qnx", "neutrino", "rtos", "adaptive partitioning", "microkernel", "pse52"],
    description: "Microkernel architecture with adaptive partitioning to prevent priority inversion under telemetry bursts.",
    defenseScript:
      "We run on BlackBerry QNX 8.0 Neutrino RTOS using POSIX PSE52 scheduling. Adaptive partitioning guarantees CPU budgets so a telemetry spike never starves the safety-critical watchdog.",
  },
  {
    id: "pillar-3",
    name: "MAVLink v2 Real-Time Framing",
    code: "MAVLink v2 (0xFD)",
    category: "EMBEDDED_SYSTEMS",
    requiredTerms: ["mavlink", "v2", "0xfd", "telemetry", "packet", "stx", "ring buffer", "crc"],
    description: "Deterministic 1,000Hz MAVLink v2 binary ingest via lock-free ring buffers without dynamic heap allocation.",
    defenseScript:
      "Our C++ edge kernel ingests native MAVLink v2 frames (STX 0xFD) directly into lock-free SPSC ring buffers with static memory allocation, ensuring worst-case execution time under 1 millisecond.",
  },
  {
    id: "pillar-4",
    name: "Deterministic Rules Engine ('Decides')",
    code: "Deterministic Decides",
    category: "SAFETY_ARCHITECTURE",
    requiredTerms: ["deterministic", "rules engine", "decides", "finite state machine", "fsm", "state machine"],
    description: "100% mathematical certainty in Go/No-Go and abort decisions—never left to neural weights.",
    defenseScript:
      "The core architectural doctrine of AeroOps is: 'Deterministic Rules Engine Decides, AI Explains.' Every abort gate is a verified finite state machine evaluated deterministically against live sensor envelopes.",
  },
  {
    id: "pillar-5",
    name: "Gemini 2.5 Flash Advisory Partition ('Explains')",
    code: "Gemini Advisory",
    category: "SAFETY_ARCHITECTURE",
    requiredTerms: ["gemini", "explains", "advisory", "read-only", "read only", "partition", "natural language"],
    description: "Isolated advisory role consuming verified state vectors to synthesize operator natural language briefings.",
    defenseScript:
      "Gemini 2.5 Flash operates strictly in a read-only advisory partition. It digests deterministic state vectors to produce natural language briefings for dispatchers, but has zero write authority to flight control.",
  },
  {
    id: "pillar-6",
    name: "Hybrid SaaS & ARR Per Active Tail",
    code: "ARR / Unit Economics",
    category: "COMMERCIAL",
    requiredTerms: ["arr", "tail", "$1,200", "$3,500", "unit economics", "gross margin", "saas", "license"],
    description: "Clear monetization of $1,200 - $3,500 ARR per tail plus flight hour intelligence fees with 80%+ gross margin.",
    defenseScript:
      "We monetize via a hybrid model: $1,200 to $3,500 ARR per active tail tiered by airframe class, plus $2.50 to $8.00 per autonomous flight hour. Because inference is edge-filtered, our gross margin exceeds 82%.",
  },
  {
    id: "pillar-7",
    name: "Commercial BVLOS Wedge & FAA Part 108/135",
    code: "BVLOS / Part 108",
    category: "COMMERCIAL",
    requiredTerms: ["bvlos", "part 108", "part 135", "part 107", "waiver", "drone delivery", "inspection", "wedge"],
    description: "Targeting commercial drone delivery & utility fleets now under Part 107/108 before 2028 eVTOL passenger scale.",
    defenseScript:
      "We aren't waiting for eVTOL passenger certification in 2028. Our immediate wedge is commercial BVLOS drone delivery and critical infrastructure inspection under FAA Part 108 and Part 135 waivers.",
  },
  {
    id: "pillar-8",
    name: "Cryptographic SHA-256 Merkle Ledger",
    code: "SHA-256 Audit Ledger",
    category: "REGULATORY",
    requiredTerms: ["sha-256", "merkle", "hash chain", "tamper", "audit", "blackbox", "ledger", "forensic"],
    description: "Immutable hash-chained telemetry blocks providing tamper-evident post-incident forensics for underwriters and FAA.",
    defenseScript:
      "Every rule evaluation generates an immutable SHA-256 hash-chained telemetry block linking previous hash, state vector, and decision bitmap. This provides FAA investigators and insurers with tamper-evident proof.",
  },
];

/**
 * Hollow buzzwords that trigger the BUZZWORD EVASION detector
 */
export const HOLLOW_BUZZWORDS: { word: string; severity: "HIGH" | "MEDIUM" }[] = [
  { word: "revolutionary", severity: "HIGH" },
  { word: "game-changing", severity: "HIGH" },
  { word: "game changer", severity: "HIGH" },
  { word: "synergy", severity: "HIGH" },
  { word: "synergies", severity: "MEDIUM" },
  { word: "seamless certification", severity: "HIGH" },
  { word: "effortless", severity: "MEDIUM" },
  { word: "infinite scalability", severity: "HIGH" },
  { word: "infinitely scalable", severity: "HIGH" },
  { word: "no competition", severity: "HIGH" },
  { word: "zero competition", severity: "HIGH" },
  { word: "100% safe", severity: "HIGH" },
  { word: "completely safe", severity: "HIGH" },
  { word: "magic", severity: "HIGH" },
  { word: "autonomous magic", severity: "HIGH" },
  { word: "paradigm shift", severity: "MEDIUM" },
  { word: "next-gen ai", severity: "MEDIUM" },
  { word: "disruptive tech", severity: "MEDIUM" },
  { word: "secret sauce", severity: "MEDIUM" },
  { word: "silver bullet", severity: "HIGH" },
];

/**
 * Acoustic filler words to track and penalize
 */
export const CRUTCH_FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "basically",
  "sort of",
  "you know",
  "actually",
  "literally",
  "kind of",
  "i mean",
  "right?",
];

/**
 * Deterministic Boundary Violation triggers (CRITICAL TRAPS)
 * Phrases where founder implies AI/LLM makes flight actuation or safety decisions
 */
export const DETERMINISTIC_BOUNDARY_VIOLATIONS = [
  /ai\s+(decides|makes\s+the\s+decision|aborts|controls|flies|lands|takes\s+over)/i,
  /gemini\s+(decides|predicts\s+and\s+aborts|controls|authorizes|overrides)/i,
  /llm\s+(determines|decides|controls|acts|authorizes)/i,
  /machine\s+learning\s+(controls|decides|flies|pilots)/i,
  /neural\s+network\s+(authorizes|decides|controls\s+the\s+flight)/i,
  /probabilistic\s+(decision|control|flight\s+loop)/i,
  /ai\s+is\s+in\s+the\s+(control\s+loop|safety\s+loop|actuation\s+loop)/i,
  /our\s+model\s+(makes\s+the\s+call|aborts\s+the\s+flight)/i,
];

/**
 * Concrete quantitative metric indicators
 */
export const QUANTITATIVE_METRIC_INDICATORS = [
  /\b\d+(\.\d+)?\s*%/i, // Percentages: 82%, 15.5%
  /\$\s*\d+([,\.]\d+)?(\s*(k|m|b|thousand|million|arr|tail))?/i, // Currency: $1,200, $3500, $1M
  /\b\d+(\.\d+)?\s*(ms|millisecond|microseconds|us|ns|hz|khz|mhz)/i, // Time/Frequency: 0.85ms, 1000Hz
  /\b(dal\s*[-–]?\s*[a-e]|dal-[abcde])\b/i, // DAL levels: DAL-B, DAL-C
  /\b\d+\s*(months?|weeks?|days?|hours?|flight\s*hours?)\b/i, // Timeframes: 12 months, 500 hours
  /\b(part\s*(107|108|135|91|23|25|27|29))\b/i, // FAA Parts
  /\b\d+\s*(tails?|airframes?|drones?|fleets?|operators?|customers?)\b/i, // Counts
  /\bqnx\s*(8\.0|neutrino)?\b/i, // QNX 8.0
  /\b(wcet|spsc|pse52|sha-256|stx|crc)\b/i, // Specific avionics metrics
];

/**
 * High-profile Red Flag vs Winning Pivot scenarios for instant learning & drill
 */
export const WINNING_PIVOT_DATABASE = [
  {
    id: "pivot-boundary",
    topic: "Deterministic vs Probabilistic AI Safety Boundary",
    triggerQuery: "Who holds liability if Gemini hallucinates an abort call?",
    flawedQuote: "Our AI is so smart that Gemini analyzes the weather and decides whether the drone should abort.",
    personaTriggered: "Skeptical FAA DER Auditor",
    investorDiagnosis:
      "FATAL AVIATION TRAP: Claiming an LLM makes flight abort calls disqualifies software under DO-178C. Probabilistic models cannot be certified for DAL-A/B actuation.",
    winningPivotScript:
      "Gemini never touches flight control or abort actuation. Our architecture enforces a strict DO-178C DAL-B partition: a deterministic C++20 finite state machine evaluates sensor telemetry against mathematical thresholds. Gemini operates strictly in a read-only advisory partition to synthesize dispatcher briefings from SHA-256 hash-chained state snapshots.",
  },
  {
    id: "pivot-wedge",
    topic: "Commercial Wedge & Time-to-Market",
    triggerQuery: "eVTOL won't scale until 2028+. How do you reach $1M ARR in 12 months?",
    flawedQuote: "We are partnering with major eVTOL passenger airlines for urban air mobility in 2030.",
    personaTriggered: "Jason Kraus Archetype",
    investorDiagnosis:
      "GTM DELUSION: Relying on uncertified future eVTOL passenger aircraft means a 5+ year zero-revenue burn.",
    winningPivotScript:
      "We aren't waiting for passenger eVTOL certification. Our commercial wedge is 400+ active commercial BVLOS drone delivery and critical utility inspection fleets operating under FAA Part 107 waivers transitioning to Part 108. At $1,200 to $2,400 ARR per tail across 450 airframes, we cross $1M ARR within 12 months with immediate cash-flow efficiency.",
  },
  {
    id: "pivot-margins",
    topic: "Unit Economics & Inference Gross Margins",
    triggerQuery: "Do LLM token costs eat your SaaS margins at 500 flight hours/month?",
    flawedQuote: "We stream all telemetry frames directly into OpenAI or Gemini for continuous AI analysis.",
    personaTriggered: "Hard-Nosed Deep-Tech VC",
    investorDiagnosis:
      "MARGIN SUICIDE: Streaming high-frequency raw telemetry (1,000Hz) to cloud LLMs creates unsustainable cloud inference bills and gross margins below 30%.",
    winningPivotScript:
      "We maintain 82%+ gross margins by decoupling the edge from the cloud. The C++ kernel on QNX 8.0 processes 1,000Hz MAVLink telemetry locally on the vehicle. Cloud LLM calls are triggered strictly on deterministic state-delta events (e.g. PONR crossing or weather shear alerts). At ~6 advisory queries per flight, our inference cost is under $0.04 per flight hour against a $4.50/hr software margin.",
  },
  {
    id: "pivot-rtos",
    topic: "Embedded Performance & QNX Determinism",
    triggerQuery: "How do you guarantee MAVLink packet bursts don't cause priority inversion?",
    flawedQuote: "We use Node.js and Python microservices with Docker containers on the drone.",
    personaTriggered: "Principal Embedded Systems Architect",
    investorDiagnosis:
      "AVIONICS AMATEUR: Docker containers and garbage-collected runtimes (Node/Python) introduce uncontrollable jitter, memory fragmentation, and cannot pass DO-178C WCET verification.",
    winningPivotScript:
      "Our edge kernel runs native C++20 on BlackBerry QNX 8.0 Neutrino RTOS with POSIX PSE52 scheduling. We allocate all memory pools statically at boot—zero runtime heap allocation. High-frequency MAVLink frames pass through lock-free SPSC ring buffers, and QNX adaptive partitioning guarantees our safety-critical watchdog gets its CPU budget with worst-case execution time under 0.85 milliseconds.",
  },
];

/**
 * Pre-loaded Demo Answers to allow 1-click sparring tests
 */
export const DEMO_PRELOADS = [
  {
    id: "demo-flawless",
    title: "🏆 Flawless Institutional Response (All Pillars Hit)",
    text: "At AeroOps AI, our foundational doctrine is: Deterministic Rules Engine Decides, AI Explains. We run on BlackBerry QNX 8.0 Neutrino RTOS with POSIX PSE52 real-time scheduling. High-frequency MAVLink v2 telemetry at 1,000Hz is ingested into lock-free ring buffers with static memory allocation and worst-case execution time under 0.85 milliseconds, fully aligned with DO-178C DAL-B pathways. Gemini 2.5 Flash operates strictly in an isolated, read-only advisory partition to explain decisions from immutable SHA-256 Merkle audit ledgers. Our wedge is commercial BVLOS drone delivery under FAA Part 108 and Part 135 waivers, commanding $1,200 to $3,500 ARR per tail with an 84% gross margin.",
  },
  {
    id: "demo-boundary-trap",
    title: "🚨 Flawed: Deterministic Boundary Violation",
    text: "Our revolutionary platform uses Gemini 2.5 Flash to continuously monitor flight sensors. The AI decides when the drone should abort, and machine learning controls the drone during in-flight wind shear emergencies to guarantee 100% safe autonomous delivery.",
  },
  {
    id: "demo-buzzwords",
    title: "⚠️ Flawed: Hollow Buzzword Evasion",
    text: "We are building a truly revolutionary and game-changing platform with infinite scalability and effortless synergy. There is zero competition because our autonomous magic provides seamless certification and a complete paradigm shift for next-gen aerospace.",
  },
  {
    id: "demo-ramble",
    title: "⏳ Flawed: 50s Ramble With Zero Numbers",
    text: "Well, you know, we've really been thinking deeply about how aviation needs to evolve, and basically like drones are everywhere now and people really want them to fly safely, but existing systems are sort of old and clunky, so we went out and talked to a bunch of folks in the industry, and they really love our vision for making everything super streamlined and connected with great software that everyone can trust and use easily every day.",
  },
];
