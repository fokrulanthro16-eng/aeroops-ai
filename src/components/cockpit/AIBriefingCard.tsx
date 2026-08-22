"use client";

import React, { useState } from "react";
import { AIBriefingPayload, FlightMission } from "@/types/aviation";
import { Sparkles, Volume2, VolumeX, ShieldAlert, CheckCircle, RefreshCw, Radio, Play, Pause } from "lucide-react";
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
      <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3">
        <Sparkles className="w-8 h-8 text-cyan-400 animate-pulse" />
        <p className="text-sm font-sans text-slate-300">
          Synthesizing Google Gemini 2.5 Flash explainable flight briefing...
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden">
      {/* Background Soft Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none bg-cyan-500" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 text-cyan-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                Explainable AI Flight Release & Dispatch Briefing
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold">
                {briefing.model_used || "Google Gemini 2.5 Flash"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Evidence-grounded rationale derived strictly from deterministic physics calculations
            </p>
          </div>
        </div>

        {/* Right Controls: Refresh & Large Audio Play Button */}
        <div className="flex items-center gap-3">
          {onRegenerateBriefing && (
            <button
              onClick={onRegenerateBriefing}
              disabled={isLoading}
              className="p-2.5 rounded-full bg-slate-950/60 border border-white/10 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 transition"
              title="Regenerate Briefing with Gemini"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-cyan-300" : ""}`} />
            </button>
          )}

          {/* Large Luxury Voice Play Button */}
          <button
            onClick={handleToggleVoice}
            className={`flex items-center gap-3 px-5 py-2.5 rounded-full font-sans text-xs font-semibold transition-all shadow-lg ${
              isPlayingAudio
                ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)] animate-pulse"
                : "bg-slate-900/80 hover:bg-slate-800 border border-cyan-400/40 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.15)]"
            }`}
          >
            {isPlayingAudio ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Voice Transmission</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Play ATC Voice Dispatch</span>
              </>
            )}

            {/* Subtle Audio Waveform Visualizer */}
            <span className="flex items-center gap-0.5 h-3 ml-1">
              <span className={`w-0.5 rounded-full bg-current ${isPlayingAudio ? "h-3 animate-[pulse_0.4s_infinite]" : "h-1"}`} />
              <span className={`w-0.5 rounded-full bg-current ${isPlayingAudio ? "h-4 animate-[pulse_0.6s_infinite]" : "h-2"}`} />
              <span className={`w-0.5 rounded-full bg-current ${isPlayingAudio ? "h-2.5 animate-[pulse_0.5s_infinite]" : "h-1.5"}`} />
              <span className={`w-0.5 rounded-full bg-current ${isPlayingAudio ? "h-3.5 animate-[pulse_0.3s_infinite]" : "h-1"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Executive Summary in Editorial Callout Box */}
      <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.06] space-y-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
          Operational Summary & Risk Rationale:
        </span>
        <p className="text-sm font-sans text-slate-200 leading-relaxed font-normal">
          {briefing.executive_summary}
        </p>
      </div>

      {/* 2-Column Split: Primary Drivers & Mitigations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
        {/* Primary Drivers */}
        <div className="p-4 rounded-2xl bg-slate-950/30 border border-white/[0.04] space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Key Telemetry Drivers
          </span>
          <ul className="space-y-2 text-slate-300 font-mono text-[11px]">
            {briefing.primary_drivers.map((driver, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mitigations */}
        <div className="p-4 rounded-2xl bg-slate-950/30 border border-white/[0.04] space-y-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Operational Mitigations
          </span>
          <ul className="space-y-2 text-slate-300 font-mono text-[11px]">
            {briefing.mitigation_steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Radio Transmission Transcript Preview */}
      <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-white/[0.04] flex items-start gap-2.5 text-xs text-slate-400 font-mono">
        <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="italic leading-relaxed">
          <span className="text-slate-200 font-semibold not-italic">ATC Radio Transcript: </span>
          &ldquo;{briefing.voice_briefing_transcript}&rdquo;
        </p>
      </div>
    </div>
  );
};