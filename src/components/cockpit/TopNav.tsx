"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, Compass, Activity, FileText, RefreshCw, Layers } from "lucide-react";

interface TopNavProps {
  currentMode: "LIVE" | "SIM" | "HYBRID";
  onModeChange: (mode: "LIVE" | "SIM" | "HYBRID") => void;
  activeScenarioKey: "scenario1" | "scenario2" | "scenario3" | "custom";
  onSelectScenario: (key: "scenario1" | "scenario2" | "scenario3") => void;
  onOpenDispatchSheet: () => void;
  isLiveLoading?: boolean;
  onRefreshLive?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentMode,
  onModeChange,
  activeScenarioKey,
  onSelectScenario,
  onOpenDispatchSheet,
  isLiveLoading = false,
  onRefreshLive,
}) => {
  const [utcTime, setUtcTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(0, 19).replace("T", " ") + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-obsidian-950/80 backdrop-blur-xl px-4 lg:px-8 py-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Glass Cockpit Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Plane className="w-5 h-5 text-cyan-400 transform -rotate-45" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-slate-100 font-mono">
                AERTOPS<span className="text-cyan-400 font-sans">.AI</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-semibold tracking-wider">
                DYSON SKY V2.5
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              Autonomous Flight Readiness & Operational Risk Engine
            </p>
          </div>
        </div>

        {/* Center: Live UTC Master Clock & Preset Scenarios */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {/* UTC Clock */}
          <div className="px-3 py-1 rounded bg-slate-900/90 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {utcTime || "0000-00-00 00:00:00 UTC"}
          </div>

          {/* Preset Scenario Selectors */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/90 border border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-400 px-1.5 hidden sm:inline">
              Presets:
            </span>
            <button
              onClick={() => onSelectScenario("scenario1")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeScenarioKey === "scenario1"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  : "text-slate-400 hover:text-emerald-300 hover:bg-slate-800"
              }`}
            >
              1. Nominal [GO]
            </button>
            <button
              onClick={() => onSelectScenario("scenario2")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeScenarioKey === "scenario2"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "text-slate-400 hover:text-amber-300 hover:bg-slate-800"
              }`}
            >
              2. Edge [AMBER]
            </button>
            <button
              onClick={() => onSelectScenario("scenario3")}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all ${
                activeScenarioKey === "scenario3"
                  ? "bg-red-500/20 text-red-300 border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                  : "text-slate-400 hover:text-red-300 hover:bg-slate-800"
              }`}
            >
              3. Severe [NO-GO]
            </button>
          </div>
        </div>

        {/* Right: Mode Switcher, Fleet Navigation & PDF Release */}
        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
            {(["SIM", "LIVE", "HYBRID"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-colors ${
                  currentMode === mode
                    ? "bg-cyan-500 text-obsidian-950 shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {currentMode === "LIVE" && onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isLiveLoading}
              title="Refresh NOAA METAR Ingestion"
              className="p-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950/40 transition"
            >
              <RefreshCw className={`w-4 h-4 ${isLiveLoading ? "animate-spin text-cyan-300" : ""}`} />
            </button>
          )}

          {/* Fleet Link */}
          <Link
            href="/fleet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-mono text-slate-300 hover:text-cyan-300 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fleet</span>
          </Link>

          {/* Dispatch Release Button */}
          <button
            onClick={onOpenDispatchSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="font-semibold">Flight Release</span>
          </button>
        </div>
      </div>
    </header>
  );
};