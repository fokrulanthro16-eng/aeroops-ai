/**
 * Web Speech API Pilot Voice Dispatcher
 * Synthesizes aviation radio-style voice briefings with audio chimes.
 */

class PilotVoiceDispatcher {
  private isSpeaking = false;

  public speak(transcript: string, onStart?: () => void, onEnd?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis not supported in this browser.");
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Play subtle cockpit radio beeps using Web Audio API
    this.playRadioChime();

    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(transcript);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = 1.0;

      // Prefer standard English aviation / robotic dispatch voices
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Natural") ||
            v.name.includes("Google") ||
            v.name.includes("David") ||
            v.name.includes("Daniel") ||
            v.name.includes("Alex") ||
            v.name.includes("Samantha"))
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e);
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    }, 200);
  }

  public stop(): void {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  private playRadioChime(): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio context might require user interaction; ignore silently
    }
  }
}

export const pilotVoice = new PilotVoiceDispatcher();
