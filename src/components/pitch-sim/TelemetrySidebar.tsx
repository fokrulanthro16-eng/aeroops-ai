"use client";

import React from "react";
import {
  Activity,
  Gauge,
  Brain,
  MessageSquare,
  FileCheck,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { ScoreIndices } from "@/lib/pitch-sim/scoring-rubric";
import { SpeechStreamTelemetry, InterruptionEvent } from "@/lib/pitch-sim/interruption-engine";
import { VCPersona } from "@/lib/pitch-sim/personas";

interface TelemetrySidebarProps {
  scores: ScoreIndices;
  telemetry: SpeechStreamTelemetry;
  activePersona: VCPersona;
  innerMonologue: string;
  interruptionHistory: InterruptionEvent[];
  onOpenScorecard: () => void;
}

export const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({
  scores,
  telemetry,
  activePersona,
  innerMonologue,
  interruptionHistory,
  onOpenScorecard,
}) => {
  const getScoreColor = (val: number) => {
    if (val >= 75) return "text-emerald-400 border-emerald-500/40 bg-emerald-950/20";
    if (val >= 55) return "text-amber-400 border-amber-500/40 bg-amber-950/20";
    return "text-red-400 border-red-500/40 bg-red-950/20";
  };

  const getScoreBarBg = (val: number) => {
    if (val >= 75) return "bg-emerald-500";
    if (val >= 55) return "bg-amber-400";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 4 Quantitative Avionics Indices */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Avionics Telemetry Indices
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            COMPOSITE: {scores.composite}/100
          </span>
        </div>

        {/* The 4 Indices Grid */}
        <div className="grid grid-cols-2 gap-2">
          {/* 1. TDI */}
          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${getScoreColor(scores.tdi)}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-300">
                TDI (Technical)
              </span>
              <span className="text-sm font-mono font-extrabold">{scores.tdi}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getScoreBarBg(scores.tdi)}`}
                style={{ width: `${scores.tdi}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              QNX 8.0 • WCET • MAVLink
            </span>
          </div>

          {/* 2. RMR */}
          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${getScoreColor(scores.rmr)}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-300">
                RMR (Regulatory)
              </span>
              <span className="text-sm font-mono font-extrabold">{scores.rmr}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getScoreBarBg(scores.rmr)}`}
                style={{ width: `${scores.rmr}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              DO-178C • DAL-B • SHA-256
            </span>
          </div>

          {/* 3. ICV */}
          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${getScoreColor(scores.icv)}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-300">
                ICV (Commercial)
              </span>
              <span className="text-sm font-mono font-extrabold">{scores.icv}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getScoreBarBg(scores.icv)}`}
                style={{ width: `${scores.icv}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              ARR/Tail • BVLOS • Margin
            </span>
          </div>

          {/* 4. VCP */}
          <div className={`p-2.5 rounded-lg border flex flex-col gap-1 ${getScoreColor(scores.vcp)}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-slate-300">
                VCP (Conviction)
              </span>
              <span className="text-sm font-mono font-extrabold">{scores.vcp}</span>
            </div>
            <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getScoreBarBg(scores.vcp)}`}
                style={{ width: `${scores.vcp}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 font-mono truncate">
              WPM • Fillers • Pauses
            </span>
          </div>
        </div>
      </div>

      {/* Pacing & Acoustic Telemetry */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Acoustic & Pacing Telemetry
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">TARGET: 135-165 WPM</span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          {/* WPM */}
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">PACING</div>
            <div
              className={`text-base font-bold ${
                telemetry.wpmZone === "OPTIMAL"
                  ? "text-emerald-400"
                  : telemetry.wpmZone === "SLOW"
                  ? "text-sky-400"
                  : "text-amber-400"
              }`}
            >
              {telemetry.wpm}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">{telemetry.wpmZone}</div>
          </div>

          {/* Fillers */}
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">CRUTCH FILLERS</div>
            <div
              className={`text-base font-bold ${
                telemetry.totalFillerCount === 0
                  ? "text-emerald-400"
                  : telemetry.totalFillerCount <= 3
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {telemetry.totalFillerCount}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">
              {telemetry.totalFillerCount === 0 ? "PRISTINE" : "DETECTED"}
            </div>
          </div>

          {/* Interrupts */}
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">INTERRUPTS</div>
            <div
              className={`text-base font-bold ${
                interruptionHistory.length === 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {interruptionHistory.length}
            </div>
            <div className="text-[9px] text-slate-500 uppercase">
              {interruptionHistory.length === 0 ? "ZERO" : "LOGGED"}
            </div>
          </div>
        </div>

        {/* Filler Word Badges */}
        {telemetry.fillerWordsFound.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono self-center mr-1">Crutches:</span>
            {telemetry.fillerWordsFound.map((item, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-500/30"
              >
                &ldquo;{item.word}&rdquo; ×{item.count}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* VC Real-Time Inner Monologue Feed */}
      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              VC Inner Monologue Feed
            </span>
          </div>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded border"
            style={{
              borderColor: `${activePersona.themeColor}55`,
              color: activePersona.themeColor,
            }}
          >
            {activePersona.shortName}
          </span>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-purple-500/20 text-xs font-mono text-purple-200/90 leading-relaxed italic relative">
          <MessageSquare className="w-3.5 h-3.5 text-purple-400/50 absolute top-2 right-2" />
          &ldquo;
          {innerMonologue ||
            "Listening carefully to founder architecture claims. Waiting for quantitative unit economics and DO-178C DAL boundary verification."}
          &rdquo;
        </div>
      </div>

      {/* Trigger Full Due Diligence Audit Button */}
      <button
        onClick={onOpenScorecard}
        className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2"
      >
        <FileCheck className="w-4 h-4" />
        <span>Generate Due Diligence Audit</span>
      </button>
    </div>
  );
};
