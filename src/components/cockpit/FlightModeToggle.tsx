"use client";

import React from "react";
import { Plane, Compass, Activity, Radio, ShieldCheck } from "lucide-react";

export type FlightViewMode = "PREFLIGHT" | "INFLIGHT_HUD";

interface FlightModeToggleProps {
  viewMode: FlightViewMode;
  onViewModeChange: (mode: FlightViewMode) => void;
  flightPhase?: string;
  isSimulating?: boolean;
}

export const FlightModeToggle: React.FC<FlightModeToggleProps> = ({
  viewMode,
  onViewModeChange,
  flightPhase = "PRE_DEPARTURE",
  isSimulating = false,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 px-3 rounded-xl bg-obsidian-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Avionics Operational Mode:
        </span>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
            flightPhase === "DIVERTING"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
              : flightPhase === "CRUISE" || flightPhase === "CLIMB"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
              : "bg-slate-800 text-slate-300"
          }`}
        >
          {flightPhase.replace("_", " ")}
        </span>
      </div>

      {/* Segmented View Switcher */}
      <div className="flex items-center p-1 rounded-lg bg-obsidian-950 border border-slate-800">
        <button
          onClick={() => onViewModeChange("PREFLIGHT")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
            viewMode === "PREFLIGHT"
              ? "bg-cyan-500 text-obsidian-950 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>[PRE-FLIGHT DISPATCH]</span>
        </button>

        <button
          onClick={() => onViewModeChange("INFLIGHT_HUD")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
            viewMode === "INFLIGHT_HUD"
              ? "bg-emerald-500 text-obsidian-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>[ACTIVE IN-FLIGHT HUD]</span>
          {isSimulating && (
            <span className="w-2 h-2 rounded-full bg-obsidian-950 animate-ping" />
          )}
        </button>
      </div>
    </div>
  );
};