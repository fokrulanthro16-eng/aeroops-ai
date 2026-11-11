/**
 * ==============================================================================
 * AEROOPS AI v3.0 — 8K MASTERCLASS CINEMATIC AUDIO & VOICEOVER PIPELINE
 * Broadcast-Grade Web Audio Foley Synthesis & Synchronized Masterclass Speech
 *
 * Implements:
 *   1. Low-pitch, authoritative British/Mid-Atlantic voiceover synthesis
 *   2. Procedural Web Audio API sound design (Sub-bass Braam, Avionics Chimes,
 *      QNX Watchdog ticks, Turbine Spool, and DO-178C Warning sirens)
 *   3. Synchronized scene-by-scene masterclass timeline sequencer
 * ==============================================================================
 */

export interface MasterclassScene {
  sceneNumber: number;
  sceneId: string;
  title: string;
  timecodeFormatted: string;
  durationSec: number;
  voiceoverText: string;
  accentWords: string[];
  foleyTriggers: {
    atSec: number;
    type: "braam" | "avionicsChime" | "qnxTick" | "turbineSpool" | "warningAlarm" | "cryptoSeal";
    label: string;
  }[];
}

export const MASTERCLASS_SCENES: MasterclassScene[] = [
  {
    sceneNumber: 1,
    sceneId: "SCENE-01-CERTIFICATION-VOID",
    title: "THE CERTIFICATION VOID",
    timecodeFormatted: "00:00 - 00:35",
    durationSec: 35,
    voiceoverText:
      "Urban air mobility is a confirmed 1.5-trillion-dollar frontier. Yet autonomy is paralyzed by a lethal vulnerability: commercial aviation rejects probabilistic cloud latency. A 200-millisecond delay over populated airspace is catastrophic hull loss. Aviation demands deterministic certifiability.",
    accentWords: [
      "1.5-trillion-dollar",
      "lethal vulnerability",
      "200-millisecond delay",
      "catastrophic hull loss",
      "deterministic certifiability",
    ],
    foleyTriggers: [
      { atSec: 1, type: "braam", label: "24Hz Sub-Bass Braam Impact" },
      { atSec: 12, type: "warningAlarm", label: "Wind Shear Warning Alarm" },
      { atSec: 24, type: "avionicsChime", label: "Telemetry Latency Disconnect" },
    ],
  },
  {
    sceneNumber: 2,
    sceneId: "SCENE-02-DETERMINISTIC-AIRLOCK",
    title: "THE DETERMINISTIC AIRLOCK",
    timecodeFormatted: "00:35 - 01:25",
    durationSec: 50,
    voiceoverText:
      "Enter AeroOps AI. Engineered to DO-178C Level A standards. At its base: a deterministic BlackBerry QNX 8.0 kernel evaluating physics, battery reserves, and aerodynamic vectors in sub-milliseconds. Above this airlock: Google Gemini 2.5 Flash translating dense aerospace telemetry into instant pilot briefings. Deterministic rules decide; explainable AI explains.",
    accentWords: [
      "DO-178C Level A",
      "BlackBerry QNX 8.0 kernel",
      "sub-milliseconds",
      "Google Gemini 2.5 Flash",
      "Deterministic rules decide",
      "explainable AI explains",
    ],
    foleyTriggers: [
      { atSec: 2, type: "qnxTick", label: "QNX RTOS Watchdog Clock Pulse" },
      { atSec: 18, type: "turbineSpool", label: "eVTOL Turbine Frequency Ramp" },
      { atSec: 36, type: "avionicsChime", label: "Dual-Layer Safety Airlock Locked" },
    ],
  },
  {
    sceneNumber: 3,
    sceneId: "SCENE-03-THREE-MOATS",
    title: "THE THREE IMPENETRABLE MOATS",
    timecodeFormatted: "01:25 - 02:20",
    durationSec: 55,
    voiceoverText:
      "Three defensible enterprise moats. First: an FAA-grade cryptographic blackbox sealing every millisecond in an immutable SHA-256 Merkle ledger for forensic replay. Second: autonomous loss-of-link fail-safe executing off-grid diversions with zero cloud dependency. Third: native 10Hz MAVLink integration, fully verified across 135 continuous test suites.",
    accentWords: [
      "Three defensible enterprise moats",
      "cryptographic blackbox",
      "immutable SHA-256 Merkle ledger",
      "autonomous loss-of-link fail-safe",
      "off-grid diversions",
      "135 continuous test suites",
    ],
    foleyTriggers: [
      { atSec: 2, type: "braam", label: "Defensible Enterprise Moats Braam" },
      { atSec: 15, type: "cryptoSeal", label: "SHA-256 Merkle Block Seal Snap" },
      { atSec: 32, type: "warningAlarm", label: "C2 Severance Auto-Lock KBUR" },
      { atSec: 46, type: "avionicsChime", label: "135/135 Test Verification Chime" },
    ],
  },
  {
    sceneNumber: 4,
    sceneId: "SCENE-04-COMMERCIAL-MONOPOLY",
    title: "COMMERCIAL MONOPOLY & CALL TO CAPITAL",
    timecodeFormatted: "02:20 - 03:30",
    durationSec: 70,
    voiceoverText:
      "Airframe manufacturers build hardware. Ride-shares sell tickets. AeroOps AI captures the mission-critical software layer: twenty-five thousand dollars annual ARR per tail plus continuous flight-hour telemetry fees. Software is validated; tests are green; the repository is locked on main. We are opening our Seed round to institutional partners building the infrastructure of flight.",
    accentWords: [
      "build hardware",
      "sell tickets",
      "mission-critical software layer",
      "twenty-five thousand dollars annual ARR",
      "flight-hour telemetry fees",
      "Software is validated",
      "infrastructure of flight",
    ],
    foleyTriggers: [
      { atSec: 3, type: "turbineSpool", label: "Vertiport Descent Approach" },
      { atSec: 25, type: "cryptoSeal", label: "MegaWatt Pad Magnetic Latch" },
      { atSec: 45, type: "braam", label: "Final Triumphant Inception Braam" },
      { atSec: 62, type: "avionicsChime", label: "Digital Resolve Power Down" },
    ],
  },
];

export interface AudioPlaybackState {
  isPlaying: boolean;
  activeSceneIndex: number;
  activeScene: MasterclassScene;
  elapsedSec: number;
  isMuted: boolean;
  voiceVolume: number;
  foleyVolume: number;
  lastFoleyTriggered?: string;
}

export type PlaybackListener = (state: AudioPlaybackState) => void;

class CinematicAudioPipeline {
  private audioCtx: AudioContext | null = null;
  private isPlaying = false;
  private isMuted = false;
  private voiceVolume = 1.0;
  private foleyVolume = 0.8;
  private activeSceneIndex = 0;
  private elapsedSec = 0;
  private tickerInterval: NodeJS.Timeout | null = null;
  private listeners: Set<PlaybackListener> = new Set();
  private lastFoleyLabel = "";
  private voiceoverAudio: HTMLAudioElement | null = null;

  constructor() {
    // Audio context will be lazily initialized on user gesture
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public subscribe(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  public getState(): AudioPlaybackState {
    const scene = MASTERCLASS_SCENES[this.activeSceneIndex] || MASTERCLASS_SCENES[0];
    return {
      isPlaying: this.isPlaying,
      activeSceneIndex: this.activeSceneIndex,
      activeScene: scene,
      elapsedSec: this.elapsedSec,
      isMuted: this.isMuted,
      voiceVolume: this.voiceVolume,
      foleyVolume: this.foleyVolume,
      lastFoleyTriggered: this.lastFoleyLabel,
    };
  }

  // ============================================================================
  // PROCEDURAL WEB AUDIO FOLEY SYNTHESIZERS
  // ============================================================================

  /**
   * 1. Cinematic Nolan / Inception Sub-Bass "Braam" Impact
   * Massive 24Hz-55Hz brass/sub impact with exponential decay and waveshaper distortion
   */
  public playCinematicBraam(duration = 2.8): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "24Hz Sub-Bass Braam Impact";
    this.notify();

    try {
      const now = ctx.currentTime;

      // Sub-bass oscillator (24Hz ramping up to 55Hz then decaying to 32Hz)
      const subOsc = ctx.createOscillator();
      subOsc.type = "sawtooth";
      subOsc.frequency.setValueAtTime(28, now);
      subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.12);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + duration);

      // Low-pass filter with heavy resonance
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(140, now);
      filter.frequency.exponentialRampToValueAtTime(320, now + 0.15);
      filter.frequency.exponentialRampToValueAtTime(60, now + duration);
      filter.Q.setValueAtTime(6.0, now);

      // Waveshaper distortion
      const shaper = ctx.createWaveShaper();
      (shaper as any).curve = this.makeDistortionCurve(18);

      // Gain Envelope
      const gain = ctx.createGain();
      const peakVol = 0.35 * this.foleyVolume;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(peakVol, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      subOsc.connect(filter);
      filter.connect(shaper);
      shaper.connect(gain);
      gain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + duration);
    } catch (e) {
      console.warn("Braam synth error:", e);
    }
  }

  /**
   * 2. Crisp Avionics Telemetry Tone
   * Dual-tone 880Hz / 1760Hz high-Q resonant glass ping
   */
  public playAvionicsTone(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "Avionics Cockpit Telemetry Chime";
    this.notify();

    try {
      const now = ctx.currentTime;
      [880, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        const vol = (idx === 0 ? 0.08 : 0.05) * this.foleyVolume;
        gain.gain.setValueAtTime(0.001, now + idx * 0.04);
        gain.gain.linearRampToValueAtTime(vol, now + idx * 0.04 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.45);
      });
    } catch {
      // Audio permission
    }
  }

  /**
   * 3. QNX Neutrino RTOS Watchdog Microkernel Clock Tick
   * High-frequency 3200Hz microsecond pulse
   */
  public playQnxClockTick(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "QNX RTOS Microkernel Clock Pulse";
    this.notify();

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(3200, now);

      const vol = 0.06 * this.foleyVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Audio permission
    }
  }

  /**
   * 4. Electric Tilt-Rotor Turbine Spool-Up Frequency Sweep
   * Filtered white noise with rising resonant bandpass filter simulating eVTOL spin-up
   */
  public playTurbineSpool(duration = 2.2): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "Electric Tilt-Rotor Turbine Spool";
    this.notify();

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * duration;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = "bandpass";
      bandpass.frequency.setValueAtTime(280, now);
      bandpass.frequency.exponentialRampToValueAtTime(1850, now + duration);
      bandpass.Q.setValueAtTime(4.5, now);

      const gain = ctx.createGain();
      const vol = 0.12 * this.foleyVolume;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      whiteNoise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    } catch {
      // Audio permission
    }
  }

  /**
   * 5. DO-178C Warning Alarm Siren
   * Dual oscillating tone 600Hz / 1200Hz
   */
  public playWarningAlarm(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "DO-178C Master Caution Siren";
    this.notify();

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";

      // Oscillate frequency
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.15);
      osc.frequency.linearRampToValueAtTime(600, now + 0.3);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.45);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);

      const vol = 0.08 * this.foleyVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {
      // Audio permission
    }
  }

  /**
   * 6. Cryptographic Merkle Block Seal Snap
   * Resonant precision metallic mechanical lock
   */
  public playCryptographicSealTone(): void {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.lastFoleyLabel = "SHA-256 Merkle Block Seal Snap";
    this.notify();

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(2400, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

      const vol = 0.1 * this.foleyVolume;
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Audio permission
    }
  }

  private makeDistortionCurve(amount = 20): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // ============================================================================
  // SYNCHRONIZED MASTERCLASS SPEECH SYNTHESIS ENGINE
  // ============================================================================

  /**
   * Speaks the current scene voiceover using low-pitch British / Mid-Atlantic formal voice profile
   */
  public playSceneVoiceover(sceneIndex: number, onComplete?: () => void): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onComplete) onComplete();
      return;
    }

    const scene = MASTERCLASS_SCENES[sceneIndex];
    if (!scene) {
      if (onComplete) onComplete();
      return;
    }

    if (this.voiceoverAudio) {
      this.voiceoverAudio.pause();
      this.voiceoverAudio = null;
    }

    try {
      // Use Studio-Grade Neural Voiceover audio asset directly
      const audio = new Audio("/assets/audio/aeroops_executive_voiceover.mp3");
      this.voiceoverAudio = audio;
      audio.volume = this.isMuted ? 0 : this.voiceVolume;

      // Approximate scene start offsets in master audio (0, 39, 76, 120s)
      const sceneOffsets = [0, 39, 76, 120];
      const startOffset = sceneOffsets[sceneIndex] || 0;

      audio.onplay = () => {
        this.activeSceneIndex = sceneIndex;
        this.isPlaying = true;
        this.notify();
      };

      audio.onended = () => {
        if (onComplete) onComplete();
      };

      audio.onerror = () => {
        console.warn("Neural audio fallback to SpeechSynthesis");
        this.fallbackSpeechSynthesis(scene, sceneIndex, onComplete);
      };

      audio.currentTime = startOffset;
      audio.play().catch(() => {
        this.fallbackSpeechSynthesis(scene, sceneIndex, onComplete);
      });
    } catch {
      this.fallbackSpeechSynthesis(scene, sceneIndex, onComplete);
    }
  }

  private fallbackSpeechSynthesis(
    scene: MasterclassScene,
    sceneIndex: number,
    onComplete?: () => void
  ): void {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      if (onComplete) onComplete();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(scene.voiceoverText);
    utterance.rate = 1.0;
    utterance.pitch = 0.88;
    utterance.volume = this.isMuted ? 0 : this.voiceVolume;

    utterance.onstart = () => {
      this.activeSceneIndex = sceneIndex;
      this.isPlaying = true;
      this.notify();
    };

    utterance.onend = () => {
      if (onComplete) onComplete();
    };

    utterance.onerror = (e) => {
      console.warn("Voiceover synthesis error:", e);
      if (onComplete) onComplete();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Starts or resumes playback of the entire 3:30 masterclass pipeline
   */
  public startPipeline(fromSceneIndex = 0): void {
    this.activeSceneIndex = fromSceneIndex;
    this.isPlaying = true;
    this.elapsedSec = 0;
    this.notify();

    // Trigger initial sub-bass impact
    this.playCinematicBraam();

    this.runSceneSequence(fromSceneIndex);
    this.startTicker();
  }

  private runSceneSequence(index: number): void {
    if (!this.isPlaying) return;
    if (index >= MASTERCLASS_SCENES.length) {
      this.stop();
      return;
    }

    this.activeSceneIndex = index;
    const currentScene = MASTERCLASS_SCENES[index];
    this.notify();

    // Schedule scene's foley triggers
    currentScene.foleyTriggers.forEach((foley) => {
      setTimeout(() => {
        if (!this.isPlaying || this.activeSceneIndex !== index) return;
        this.triggerFoleyType(foley.type);
      }, foley.atSec * 1000);
    });

    this.playSceneVoiceover(index, () => {
      if (!this.isPlaying) return;
      // 1.5s cinematic pause between scenes
      setTimeout(() => {
        if (this.isPlaying) {
          this.runSceneSequence(index + 1);
        }
      }, 1500);
    });
  }

  private triggerFoleyType(type: MasterclassScene["foleyTriggers"][0]["type"]): void {
    switch (type) {
      case "braam":
        this.playCinematicBraam();
        break;
      case "avionicsChime":
        this.playAvionicsTone();
        break;
      case "qnxTick":
        this.playQnxClockTick();
        break;
      case "turbineSpool":
        this.playTurbineSpool();
        break;
      case "warningAlarm":
        this.playWarningAlarm();
        break;
      case "cryptoSeal":
        this.playCryptographicSealTone();
        break;
    }
  }

  private startTicker(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      if (this.isPlaying) {
        this.elapsedSec += 1;
        this.notify();
      }
    }, 1000);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.voiceoverAudio) {
      this.voiceoverAudio.pause();
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.notify();
  }

  public resume(): void {
    this.isPlaying = true;
    if (this.voiceoverAudio && this.voiceoverAudio.paused) {
      this.voiceoverAudio.play().catch(() => {});
    } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        this.runSceneSequence(this.activeSceneIndex);
      }
    }
    this.startTicker();
    this.notify();
  }

  public stop(): void {
    this.isPlaying = false;
    this.elapsedSec = 0;
    if (this.voiceoverAudio) {
      this.voiceoverAudio.pause();
      this.voiceoverAudio.currentTime = 0;
      this.voiceoverAudio = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
    this.notify();
  }

  public toggleMute(): void {
    this.isMuted = !this.isMuted;
    this.notify();
  }

  public selectScene(index: number): void {
    this.stop();
    this.activeSceneIndex = Math.max(0, Math.min(index, MASTERCLASS_SCENES.length - 1));
    this.notify();
  }
}

// Global Singleton
export const cinematicAudioPipeline = new CinematicAudioPipeline();
