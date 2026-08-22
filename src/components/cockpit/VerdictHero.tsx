"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, ShieldCheck, Check, X, ShieldAlert } from "lucide-react";
import { FlightMission } from "@/types/aviation";

interface VerdictHeroProps {
  mission: FlightMission;
}

export const VerdictHero: React.FC<VerdictHeroProps> = ({ mission }) => {
  const verdict = mission.risk.verdict;
  const score = mission.risk.compositeScore;
  const hardGates = mission.risk.hardGates;
  const failedGatesCount = mission.risk.failedGatesCount;

  const verdictConfig = {
    GO: {
      glow: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      badge: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
      title: "MISSION AUTHORIZED: GO",
      scoreColor: "text-emerald-400",
      ringColor: "#10B981",
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      subtext: "All deterministic safety gates verified. Atmospheric, aerodynamic, and reserve margins nominal.",
    },
    AMBER: {
      glow: "from-amber-500/20 via-amber-500/5 to-transparent",
      badge: "bg-amber-500/15 text-amber-300 border-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
      title: "SUPERVISORY CAUTION: AMBER",
      scoreColor: "text-amber-400",
      ringColor: "#F59E0B",
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      subtext: "Elevated risk vectors detected. Review crosswinds, thermal derating, and alternate divert filing.",
    },
    NO_GO: {
      glow: "from-rose-500/25 via-rose-500/5 to-transparent",
      badge: "bg-rose-500/15 text-rose-300 border-rose-400/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]",
      title: "FLIGHT RELEASE BARRED: NO-GO",
      scoreColor: "text-rose-400",
      ringColor: "#F43F5E",
      icon: <XCircle className="w-6 h-6 text-rose-400" />,
      subtext: "Fatal Safety Gate violation detected. Flight authorization revoked by deterministic rules engine.",
    },
  }[verdict];

  // Circular SVG score progress ring
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  return (
    <div className="relative glass-panel rounded-3xl p-6 sm:p-8 overflow-hidden">
      {/* Soft Ambient Radial Glow */}
      <div
        className={`absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none bg-gradient-to-br ${verdictConfig.glow}`}
      />

      <div className="relative z-10 space-y-6">
        {/* Top Header: Callsign & Status Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              {verdictConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white tracking-wide">
                  {mission.callsign}
                </span>
                <span className="text-xs text-slate-400 font-mono">• {mission.aircraft.model}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
                <span>{mission.origin.icao}</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                <span>{mission.destination.icao}</span>
                <span className="text-slate-500">|</span>
                <span>{mission.routeDistanceKm} km ({Math.round(mission.routeDistanceKm * 0.539957)} NM)</span>
              </div>
            </div>
          </div>

          {/* Large Luxury Verdict Pill */}
          <div className={`px-5 py-2 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${verdictConfig.badge}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {verdictConfig.title}
          </div>
        </div>

        {/* Center: Risk Ring Gauge & Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Circular Risk Index Gauge */}
          <div className="md:col-span-4 flex items-center justify-center p-4 rounded-2xl bg-slate-950/40 border border-white/[0.05]">
            <div className="relative flex items-center justify-center">
              <svg width="100" height="100" className="transform -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={verdictConfig.ringColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className={`text-2xl font-black font-mono tracking-tight ${verdictConfig.scoreColor}`}>
                  {score}
                </span>
                <span className="text-[9px] uppercase font-mono text-slate-400 tracking-wider">
                  Risk Index
                </span>
              </div>
            </div>

            <div className="ml-4 space-y-0.5 font-sans">
              <span className="text-xs font-semibold text-slate-200 block">
                {score < 30 ? "Nominal Index" : score < 60 ? "Advisory Range" : "Prohibitive Index"}
              </span>
              <p className="text-[11px] text-slate-400 font-mono">
                {failedGatesCount === 0 ? "5 / 5 Gates Clear" : `${failedGatesCount} Gate Violations`}
              </p>
            </div>
          </div>

          {/* Subtext description */}
          <div className="md:col-span-8 p-4 rounded-2xl bg-slate-950/30 border border-white/[0.04] text-xs text-slate-300 leading-relaxed font-sans">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block mb-1">
              Deterministic Safety Assessment:
            </span>
            {verdictConfig.subtext}
          </div>
        </div>

        {/* Bottom Checklist: 5 Deterministic Safety Gates */}
        <div className="border-t border-white/[0.06] pt-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-3">
            Deterministic Safety Interlocks Checklist:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {hardGates.map((gate) => (
              <div
                key={gate.gateId}
                className={`p-2.5 rounded-2xl border text-[11px] font-mono transition-all flex items-start gap-2 ${
                  gate.passed
                    ? "bg-slate-950/40 border-white/[0.06] text-slate-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-4 h-4 rounded-full mt-0.5 shrink-0 ${
                    gate.passed
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                  }`}
                >
                  {gate.passed ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                </span>

                <div className="min-w-0">
                  <div className="font-semibold text-slate-200 truncate">{gate.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {gate.telemetryValue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};