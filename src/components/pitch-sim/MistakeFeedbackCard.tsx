"use client";

import React from "react";
import {
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { MistakeAuditFeedback } from "@/lib/pitch-sim/personas";

interface MistakeFeedbackCardProps {
  feedback: MistakeAuditFeedback | null;
  className?: string;
  onApplyWinningScript?: (script: string) => void;
}

export const MistakeFeedbackCard: React.FC<MistakeFeedbackCardProps> = ({
  feedback,
  className = "",
  onApplyWinningScript,
}) => {
  if (!feedback) return null;

  const isCritical = feedback.verdict === "CRITICAL_MISTAKE";
  const isPartial = feedback.verdict === "PARTIAL_OR_VAGUE";

  return (
    <div
      className={`rounded-xl border p-2.5 sm:p-3 backdrop-blur-md transition-all shadow-lg flex flex-col gap-2 ${
        isCritical
          ? "border-red-500/80 bg-red-950/40 shadow-[0_0_20px_rgba(239,68,68,0.25)]"
          : isPartial
          ? "border-amber-500/70 bg-amber-950/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          : "border-emerald-500/70 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
      } ${className}`}
    >
      {/* Top Header: Verdict Pill */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
        <div className="flex items-center gap-2">
          {isCritical ? (
            <div className="p-1 rounded bg-red-500/20 text-red-400">
              <AlertOctagon className="w-3.5 h-3.5" />
            </div>
          ) : isPartial ? (
            <div className="p-1 rounded bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1 rounded bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex items-center gap-2 font-mono">
            <span
              className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded tracking-wide uppercase ${
                isCritical
                  ? "bg-red-500/30 text-red-200 border border-red-500/50"
                  : isPartial
                  ? "bg-amber-500/30 text-amber-200 border border-amber-500/50"
                  : "bg-emerald-500/30 text-emerald-200 border border-emerald-500/50"
              }`}
            >
              {isCritical
                ? "CRITICAL MISTAKE CAUGHT"
                : isPartial
                ? "PARTIAL OR VAGUE ANSWER"
                : "STRONG INSTITUTIONAL ANSWER"}
            </span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Sand Hill Road Audit Benchmark
            </span>
          </div>
        </div>

        {onApplyWinningScript && (
          <button
            onClick={() => onApplyWinningScript(feedback.idealAnswerScript)}
            className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 flex items-center gap-1 transition-all"
          >
            <span>Practice Winning Script</span>
            <ArrowRight className="w-3 h-3 text-cyan-300" />
          </button>
        )}
      </div>

      {/* Grid: What You Said vs Mistake Finding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
        {/* Box 1: What You Said */}
        <div className="p-2 rounded-lg bg-black/50 border border-white/5 flex flex-col gap-0.5">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-slate-400" />
            <span>Audited Utterance:</span>
          </span>
          <p className="text-slate-200 italic line-clamp-2 text-[11px] leading-snug">
            &ldquo;{feedback.whatYouSaidQuote || "Founder statement analyzed."}&rdquo;
          </p>
        </div>

        {/* Box 2: Mistake / Audit Finding */}
        <div
          className={`p-2 rounded-lg border flex flex-col gap-0.5 ${
            isCritical
              ? "bg-red-950/50 border-red-500/40 text-red-200"
              : isPartial
              ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
              : "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
          }`}
        >
          <span className="text-[9px] uppercase tracking-wider font-bold flex items-center gap-1 text-slate-300">
            <ShieldAlert className="w-3 h-3 text-amber-400" />
            <span>Audit Assessment:</span>
          </span>
          <p className="line-clamp-2 leading-snug text-[11px]">
            {feedback.mistakeDetected}
          </p>
        </div>
      </div>

      {/* Box 3: Winning Script Teleprompter Hint */}
      <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex flex-col gap-0.5 font-mono text-xs">
        <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
          <Lightbulb className="w-3 h-3 text-emerald-400" />
          <span>Institutional Model Pivot:</span>
        </span>
        <p className="text-emerald-200 leading-snug text-[11px]">
          &ldquo;{feedback.idealAnswerScript}&rdquo;
        </p>
      </div>
    </div>
  );
};
