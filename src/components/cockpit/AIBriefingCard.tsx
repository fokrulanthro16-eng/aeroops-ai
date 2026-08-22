"use client";

import React, { useState } from "react";
import { AIBriefingPayload, FlightMission } from "@/types/aviation";
import { Sparkles, Volume2, VolumeX, ShieldAlert, CheckCircle, RefreshCw, Radio } from "lucide-react";
import { pilotVoice } from "@/lib/tts";

interface AIBriefingCardProps {
  mission: FlightMission;
  onRegenerateBriefing?: () => void;
  isLoading?: boolean;
}

export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({
  mission,
  onRegenerateBriefing,
  isLoading = false,
}) => {
  const briefing = mission.aiBriefing;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleToggleVoice = () => {
    if (isPlayingAudio) {
      pilotVoice.stop();
      setIsPlayingAudio(false);
    } else if (briefing?.voice_briefing_transcript) {
      pilotVoice.speak(
        briefing.voice_briefing_transcript,
        () => setIsPlayingAudio(true),
        () => setIsPlayingAudio(false)
      );
    }
  };

  if (!briefing) {
    return (
      <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-6 flex flex-col items-center justify-center text-center space-y-3">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
        <p className="text-sm font-mono text-slate-300">
          Generating Google Gemini 2.5 Flash explainable flight briefing...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-obsidian-900/90 border border-cyan-500/30 p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
              Explainable AI Pilot Briefing
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-normal">
                {briefing.model_used || "Gemini 2.5 Flash"}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Ground truth evidence synthesized strictly from deterministic safety physics
            </p>
          </div>
        </div>

        {/* Audio Dispatch Button & Regenerate */}
        <div className="flex items-center gap-2">
          {onRegenerateBriefing && (
            <button
              onClick={onRegenerateBriefing}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-slate-700 transition"
              title="Refresh Briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-300" : ""}`} />
            </button>
          )}

          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition shadow-sm ${
              isPlayingAudio
                ? "bg-cyan-500 text-obsidian-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse"
                : "bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/50"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4" />
                <span>Stop Radio</span>
                <span className="flex gap-0.5 items-center">
                  <span className="w-1 h-3 bg-obsidian-950 animate-[pulse_0.4s_infinite]" />
                  <span className="w-1 h-4 bg-obsidian-950 animate-[pulse_0.6s_infinite]" />
                  <span className="w-1 h-2 bg-obsidian-950 animate-[pulse_0.5s_infinite]" />
                </span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>Play Voice Dispatch</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Executive Summary Box */}
      <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-sm text-slate-200 font-sans leading-relaxed mb-4">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
          Executive Operational Summary:
        </span>
        {briefing.executive_summary}
      </div>

      {/* 2-Column Grid: Primary Drivers & Mitigations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Primary Drivers */}
        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
            Primary Quantitative Drivers
          </span>
          <ul className="space-y-1.5 text-slate-300">
            {briefing.primary_drivers.map((driver, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critical Hazards & Mitigations */}
        <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800/80 space-y-2">
          <span className="text-[11px] uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Mitigation Protocol & Hazards
          </span>
          <ul className="space-y-1.5 text-slate-300">
            {briefing.mitigation_steps.map((mit, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{mit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Voice Transcript Preview */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-start gap-2 text-[11px] font-mono text-slate-400">
        <Radio className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
        <p className="italic">
          <span className="text-slate-300 font-semibold not-italic">Voice Transmission: </span>
          &ldquo;{briefing.voice_briefing_transcript}&rdquo;
        </p>
      </div>
    </div>
  );
};