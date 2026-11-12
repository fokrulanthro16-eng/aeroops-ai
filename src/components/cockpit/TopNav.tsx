"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, Activity, FileText, Layers, Radio, RefreshCw, UserCheck, Video } from "lucide-react";
import { FlightViewMode } from "./FlightModeToggle";
import { CinematicTheaterModal } from "@/components/pitch-sim/CinematicTheaterModal";
import { CockpitWalkthroughModal } from "./CockpitWalkthroughModal";

interface TopNavProps {
  currentMode: "LIVE" | "SIM" | "HYBRID";
  onModeChange: (mode: "LIVE" | "SIM" | "HYBRID") => void;
  activeScenarioKey: "scenario1" | "scenario2" | "scenario3" | "custom";
  onSelectScenario: (key: "scenario1" | "scenario2" | "scenario3") => void;
  onOpenDispatchSheet: () => void;
  isLiveLoading?: boolean;
  onRefreshLive?: () => void;
  flightViewMode?: FlightViewMode;
  onFlightViewModeChange?: (mode: FlightViewMode) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentMode,
  onModeChange,
  activeScenarioKey,
  onSelectScenario,
  onOpenDispatchSheet,
  isLiveLoading = false,
  onRefreshLive,
  flightViewMode = "PREFLIGHT",
  onFlightViewModeChange,
}) => {
  const [utcTime, setUtcTime] = useState<string>("");
  const [isCinematicOpen, setIsCinematicOpen] = useState(false);
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full max-w-[1840px] mx-auto px-4 sm:px-6 pt-4 pb-2">
      <div className="glass-pill rounded-full px-5 sm:px-7 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Minimalist Brand & Status Chip */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            <Plane className="w-4 h-4 text-cyan-300 transform -rotate-45" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-sans">
                AeroOps<span className="text-cyan-400 font-light ml-0.5">AI</span>
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 tracking-wide font-mono">
                v3.0 ENTERPRISE • QNX 8.0 RTOS
              </span>
            </div>
          </div>
        </div>

        {/* Center: Flight Mode & Scenario Preset Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {/* Pre-Flight vs Live Flight Toggle */}
          {onFlightViewModeChange && (
            <div className="flex items-center p-1 rounded-full bg-slate-950/60 border border-white/5 shadow-inner">
              <button
                onClick={() => onFlightViewModeChange("PREFLIGHT")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  flightViewMode === "PREFLIGHT"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Pre-Flight Release
              </button>
              <button
                onClick={() => onFlightViewModeChange("INFLIGHT_HUD")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  flightViewMode === "INFLIGHT_HUD"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Radio className="w-3 h-3 text-emerald-400" />
                Live Flight 1Hz
              </button>
            </div>
          )}

          {/* Scenario Preset Switcher */}
          <div className="flex items-center p-1 rounded-full bg-slate-950/60 border border-white/5">
            <button
              onClick={() => onSelectScenario("scenario1")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeScenarioKey === "scenario1"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Nominal [GO]
            </button>
            <button
              onClick={() => onSelectScenario("scenario2")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeScenarioKey === "scenario2"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Edge [AMBER]
            </button>
            <button
              onClick={() => onSelectScenario("scenario3")}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                activeScenarioKey === "scenario3"
                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Severe [NO-GO]
            </button>
          </div>
        </div>

        {/* Right: Master Clock, Fleet Nav & Printable Release */}
        <div className="flex items-center gap-2.5">
          {/* Mode Pill (LIVE / SIM) */}
          <div className="flex items-center p-0.5 rounded-full bg-slate-950/60 border border-white/5 text-[11px] font-mono">
            {(["SIM", "LIVE"] as const).map((m) => (
              <button
                key={m}
                onClick={() => onModeChange(m)}
                className={`px-2.5 py-1 rounded-full transition ${
                  currentMode === m
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {currentMode === "LIVE" && onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isLiveLoading}
              title="Refresh NOAA METAR"
              className="p-2 rounded-full bg-slate-900/60 border border-white/10 text-cyan-300 hover:bg-cyan-950/40 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLiveLoading ? "animate-spin text-cyan-300" : ""}`} />
            </button>
          )}

          {/* UTC Clock Badge with suppressHydrationWarning */}
          <div
            suppressHydrationWarning={true}
            className="px-3.5 py-1 rounded-full bg-slate-950/60 border border-white/10 text-xs font-mono text-cyan-300 flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span suppressHydrationWarning={true}>
              {mounted && utcTime ? utcTime : "00:00:00 UTC"}
            </span>
          </div>

          {/* Cockpit 4K/HD Video Walkthrough Button */}
          <button
            onClick={() => setIsWalkthroughOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-400/50 text-xs font-medium text-emerald-200 hover:text-white transition shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            title="Play 4K Mission Cockpit Walkthrough Video"
          >
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Walkthrough</span>
          </button>

          {/* Fleet Hub Link */}
          <Link
            href="/fleet"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/60 border border-white/10 hover:border-cyan-400/30 text-xs font-medium text-slate-300 hover:text-cyan-300 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Fleet Hub</span>
          </Link>

          {/* Dispatch Release Document Button */}
          <button
            onClick={onOpenDispatchSheet}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/40 text-xs font-semibold text-cyan-200 transition shadow-[0_0_15px_rgba(56,189,248,0.2)]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Flight Release</span>
          </button>
        </div>
      </div>

      {/* 8K Masterclass Cinematic Video & Voiceover Assets Pipeline Modal */}
      <CinematicTheaterModal
        isOpen={isCinematicOpen}
        onClose={() => setIsCinematicOpen(false)}
      />

      {/* Cockpit 4K Autonomous Walkthrough Modal */}
      <CockpitWalkthroughModal
        isOpen={isWalkthroughOpen}
        onClose={() => setIsWalkthroughOpen(false)}
      />
    </header>
  );
};