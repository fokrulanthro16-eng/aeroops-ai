"use client";

import React from "react";
import { HardSafetyGate, RiskFactorScores } from "@/types/aviation";
import { ShieldCheck, ShieldAlert, Check, X } from "lucide-react";

interface RiskMatrixProps {
  factors: RiskFactorScores;
  hardGates: HardSafetyGate[];
}

export const RiskMatrix: React.FC<RiskMatrixProps> = ({ factors, hardGates }) => {
  const factorRows = [
    { label: "Atmospheric & METAR Weather", weight: "30%", score: factors.weather },
    { label: "Battery Energy & Landing Reserve", weight: "25%", score: factors.energy },
    { label: "Airspace & Geo-Fence Proximity", weight: "20%", score: factors.airspace },
    { label: "Aircraft Mass & Aerodynamic Envelope", weight: "15%", score: factors.aircraft },
    { label: "Route Heading & Distance Geometry", weight: "10%", score: factors.route },
  ];

  const getScoreColor = (score: number) => {
    if (score < 30) return "bg-emerald-500 text-emerald-400";
    if (score < 60) return "bg-amber-500 text-amber-400";
    return "bg-red-500 text-red-400";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 5-Factor Risk Score Breakdown */}
      <div className="lg:col-span-6 rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-cyan-400" />
              5-Factor Weighted Risk Model
            </h3>
            <span className="text-[11px] font-mono text-cyan-400">Heuristic Index</span>
          </div>

          <div className="space-y-3.5">
            {factorRows.map((factor, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">{factor.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">w={factor.weight}</span>
                    <span className={`font-bold ${getScoreColor(factor.score).split(" ")[1]}`}>
                      {factor.score}/100
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreColor(factor.score).split(" ")[0]}`}
                    style={{ width: `${Math.min(100, factor.score)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Target Risk Threshold: &lt; 30 (GO)</span>
          <span>Deterministic Heuristic Engine</span>
        </div>
      </div>

      {/* Hard Safety Gates Indicator */}
      <div className="lg:col-span-6 rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-sm bg-red-500" />
              Deterministic Hard Safety Gates (Zero Tolerance)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">5 Interlocks</span>
          </div>

          <div className="space-y-2">
            {hardGates.map((gate) => (
              <div
                key={gate.gateId}
                className={`p-2.5 rounded-lg border text-xs font-mono transition-colors flex items-center justify-between ${
                  gate.passed
                    ? "bg-slate-900/60 border-slate-800 text-slate-300"
                    : "bg-red-950/40 border-red-500/50 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">
                    {gate.passed ? (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                        <X className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      {gate.name}
                      <span className="text-[10px] text-slate-400">[{gate.gateId}]</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Observed: <span className={gate.passed ? "text-cyan-300" : "text-red-400 font-bold"}>{gate.telemetryValue}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                      gate.passed
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/40"
                    }`}
                  >
                    {gate.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Failure of ANY gate forces immediate NO-GO</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Certified Rules Engine
          </span>
        </div>
      </div>
    </div>
  );
};