"use client";

import React from "react";
import { Sliders, RotateCcw, AlertTriangle, Shield, Wind, Battery, Weight, Thermometer } from "lucide-react";

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
    <div className="rounded-xl bg-obsidian-900/90 border border-cyan-500/30 p-4 sm:p-5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
            Aerodynamic "What-If" Telemetry Simulator
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
            REAL-TIME DETERMINISTIC ENGINE
          </span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1 text-xs font-mono text-slate-400 hover:text-cyan-300 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Wind Speed Slider */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Wind Speed
            </span>
            <span className={`font-bold ${params.windSpeedKts > maxCrosswindKts ? "text-red-400" : "text-cyan-300"}`}>
              {params.windSpeedKts} kts
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={params.windSpeedKts}
            onChange={(e) => onChange({ windSpeedKts: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 kt (Calm)</span>
            <span className="text-amber-400">Limit: {maxCrosswindKts} kt</span>
            <span>50 kt (Storm)</span>
          </div>
        </div>

        {/* 2. Wind Direction Slider */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
              Wind Direction
            </span>
            <span className="font-bold text-cyan-300 font-mono">
              {params.windDirDeg}° (Azimuth)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={params.windDirDeg}
            onChange={(e) => onChange({ windDirDeg: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>000° (N)</span>
            <span>090° (E)</span>
            <span>180° (S)</span>
            <span>270° (W)</span>
            <span>360°</span>
          </div>
        </div>

        {/* 3. Payload Weight Slider */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Weight className="w-3.5 h-3.5 text-cyan-400" />
              Cargo / Pax Payload
            </span>
            <span className={`font-bold ${params.payloadKg > maxPayloadKg ? "text-red-400" : "text-cyan-300"}`}>
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0 kg</span>
            <span className="text-amber-400">Max: {maxPayloadKg} kg</span>
            <span>{Math.round(maxPayloadKg * 1.3)} kg</span>
          </div>
        </div>

        {/* 4. Initial Battery SOC Slider */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5 text-cyan-400" />
              Departure Battery SOC
            </span>
            <span className={`font-bold ${params.initialSocPercent < 30 ? "text-red-400" : "text-emerald-300"}`}>
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>20%</span>
            <span>50%</span>
            <span className="text-emerald-400">100% Full</span>
          </div>
        </div>

        {/* 5. Ambient Temperature Slider */}
        <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              Ambient Temp (Derating)
            </span>
            <span className={`font-bold ${params.tempC < 10 ? "text-amber-400" : "text-slate-200"}`}>
              {params.tempC}°C {params.tempC < 10 ? `(-${Math.round((10 - params.tempC) * 0.8)}% cap)` : "(Nominal)"}
            </span>
          </div>
          <input
            type="range"
            min="-15"
            max="45"
            step="1"
            value={params.tempC}
            onChange={(e) => onChange({ tempC: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>-15°C (Severe Cold)</span>
            <span className="text-cyan-400">10°C (Derate Threshold)</span>
            <span>45°C</span>
          </div>
        </div>

        {/* 6. Active TFR Incursion Toggle */}
        <div className="flex flex-col justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-400" />
              VIP TFR Airspace Incursion
            </span>
            <span className={`font-bold ${params.enableTfr ? "text-red-400" : "text-emerald-400"}`}>
              {params.enableTfr ? "ACTIVE NOTAM" : "CLEAR"}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] font-mono text-slate-400">
              Force corridor into active VIP security ring:
            </span>
            <button
              onClick={() => onChange({ enableTfr: !params.enableTfr })}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-all ${
                params.enableTfr
                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {params.enableTfr ? "TFR ACTIVE" : "DISABLED"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};