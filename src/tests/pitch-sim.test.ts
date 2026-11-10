/**
 * ==============================================================================
 * AEROOPS AI — PITCH SIMULATOR & ADVERSARIAL VC ENGINE UNIT TESTS
 * Validates the 4 interruption heuristics, scoring rubric, and deterministic fallback.
 * ==============================================================================
 */

import { evaluateDeterministicPitch } from "../lib/pitch-sim/deterministic-vc-engine";
import {
  evaluateSpeechStream,
  calculateWpm,
  detectFillerWords,
  detectBuzzwords,
  detectQuantitativeMetrics,
  evaluateThesisPillars,
  DEFAULT_INTERRUPTION_CONFIG,
} from "../lib/pitch-sim/interruption-engine";
import {
  calculateLiveScores,
  generateDueDiligenceReport,
  exportReportAsMarkdown,
} from "../lib/pitch-sim/scoring-rubric";
import { DEMO_PRELOADS, THESIS_PILLARS } from "../lib/pitch-sim/knowledge-vault";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ✗ FAIL: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

export function runPitchSimTests() {
  console.log("\n[RUNNING PITCH SIMULATOR & VC ADVERSARIAL ENGINE TESTS]");

  // --------------------------------------------------------------------------
  // Test 1: Flawless Pitch Evaluation
  // --------------------------------------------------------------------------
  const flawless = DEMO_PRELOADS.find((d) => d.id === "demo-flawless")!;
  const flawlessResult = evaluateDeterministicPitch({
    transcript: flawless.text,
    currentUtterance: flawless.text,
    elapsedSeconds: 30,
    activePersonaId: "jason-kraus",
    hostilityLevel: 3,
    isGauntletMode: true,
  });

  assert(!flawlessResult.wasInterrupted, "Flawless response must NOT be interrupted");
  assert(flawlessResult.liveScores.tdi >= 75, `Flawless response TDI (${flawlessResult.liveScores.tdi}) must be >= 75`);
  assert(flawlessResult.liveScores.rmr >= 75, `Flawless response RMR (${flawlessResult.liveScores.rmr}) must be >= 75`);
  assert(flawlessResult.liveScores.icv >= 70, `Flawless response ICV (${flawlessResult.liveScores.icv}) must be >= 70`);
  assert(flawlessResult.latencyMs < 25, `Deterministic latency (${flawlessResult.latencyMs}ms) must be ultra-fast`);

  // --------------------------------------------------------------------------
  // Test 2: Deterministic Boundary Violation (Critical Trap)
  // --------------------------------------------------------------------------
  const boundaryTrap = DEMO_PRELOADS.find((d) => d.id === "demo-boundary-trap")!;
  const boundaryResult = evaluateDeterministicPitch({
    transcript: boundaryTrap.text,
    currentUtterance: boundaryTrap.text,
    elapsedSeconds: 15,
    activePersonaId: "jason-kraus",
    hostilityLevel: 4,
    isGauntletMode: true,
  });

  assert(boundaryResult.wasInterrupted, "Boundary violation MUST trigger immediate VC interruption");
  assert(
    boundaryResult.interruptionReason?.includes("DETERMINISTIC SAFETY BOUNDARY VIOLATION") ?? false,
    "Interruption reason must flag deterministic safety boundary violation"
  );
  assert(
    boundaryResult.persona.id === "faa-der-auditor",
    `FAA DER Auditor must cut in during boundary breach (Got ${boundaryResult.persona.id})`
  );

  // --------------------------------------------------------------------------
  // Test 3: Hollow Buzzword Evasion Detector
  // --------------------------------------------------------------------------
  const buzzwordsTrap = DEMO_PRELOADS.find((d) => d.id === "demo-buzzwords")!;
  const buzzwordsResult = evaluateDeterministicPitch({
    transcript: buzzwordsTrap.text,
    currentUtterance: buzzwordsTrap.text,
    elapsedSeconds: 15,
    activePersonaId: "series-a-vc",
    hostilityLevel: 4,
    isGauntletMode: true,
  });

  assert(buzzwordsResult.wasInterrupted, "Excessive hollow buzzwords must trigger VC interruption");
  assert(
    buzzwordsResult.interruptionReason?.includes("BUZZWORD") ?? false,
    "Interruption reason must flag buzzword evasion"
  );

  // --------------------------------------------------------------------------
  // Test 4: 40s Ramble Exceeded (No Quantitative Numbers)
  // --------------------------------------------------------------------------
  const rambleTrap = DEMO_PRELOADS.find((d) => d.id === "demo-ramble")!;
  const rambleResult = evaluateDeterministicPitch({
    transcript: rambleTrap.text,
    currentUtterance: rambleTrap.text,
    elapsedSeconds: 45, // > 40s threshold
    activePersonaId: "jason-kraus",
    hostilityLevel: 3,
    isGauntletMode: false,
  });

  assert(rambleResult.wasInterrupted, "Speaking > 40s without numbers must trigger ramble interruption");
  assert(
    rambleResult.interruptionReason?.includes("RAMBLE") ?? false,
    "Interruption reason must flag ramble threshold exceeded"
  );

  // --------------------------------------------------------------------------
  // Test 5: Pacing WPM Calculation & Crutch Detection
  // --------------------------------------------------------------------------
  const pacingOptimal = calculateWpm(150, 60); // 150 WPM
  assert(pacingOptimal.wpm === 150, "150 words in 60s must yield 150 WPM");
  assert(pacingOptimal.zone === "OPTIMAL", "150 WPM must be in OPTIMAL zone");

  const pacingSlow = calculateWpm(80, 60); // 80 WPM
  assert(pacingSlow.zone === "SLOW", "80 WPM must be in SLOW zone");

  const pacingRushed = calculateWpm(210, 60); // 210 WPM
  assert(pacingRushed.zone === "RUSHED", "210 WPM must be in RUSHED zone");

  const crutches = detectFillerWords("Um, basically we are sort of, like, ready you know.");
  assert(crutches.total >= 4, `Must detect >= 4 filler words (Got ${crutches.total})`);

  // --------------------------------------------------------------------------
  // Test 6: Thesis Pillars Coverage
  // --------------------------------------------------------------------------
  const coveredPillars = evaluateThesisPillars(flawless.text);
  assert(
    coveredPillars.length >= 7,
    `Flawless pitch must cover at least 7/8 thesis pillars (Got ${coveredPillars.length})`
  );

  // --------------------------------------------------------------------------
  // Test 7: Due Diligence Report Synthesis & Markdown Export
  // --------------------------------------------------------------------------
  const telemetry = evaluateSpeechStream(
    flawless.text,
    flawless.text,
    30,
    "jason-kraus",
    DEFAULT_INTERRUPTION_CONFIG
  );
  const report = generateDueDiligenceReport(flawless.text, telemetry, []);

  assert(
    report.investmentVerdict.status === "TERM_SHEET_EXTENDED",
    `Flawless response verdict must be TERM_SHEET_EXTENDED (Got ${report.investmentVerdict.status})`
  );
  assert(report.scores.composite >= 80, `Composite score must be >= 80 (Got ${report.scores.composite})`);

  const markdownExport = exportReportAsMarkdown(report);
  assert(
    markdownExport.includes("INSTITUTIONAL DUE DILIGENCE AUDIT REPORT"),
    "Exported Markdown must include correct title"
  );
  assert(
    markdownExport.includes("QUANTITATIVE DUE DILIGENCE INDICES"),
    "Exported Markdown must include score table"
  );

  console.log("  ✓ All 7 Pitch Simulator adversarial unit tests passed successfully!\n");
  return { passed: 7, failed: 0 };
}

// Run standalone if invoked directly
if (typeof require !== "undefined" && require.main === module) {
  runPitchSimTests();
}
