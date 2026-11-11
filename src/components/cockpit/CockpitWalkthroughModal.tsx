"use client";

import React, { useRef, useState } from "react";
import {
  Video,
  Download,
  X,
  Play,
  CheckCircle2,
  Cpu,
  Compass,
  ShieldCheck,
  Activity,
  Sparkles,
  TrendingUp,
} from "lucide-react";

interface CockpitWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalkthroughStep {
  step: number;
  timecode: string;
  startSec: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  summary: string;
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    step: 1,
    timecode: "00:00 - 00:39",
    startSec: 0,
    title: "Architectural Foundation & QNX RTOS",
    subtitle: "Deterministic DO-178C Level A Safety Airlock // BlackBerry QNX 8.0",
    icon: <Cpu className="w-4 h-4 text-cyan-400" />,
    summary:
      "AeroOps is anchored on a deterministic BlackBerry QNX Neutrino 8.0 RTOS kernel, rejecting cloud latency and probabilistic failure modes.",
  },
  {
    step: 2,
    timecode: "00:39 - 01:16",
    startSec: 39,
    title: "Vector Airspace & Corridor Radar",
    subtitle: "38.5km Urban Corridor // KLAX -> KBUR // PONR 20.5km",
    icon: <Compass className="w-4 h-4 text-amber-400" />,
    summary:
      "Dynamic Point of No Return calculations with autonomous return-to-origin and diversion fail-safes without requiring cloud connectivity.",
  },
  {
    step: 3,
    timecode: "01:16 - 02:00",
    startSec: 76,
    title: "Deterministic Safety Assessment",
    subtitle: "Risk Index 17 // 5/5 Hardware Interlocks Verified Clear",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    summary:
      "Independent sub-millisecond audits of MTOW, energy margins, crosswind limits, and METAR feeds with hard override authority.",
  },
  {
    step: 4,
    timecode: "02:00 - 03:12",
    startSec: 120,
    title: "The Four Telemetry Pillars",
    subtitle: "10Hz MAVLink v2 Ingestion // 4 Domain-Specific Physics Engines",
    icon: <Activity className="w-4 h-4 text-cyan-400" />,
    summary:
      "Real-time evaluation of Atmospheric & Wind, Energy & PONR (77.8% landing reserve), Airspace NOTAMs, and Weight & Balance gross mass.",
  },
  {
    step: 5,
    timecode: "03:12 - 03:48",
    startSec: 192,
    title: "Explainable AI & SHA-256 Blackbox",
    subtitle: "Google Gemini 2.5 Flash Advisory // NTSB Merkle Forensic Ledger",
    icon: <Sparkles className="w-4 h-4 text-indigo-400" />,
    summary:
      "Natural-language pilot briefings above the airlock with immutable microsecond-resolution SHA-256 cryptographic chain recording.",
  },
  {
    step: 6,
    timecode: "03:48 - 04:45",
    startSec: 228,
    title: "Commercial Value & Investment Thesis",
    subtitle: "$1.5T UAM Market // $25,000 / Year ARR Per Tail // 163 Tests Passed",
    icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    summary:
      "High-margin software layer capturing $3.8M+ ARR across 150 aircraft fleet with 163 continuous tests verified and locked on main.",
  },
];

export const CockpitWalkthroughModal: React.FC<CockpitWalkthroughModalProps> = ({
  isOpen,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const handleSeekToStep = (startSec: number, index: number) => {
    setActiveStepIndex(index);
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl my-auto rounded-3xl bg-[#070B14] border border-emerald-500/30 shadow-[0_0_80px_rgba(16,185,129,0.15)] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Video className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-sans">
                  Mission Cockpit 4K Autonomous Walkthrough
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-500/15 border border-emerald-400/40 text-emerald-300">
                  1080p60 RECORDING
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 border border-cyan-400/40 text-cyan-300 hidden md:inline">
                  6-STEP Q-SYNC AUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Headless browser video capture of live dashboard synchronized with formal aerospace voiceover
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/assets/video/aeroops_cockpit_walkthrough.mp4"
              download="aeroops_cockpit_walkthrough.mp4"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-xs font-mono text-emerald-300 transition shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Download Full HD MP4 Walkthrough Video"
            >
              <Download className="w-3.5 h-3.5 text-emerald-300" />
              <span>Download MP4</span>
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display */}
        <div className="relative w-full aspect-[16/9] max-h-[460px] bg-black border-b border-white/[0.08] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
            src="/assets/video/aeroops_cockpit_walkthrough.mp4"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        {/* 6-Step Interactive Navigation Rail */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              Synchronized 6-Step Presentation Timeline
            </h3>
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              DO-178C DAL-A Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {WALKTHROUGH_STEPS.map((s, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={s.step}
                  onClick={() => handleSeekToStep(s.startSec, idx)}
                  className={`p-3.5 rounded-2xl text-left border transition group relative overflow-hidden ${
                    isActive
                      ? "bg-emerald-500/15 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      : "bg-slate-900/50 hover:bg-slate-800/60 border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1.5">
                      {s.icon}
                      STEP 0{s.step}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {s.timecode}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition truncate">
                    {s.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-sans mt-1 line-clamp-2">
                    {s.summary}
                  </p>

                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-mono text-cyan-400">
                    <Play className="w-2.5 h-2.5 fill-cyan-400" />
                    <span>Seek to timestamp</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
