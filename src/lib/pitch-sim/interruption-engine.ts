/**
 * ==============================================================================
 * AEROOPS AI — REAL-TIME INTERRUPTION & HEURISTIC ENGINE
 * Version: 3.0 Enterprise Architecture Specification
 * Continuously evaluates founder speech streams against the 4 critical failure modes:
 * 1. Ramble Threshold Exceeded
 * 2. Deterministic Boundary Violation (Critical Trap)
 * 3. Buzzword Evasion Trigger
 * 4. Metric Dodge Detection
 * ==============================================================================
 */

import {
  HOLLOW_BUZZWORDS,
  CRUTCH_FILLER_WORDS,
  DETERMINISTIC_BOUNDARY_VIOLATIONS,
  QUANTITATIVE_METRIC_INDICATORS,
  THESIS_PILLARS,
} from "./knowledge-vault";
import { VC_PERSONAS, getPersonaById, VCPersona } from "./personas";

export type InterruptionTriggerRule =
  | "RAMBLE_EXCEEDED"
  | "DETERMINISTIC_BOUNDARY_VIOLATION"
  | "BUZZWORD_EVASION"
  | "METRIC_DODGE";

export interface InterruptionEvent {
  isInterrupted: boolean;
  rule: InterruptionTriggerRule | null;
  ruleName: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  interruptingPersona: VCPersona;
  interjectionText: string;
  offendingSnippet: string;
  timestampMs: number;
}

export interface SpeechStreamTelemetry {
  wordCount: number;
  elapsedSeconds: number;
  wpm: number;
  wpmZone: "SLOW" | "OPTIMAL" | "RUSHED";
  fillerWordsFound: { word: string; count: number }[];
  totalFillerCount: number;
  buzzwordsFound: { word: string; severity: "HIGH" | "MEDIUM" }[];
  metricsFound: string[];
  coveredPillarIds: string[];
  interruption: InterruptionEvent | null;
}

export interface InterruptionConfig {
  rambleThresholdSec: number; // default 40s (slider 25s - 60s)
  buzzwordThresholdCount: number; // default 3
  buzzwordWindowSec: number; // default 20s
  metricDodgeWordThreshold: number; // default 80 words
  isExpectingMetric: boolean; // true if previous VC question demanded a number
}

export const DEFAULT_INTERRUPTION_CONFIG: InterruptionConfig = {
  rambleThresholdSec: 40,
  buzzwordThresholdCount: 3,
  buzzwordWindowSec: 20,
  metricDodgeWordThreshold: 80,
  isExpectingMetric: true,
};

/**
 * Calculates current Words Per Minute and pacing zone
 */
export function calculateWpm(
  wordCount: number,
  elapsedSeconds: number
): { wpm: number; zone: "SLOW" | "OPTIMAL" | "RUSHED" } {
  if (elapsedSeconds <= 2 || wordCount === 0) {
    return { wpm: 0, zone: "OPTIMAL" };
  }
  const wpm = Math.round((wordCount / elapsedSeconds) * 60);

  let zone: "SLOW" | "OPTIMAL" | "RUSHED" = "OPTIMAL";
  if (wpm < 130) {
    zone = "SLOW";
  } else if (wpm > 170) {
    zone = "RUSHED";
  } else {
    zone = "OPTIMAL";
  }

  return { wpm, zone };
}

/**
 * Scans transcript for filler words
 */
export function detectFillerWords(transcript: string): {
  fillerList: { word: string; count: number }[];
  total: number;
} {
  const words = transcript.toLowerCase().split(/\s+/);
  const map: Record<string, number> = {};
  let total = 0;

  for (const filler of CRUTCH_FILLER_WORDS) {
    // Check single word or multi-word phrase like "sort of", "you know"
    if (filler.includes(" ")) {
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = transcript.match(regex);
      if (matches) {
        map[filler] = matches.length;
        total += matches.length;
      }
    } else {
      const count = words.filter((w) => w.replace(/[^a-z]/g, "") === filler).length;
      if (count > 0) {
        map[filler] = count;
        total += count;
      }
    }
  }

  const fillerList = Object.entries(map).map(([word, count]) => ({ word, count }));
  return { fillerList, total };
}

/**
 * Detects buzzwords in speech
 */
export function detectBuzzwords(transcript: string): { word: string; severity: "HIGH" | "MEDIUM" }[] {
  const lower = transcript.toLowerCase();
  const detected: { word: string; severity: "HIGH" | "MEDIUM" }[] = [];

  for (const item of HOLLOW_BUZZWORDS) {
    const regex = new RegExp(`\\b${item.word}\\b`, "i");
    if (regex.test(lower)) {
      detected.push(item);
    }
  }

  return detected;
}

/**
 * Detects quantitative metrics and architectural anchors
 */
export function detectQuantitativeMetrics(transcript: string): string[] {
  const detected: string[] = [];
  for (const regex of QUANTITATIVE_METRIC_INDICATORS) {
    const match = transcript.match(regex);
    if (match) {
      detected.push(match[0]);
    }
  }
  return Array.from(new Set(detected));
}

/**
 * Evaluates which Thesis Pillars have been addressed
 */
export function evaluateThesisPillars(transcript: string): string[] {
  const lower = transcript.toLowerCase();
  const covered: string[] = [];

  for (const pillar of THESIS_PILLARS) {
    // Check if at least one required term matches
    const matched = pillar.requiredTerms.some((term) => lower.includes(term.toLowerCase()));
    if (matched) {
      covered.push(pillar.id);
    }
  }

  return covered;
}

/**
 * Core Real-Time Interruption Evaluator
 * Tests all 4 conditions and returns an immediate InterruptionEvent if tripped.
 */
export function evaluateSpeechStream(
  currentUtterance: string,
  totalTranscript: string,
  elapsedSeconds: number,
  activePersonaId: string,
  config: InterruptionConfig = DEFAULT_INTERRUPTION_CONFIG
): SpeechStreamTelemetry {
  const words = currentUtterance.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const { wpm, zone: wpmZone } = calculateWpm(wordCount, elapsedSeconds);
  const { fillerList: fillerWordsFound, total: totalFillerCount } = detectFillerWords(currentUtterance);
  const buzzwordsFound = detectBuzzwords(currentUtterance);
  const metricsFound = detectQuantitativeMetrics(currentUtterance);
  const coveredPillarIds = evaluateThesisPillars(totalTranscript);

  let interruption: InterruptionEvent | null = null;

  // ------------------------------------------------------------------------
  // CONDITION 2: DETERMINISTIC BOUNDARY VIOLATION (CRITICAL TRAP)
  // Highest priority — immediately halts on probabilistic claims
  // ------------------------------------------------------------------------
  for (const pattern of DETERMINISTIC_BOUNDARY_VIOLATIONS) {
    const match = currentUtterance.match(pattern);
    if (match) {
      const auditor = getPersonaById("faa-der-auditor");
      interruption = {
        isInterrupted: true,
        rule: "DETERMINISTIC_BOUNDARY_VIOLATION",
        ruleName: "DETERMINISTIC SAFETY BOUNDARY VIOLATION",
        severity: "CRITICAL",
        interruptingPersona: auditor,
        interjectionText: auditor.interjectionPhrases.boundary,
        offendingSnippet: match[0],
        timestampMs: Date.now(),
      };
      break;
    }
  }

  // ------------------------------------------------------------------------
  // CONDITION 3: BUZZWORD EVASION TRIGGER
  // Fires if >= 3 hollow buzzwords detected
  // ------------------------------------------------------------------------
  if (!interruption && buzzwordsFound.length >= config.buzzwordThresholdCount) {
    const persona = getPersonaById("series-a-vc");
    interruption = {
      isInterrupted: true,
      rule: "BUZZWORD_EVASION",
      ruleName: "HOLLOW BUZZWORD EVASION TRIGGER",
      severity: "HIGH",
      interruptingPersona: persona,
      interjectionText: persona.interjectionPhrases.buzzword,
      offendingSnippet: buzzwordsFound.map((b) => b.word).join(", "),
      timestampMs: Date.now(),
    };
  }

  // ------------------------------------------------------------------------
  // CONDITION 1: RAMBLE THRESHOLD EXCEEDED
  // Founder speaks continuously for > rambleThresholdSec without metrics
  // ------------------------------------------------------------------------
  if (
    !interruption &&
    elapsedSeconds >= config.rambleThresholdSec &&
    metricsFound.length === 0 &&
    wordCount > 40
  ) {
    const persona = getPersonaById(activePersonaId);
    interruption = {
      isInterrupted: true,
      rule: "RAMBLE_EXCEEDED",
      ruleName: `RAMBLE THRESHOLD EXCEEDED (${Math.round(elapsedSeconds)}s without concrete metric)`,
      severity: "HIGH",
      interruptingPersona: persona,
      interjectionText: persona.interjectionPhrases.ramble,
      offendingSnippet: `Spoke ${wordCount} words continuously without stating unit economics, QNX latency, or DAL level.`,
      timestampMs: Date.now(),
    };
  }

  // ------------------------------------------------------------------------
  // CONDITION 4: METRIC DODGE DETECTION
  // When active question asked for hard number and founder spoke > 80 words with 0 metrics
  // ------------------------------------------------------------------------
  if (
    !interruption &&
    config.isExpectingMetric &&
    wordCount >= config.metricDodgeWordThreshold &&
    metricsFound.length === 0
  ) {
    const persona = getPersonaById("series-a-vc");
    interruption = {
      isInterrupted: true,
      rule: "METRIC_DODGE",
      ruleName: "QUANTITATIVE METRIC DODGE DETECTED",
      severity: "HIGH",
      interruptingPersona: persona,
      interjectionText: persona.interjectionPhrases.dodge,
      offendingSnippet: `Exceeded ${config.metricDodgeWordThreshold} words with zero quantitative figures.`,
      timestampMs: Date.now(),
    };
  }

  return {
    wordCount,
    elapsedSeconds,
    wpm,
    wpmZone,
    fillerWordsFound,
    totalFillerCount,
    buzzwordsFound,
    metricsFound,
    coveredPillarIds,
    interruption,
  };
}
