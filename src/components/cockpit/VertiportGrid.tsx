"use client";

import React from "react";
import { VertiportTurnaroundState } from "@/types/aviation";
import { BatteryCharging, Clock, CheckCircle2, Lock, ArrowUpRight, Zap } from "lucide-react";

interface VertiportGridProps {
  vertiportState?: VertiportTurnaroundState;
}

export const VertiportGrid: React.FC<VertiportGridProps> = ({ vertiportState }) => {
  if (!vertiportState) return null;

  return (
    <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <BatteryCharging className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
            Destination Vertiport Turnaround & Fast-Charge Matrix
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
            {vertiportState.vertiportIcao} • {vertiportState.name.split(" ")[0]}
          </span>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Available Pads:{" "}
          <span className="font-bold text-emerald-400">{vertiportState.availablePads}</span> /{" "}
          <span>{vertiportState.totalPads}</span>
        </div>
      </div>

      {/* Grid of 4 Pads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {vertiportState.pads.map((pad) => {
          const isReservedForUs = pad.padId === vertiportState.lockedSlotPadId;
          return (
            <div
              key={pad.padId}
              className={`p-3.5 rounded-lg border text-xs font-mono transition-all flex flex-col justify-between ${
                isReservedForUs
                  ? "bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  : pad.status === "AVAILABLE"
                  ? "bg-slate-950/60 border-slate-800 text-slate-300"
                  : "bg-slate-900/80 border-slate-800/80 text-slate-400"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-200 flex items-center gap-1">
                    {pad.padName}
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                      isReservedForUs
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : pad.status === "AVAILABLE"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
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

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {pad.estimatedClearTimeUtc}
                </span>
                {isReservedForUs && (
                  <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Auto-Reserved
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