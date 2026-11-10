"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Radio,
  FileCheck,
  Plane,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Flame,
} from "lucide-react";
import { WaveformCanvas, AudioSpeakerState } from "@/components/pitch-sim/WaveformCanvas";
import { PersonaHUD } from "@/components/pitch-sim/PersonaHUD";
import { InterruptionAlert } from "@/components/pitch-sim/InterruptionAlert";
import { TelemetrySidebar } from "@/components/pitch-sim/TelemetrySidebar";
import { ScorecardModal } from "@/components/pitch-sim/ScorecardModal";
import {
  VC_PERSONAS,
  getPersonaById,
  VCPersona,
} from "@/lib/pitch-sim/personas";
import {
  SpeechStreamTelemetry,
  InterruptionEvent,
  evaluateSpeechStream,
  DEFAULT_INTERRUPTION_CONFIG,
} from "@/lib/pitch-sim/interruption-engine";
import {
  ScoreIndices,
  calculateLiveScores,
  generateDueDiligenceReport,
  DueDiligenceReport,
} from "@/lib/pitch-sim/scoring-rubric";
import {
  DEMO_PRELOADS,
  THESIS_PILLARS,
} from "@/lib/pitch-sim/knowledge-vault";
import { PitchEvaluationResult } from "@/lib/pitch-sim/deterministic-vc-engine";

// Window typing for speech recognition
interface IWindowSpeechRecognition {
  new (): SpeechRecognitionInstance;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export default function PitchSimulatorPage() {
  // Mode selection
  const [activeMode, setActiveMode] = useState<"GAUNTLET" | "ELEVATOR_RUN">("GAUNTLET");
  const [isGauntletMode, setIsGauntletMode] = useState(true); // Full panel vs solo
  const [activePersonaId, setActivePersonaId] = useState<string>("jason-kraus");
  const [hostilityLevel, setHostilityLevel] = useState<number>(3);

  // Audio & Speech State
  const [isMicActive, setIsMicActive] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [speakerState, setSpeakerState] = useState<AudioSpeakerState>("IDLE");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Transcripts & Dialog
  const [transcript, setTranscript] = useState<string>("");
  const [currentUtterance, setCurrentUtterance] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [chatLog, setChatLog] = useState<
    { id: string; speaker: "founder" | "vc"; persona?: VCPersona; text: string; timestamp: string }[]
  >([
    {
      id: "initial-vc-greeting",
      speaker: "vc",
      persona: getPersonaById("jason-kraus"),
      text: "Welcome to the AeroOps AI Technical & Venture Due Diligence Sparring Session. We've reviewed your thesis on 'Deterministic Rules Engine Decides, AI Explains.' Walk us through your dual-layer QNX 8.0 architecture and how you plan to reach $1M ARR in the next 12 months with commercial BVLOS drone fleets.",
      timestamp: "00:00",
    },
  ]);

  // Telemetry & Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [elevatorCountdownSec, setElevatorCountdownSec] = useState<number>(120);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [systemLatencyMs, setSystemLatencyMs] = useState<number>(12);
  const [engineSource, setEngineSource] = useState<string>("Offline Deterministic Kernel");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Scores & Interruption
  const [activeInterruption, setActiveInterruption] = useState<InterruptionEvent | null>(null);
  const [interruptionHistory, setInterruptionHistory] = useState<InterruptionEvent[]>([]);
  const [innerMonologue, setInnerMonologue] = useState<string>(
    "Awaiting founder technical defense of QNX Neutrino deterministic bounds."
  );

  const [liveScores, setLiveScores] = useState<ScoreIndices>({
    tdi: 65,
    rmr: 65,
    icv: 60,
    vcp: 80,
    composite: 67,
  });

  const [telemetry, setTelemetry] = useState<SpeechStreamTelemetry>({
    wordCount: 0,
    elapsedSeconds: 0,
    wpm: 0,
    wpmZone: "OPTIMAL",
    fillerWordsFound: [],
    totalFillerCount: 0,
    buzzwordsFound: [],
    metricsFound: [],
    coveredPillarIds: [],
    interruption: null,
  });

  // Scorecard modal state
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<DueDiligenceReport | null>(null);

  const activePersona = getPersonaById(activePersonaId);

  // --------------------------------------------------------------------------
  // Timer: 120s Countdown for Mode B, or standard running stopwatch for Mode A
  // --------------------------------------------------------------------------
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);

        if (activeMode === "ELEVATOR_RUN") {
          setElevatorCountdownSec((prev) => {
            if (prev <= 1) {
              // Time's up! Automatically trigger audit report
              setIsTimerRunning(false);
              stopMicrophone();
              handleGenerateAuditReport();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeMode]);

  // --------------------------------------------------------------------------
  // Speech Synthesis helper
  // --------------------------------------------------------------------------
  const speakText = useCallback(
    (text: string, persona: VCPersona) => {
      if (isTtsMuted || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = persona.voiceConfig.pitch;
      utterance.rate = persona.voiceConfig.rate;

      // Select suitable English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => v.lang.includes("en-US") || v.lang.includes("en"));
      if (preferred) utterance.voice = preferred;

      setSpeakerState("VC_SPEAKING");

      utterance.onend = () => {
        setSpeakerState(isMicActive ? "FOUNDER_SPEAKING" : "IDLE");
      };

      utterance.onerror = () => {
        setSpeakerState("IDLE");
      };

      window.speechSynthesis.speak(utterance);
    },
    [isTtsMuted, isMicActive]
  );

  // --------------------------------------------------------------------------
  // Voice Interruption trigger
  // --------------------------------------------------------------------------
  const triggerInterruption = useCallback(
    (event: InterruptionEvent) => {
      setActiveInterruption(event);
      setInterruptionHistory((prev) => [...prev, event]);
      setSpeakerState("VC_INTERRUPTING");

      // Halt mic capture to force founder to listen
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsMicActive(false);

      // Play vocal interjection
      speakText(event.interjectionText, event.interruptingPersona);
    },
    [speakText]
  );

  // --------------------------------------------------------------------------
  // Web Speech Recognition & Web Audio Setup
  // --------------------------------------------------------------------------
  const startMicrophone = async () => {
    try {
      // 1. AudioContext & AnalyserNode for oscilloscope
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

      if (!audioContextRef.current && AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        audioContextRef.current = audioCtx;
      }

      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      if (audioContextRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        setAnalyserNode(analyser);
      }

      // 2. Web Speech Recognition
      const SpeechRecognitionClass: IWindowSpeechRecognition | undefined =
        (window as unknown as { SpeechRecognition: IWindowSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: IWindowSpeechRecognition })
          .webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const chunk = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += chunk;
            } else {
              interimTranscript += chunk;
            }
          }

          const activeText = (finalTranscript || interimTranscript).trim();
          if (activeText) {
            setCurrentUtterance(activeText);
            setTranscript((prev) => (prev ? `${prev} ${activeText}` : activeText));

            // Run real-time heuristics
            const currentTelem = evaluateSpeechStream(
              activeText,
              transcript + " " + activeText,
              elapsedSeconds || 5,
              activePersonaId,
              DEFAULT_INTERRUPTION_CONFIG
            );

            setTelemetry(currentTelem);
            const scores = calculateLiveScores(
              transcript + " " + activeText,
              currentTelem,
              interruptionHistory
            );
            setLiveScores(scores);

            // Check if heuristic tripped an immediate interruption
            if (currentTelem.interruption && currentTelem.interruption.isInterrupted) {
              triggerInterruption(currentTelem.interruption);
            }
          }
        };

        recognition.onerror = (err) => {
          console.warn("[SpeechRecognition Error]:", err);
        };

        recognition.onend = () => {
          if (isMicActive) {
            try {
              recognition.start();
            } catch {
              // ignore
            }
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsMicActive(true);
      setIsTimerRunning(true);
      setSpeakerState("FOUNDER_SPEAKING");
    } catch (err) {
      console.error("[Microphone Access Error]:", err);
      setIsMicActive(false);
      setSpeakerState("IDLE");
    }
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    setIsMicActive(false);
    setSpeakerState("IDLE");
  };

  const toggleMicrophone = () => {
    if (isMicActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  };

  // --------------------------------------------------------------------------
  // Submit Founder Response to Sparring API (or deterministic offline fallback)
  // --------------------------------------------------------------------------
  const submitFounderUtterance = async (overrideText?: string) => {
    const textToSubmit = (overrideText || currentUtterance || textInput).trim();
    if (!textToSubmit) return;

    // Log founder speech in chat log
    const nowTime = new Date().toLocaleTimeString([], { minute: "2-digit", second: "2-digit" });
    const newChatLog = [
      ...chatLog,
      {
        id: `founder-${Date.now()}`,
        speaker: "founder" as const,
        text: textToSubmit,
        timestamp: nowTime,
      },
    ];
    setChatLog(newChatLog);

    // Update cumulative transcript
    const updatedTotal = transcript ? `${transcript} ${textToSubmit}` : textToSubmit;
    setTranscript(updatedTotal);
    setCurrentUtterance("");
    setTextInput("");

    setIsEvaluating(true);
    const startT = performance.now();

    try {
      const response = await fetch("/api/pitch-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: updatedTotal,
          currentUtterance: textToSubmit,
          elapsedSeconds: elapsedSeconds || 15,
          activePersonaId,
          hostilityLevel,
          isGauntletMode,
          interruptionHistory,
        }),
      });

      const data = (await response.json()) as PitchEvaluationResult;
      const latency = Math.round(performance.now() - startT);
      setSystemLatencyMs(latency);
      setEngineSource(data.source === "GEMINI_2_5_FLASH" ? "Gemini 2.5 Flash" : "Deterministic RTOS Kernel");

      // Update persona and scores
      setActivePersonaId(data.persona.id);
      setLiveScores(data.liveScores);
      setInnerMonologue(data.innerMonologue);

      // Add VC reply to chat log
      setChatLog((prev) => [
        ...prev,
        {
          id: `vc-${Date.now()}`,
          speaker: "vc",
          persona: data.persona,
          text: data.vcResponseText,
          timestamp: nowTime,
        },
      ]);

      // If VC interrupted
      if (data.wasInterrupted) {
        triggerInterruption({
          isInterrupted: true,
          rule: "DETERMINISTIC_BOUNDARY_VIOLATION",
          ruleName: data.interruptionReason || "VC INTERRUPT",
          severity: "CRITICAL",
          interruptingPersona: data.persona,
          interjectionText: data.vcResponseText,
          offendingSnippet: data.claimCritique.redFlag || textToSubmit,
          timestampMs: Date.now(),
        });
      } else {
        // Speak response if not interrupted
        speakText(data.vcResponseText, data.persona);
      }

      // Re-evaluate telemetry
      const updatedTelem = evaluateSpeechStream(
        textToSubmit,
        updatedTotal,
        elapsedSeconds,
        data.persona.id,
        DEFAULT_INTERRUPTION_CONFIG
      );
      setTelemetry(updatedTelem);
    } catch (err) {
      console.error("[Sparring Evaluation Error]:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // --------------------------------------------------------------------------
  // Manual VC Interrupt Action
  // --------------------------------------------------------------------------
  const forceManualVCInterrupt = () => {
    const persona = getPersonaById(activePersonaId);
    triggerInterruption({
      isInterrupted: true,
      rule: "RAMBLE_EXCEEDED",
      ruleName: "MANUAL VC INTERRUPT FORCED",
      severity: "HIGH",
      interruptingPersona: persona,
      interjectionText: `Hold on! ${persona.shortName} cutting in right now. Stop hand-waving and address your core DO-178C certification and unit economics immediately.`,
      offendingSnippet: currentUtterance || "Manual VC partner intervention triggered",
      timestampMs: Date.now(),
    });
  };

  // --------------------------------------------------------------------------
  // Generate Full Audit Report
  // --------------------------------------------------------------------------
  const handleGenerateAuditReport = () => {
    const report = generateDueDiligenceReport(transcript, telemetry, interruptionHistory);
    setGeneratedReport(report);
    setIsScorecardOpen(true);
  };

  // --------------------------------------------------------------------------
  // Reset Simulation
  // --------------------------------------------------------------------------
  const handleResetSession = () => {
    stopMicrophone();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setTranscript("");
    setCurrentUtterance("");
    setTextInput("");
    setElapsedSeconds(0);
    setElevatorCountdownSec(120);
    setIsTimerRunning(false);
    setActiveInterruption(null);
    setInterruptionHistory([]);
    setLiveScores({ tdi: 65, rmr: 65, icv: 60, vcp: 80, composite: 67 });
    setChatLog([
      {
        id: "initial-vc-greeting-reset",
        speaker: "vc",
        persona: getPersonaById(activePersonaId),
        text: "Session reset. We are ready for your technical due diligence defense. Begin whenever you are ready.",
        timestamp: "00:00",
      },
    ]);
  };

  // Format MM:SS.s
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.0`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Cockpit Telemetry Bar */}
      <header className="w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-2.5">
        <div className="max-w-[1840px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Route Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 transition-all"
              title="Return to Main Cockpit"
            >
              <Plane className="w-4 h-4 transform -rotate-45" />
            </Link>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  AeroOps<span className="text-cyan-400 font-light ml-0.5">AI</span>
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 uppercase tracking-wider">
                  VC PITCH & DUE DILIGENCE SIMULATOR
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                DO-178C DAL-B • QNX 8.0 RTOS • SHA-256 Merkle Ledger • $1,200-$3,500 ARR/Tail
              </p>
            </div>
          </div>

          {/* Mode Switcher ("The Gauntlet" vs "2-Minute Elevator Run") */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => {
                setActiveMode("GAUNTLET");
                setIsTimerRunning(false);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition-all flex items-center gap-1.5 ${
                activeMode === "GAUNTLET"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>MODE A: The Gauntlet</span>
            </button>

            <button
              onClick={() => {
                setActiveMode("ELEVATOR_RUN");
                setElevatorCountdownSec(120);
                setIsTimerRunning(false);
              }}
              className={`px-3 py-1.5 text-xs rounded-lg font-mono font-medium transition-all flex items-center gap-1.5 ${
                activeMode === "ELEVATOR_RUN"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>MODE B: 2-Min Elevator Run</span>
            </button>
          </div>

          {/* Top Avionics Indicators */}
          <div className="flex items-center gap-2.5 text-xs font-mono">
            {/* Countdown / Timer Display */}
            {activeMode === "ELEVATOR_RUN" ? (
              <div
                className={`px-3 py-1 rounded-lg border flex items-center gap-1.5 font-bold ${
                  elevatorCountdownSec <= 20
                    ? "bg-red-500/20 border-red-500 text-red-300 animate-pulse"
                    : "bg-slate-900 border-slate-800 text-amber-400"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>COUNTDOWN: {formatCountdown(elevatorCountdownSec)}</span>
              </div>
            ) : (
              <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>SESSION: {Math.floor(elapsedSeconds / 60)}:{String(elapsedSeconds % 60).padStart(2, "0")}</span>
              </div>
            )}

            {/* Engine Latency & Mode */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">{systemLatencyMs}ms</span>
              <span className="text-[10px] text-slate-500">({engineSource})</span>
            </div>

            {/* TTS Mute Toggle */}
            <button
              onClick={() => setIsTtsMuted(!isTtsMuted)}
              className={`p-1.5 rounded-lg border transition-colors ${
                isTtsMuted
                  ? "bg-red-950/40 border-red-500/40 text-red-400"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={isTtsMuted ? "Audio Speech Synthesis Muted" : "Audio Speech Synthesis Active"}
            >
              {isTtsMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Reset Button */}
            <button
              onClick={handleResetSession}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset Simulation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main 3-Column Dark Cockpit Grid */}
      <main className="flex-1 max-w-[1840px] w-full mx-auto p-3 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Persona HUD & Thesis Checklist (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <PersonaHUD
            activePersonaId={activePersonaId}
            isGauntletMode={isGauntletMode}
            hostilityLevel={hostilityLevel}
            coveredPillarIds={telemetry.coveredPillarIds}
            isVCResponding={speakerState === "VC_SPEAKING" || speakerState === "VC_INTERRUPTING"}
            onSelectPersona={(id) => setActivePersonaId(id)}
            onToggleGauntletMode={(gauntlet) => setIsGauntletMode(gauntlet)}
            onChangeHostility={(lvl) => setHostilityLevel(lvl)}
          />
        </div>

        {/* CENTER COLUMN: Waveform, Interruption Banner, Transcript, Audio Deck (6 Cols) */}
        <div className="lg:col-span-6 flex flex-col gap-3 min-w-0">
          {/* Waveform Visualizer */}
          <WaveformCanvas
            speakerState={speakerState}
            analyserNode={analyserNode}
            height={90}
            activePersonaColor={activePersona.themeColor}
          />

          {/* Master Caution Interruption Alert Banner */}
          <InterruptionAlert
            interruption={activeInterruption}
            onDismiss={() => {
              setActiveInterruption(null);
              setSpeakerState(isMicActive ? "FOUNDER_SPEAKING" : "IDLE");
            }}
            onAcknowledgeRebut={() => {
              setActiveInterruption(null);
              setTextInput("Under DO-178C DAL-B, our deterministic C++ kernel enforces all Go/No-Go and abort thresholds. Gemini operates strictly in an isolated, read-only advisory partition to explain verified sensor snapshots without any actuation authority.");
            }}
          />

          {/* Mode B: 4-Stage Pacing Telemetry Bar */}
          {activeMode === "ELEVATOR_RUN" && (
            <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-300">
                <span className="font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>4-STAGE PACING TELEMETRY (120s RUN)</span>
                </span>
                <span className="text-amber-400">
                  {120 - elevatorCountdownSec}s / 120s elapsed
                </span>
              </div>

              {/* 4 Stage Visual Track */}
              <div className="grid grid-cols-4 gap-1 h-2 rounded-full overflow-hidden bg-slate-950 p-0.5">
                {/* Stage 1: 0-25s */}
                <div
                  className={`h-full rounded transition-all ${
                    elevatorCountdownSec <= 120 && elevatorCountdownSec > 95
                      ? "bg-cyan-400 animate-pulse"
                      : elevatorCountdownSec <= 95
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
                {/* Stage 2: 25-55s */}
                <div
                  className={`h-full rounded transition-all ${
                    elevatorCountdownSec <= 95 && elevatorCountdownSec > 65
                      ? "bg-cyan-400 animate-pulse"
                      : elevatorCountdownSec <= 65
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
                {/* Stage 3: 55-90s */}
                <div
                  className={`h-full rounded transition-all ${
                    elevatorCountdownSec <= 65 && elevatorCountdownSec > 30
                      ? "bg-cyan-400 animate-pulse"
                      : elevatorCountdownSec <= 30
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
                {/* Stage 4: 90-120s */}
                <div
                  className={`h-full rounded transition-all ${
                    elevatorCountdownSec <= 30 && elevatorCountdownSec > 0
                      ? "bg-cyan-400 animate-pulse"
                      : elevatorCountdownSec === 0
                      ? "bg-emerald-500"
                      : "bg-slate-800"
                  }`}
                />
              </div>

              {/* Stage Labels */}
              <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-400 text-center">
                <span className={elevatorCountdownSec <= 120 && elevatorCountdownSec > 95 ? "text-cyan-300 font-bold" : ""}>
                  00-25s: Hook & Wedge
                </span>
                <span className={elevatorCountdownSec <= 95 && elevatorCountdownSec > 65 ? "text-cyan-300 font-bold" : ""}>
                  25-55s: QNX + AI Bounds
                </span>
                <span className={elevatorCountdownSec <= 65 && elevatorCountdownSec > 30 ? "text-cyan-300 font-bold" : ""}>
                  55-90s: ARR & Economics
                </span>
                <span className={elevatorCountdownSec <= 30 ? "text-cyan-300 font-bold" : ""}>
                  90-120s: Moat & Ask
                </span>
              </div>
            </div>
          )}

          {/* Live Streaming Sparring Dialog Box */}
          <div className="flex-1 min-h-[380px] max-h-[500px] rounded-xl bg-slate-900/60 border border-slate-800 p-4 overflow-y-auto flex flex-col gap-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>ENCRYPTED SPARRING COMMS CHANNEL (MAVLINK STX: 0xFD)</span>
              </span>
              <span>{chatLog.length} EXCHANGES</span>
            </div>

            {chatLog.map((msg) => {
              const isFounder = msg.speaker === "founder";
              const persona = msg.persona || activePersona;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-1 ${
                    isFounder ? "items-end" : "items-start"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] font-mono">
                    <span
                      className="font-bold"
                      style={{
                        color: isFounder ? "#10b981" : persona.themeColor,
                      }}
                    >
                      {isFounder ? "FOUNDER (RPIC)" : `${persona.name} (${persona.shortName})`}
                    </span>
                    <span className="text-[10px] text-slate-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl max-w-[92%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                      isFounder
                        ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-100 rounded-tr-none"
                        : "bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {/* Live streaming interim utterance */}
            {isMicActive && currentUtterance && (
              <div className="flex flex-col gap-1 items-end animate-pulse">
                <span className="text-[10px] font-mono text-emerald-400">
                  FOUNDER STREAMING [INTERIM TRANSCRIPT]...
                </span>
                <div className="p-3 rounded-xl max-w-[85%] bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs italic">
                  {currentUtterance}
                </div>
              </div>
            )}
          </div>

          {/* Quick-Action Demo Pitch Presets */}
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Simulate Founder Transcripts (1-Click Drill):</span>
              </span>
              <span className="text-[10px] text-slate-500">Test Interruption Heuristics</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {DEMO_PRELOADS.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => {
                    setTextInput(demo.text);
                    submitFounderUtterance(demo.text);
                  }}
                  className="px-2 py-1.5 text-[10px] font-mono text-left rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 transition-all truncate"
                  title={demo.text}
                >
                  {demo.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Voice & Text Controller Deck */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              {/* Mic Push-to-Talk / Continuous Toggle */}
              <button
                onClick={toggleMicrophone}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md shrink-0 ${
                  isMicActive
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 animate-pulse"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40"
                }`}
              >
                {isMicActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                <span>{isMicActive ? "Mute Mic" : "Push to Talk"}</span>
              </button>

              {/* Text Input Box Fallback */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitFounderUtterance();
                    }
                  }}
                  placeholder="Or type founder defense statement..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/60 focus:outline-none text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 font-sans"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={() => submitFounderUtterance()}
                disabled={isEvaluating || (!textInput.trim() && !currentUtterance.trim())}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white flex items-center gap-1.5 transition-all shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>

              {/* Force VC Interrupt Button */}
              <button
                onClick={forceManualVCInterrupt}
                className="px-3 py-2.5 rounded-xl font-mono text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all shrink-0"
                title="Simulate immediate investor interjection"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Force Interrupt</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Telemetry Sidebar & Scores (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <TelemetrySidebar
            scores={liveScores}
            telemetry={telemetry}
            activePersona={activePersona}
            innerMonologue={innerMonologue}
            interruptionHistory={interruptionHistory}
            onOpenScorecard={handleGenerateAuditReport}
          />
        </div>
      </main>

      {/* Due Diligence Institutional Scorecard Modal */}
      <ScorecardModal
        report={generatedReport}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />
    </div>
  );
}
