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
  Radio,
  Compass,
  Gauge,
  Cpu,
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
  telemetrySource?: "SIMULATED" | "MAVLINK_V2" | "QNX_POSIX" | "PX4_SITL";
  onSelectTelemetrySource?: (source: "SIMULATED" | "MAVLINK_V2" | "QNX_POSIX" | "PX4_SITL") => void;
  onToggleC2Link?: () => void;
  isC2Severed?: boolean;
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
  telemetrySource = "SIMULATED",
  onSelectTelemetrySource,
  onToggleC2Link,
  isC2Severed = false,
}) => {
  const isDiverting = telemetry.flightPhase === "DIVERTING";
  const linkSevered = isC2Severed || telemetry.c2LinkStatus === "SEVERED";

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6 relative overflow-hidden border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
      {/* HUD Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                Active 1Hz In-Flight Avionics Stream
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-mono font-semibold animate-pulse">
                {telemetrySource === "PX4_SITL" ? "10Hz SITL ACTIVE" : "1Hz TELEMETRY ACTIVE"}
              </span>
            </div>

            {/* Real-Time DO-178C, MAVLink & C2 Architecture Badges */}
            <div className="flex flex-wrap items-center gap-2 my-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/15 border border-indigo-400/30 text-indigo-300 font-mono font-semibold tracking-wide">
                [KERNEL: QNX 8.0 POSIX ACTIVE]
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono font-semibold tracking-wide">
                [TELEMETRY: MAVLINK v2 CONNECTED]
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono font-semibold tracking-wide">
                [AIRLOCK: DETERMINISTIC SAFE]
              </span>
              {linkSevered ? (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-rose-500/20 border border-rose-400/40 text-rose-300 font-mono font-semibold tracking-wide animate-pulse">
                  [LINK: LOST | AIRBORNE FAIL-SAFE ACTIVE]
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono font-semibold tracking-wide">
                  [LINK: ACTIVE | DUAL-RADIO C2 LOCKED]
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Flight Phase: <span className="text-cyan-300 font-bold">{telemetry.flightPhase}</span> • Alt:{" "}
              <span className="text-slate-200 font-bold">{telemetry.currentAltitudeFt} ft</span> • Ground Speed:{" "}
              <span className="text-cyan-300 font-bold">{telemetry.currentGroundSpeedKts} kt</span>
              {telemetry.attitude && (
                <>
                  {" "}• Pitch: <span className="text-slate-200 font-bold">{telemetry.attitude.pitchDeg}°</span> • Roll:{" "}
                  <span className="text-slate-200 font-bold">{telemetry.attitude.rollDeg}°</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Flight Playback & Anomaly Triggers */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onSelectTelemetrySource && (
            <div className="flex items-center p-1 rounded-full bg-slate-950/70 border border-white/10 text-[11px] font-mono mr-1">
              <button
                onClick={() => onSelectTelemetrySource("SIMULATED")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  telemetrySource === "SIMULATED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                SIM
              </button>
              <button
                onClick={() => onSelectTelemetrySource("MAVLINK_V2")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  telemetrySource === "MAVLINK_V2"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold shadow-[0_0_8px_rgba(56,189,248,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                MAVLink v2
              </button>
              <button
                onClick={() => onSelectTelemetrySource("QNX_POSIX")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  telemetrySource === "QNX_POSIX"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                QNX 8.0
              </button>
              <button
                onClick={() => onSelectTelemetrySource("PX4_SITL")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  telemetrySource === "PX4_SITL"
                    ? "bg-purple-500/25 text-purple-300 border border-purple-400/40 font-semibold shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                PX4 SITL LIVE
              </button>
            </div>
          )}
          <button
            onClick={onTogglePlayback}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-sans font-semibold transition-all shadow-md ${
              isPlaying
                ? "bg-amber-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                : "bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pause Stream" : "Stream 1Hz"}</span>
          </button>

          <button
            onClick={onResetFlight}
            className="p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-300 transition"
            title="Reset Flight Timeline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Anomaly Injectors */}
          <button
            onClick={onInjectWindShear}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-sans font-medium transition-all border ${
              hasInjectedShear
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-slate-950/60 text-slate-300 border-white/10 hover:border-rose-400/40 hover:text-rose-300"
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-rose-400" />
            <span>{hasInjectedShear ? "Shear Active (32kt)" : "Inject Wind Shear"}</span>
          </button>

          <button
            onClick={onInjectBatteryDegrade}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-sans font-medium transition-all border ${
              hasInjectedDegrade
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                : "bg-slate-950/60 text-slate-300 border-white/10 hover:border-amber-400/40 hover:text-amber-300"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>{hasInjectedDegrade ? "SOC Anomaly (-8%)" : "Inject SOC Anomaly"}</span>
          </button>

          {/* Dual-Radio C2 Link Severance Injection */}
          {onToggleC2Link && (
            <button
              onClick={onToggleC2Link}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-sans font-medium transition-all border ${
                linkSevered
                  ? "bg-rose-500/25 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse"
                  : "bg-slate-950/60 text-slate-300 border-white/10 hover:border-rose-400/40 hover:text-rose-300"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-400" />
              <span>{linkSevered ? "Simulate C2 Link Restored" : "Simulate C2 Link Severance"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Autonomous In-Flight Diversion Banner */}
      {isDiverting && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <span className="text-xs font-sans font-bold text-amber-300 uppercase tracking-wide block">
                AUTONOMOUS IN-FLIGHT DIVERSION TRIGGERED: {telemetry.recommendedAction}
              </span>
              <p className="text-xs text-slate-200 font-sans mt-0.5">
                {telemetry.diversionReason}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Target Alternate</span>
            <span className="text-sm font-bold font-mono text-cyan-300">
              {telemetry.diversionTargetIcao} ({telemetry.distanceToAlternateNm} NM)
            </span>
          </div>
        </div>
      )}

      {/* 4 In-Flight Radial Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-2">
        {/* Cell Temperature */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] flex flex-col items-center">
          <RadialGauge
            value={telemetry.batteryCellTempC}
            max={70}
            label="Cell Temp"
            unit="°C"
            color={telemetry.batteryCellTempC > 48 ? "red" : telemetry.batteryCellTempC > 38 ? "amber" : "cyan"}
            size={95}
            subtext="Limit: 55°C"
          />
        </div>

        {/* Instantaneous Power */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] flex flex-col items-center">
          <RadialGauge
            value={telemetry.instantaneousPowerKw}
            max={300}
            label="Discharge"
            unit="kW"
            color="emerald"
            size={95}
            subtext="Cruise Power"
          />
        </div>

        {/* Live SOC */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] flex flex-col items-center">
          <RadialGauge
            value={telemetry.liveBatterySoc}
            max={100}
            label="Live SOC"
            unit="%"
            color={telemetry.liveBatterySoc < 25 ? "red" : telemetry.liveBatterySoc < 40 ? "amber" : "emerald"}
            size={95}
            subtext={`Target: ${telemetry.theoreticalSoc}%`}
          />
        </div>

        {/* Flight Distance */}
        <div className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.04] flex flex-col items-center justify-center text-center space-y-1.5 font-mono">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Distance Flown</span>
          <div className="text-xl font-bold text-cyan-300">
            {telemetry.distanceFlownKm} <span className="text-xs text-slate-400 font-normal">km</span>
          </div>
          <div className="text-[11px] text-slate-400 border-t border-white/[0.05] pt-1.5 w-full">
            Remaining: <span className="text-slate-200 font-bold">{telemetry.distanceRemainingKm} km</span>
          </div>
          <div className="text-[10px] text-amber-400">
            {telemetry.isPastPonr ? "PAST PONR (COMMITTED)" : "BEFORE PONR (CLEAR)"}
          </div>
        </div>
      </div>

      {/* SITL High-Fidelity Attitude & Distributed Propulsion Gauges */}
      {(telemetry.attitude || telemetry.motorRpm) && (
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <span className="text-xs font-mono font-bold text-purple-300 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              PX4 SITL Flight Dynamics & 6-Motor Propulsion Matrix
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Update Rate: 10Hz • High-Frequency Sensor Drift Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Attitude Vector */}
            {telemetry.attitude && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-mono block">Attitude State (#30)</span>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">ROLL</span>
                    <span className="text-sm font-bold text-cyan-300">{telemetry.attitude.rollDeg}°</span>
                    {telemetry.attitude.rollRateDps !== undefined && (
                      <span className="text-[10px] text-slate-400 block">{telemetry.attitude.rollRateDps}°/s</span>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">PITCH</span>
                    <span className="text-sm font-bold text-emerald-300">{telemetry.attitude.pitchDeg}°</span>
                    {telemetry.attitude.pitchRateDps !== undefined && (
                      <span className="text-[10px] text-slate-400 block">{telemetry.attitude.pitchRateDps}°/s</span>
                    )}
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-500 block">YAW / HDG</span>
                    <span className="text-sm font-bold text-purple-300">{telemetry.attitude.yawDeg}°</span>
                    {telemetry.attitude.yawRateDps !== undefined && (
                      <span className="text-[10px] text-slate-400 block">{telemetry.attitude.yawRateDps}°/s</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Distributed Motor RPMs */}
            {telemetry.motorRpm && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                <span className="text-[11px] text-slate-400 uppercase font-mono block">
                  Distributed Tilt-Rotor RPM (6 Motors)
                </span>
                <div className="grid grid-cols-6 gap-1.5 text-center font-mono">
                  {telemetry.motorRpm.map((rpm, idx) => (
                    <div key={idx} className="p-1.5 rounded-lg bg-slate-950/60 border border-white/5">
                      <span className="text-[9px] text-slate-500 block">M{idx + 1}</span>
                      <span className="text-xs font-bold text-slate-200">{rpm}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
