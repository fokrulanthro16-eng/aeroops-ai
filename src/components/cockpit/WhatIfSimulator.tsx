"use client";

import React from "react";
import { Sliders, RotateCcw, Wind, Battery, Weight, Thermometer, Shield, AlertTriangle } from "lucide-react";

interface WhatIfParams {
  windSpeedKts: number;
  windDirDeg: number;
  payloadKg: number;
  initialSocPercent: number;
  tempC: number;
  enableTfr: boolean;
}

interface WhatIfSimulatorProps {
  params: WhatIfParams;
  onChange: (updated: Partial<WhatIfParams>) => void;
  onReset: () => void;
  maxPayloadKg: number;
  maxCrosswindKts: number;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  params,
  onChange,
  onReset,
  maxPayloadKg,
  maxCrosswindKts,
}) => {
  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                Aerodynamic "What-If" Performance Studio
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-semibold">
                REAL-TIME DETERMINISTIC
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Interact with physical variables to recalculate aerodynamic envelopes and PONR thresholds in real-time
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-xs font-medium text-slate-300 hover:text-cyan-300 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Wind Speed */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Wind Speed
            </span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border text-xs ${
              params.windSpeedKts > maxCrosswindKts
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
            }`}>
              {params.windSpeedKts} kt
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={params.windSpeedKts}
            onChange={(e) => onChange({ windSpeedKts: Number(e.target.value) })}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 kt (Calm)</span>
            <span className="text-amber-400">Limit: {maxCrosswindKts} kt</span>
            <span>50 kt (Storm)</span>
          </div>
        </div>

        {/* 2. Wind Direction */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Wind Direction (Azimuth)
            </span>
            <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 text-xs">
              {params.windDirDeg}°
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={params.windDirDeg}
            onChange={(e) => onChange({ windDirDeg: Number(e.target.value) })}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>000° (N)</span>
            <span>090° (E)</span>
            <span>180° (S)</span>
            <span>270° (W)</span>
          </div>
        </div>

        {/* 3. Payload Mass */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Weight className="w-4 h-4 text-cyan-400" />
              Cargo / Pax Payload
            </span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border text-xs ${
              params.payloadKg > maxPayloadKg
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
            }`}>
              {params.payloadKg} kg
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.round(maxPayloadKg * 1.3)}
            step="10"
            value={params.payloadKg}
            onChange={(e) => onChange({ payloadKg: Number(e.target.value) })}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 kg</span>
            <span className="text-amber-400">Max: {maxPayloadKg} kg</span>
            <span>{Math.round(maxPayloadKg * 1.3)} kg</span>
          </div>
        </div>

        {/* 4. Departure Battery SOC */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              Departure Battery SOC
            </span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border text-xs ${
              params.initialSocPercent < 30
                ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
                : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
            }`}>
              {params.initialSocPercent}%
            </span>
          </div>

          <input
            type="range"
            min="20"
            max="100"
            step="1"
            value={params.initialSocPercent}
            onChange={(e) => onChange({ initialSocPercent: Number(e.target.value) })}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>20%</span>
            <span>60%</span>
            <span className="text-emerald-400">100% Full</span>
          </div>
        </div>

        {/* 5. Ambient Temperature */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-cyan-400" />
              Ambient Temp (Cold Derate)
            </span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border text-xs ${
              params.tempC < 10
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-slate-800 text-slate-200 border-white/10"
            }`}>
              {params.tempC}°C {params.tempC < 10 ? `(-${Math.round((10 - params.tempC) * 0.8)}%)` : ""}
            </span>
          </div>

          <input
            type="range"
            min="-15"
            max="45"
            step="1"
            value={params.tempC}
            onChange={(e) => onChange({ tempC: Number(e.target.value) })}
            className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-15°C</span>
            <span className="text-cyan-400">10°C (Threshold)</span>
            <span>45°C</span>
          </div>
        </div>

        {/* 6. Active VIP TFR Incursion Toggle */}
        <div className="p-5 rounded-2xl bg-slate-950/40 border border-white/[0.05] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-slate-300 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-rose-400" />
              VIP TFR Airspace Incursion
            </span>
            <span className={`font-mono font-bold px-2.5 py-0.5 rounded-full border text-xs ${
              params.enableTfr
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {params.enableTfr ? "ACTIVE NOTAM" : "CLEAR"}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] font-sans text-slate-400">
              Corridor VIP restriction:
            </span>
            <button
              onClick={() => onChange({ enableTfr: !params.enableTfr })}
              className={`px-4 py-1.5 text-xs font-sans font-semibold rounded-full transition-all ${
                params.enableTfr
                  ? "bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-white/10"
              }`}
            >
              {params.enableTfr ? "TFR Active" : "Disabled"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};