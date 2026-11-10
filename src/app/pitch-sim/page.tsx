"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  FileCheck,
  Plane,
  Clock,
  CheckCircle2,
  AlertOctagon,
  Video,
  Eye,
  Building2,
  Play,
  RotateCcw,
  Check,
  Copy,
  ChevronRight,
  Flame,
  Shield,
  Send,
  Zap,
  ArrowRight,
  Volume1,
  HelpCircle,
  Activity,
  Layers,
  Download,
  FileText,
  Printer,
  Film,
} from "lucide-react";
import { WaveformCanvas, AudioSpeakerState } from "@/components/pitch-sim/WaveformCanvas";
import { ScorecardModal } from "@/components/pitch-sim/ScorecardModal";
import { FounderCameraHUD } from "@/components/pitch-sim/FounderCameraHUD";
import { VCPanelGrid } from "@/components/pitch-sim/VCPanelGrid";
import { CinematicTheaterModal } from "@/components/pitch-sim/CinematicTheaterModal";
import {
  VC_PERSONAS,
  getPersonaById,
  VCPersona,
  VCFacialState,
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
  DueDiligenceQA,
  getDynamicQA,
  getNextQA,
  getRandomQA,
  PersonaId,
  CORE_VERTICALS,
  PRESSURE_ANGLES,
} from "@/lib/pitch-sim/qa-vault";
import {
  speakInstitutionalVoice,
  stopSpeechSynthesis,
  prewarmSpeechAudio,
} from "@/lib/pitch-sim/sophisticated-voice";

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

export type SimulatorLoopState =
  | "STANDBY"
  | "VC_SPEAKING_QUESTION"
  | "LISTENING_TO_FOUNDER"
  | "FOUNDER_AUTO_DEMO"
  | "AUDITING_ANSWER";

export default function PitchSimulatorPage() {
  // Question & Combinatorial Permutation State
  const [currentQAIndex, setCurrentQAIndex] = useState<number>(0);
  const [currentQA, setCurrentQA] = useState<DueDiligenceQA>(() => getDynamicQA(0));
  const [activePersonaId, setActivePersonaId] = useState<PersonaId>("jason-kraus");
  const [selectedPersonaFilter, setSelectedPersonaFilter] = useState<string>("ALL");
  const [simulatorState, setSimulatorState] = useState<SimulatorLoopState>("STANDBY");

  // Telemetry & Accuracy Audit
  const [accuracyScore, setAccuracyScore] = useState<number>(88);
  const [auditVerdict, setAuditVerdict] = useState<"INSTITUTIONAL_GRADE" | "NEEDS_SHARPER_METRICS" | "CRITICAL_BOUNDARY_ERROR">("INSTITUTIONAL_GRADE");
  const [spokenVCFeedback, setSpokenVCFeedback] = useState<string>(
    "AeroOps AI VC War Room online. Click 'Start / Next VC Question' to Spar."
  );
  const [missedKeywordsList, setMissedKeywordsList] = useState<string[]>([]);
  const [activeFacialState, setActiveFacialState] = useState<VCFacialState>("LISTENING");
  const [presenceScore, setPresenceScore] = useState<number>(88);
  const [visualComment, setVisualComment] = useState<string | null>("Executive camera HUD online.");
  const frameCaptureFnRef = useRef<(() => string | null) | null>(null);

  // Audio State & Speech Recognition
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isTtsMuted, setIsTtsMuted] = useState<boolean>(false);
  const [speakerState, setSpeakerState] = useState<AudioSpeakerState>("IDLE");
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Transcripts
  const [transcript, setTranscript] = useState<string>("");
  const [currentUtterance, setCurrentUtterance] = useState<string>("");
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // System Metas
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [systemLatencyMs, setSystemLatencyMs] = useState<number>(12);
  const [isGeneratingQA, setIsGeneratingQA] = useState<boolean>(false);
  const [isScorecardOpen, setIsScorecardOpen] = useState<boolean>(false);
  const [isCinematicModalOpen, setIsCinematicModalOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [interruptionHistory, setInterruptionHistory] = useState<InterruptionEvent[]>([]);

  const [liveScores, setLiveScores] = useState<ScoreIndices>({
    tdi: 86,
    rmr: 85,
    icv: 82,
    vcp: 88,
    composite: 86,
    eyeContactAndPresence: 88,
  });

  const [telemetry, setTelemetry] = useState<SpeechStreamTelemetry>({
    wordCount: 0,
    elapsedSeconds: 0,
    wpm: 135,
    wpmZone: "OPTIMAL",
    fillerWordsFound: [],
    totalFillerCount: 0,
    buzzwordsFound: [],
    metricsFound: [],
    coveredPillarIds: [],
    interruption: null,
  });

  const activePersona = getPersonaById(activePersonaId);

  // Session Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Audio Pre-warm on first user interaction
  useEffect(() => {
    const handleFirstClick = () => {
      prewarmSpeechAudio();
      window.removeEventListener("click", handleFirstClick);
    };
    window.addEventListener("click", handleFirstClick);
    return () => window.removeEventListener("click", handleFirstClick);
  }, []);

  // --------------------------------------------------------------------------
  // Question Activation & Vocalization
  // --------------------------------------------------------------------------
  const activateQuestion = useCallback(
    (qa: DueDiligenceQA, vocalize = true) => {
      stopSpeechSynthesis();
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);

      setCurrentQA(qa);
      setCurrentQAIndex(qa.index);
      setActivePersonaId(qa.personaId);
      setActiveFacialState("LISTENING");
      setIsTimerRunning(true);

      if (vocalize && !isTtsMuted) {
        setSimulatorState("VC_SPEAKING_QUESTION");
        setSpeakerState("VC_SPEAKING");

        speakInstitutionalVoice(qa.question, qa.personaId, {
          onEnd: () => {
            setSimulatorState("STANDBY");
            setSpeakerState("IDLE");
          },
          onError: () => {
            setSimulatorState("STANDBY");
            setSpeakerState("IDLE");
          },
        });
      } else {
        setSimulatorState("STANDBY");
        setSpeakerState("IDLE");
      }
    },
    [isTtsMuted]
  );

  const cycleNextQuestion = useCallback(() => {
    const nextIdx = currentQAIndex + 1;
    const filter = selectedPersonaFilter === "ALL" ? undefined : (selectedPersonaFilter as PersonaId);
    const next = getNextQA(nextIdx, filter);
    activateQuestion(next, true);
  }, [currentQAIndex, selectedPersonaFilter, activateQuestion]);

  // --------------------------------------------------------------------------
  // Generate Fresh Unscripted Question from 1,000+ Combinatorial Matrix
  // --------------------------------------------------------------------------
  const generateUnscriptedQuestion = async () => {
    stopSpeechSynthesis();
    setIsGeneratingQA(true);
    const randomIdx = Math.floor(Math.random() * 1000);
    const filter = selectedPersonaFilter === "ALL" ? undefined : (selectedPersonaFilter as PersonaId);

    try {
      const response = await fetch("/api/pitch-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "GENERATE_FRESH_QA",
          questionIndex: randomIdx,
          personaId: filter || activePersonaId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.qa) {
          activateQuestion(data.qa, true);
          setSystemLatencyMs(data.latencyMs || 10);
        }
      } else {
        const fallback = getRandomQA(filter);
        activateQuestion(fallback, true);
      }
    } catch {
      const fallback = getRandomQA(filter);
      activateQuestion(fallback, true);
    } finally {
      setIsGeneratingQA(false);
    }
  };

  // --------------------------------------------------------------------------
  // Auto-Demo Model Answer Vocalization
  // --------------------------------------------------------------------------
  const playModelAnswerAutoDemo = useCallback(() => {
    stopSpeechSynthesis();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsMicActive(false);

    setSimulatorState("FOUNDER_AUTO_DEMO");
    setSpeakerState("FOUNDER_SPEAKING");
    setCurrentUtterance(currentQA.modelAnswerScript);

    speakInstitutionalVoice(currentQA.modelAnswerScript, "founder", {
      onEnd: () => {
        setSpeakerState("IDLE");
        auditFounderAnswer(currentQA.modelAnswerScript);
      },
      onError: () => {
        setSpeakerState("IDLE");
        auditFounderAnswer(currentQA.modelAnswerScript);
      },
    });
  }, [currentQA.modelAnswerScript]);

  // --------------------------------------------------------------------------
  // Founder Speech Recognition
  // --------------------------------------------------------------------------
  const startListeningToFounder = useCallback(async () => {
    stopSpeechSynthesis();
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);

    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      if (!mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;

        if (audioContextRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          setAnalyserNode(analyser);
        }
      }

      const SpeechRecClass: IWindowSpeechRecognition | undefined =
        (window as unknown as { SpeechRecognition: IWindowSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition: IWindowSpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecClass) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.stop();
          } catch {
            // ignore
          }
        }

        const recognition = new SpeechRecClass();
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

            // Auto-audit on 4.0s of silence
            if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
            autoSubmitTimerRef.current = setTimeout(() => {
              if (activeText.split(" ").length >= 6) {
                auditFounderAnswer(activeText);
              }
            }, 4000);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsMicActive(true);
      setSpeakerState("FOUNDER_SPEAKING");
      setSimulatorState("LISTENING_TO_FOUNDER");
    } catch (err) {
      console.warn("[Mic Init Error]:", err);
      setIsMicActive(false);
      setSpeakerState("IDLE");
      setSimulatorState("STANDBY");
    }
  }, []);

  const stopListening = useCallback(() => {
    if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsMicActive(false);
    setSpeakerState("IDLE");
  }, []);

  const toggleMic = () => {
    if (isMicActive) {
      stopListening();
      if (currentUtterance.trim()) {
        auditFounderAnswer(currentUtterance);
      } else {
        setSimulatorState("STANDBY");
      }
    } else {
      startListeningToFounder();
    }
  };

  // --------------------------------------------------------------------------
  // Audit Spoken Answer via Real-Time API
  // --------------------------------------------------------------------------
  const auditFounderAnswer = async (spokenText?: string) => {
    stopListening();
    stopSpeechSynthesis();

    const answer = (spokenText || currentUtterance).trim();
    if (!answer) return;

    setSimulatorState("AUDITING_ANSWER");
    const updatedTotal = transcript ? `${transcript} ${answer}` : answer;
    setTranscript(updatedTotal);

    let webcamFrameBase64: string | undefined = undefined;
    if (frameCaptureFnRef.current) {
      const captured = frameCaptureFnRef.current();
      if (captured) webcamFrameBase64 = captured;
    }

    const startT = performance.now();

    try {
      const response = await fetch("/api/pitch-sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AUDIT_FOUNDER_ANSWER",
          transcript: updatedTotal,
          currentUtterance: answer,
          questionAsked: currentQA.question,
          modelAnswerScript: currentQA.modelAnswerScript,
          keyPillars: currentQA.keyPillarsToHit,
          activePersonaId: currentQA.personaId,
          webcamFrameBase64,
          elapsedSeconds: elapsedSeconds || 20,
        }),
      });

      const data = await response.json();
      const latency = Math.round(performance.now() - startT);
      setSystemLatencyMs(latency);

      setAccuracyScore(data.accuracyScore ?? 85);
      setAuditVerdict(data.verdict ?? "INSTITUTIONAL_GRADE");
      setSpokenVCFeedback(data.spokenFeedback ?? "Audited successfully.");
      setMissedKeywordsList(data.missedKeywords ?? []);
      setActiveFacialState(data.vcFacialState ?? "LISTENING");

      if (data.liveScores) {
        setLiveScores(data.liveScores);
      }
      if (data.visualPresenceComment) {
        setVisualComment(data.visualPresenceComment);
      }

      // Re-evaluate speech telemetry
      const updatedTelem = evaluateSpeechStream(
        answer,
        updatedTotal,
        elapsedSeconds,
        currentQA.personaId,
        DEFAULT_INTERRUPTION_CONFIG
      );
      setTelemetry(updatedTelem);

      // Vocalize VC reaction
      if (!isTtsMuted && data.spokenFeedback) {
        setSimulatorState("VC_SPEAKING_QUESTION");
        setSpeakerState("VC_SPEAKING");

        speakInstitutionalVoice(data.spokenFeedback, currentQA.personaId, {
          onEnd: () => {
            setSimulatorState("STANDBY");
            setSpeakerState("IDLE");
          },
          onError: () => {
            setSimulatorState("STANDBY");
            setSpeakerState("IDLE");
          },
        });
      } else {
        setSimulatorState("STANDBY");
        setSpeakerState("IDLE");
      }
    } catch (err) {
      console.error("[Audit Error]:", err);
      setSimulatorState("STANDBY");
    }
  };

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(currentQA.modelAnswerScript);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const downloadMarkdownDossier = () => {
    window.open("/api/pitch-sim/export-qa?format=md", "_blank");
    setIsExportMenuOpen(false);
  };

  const openPdfPrintDossier = () => {
    window.open("/api/pitch-sim/export-qa?format=pdf", "_blank");
    setIsExportMenuOpen(false);
  };

  const resetWarRoom = () => {
    stopListening();
    stopSpeechSynthesis();
    setTranscript("");
    setCurrentUtterance("");
    setElapsedSeconds(0);
    setIsTimerRunning(false);
    setSimulatorState("STANDBY");
    const initialQA = getDynamicQA(0);
    setCurrentQA(initialQA);
    setCurrentQAIndex(0);
    setActivePersonaId("jason-kraus");
    setActiveFacialState("LISTENING");
    setAccuracyScore(88);
    setAuditVerdict("INSTITUTIONAL_GRADE");
    setSpokenVCFeedback("War room reset. Click 'Start / Next VC Question' to spar.");
  };

  // Helper: check if a word in transcript matches a key pillar or fact
  const renderHighlightedTranscript = (text: string) => {
    if (!text) {
      return (
        <span className="text-slate-500 italic text-xs">
          Speech stream standby. Speak into your microphone or click &ldquo;Hear Ideal Model Answer Read Aloud&rdquo;.
        </span>
      );
    }

    const words = text.split(" ");
    const keyTerms = [
      "qnx",
      "8.0",
      "deterministic",
      "dal-b",
      "dal-c",
      "read-only",
      "merkle",
      "sha-256",
      "wcet",
      "0.85ms",
      "0.82ms",
      "arr",
      "$2,400",
      "$1,200",
      "$3,500",
      "84%",
      "margin",
      "part 108",
      "part 135",
      "spsc",
      "gemini",
      "isolated",
      "advisory",
      "actuation",
    ];

    return (
      <p className="text-xs sm:text-sm font-mono leading-relaxed text-slate-200">
        <span className="text-cyan-400 font-bold mr-1">&gt;</span>
        {words.map((w, idx) => {
          const clean = w.toLowerCase().replace(/[^a-z0-9$%.-]/g, "");
          const isHit = keyTerms.some((t) => clean.includes(t));
          if (isHit) {
            return (
              <span key={idx} className="bg-emerald-500/25 text-emerald-300 font-bold px-1 rounded mx-0.5 border border-emerald-500/40">
                {w}{" "}
              </span>
            );
          }
          return <span key={idx}>{w} </span>;
        })}
      </p>
    );
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between p-2.5 sm:p-3 gap-2.5 font-sans select-none">
      {/* ==================================================================== */}
      {/* ROW 1: TOP TELEMETRY BAR (Fixed Height ~48px)                        */}
      {/* ==================================================================== */}
      <header className="h-12 min-h-[48px] max-h-[48px] rounded-xl border border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between text-xs font-mono shadow-md z-20">
        {/* Left: Cockpit Title + Live Engine Status */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/flight-ops"
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-bold tracking-wider transition-colors"
          >
            <Plane className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">AEROOPS AI</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-1.5 text-slate-200">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">
              VC Sparring War Room
            </span>
          </div>
          <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-bold">
            NEBIUS DEEPSEEK v4.1
          </span>
        </div>

        {/* Center: 1,000+ Permutations Indicator + Persona Pills */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700/60 text-[11px] text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Vault:</span>
            <span className="font-bold text-purple-300">1,000+ Permutations</span>
            <span className="text-slate-500">|</span>
            <span className="text-cyan-400 font-bold">Q #{currentQA.index + 1}</span>
          </div>

          {/* Persona Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded border border-slate-800">
            {["ALL", "jason-kraus", "sarah-chen", "marcus-vance", "dr-viktor-krenz"].map((fKey) => (
              <button
                key={fKey}
                onClick={() => setSelectedPersonaFilter(fKey)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                  selectedPersonaFilter === fKey
                    ? "bg-cyan-500/30 text-cyan-300 font-bold border border-cyan-500/50"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {fKey === "ALL"
                  ? "All 4"
                  : fKey === "jason-kraus"
                  ? "Jason"
                  : fKey === "sarah-chen"
                  ? "Sarah"
                  : fKey === "marcus-vance"
                  ? "Marcus"
                  : "Viktor"}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Telemetry Metrics & Score Pills */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>{systemLatencyMs}ms</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/60 border border-slate-700/60 text-slate-300">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>
                {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              setIsTtsMuted(!isTtsMuted);
              if (!isTtsMuted) stopSpeechSynthesis();
            }}
            className={`p-1.5 rounded border transition-colors ${
              isTtsMuted
                ? "bg-red-950/60 border-red-500/40 text-red-400"
                : "bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title={isTtsMuted ? "Unmute VC Voice" : "Mute VC Voice"}
          >
            {isTtsMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="px-2 py-1 rounded bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
            title="Export 1,000+ Due Diligence Q&A Matrix as PDF or Markdown"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Export Dossier</span>
          </button>

          <button
            onClick={() => setIsScorecardOpen(true)}
            className="px-2.5 py-1 rounded bg-cyan-600/80 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Due Diligence Audit</span>
          </button>

          <button
            onClick={() => setIsCinematicModalOpen(true)}
            className="px-2.5 py-1 rounded bg-gradient-to-r from-cyan-500/25 to-indigo-500/25 hover:from-cyan-500/35 hover:to-indigo-500/35 border border-cyan-400/40 text-cyan-200 font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-sm"
            title="Open 8K Masterclass Cinematic Video & Voiceover Assets Pipeline"
          >
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">8K Reel</span>
          </button>

          <button
            onClick={resetWarRoom}
            className="p-1.5 rounded border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Simulator"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* ROW 2: MIDDLE SPLIT STAGE (Flexible flex-1 min-h-0, Zero Overlap)    */}
      {/* ==================================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden">
        {/* ------------------------------------------------------------------ */}
        {/* LEFT COLUMN: Founder Live Camera (Top) + 4-VC Grid (Bottom) (4 Cols)*/}
        {/* ------------------------------------------------------------------ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-2.5 min-h-0 h-full overflow-hidden">
          {/* Top Half: Founder Live HD Camera HUD (~44% height) */}
          <div className="flex-1 min-h-[160px] max-h-[46%] rounded-xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-lg relative flex flex-col">
            <FounderCameraHUD
              wpm={telemetry.wpm}
              wpmZone={telemetry.wpmZone}
              presenceScore={presenceScore}
              visualComment={visualComment}
              onFrameCaptureReady={(fn) => {
                frameCaptureFnRef.current = fn;
              }}
              className="w-full h-full"
            />
          </div>

          {/* Bottom Half: 2x2 Zoom-Style VC Boardroom Grid (~54% height) */}
          <div className="flex-1 min-h-[180px] max-h-[54%] rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 p-2 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-b border-white/5 pb-1">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>Executive VC Panel</span>
              </span>
              <span className="text-cyan-400 font-bold">{activePersona.name}</span>
            </div>

            <div className="flex-1 min-h-0 pt-1.5">
              <VCPanelGrid
                activePersonaId={activePersonaId}
                isVCResponding={simulatorState === "VC_SPEAKING_QUESTION"}
                activeFacialState={activeFacialState}
                interruptedPersonaId={null}
                onSelectPersona={(id) => {
                  const qa = getDynamicQA(currentQAIndex, id as PersonaId);
                  activateQuestion(qa, true);
                }}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT COLUMN: Active Question + Teleprompter + Transcript (8 Cols)  */}
        {/* ------------------------------------------------------------------ */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-2.5 min-h-0 h-full overflow-hidden">
          {/* Card 1: ACTIVE VC QUESTION (High-Contrast Header Card) */}
          <div className="rounded-xl border border-slate-800/90 bg-slate-900/90 p-3 shadow-md flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded font-bold uppercase text-[10px] tracking-wide"
                  style={{
                    backgroundColor: `${activePersona.themeColor}20`,
                    color: activePersona.themeColor,
                    borderColor: `${activePersona.themeColor}50`,
                    borderWidth: 1,
                  }}
                >
                  {activePersona.name}
                </span>
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  {activePersona.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-bold">
                  {currentQA.verticalTitle.split(" ")[0]}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-bold">
                  {currentQA.angleTitle}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
              &ldquo;{currentQA.question}&rdquo;
            </p>
          </div>

          {/* Card 2: WINNING MODEL ANSWER TELEPROMPTER (READ ALOUD) */}
          <div className="flex-1 min-h-[170px] max-h-[50%] rounded-xl border-2 border-emerald-500/45 bg-emerald-950/25 p-3 sm:p-4 shadow-[0_0_25px_rgba(16,185,129,0.12)] flex flex-col justify-between backdrop-blur-sm overflow-hidden">
            {/* Header: Title + Target Metrics + Copy */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-emerald-500/20 pb-1.5 shrink-0">
              <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                <span>Winning Model Answer Teleprompter (Read Into Mic)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden md:inline text-[10px] text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Target: {currentQA.targetMetrics.arrPerTail} | {currentQA.targetMetrics.grossMargin}
                </span>
                <button
                  onClick={copyScriptToClipboard}
                  className="text-[10px] text-emerald-300 hover:text-white px-2 py-0.5 rounded bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/30 flex items-center gap-1 transition-all"
                >
                  {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Large Typography Model Answer Script */}
            <div className="flex-1 min-h-0 overflow-y-auto my-2 pr-1 font-medium text-emerald-100 text-sm sm:text-base md:text-[17px] leading-relaxed">
              &ldquo;{currentQA.modelAnswerScript}&rdquo;
            </div>

            {/* Mandatory Talking Point Chips */}
            <div className="flex flex-wrap items-center gap-1.5 shrink-0 pt-1 border-t border-emerald-500/15">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-500 mr-1">
                Mandatory Anchors:
              </span>
              {currentQA.keyPillarsToHit.map((pillar, idx) => (
                <span
                  key={idx}
                  className="text-[10.5px] font-mono px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-500/40 text-emerald-200 font-semibold"
                >
                  {pillar}
                </span>
              ))}
            </div>
          </div>

          {/* Card 3: LIVE SPOKEN TRANSCRIPT & INSTANT AUDIT FINDING */}
          <div className="flex-1 min-h-[130px] max-h-[38%] rounded-xl border border-slate-800 bg-slate-900/85 p-3 shadow-md flex flex-col justify-between overflow-hidden">
            {/* Header: Speech Status + Accuracy Score */}
            <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Real-Time Utterance &amp; Fact Audit:</span>
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  simulatorState === "LISTENING_TO_FOUNDER"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                    : "bg-slate-800 text-slate-400"
                }`}>
                  {simulatorState === "LISTENING_TO_FOUNDER" ? "LISTENING LIVE" : "STANDBY"}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    auditVerdict === "CRITICAL_BOUNDARY_ERROR"
                      ? "bg-red-500/20 text-red-300 border border-red-500/40"
                      : auditVerdict === "INSTITUTIONAL_GRADE"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {auditVerdict.replace(/_/g, " ")} ({accuracyScore}%)
                </span>
              </div>
            </div>

            {/* Scrollable Highlighted Transcript */}
            <div className="flex-1 min-h-0 overflow-y-auto my-1.5 pr-1">
              {renderHighlightedTranscript(currentUtterance || transcript)}
            </div>

            {/* Spoken VC Feedback & Audio Waveform */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 text-[11px] font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                <Volume1 className="w-3 h-3 text-cyan-400 shrink-0" />
                <span className="text-slate-300 truncate italic">
                  &ldquo;{spokenVCFeedback}&rdquo;
                </span>
              </div>

              <div className="h-5 w-28 rounded bg-black/50 border border-white/5 overflow-hidden">
                <WaveformCanvas
                  analyserNode={analyserNode}
                  speakerState={speakerState}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* ROW 3: BOTTOM CONTROL DECK (Fixed Height ~60px, Zero Overlap)        */}
      {/* ==================================================================== */}
      <footer className="h-14 min-h-[56px] max-h-[60px] rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-2 shadow-2xl z-20">
        {/* Left: Primary Auto-Interview Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => activateQuestion(currentQA, true)}
            disabled={simulatorState === "AUDITING_ANSWER"}
            className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50"
          >
            <Mic className="w-4 h-4 text-white" />
            <span>Start / Next VC Question (VC Speaks First)</span>
          </button>

          {/* Mic Toggle: Speak Now / Done Speaking */}
          <button
            onClick={toggleMic}
            disabled={simulatorState === "AUDITING_ANSWER"}
            className={`px-3.5 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 ${
              isMicActive
                ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.45)] animate-pulse"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            } disabled:opacity-50`}
          >
            {isMicActive ? <CheckCircle2 className="w-4 h-4" /> : <Radio className="w-4 h-4 text-red-400" />}
            <span>{isMicActive ? "Done Speaking — Audit My Answer" : "Speak My Answer Now"}</span>
          </button>
        </div>

        {/* Right: Practice Assists & Dossier Export */}
        <div className="flex items-center gap-2">
          {/* Export 1,000+ Q&A Dossier Button with Popover */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="px-3 py-2 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
              title="Export 1,000+ Due Diligence Q&A Matrix as PDF or Markdown"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Export 1,000+ Q&amp;A (.pdf / .md)</span>
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-72 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl p-2 shadow-2xl z-50 flex flex-col gap-1 text-xs font-mono">
                <div className="px-2 py-1 text-[10px] text-slate-400 uppercase font-bold border-b border-white/5 flex items-center justify-between">
                  <span>Export Due Diligence Dossier</span>
                  <span className="text-[9px] text-amber-400">1,000+ Q&amp;As</span>
                </div>
                <button
                  onClick={openPdfPrintDossier}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <Printer className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-emerald-300">Printable PDF Dossier (.pdf)</span>
                    <span className="text-[10px] text-slate-400 block">Print or save as formatted PDF document</span>
                  </div>
                </button>
                <button
                  onClick={downloadMarkdownDossier}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 text-slate-200 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold block text-cyan-300">Markdown Dossier (.md)</span>
                    <span className="text-[10px] text-slate-400 block">Download complete raw markdown file</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={playModelAnswerAutoDemo}
            disabled={simulatorState === "AUDITING_ANSWER" || simulatorState === "FOUNDER_AUTO_DEMO"}
            className="px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Listen to founder deliver the model answer"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
            <span className="hidden sm:inline">Hear Ideal Model Answer Read Aloud</span>
          </button>

          <button
            onClick={generateUnscriptedQuestion}
            disabled={isGeneratingQA || simulatorState === "AUDITING_ANSWER"}
            className="px-3 py-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 font-mono font-semibold text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Synthesize brand-new unscripted question from 1,000+ matrix via Nebius"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-400 ${isGeneratingQA ? "animate-spin" : ""}`} />
            <span>AI Generate Unscripted Question</span>
          </button>
        </div>
      </footer>

      {/* Due Diligence Institutional Scorecard Modal */}
      <ScorecardModal
        report={generateDueDiligenceReport(transcript || "AeroOps AI Overview", telemetry, interruptionHistory)}
        isOpen={isScorecardOpen}
        onClose={() => setIsScorecardOpen(false)}
      />

      {/* 8K Masterclass Cinematic Video & Voiceover Assets Pipeline Modal */}
      <CinematicTheaterModal
        isOpen={isCinematicModalOpen}
        onClose={() => setIsCinematicModalOpen(false)}
      />
    </div>
  );
}
