/**
 * ==============================================================================
 * AEROOPS AI — SOPHISTICATED SPEECH SYNTHESIS ENGINE
 * High-fidelity, natural institutional voice synthesis tuned for Sand Hill Road
 * VCs and executive aviation auditors.
 * Version: 6.0 Strict Non-Overlapping Zero-Latency Voice Engine
 * ==============================================================================
 */

export interface VoicePersonaConfig {
  id: string;
  name: string;
  rate: number;
  pitch: number;
  preferredVoices: string[];
  gender: "male" | "female";
  styleNotes: string;
}

export const PERSONA_VOICE_CONFIGS: Record<string, VoicePersonaConfig> = {
  "jason-kraus": {
    id: "jason-kraus",
    name: "Jason Kraus",
    rate: 1.06,
    pitch: 1.0,
    preferredVoices: [
      "Google US English",
      "Microsoft Ryan Online (Natural) - English (United States)",
      "Microsoft Guy Online (Natural) - English (United States)",
      "Microsoft David - English (United States)",
      "en-US",
    ],
    gender: "male",
    styleNotes: "Crisp, energetic catalyst cadence focused on commercial velocity",
  },
  "sarah-chen": {
    id: "sarah-chen",
    name: "Sarah Chen",
    rate: 1.04,
    pitch: 1.04,
    preferredVoices: [
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Google US English Female",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Zira - English (United States)",
      "Samantha",
      "en-US",
    ],
    gender: "female",
    styleNotes: "Sharp, analytical Wall Street / Sand Hill cadence interrogating margins",
  },
  "marcus-vance": {
    id: "marcus-vance",
    name: "Marcus Vance",
    rate: 0.96,
    pitch: 0.88,
    preferredVoices: [
      "Google UK English Male",
      "Microsoft Sonia Online (Natural) - English (United Kingdom)",
      "Microsoft George - English (United Kingdom)",
      "Daniel",
      "en-GB",
      "en-US",
    ],
    gender: "male",
    styleNotes: "Deep, measured regulatory authority probing DO-178C DAL-B boundaries",
  },
  "dr-viktor-krenz": {
    id: "dr-viktor-krenz",
    name: "Dr. Viktor Krenz",
    rate: 0.99,
    pitch: 0.93,
    preferredVoices: [
      "Microsoft Ryan Online (Natural) - English (United States)",
      "Google UK English Male",
      "Microsoft Mark - English (United States)",
      "Daniel",
      "en-GB",
      "en-US",
    ],
    gender: "male",
    styleNotes: "Precise systems-architect cadence auditing QNX memory barriers",
  },
  founder: {
    id: "founder",
    name: "Executive Founder",
    rate: 1.02,
    pitch: 1.0,
    preferredVoices: [
      "Google US English",
      "Microsoft Ryan Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "en-US",
    ],
    gender: "male",
    styleNotes: "Articulate, steady, commanding founder presentation delivery",
  },
};

let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

export function loadBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const available = window.speechSynthesis.getVoices();
    if (available && available.length > 0) {
      cachedVoices = available;
      voicesLoaded = true;
      resolve(available);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(cachedVoices);
    };

    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 500);
  });
}

/**
 * Clean audio queue cancellation so voices never overlap or echo.
 */
export function stopSpeechSynthesis(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Pre-warms browser audio buffer on first click to eliminate startup clipping.
 */
export function prewarmSpeechAudio(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    stopSpeechSynthesis();
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0.01;
    silent.rate = 2.0;
    window.speechSynthesis.speak(silent);
    loadBrowserVoices();
  } catch {
    // ignore
  }
}

/**
 * Selects the optimal browser voice matching persona preferences.
 */
export function selectBestVoice(personaId: string): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;

  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const config = PERSONA_VOICE_CONFIGS[personaId] || PERSONA_VOICE_CONFIGS["jason-kraus"];

  // 1. Try preferred voice exact or partial matches
  for (const preferred of config.preferredVoices) {
    const found = voices.find(
      (v) =>
        v.name.toLowerCase().includes(preferred.toLowerCase()) ||
        v.lang.toLowerCase() === preferred.toLowerCase()
    );
    if (found) return found;
  }

  // 2. Try English natural/online voices
  const naturalEn = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.includes("Natural") || v.name.includes("Online") || v.name.includes("Google"))
  );
  if (naturalEn) return naturalEn;

  // 3. Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith("en"));
  if (anyEn) return anyEn;

  return voices[0] || null;
}

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
  volume?: number;
}

/**
 * Executes high-grade speech synthesis with persona-specific tuning and queue protection.
 */
export function speakInstitutionalVoice(
  text: string,
  personaId: string,
  options: SpeakOptions = {}
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    options.onEnd?.();
    return null;
  }

  try {
    // Cancel any previous utterance to prevent voice overlap
    stopSpeechSynthesis();

    const config = PERSONA_VOICE_CONFIGS[personaId] || PERSONA_VOICE_CONFIGS["jason-kraus"];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = options.volume ?? 1.0;

    const matchedVoice = selectBestVoice(personaId);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    } else {
      utterance.lang = "en-US";
    }

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    if (options.onError) utterance.onerror = options.onError;

    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (err) {
    console.error("Speech synthesis failed:", err);
    options.onError?.(err);
    options.onEnd?.();
    return null;
  }
}
