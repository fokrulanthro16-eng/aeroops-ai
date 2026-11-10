/**
 * ==============================================================================
 * AEROOPS AI — SCORING RUBRIC ENGINE & DUE DILIGENCE AUDIT GENERATOR
 * Version: 3.0 Enterprise Architecture Specification
 * Computes the 4 Quantitative Indices (TDI, RMR, ICV, VCP) and generates
 * the "Red Flag vs. Winning Pivot" matrix and exportable dossiers.
 * ==============================================================================
 */

import {
  THESIS_PILLARS,
  WINNING_PIVOT_DATABASE,
  AEROOPS_ARCH_SPEC,
} from "./knowledge-vault";
import { SpeechStreamTelemetry, InterruptionEvent } from "./interruption-engine";

export interface ScoreIndices {
  tdi: number; // Technical Defensibility Index (0-100)
  rmr: number; // Regulatory Moat Rating (0-100)
  icv: number; // Investor Clarity & GTM Score (0-100)
  vcp: number; // Vocal Conviction & Pacing Index (0-100)
  composite: number; // Weighted Overall Score (0-100)
}

export interface RedFlagPivotItem {
  id: string;
  topic: string;
  founderQuote: string;
  personaTriggered: string;
  investorDiagnosis: string;
  winningPivotScript: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
}

export interface DueDiligenceReport {
  sessionId: string;
  generatedAt: string;
  investmentVerdict: {
    status: "TERM_SHEET_EXTENDED" | "CONDITIONAL_PASS" | "NEEDS_REVISION" | "DILIGENCE_REJECTED";
    headline: string;
    summary: string;
    tier: string;
  };
  scores: ScoreIndices;
  subsystemBreakdown: {
    technical: {
      score: number;
      strengths: string[];
      risks: string[];
    };
    regulatory: {
      score: number;
      strengths: string[];
      risks: string[];
    };
    commercial: {
      score: number;
      strengths: string[];
      risks: string[];
    };
    delivery: {
      score: number;
      wpm: number;
      fillerCount: number;
      interruptionCount: number;
      notes: string[];
    };
  };
  pillarsSummary: {
    total: number;
    coveredCount: number;
    uncoveredPillars: string[];
  };
  redFlagPivotMatrix: RedFlagPivotItem[];
  transcript: string;
}

/**
 * Computes live scores based on telemetry and transcript evidence
 */
export function calculateLiveScores(
  transcript: string,
  telemetry: SpeechStreamTelemetry,
  interruptionHistory: InterruptionEvent[]
): ScoreIndices {
  const lower = transcript.toLowerCase();

  // 1. Technical Defensibility Index (TDI)
  let tdi = 30; // base baseline
  if (lower.includes("qnx") || lower.includes("neutrino")) tdi += 18;
  if (lower.includes("rtos") || lower.includes("microkernel")) tdi += 10;
  if (lower.includes("mavlink") || lower.includes("0xfd")) tdi += 12;
  if (lower.includes("ring buffer") || lower.includes("spsc") || lower.includes("lock-free")) tdi += 12;
  if (lower.includes("static") || lower.includes("no heap") || lower.includes("zero dynamic")) tdi += 10;
  if (lower.includes("wcet") || lower.includes("millisecond") || lower.includes("0.85")) tdi += 8;
  // Penalty for node/python on drone or dynamic heap
  if (lower.includes("node.js on the drone") || lower.includes("docker on the flight controller")) tdi -= 25;
  tdi = Math.min(100, Math.max(10, tdi));

  // 2. Regulatory Moat Rating (RMR)
  let rmr = 30;
  if (lower.includes("do-178c") || lower.includes("arp4754")) rmr += 18;
  if (lower.includes("dal-b") || lower.includes("dal-c") || lower.includes("design assurance")) rmr += 14;
  if (lower.includes("deterministic") || lower.includes("state machine") || lower.includes("decides")) rmr += 12;
  if (lower.includes("advisory") || lower.includes("read-only") || lower.includes("explains")) rmr += 12;
  if (lower.includes("sha-256") || lower.includes("merkle") || lower.includes("blackbox")) rmr += 14;
  // Fatal penalty for boundary violation
  const hasBoundaryViolation = interruptionHistory.some(
    (i) => i.rule === "DETERMINISTIC_BOUNDARY_VIOLATION"
  );
  if (hasBoundaryViolation) {
    rmr = Math.min(rmr, 38); // Cap immediately
  }
  rmr = Math.min(100, Math.max(10, rmr));

  // 3. Investor Clarity & GTM Score (ICV)
  let icv = 30;
  if (lower.includes("arr") || lower.includes("tail") || lower.includes("$1,200") || lower.includes("$3,500")) icv += 18;
  if (lower.includes("bvlos") || lower.includes("part 108") || lower.includes("part 135")) icv += 15;
  if (lower.includes("drone delivery") || lower.includes("inspection") || lower.includes("wedge")) icv += 12;
  if (lower.includes("gross margin") || lower.includes("82%") || lower.includes("80%")) icv += 12;
  if (lower.includes("sales cycle") || lower.includes("6 to 9") || lower.includes("payback")) icv += 13;
  // Penalty for evasive buzzwords
  if (telemetry.buzzwordsFound.length >= 2) icv -= 15;
  icv = Math.min(100, Math.max(10, icv));

  // 4. Vocal Conviction & Pacing Index (VCP)
  let vcp = 85;
  // Penalize bad pacing
  if (telemetry.wpmZone === "SLOW") vcp -= 15;
  if (telemetry.wpmZone === "RUSHED") vcp -= 10;
  // Penalize filler crutches
  vcp -= Math.min(30, telemetry.totalFillerCount * 4);
  // Penalize interruptions
  vcp -= interruptionHistory.length * 12;
  vcp = Math.min(100, Math.max(15, vcp));

  // Composite Score
  const composite = Math.round(tdi * 0.3 + rmr * 0.3 + icv * 0.25 + vcp * 0.15);

  return { tdi, rmr, icv, vcp, composite };
}

/**
 * Identifies Red Flags and generates the Winning Pivot Matrix
 */
export function buildRedFlagPivotMatrix(
  transcript: string,
  interruptionHistory: InterruptionEvent[]
): RedFlagPivotItem[] {
  const items: RedFlagPivotItem[] = [];
  const lower = transcript.toLowerCase();

  // Check against known database patterns
  for (const pivot of WINNING_PIVOT_DATABASE) {
    let triggered = false;
    let quote = "";

    if (pivot.id === "pivot-boundary") {
      const boundaryInterruption = interruptionHistory.find(
        (i) => i.rule === "DETERMINISTIC_BOUNDARY_VIOLATION"
      );
      if (
        boundaryInterruption ||
        lower.includes("ai decides") ||
        lower.includes("gemini predicts and aborts") ||
        lower.includes("machine learning controls the drone")
      ) {
        triggered = true;
        quote = boundaryInterruption
          ? boundaryInterruption.offendingSnippet
          : "Implied probabilistic LLM makes flight control decisions";
      }
    } else if (pivot.id === "pivot-wedge") {
      if (
        (lower.includes("evtol") && !lower.includes("bvlos") && !lower.includes("drone")) ||
        lower.includes("air taxi in 2030") ||
        lower.includes("partnering with major evtol")
      ) {
        triggered = true;
        quote = "Targeting distant 2028-2030 passenger eVTOL scale without immediate drone wedge";
      }
    } else if (pivot.id === "pivot-margins") {
      if (
        lower.includes("stream all telemetry into openai") ||
        lower.includes("continuous cloud llm") ||
        (lower.includes("cloud") && !lower.includes("edge") && !lower.includes("gross margin"))
      ) {
        triggered = true;
        quote = "Uncapped continuous cloud LLM token ingestion on high-frequency telemetry";
      }
    } else if (pivot.id === "pivot-rtos") {
      if (
        lower.includes("docker") ||
        lower.includes("node.js") ||
        lower.includes("python on the flight") ||
        lower.includes("microservices on the drone")
      ) {
        triggered = true;
        quote = "Garbage-collected runtimes proposed for safety-critical avionics flight control";
      }
    }

    if (triggered) {
      items.push({
        id: pivot.id,
        topic: pivot.topic,
        founderQuote: quote || pivot.flawedQuote,
        personaTriggered: pivot.personaTriggered,
        investorDiagnosis: pivot.investorDiagnosis,
        winningPivotScript: pivot.winningPivotScript,
        severity: pivot.id === "pivot-boundary" ? "CRITICAL" : "HIGH",
      });
    }
  }

  // If interruption history contains ramble or buzzword not in database, add dynamically
  for (const inter of interruptionHistory) {
    if (inter.rule === "BUZZWORD_EVASION" && !items.some((i) => i.id === "dynamic-buzzword")) {
      items.push({
        id: "dynamic-buzzword",
        topic: "Hollow Buzzword Usage & Evasive Narrative",
        founderQuote: `Used buzzwords: "${inter.offendingSnippet}"`,
        personaTriggered: inter.interruptingPersona.name,
        investorDiagnosis:
          "INVESTOR SKEPTICISM: Relying on superficial superlative adjectives signals lack of technical or commercial depth.",
        winningPivotScript:
          "Replace marketing adjectives with hard metrics: 'We achieve sub-0.85ms WCET on QNX 8.0, and command $1,200 to $3,500 ARR/tail with 82% gross margins across 450 initial Part 108 delivery tails.'",
        severity: "HIGH",
      });
    } else if (inter.rule === "RAMBLE_EXCEEDED" && !items.some((i) => i.id === "dynamic-ramble")) {
      items.push({
        id: "dynamic-ramble",
        topic: "Pacing & Quantitative Anchor Discipline",
        founderQuote: inter.offendingSnippet,
        personaTriggered: inter.interruptingPersona.name,
        investorDiagnosis:
          "EXECUTIVE PRESENCE FAILURE: Speaking > 40 seconds without a single quantitative anchor causes VC partners to mentally tune out.",
        winningPivotScript:
          "Always open with the quantitative punchline: 'AeroOps AI is a dual-layer software suite running an edge safety kernel on QNX 8.0 and a fleet control plane in Next.js 14, targeting a $1,200-$3,500 ARR/tail wedge in commercial BVLOS drones.'",
        severity: "MEDIUM",
      });
    }
  }

  // If no red flags tripped, add praise/benchmark item
  if (items.length === 0) {
    items.push({
      id: "benchmark-praise",
      topic: "Deterministic Separation Doctrine Upheld",
      founderQuote: "Preserved clean separation between QNX deterministic kernel and Gemini advisory partition.",
      personaTriggered: "FAA DER Auditor & QNX Architect",
      investorDiagnosis:
        "EXEMPLARY EXECUTION: Fully satisfied DO-178C DAL-B and ARP4754A safety doctrine. No critical regulatory traps tripped.",
      winningPivotScript:
        "Continue reinforcing the dual-layer architecture: BlackBerry QNX 8.0 edge kernel with static memory allocation at the vehicle, paired with Gemini 2.5 Flash purely explaining SHA-256 hash-chained dispatch evidence.",
      severity: "MEDIUM",
    });
  }

  return items;
}

/**
 * Synthesizes the full Due Diligence Report
 */
export function generateDueDiligenceReport(
  transcript: string,
  telemetry: SpeechStreamTelemetry,
  interruptionHistory: InterruptionEvent[]
): DueDiligenceReport {
  const scores = calculateLiveScores(transcript, telemetry, interruptionHistory);
  const redFlagPivotMatrix = buildRedFlagPivotMatrix(transcript, interruptionHistory);

  const coveredIds = telemetry.coveredPillarIds;
  const uncoveredPillars = THESIS_PILLARS.filter((p) => !coveredIds.includes(p.id)).map(
    (p) => `${p.name} (${p.code})`
  );

  // Determine Verdict
  let status: DueDiligenceReport["investmentVerdict"]["status"] = "CONDITIONAL_PASS";
  let headline = "";
  let summary = "";
  let tier = "";

  const hasCritical = redFlagPivotMatrix.some((r) => r.severity === "CRITICAL");

  if (hasCritical || scores.rmr < 40) {
    status = "DILIGENCE_REJECTED";
    headline = "🚨 DUE DILIGENCE REJECTED: CRITICAL REGULATORY BOUNDARY HAZARD";
    summary =
      "Founder breached the DO-178C safety boundary by implying non-deterministic AI executes flight control or abort decisions. Regulators and aviation underwriters will reject this architecture in preliminary design review.";
    tier = "FAIL — ZERO ALLOCATION";
  } else if (scores.composite >= 80 && scores.tdi >= 75 && scores.rmr >= 75 && scores.icv >= 70) {
    status = "TERM_SHEET_EXTENDED";
    headline = "🏆 TERM SHEET EXTENDED: DAL-B CERTIFIABLE & COMMERCIAL WEDGE VALIDATED";
    summary =
      "The founder demonstrated pristine technical defensibility on QNX 8.0 RTOS, rock-solid DO-178C DAL-B partition isolation, and a realistic $1,200-$3,500 ARR/tail commercial wedge in Part 108 BVLOS drones. High conviction Series A candidate.";
    tier = "TIER-1 LEAD CONVICTION";
  } else if (scores.composite >= 60) {
    status = "CONDITIONAL_PASS";
    headline = "⚠️ SERIES A DILIGENCE PASS: CONDITIONAL UPON BENCH-TEST AUDIT";
    summary =
      "Solid architectural foundation with clear understanding of the 'Decides vs Explains' doctrine. Requires sharpening of unit economics and proof of QNX worst-case execution time under 1,000Hz MAVLink load before funding release.";
    tier = "TIER-2 CONDITIONAL POC";
  } else {
    status = "NEEDS_REVISION";
    headline = "⏳ DILIGENCE PAUSED: ARCHITECTURAL & GTM REVISIONS REQUIRED";
    summary =
      "The pitch struggled with pacing, excess crutch fillers, or vagueness around unit economics and embedded RTOS implementation. Re-sparring required with focus on the 8 Thesis Pillars.";
    tier = "RE-DRILL REQUIRED";
  }

  return {
    sessionId: `AERO-DD-${Date.now().toString(36).toUpperCase()}`,
    generatedAt: new Date().toISOString(),
    investmentVerdict: {
      status,
      headline,
      summary,
      tier,
    },
    scores,
    subsystemBreakdown: {
      technical: {
        score: scores.tdi,
        strengths: [
          scores.tdi > 65
            ? "Articulated BlackBerry QNX 8.0 Neutrino RTOS microkernel architecture"
            : "Acknowledged deterministic execution requirement",
          scores.tdi > 75 ? "Confirmed lock-free ring buffers and static memory allocation" : "Identified MAVLink v2 protocol",
        ],
        risks: [
          scores.tdi < 70
            ? "Needs more precision on p99 IPC latency and WCET targets (<1ms)"
            : "Must verify WebSocket bridge latency under packet bursts",
        ],
      },
      regulatory: {
        score: scores.rmr,
        strengths: [
          scores.rmr > 60
            ? "Clear separation between deterministic safety kernel and Gemini 2.5 Flash advisory partition"
            : "Understands FAA DO-178C terminology",
          "SHA-256 Merkle audit ledger enables Part 135 post-incident forensics",
        ],
        risks: [
          hasCritical
            ? "CRITICAL HAZARD: Must strictly avoid phrasing implying AI decides abort gates"
            : "Requires formal DO-330 tool qualification roadmap for dispatch UI",
        ],
      },
      commercial: {
        score: scores.icv,
        strengths: [
          "Targeted commercial BVLOS drone delivery as an immediate wedge ahead of 2028 eVTOL scale",
          "Hybrid SaaS model: $1,200-$3,500 ARR/tail plus flight hour intelligence fees",
        ],
        risks: [
          scores.icv < 70
            ? "Clarify customer CAC payback period and pilot-to-paid conversion rate"
            : "Protect gross margins against continuous cloud LLM token consumption",
        ],
      },
      delivery: {
        score: scores.vcp,
        wpm: telemetry.wpm,
        fillerCount: telemetry.totalFillerCount,
        interruptionCount: interruptionHistory.length,
        notes: [
          telemetry.wpmZone === "OPTIMAL"
            ? `Pacing in ideal cadence zone (${telemetry.wpm} WPM)`
            : `Pacing ${telemetry.wpmZone.toLowerCase()} (${telemetry.wpm} WPM; optimal is 135-165)`,
          `Logged ${telemetry.totalFillerCount} acoustic crutch fillers ("um", "uh", "like")`,
          `Sustained ${interruptionHistory.length} VC panel interruptions`,
        ],
      },
    },
    pillarsSummary: {
      total: THESIS_PILLARS.length,
      coveredCount: coveredIds.length,
      uncoveredPillars,
    },
    redFlagPivotMatrix,
    transcript,
  };
}

/**
 * Exports report as a clean Markdown string
 */
export function exportReportAsMarkdown(report: DueDiligenceReport): string {
  return `# AEROOPS AI — INSTITUTIONAL DUE DILIGENCE AUDIT REPORT
**Session ID:** \`${report.sessionId}\`  
**Generated At:** ${report.generatedAt}  
**Investment Verdict:** ${report.investmentVerdict.headline}  
**Conviction Tier:** ${report.investmentVerdict.tier}  

---

## 1. EXECUTIVE SUMMARY
${report.investmentVerdict.summary}

---

## 2. QUANTITATIVE DUE DILIGENCE INDICES (0-100)
| Subsystem Index | Score | Threshold Benchmark | Status |
| :--- | :---: | :---: | :--- |
| **Technical Defensibility Index (TDI)** | **${report.scores.tdi}/100** | > 75.0 (Target) | ${report.scores.tdi >= 75 ? "PASSED" : "REVIEW"} |
| **Regulatory Moat Rating (RMR)** | **${report.scores.rmr}/100** | > 80.0 (DAL-B Target) | ${report.scores.rmr >= 80 ? "PASSED" : "CAUTION"} |
| **Investor Clarity & GTM Score (ICV)** | **${report.scores.icv}/100** | > 70.0 (Target) | ${report.scores.icv >= 70 ? "PASSED" : "REVIEW"} |
| **Vocal Conviction & Pacing (VCP)** | **${report.scores.vcp}/100** | > 75.0 (Target) | ${report.scores.vcp >= 75 ? "PASSED" : "REVIEW"} |
| **COMPOSITE DUE DILIGENCE RATING** | **${report.scores.composite}/100** | **Weighted Composite** | **${report.investmentVerdict.status}** |

---

## 3. THESIS PILLARS COVERAGE (${report.pillarsSummary.coveredCount}/${report.pillarsSummary.total})
${
  report.pillarsSummary.uncoveredPillars.length === 0
    ? "✅ **100% of Required Aerospace & Commercial Thesis Pillars Addressed.**"
    : `⚠️ **Uncovered Pillars:**\n${report.pillarsSummary.uncoveredPillars.map((p) => `- ${p}`).join("\n")}`
}

---

## 4. RED FLAG VS. WINNING PIVOT MATRIX
${report.redFlagPivotMatrix
  .map(
    (item, idx) => `### ${idx + 1}. [${item.severity}] ${item.topic}
- **Founder Statement / Claim:** *"${item.founderQuote}"*
- **VC Persona Triggered:** ${item.personaTriggered}
- **Investor Diagnosis:** ${item.investorDiagnosis}
- **Institutional Winning Pivot:**
  > "${item.winningPivotScript}"
`
  )
  .join("\n")}

---

## 5. ACOUSTIC & DELIVERY TELEMETRY
- **Pacing:** ${report.subsystemBreakdown.delivery.wpm} WPM (Target: 135 - 165 WPM)
- **Crutch Filler Words:** ${report.subsystemBreakdown.delivery.fillerCount} instances
- **VC Panel Interruptions:** ${report.subsystemBreakdown.delivery.interruptionCount}

---

## 6. SESSION RAW TRANSCRIPT
\`\`\`text
${report.transcript}
\`\`\`
`;
}
