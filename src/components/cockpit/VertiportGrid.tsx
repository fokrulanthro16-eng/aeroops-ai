"use client";

import React, { useState, useEffect } from "react";
import { VertiportTurnaroundState } from "@/types/aviation";
import { BatteryCharging, Clock, Lock, Zap } from "lucide-react";

interface VertiportGridProps {
  vertiportState?: VertiportTurnaroundState;
}

export const VertiportGrid: React.FC<VertiportGridProps> = ({ vertiportState }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!vertiportState) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <BatteryCharging className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                Destination Vertiport Fast-Charge & Turnaround Matrix
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-cyan-300">
                {vertiportState.vertiportIcao} • {vertiportState.name.split(" ")[0]}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Automated MegaWatt charging bay allocation & turnaround slot schedule
            </p>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Available Charging Bays:{" "}
          <span className="font-bold text-emerald-400">{vertiportState.availablePads}</span> /{" "}
          <span>{vertiportState.totalPads}</span>
        </div>
      </div>

      {/* Grid of 4 Pads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vertiportState.pads.map((pad) => {
          const isReservedForUs = pad.padId === vertiportState.lockedSlotPadId;
          return (
            <div
              key={pad.padId}
              className={`p-5 rounded-2xl border text-xs font-mono transition-all flex flex-col justify-between ${
                isReservedForUs
                  ? "bg-cyan-500/10 border-cyan-400/30 shadow-[0_0_20px_rgba(56,189,248,0.15)]"
                  : pad.status === "AVAILABLE"
                  ? "bg-slate-950/40 border-white/[0.05] text-slate-300"
                  : "bg-slate-950/20 border-white/[0.04] text-slate-400"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 font-sans">
                    {pad.padName}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      isReservedForUs
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                        : pad.status === "AVAILABLE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {isReservedForUs ? "LOCKED (OUR FLIGHT)" : pad.status}
                  </span>
                </div>

                <div className="space-y-1 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Power:</span>
                    <span className="text-cyan-300 font-semibold">{pad.chargerPowerKw} kW DC</span>
                  </div>
                  {pad.assignedCallsign && (
                    <div className="flex justify-between">
                      <span>Assigned:</span>
                      <span className="text-slate-200 font-bold">{pad.assignedCallsign}</span>
                    </div>
                  )}
                  {pad.currentSocTargetPercent && (
                    <div className="flex justify-between">
                      <span>Target SOC:</span>
                      <span className="text-emerald-400">{pad.currentSocTargetPercent}%</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-slate-400">
                <span
                  suppressHydrationWarning={true}
                  className="flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span suppressHydrationWarning={true}>
                    {mounted ? pad.estimatedClearTimeUtc : "UTC (LOCKED)"}
                  </span>
                </span>
                {isReservedForUs && (
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Auto-Locked
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};