"use client";

import React from "react";
import { InFlightTelemetry } from "@/types/aviation";
import { RadialGauge } from "../ui/RadialGauge";
import {
  Thermometer,
  Zap,
  Navigation,
  Wind,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  Flame,
} from "lucide-react";

interface LiveTelemetryHUDProps {
  telemetry: InFlightTelemetry;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onResetFlight: () => void;
  onInjectWindShear: () => void;
  onInjectBatteryDegrade: () => void;
  hasInjectedShear: boolean;
  hasInjectedDegrade: boolean;
}

export const LiveTelemetryHUD: React.FC<LiveTelemetryHUDProps> = ({
  telemetry,
  isPlaying,
  onTogglePlayback,
  onResetFlight,
  onInjectWindShear,
  onInjectBatteryDegrade,
  hasInjectedShear,
  hasInjectedDegrade,
}) => {
  const isDiverting = telemetry.flightPhase === "DIVERTING";

  return (
    <div className="rounded-xl bg-obsidian-900/95 border border-emerald-500/30 p-4 sm:p-5 shadow-[0_0_25px_rgba(16,185,129,0.15)] space-y-4">
      {/* HUD Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                1Hz In-Flight Telemetry Stream
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono font-semibold animate-pulse">
                LIVE AVIONICS FEED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Phase: <span className="text-cyan-300 font-bold">{telemetry.flightPhase}</span> • Alt:{" "}
              <span className="text-slate-200 font-bold">{telemetry.currentAltitudeFt} ft</span> • Ground Speed:{" "}
              <span className="text-cyan-300 font-bold">{telemetry.currentGroundSpeedKts} kts</span>
            </p>
          </div>
        </div>

        {/* Flight Playback & Anomaly Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onTogglePlayback}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
              isPlaying
                ? "bg-amber-500 text-obsidian-950 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                : "bg-emerald-500 text-obsidian-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause Stream" : "Stream 1Hz"}</span>
          </button>

          <button
            onClick={onResetFlight}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition"
            title="Reset Flight Playback"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Anomaly Injectors */}
          <button
            onClick={onInjectWindShear}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
              hasInjectedShear
                ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-red-400 hover:text-red-300"
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-red-400" />
            <span>{hasInjectedShear ? "Shear Injected (32kt)" : "Inject Wind Shear"}</span>
          </button>

          <button
            onClick={onInjectBatteryDegrade}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
              hasInjectedDegrade
                ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                : "bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-amber-300"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{hasInjectedDegrade ? "Battery Anomaly (-8%)" : "Inject SOC Anomaly"}</span>
          </button>
        </div>
      </div>

      {/* Autonomous In-Flight Diversion Banner */}
      {isDiverting && (
        <div className="p-3.5 rounded-lg bg-amber-950/50 border border-amber-500/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <span className="text-xs font-mono uppercase font-bold text-amber-300 block">
                AUTONOMOUS IN-FLIGHT DIVERSION INITIATED: {telemetry.recommendedAction}
              </span>
              <p className="text-xs text-slate-200 font-mono mt-0.5">
                {telemetry.diversionReason}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Target Alternate</span>
            <span className="text-sm font-black font-mono text-cyan-300">
              {telemetry.diversionTargetIcao} ({telemetry.distanceToAlternateNm} NM)
            </span>
          </div>
        </div>
      )}

      {/* 4 Radial Gauges: Live Cell Temp, Instant Discharge, Live SOC vs Theoretical, Alternate Distance */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-1">
        {/* Cell Temperature */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center">
          <RadialGauge
            value={telemetry.batteryCellTempC}
            max={70}
            label="Cell Temp"
            unit="°C"
            color={telemetry.batteryCellTempC > 48 ? "red" : telemetry.batteryCellTempC > 38 ? "amber" : "cyan"}
            size={100}
            subtext="Limit: 55°C"
          />
        </div>

        {/* Instantaneous Power */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center">
          <RadialGauge
            value={telemetry.instantaneousPowerKw}
            max={300}
            label="Discharge"
            unit="kW"
            color="emerald"
            size={100}
            subtext="Hover/Cruise Draw"
          />
        </div>

        {/* Live SOC */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center">
          <RadialGauge
            value={telemetry.liveBatterySoc}
            max={100}
            label="Live SOC"
            unit="%"
            color={telemetry.liveBatterySoc < 25 ? "red" : telemetry.liveBatterySoc < 40 ? "amber" : "emerald"}
            size={100}
            subtext={`Target: ${telemetry.theoreticalSoc}%`}
          />
        </div>

        {/* Distance Flown / Alternate Distance */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center space-y-1.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Flight Distance</span>
          <div className="text-xl font-bold text-cyan-300">
            {telemetry.distanceFlownKm} <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-1 w-full">
            Remaining: <span className="text-slate-200 font-bold">{telemetry.distanceRemainingKm} km</span>
          </div>
          <div className="text-[10px] text-amber-400">
            PONR Status: {telemetry.isPastPonr ? "PAST PONR (COMMITTED)" : "BEFORE PONR (RETURN CLEAR)"}
          </div>
        </div>
      </div>
    </div>
  );
};