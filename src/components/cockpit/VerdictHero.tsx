"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";
import { FlightMission } from "@/types/aviation";

interface VerdictHeroProps {
  mission: FlightMission;
}

export const VerdictHero: React.FC<VerdictHeroProps> = ({ mission }) => {
  const verdict = mission.risk.verdict;
  const score = mission.risk.compositeScore;
  const failedGatesCount = mission.risk.failedGatesCount;

  const verdictConfig = {
    GO: {
      bg: "bg-emerald-950/40",
      border: "border-emerald-500/50",
      glow: "shadow-[0_0_30px_rgba(16,185,129,0.25)]",
      titleText: "text-emerald-400",
      title: "MISSION AUTHORIZATION: GO",
      badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      icon: <CheckCircle2 className="w-8 h-8 text-emerald-400" />,
      subtext: "All deterministic safety gates verified. Operational risk index nominal.",
    },
    AMBER: {
      bg: "bg-amber-950/40",
      border: "border-amber-500/50",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.25)]",
      titleText: "text-amber-400",
      title: "SUPERVISORY CAUTION: AMBER",
      badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      icon: <AlertTriangle className="w-8 h-8 text-amber-400 animate-bounce" />,
      subtext: "Elevated risk vectors identified. Pilot/Operator review & mitigations required.",
    },
    NO_GO: {
      bg: "bg-red-950/40",
      border: "border-red-500/60",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.3)]",
      titleText: "text-red-400",
      title: "FLIGHT RELEASE PROHIBITED: NO-GO",
      badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
      icon: <XCircle className="w-8 h-8 text-red-400 animate-pulse" />,
      subtext: "Hard Safety Gate violation detected. Mission aborted by safety rules engine.",
    },
  }[verdict];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-6 transition-all duration-300 ${verdictConfig.bg} ${verdictConfig.border} ${verdictConfig.glow}`}
    >
      {/* Background Decorative Tech Lines */}
      <div className="absolute top-0 right-0 w-96 h-full pointer-events-none opacity-10 bg-cockpit-grid" />
      <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none bg-cyan-500" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Verdict & Status Details */}
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-slate-800 shrink-0">
            {verdictConfig.icon}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${verdictConfig.titleText}`}>
                {verdictConfig.title}
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-mono font-bold uppercase tracking-wider ${verdictConfig.badgeBg}`}>
                {verdict}
              </span>
            </div>

            <p className="text-sm text-slate-300 font-sans font-medium max-w-2xl">
              {verdictConfig.subtext}
            </p>

            {/* Flight Segment Route Indicator */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-mono text-slate-400">
              <span className="text-cyan-300 font-semibold">{mission.callsign}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-200">
                {mission.origin.icao} ({mission.origin.name.split(" ")[0]})
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                {mission.destination.icao} ({mission.destination.name.split(" ")[0]})
              </span>
              <span>•</span>
              <span>{mission.routeDistanceKm} km ({Math.round(mission.routeDistanceKm * 0.539957)} NM)</span>
              <span>•</span>
              <span className="text-slate-300">{mission.aircraft.model}</span>
            </div>
          </div>
        </div>

        {/* Right: Risk Index & Hard Gate Summary Scorecard */}
        <div className="flex items-center gap-4 self-stretch lg:self-auto justify-end border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-3 lg:pt-0 lg:pl-6">
          {/* Risk Score */}
          <div className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-obsidian-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-black font-mono tracking-tight ${
                  score < 30 ? "text-emerald-400" : score < 60 ? "text-amber-400" : "text-red-400"
                }`}
              >
                {score}
              </span>
              <span className="text-xs text-slate-500 font-mono">/100</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {score < 30 ? "Low Risk" : score < 60 ? "Moderate" : "Prohibitive"}
            </span>
          </div>

          {/* Hard Gates Counter */}
          <div className="flex flex-col items-center justify-center px-4 py-2 rounded-lg bg-obsidian-950/70 border border-slate-800">
            <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Hard Gates
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {failedGatesCount === 0 ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />
              )}
              <span
                className={`text-2xl font-black font-mono ${
                  failedGatesCount === 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {5 - failedGatesCount}/5
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {failedGatesCount === 0 ? "All Clear" : `${failedGatesCount} Failed`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};