"use client";

import React from "react";
import {
  Sparkles,
  ShieldAlert,
  Scale,
  Cpu,
  Radio,
  FileEdit,
  Eye,
  CheckCircle2,
  AlertOctagon,
  Volume2,
} from "lucide-react";
import { VC_PERSONAS, VCPersona, VCFacialState } from "@/lib/pitch-sim/personas";

interface VCPanelGridProps {
  activePersonaId: string;
  isVCResponding: boolean;
  activeFacialState: VCFacialState;
  interruptedPersonaId: string | null;
  onSelectPersona: (id: string) => void;
  className?: string;
}

export const VCPanelGrid: React.FC<VCPanelGridProps> = ({
  activePersonaId,
  isVCResponding,
  activeFacialState,
  interruptedPersonaId,
  onSelectPersona,
  className = "",
}) => {
  const getMicroCaption = (persona: VCPersona, isCurrent: boolean): string => {
    if (interruptedPersonaId === persona.id) {
      return persona.statusMicroCaptions.interrupt;
    }
    if (!isCurrent) {
      return persona.statusMicroCaptions.listening;
    }
    switch (activeFacialState) {
      case "SKEPTICAL_SQUINT":
        return persona.statusMicroCaptions.skeptical;
      case "TAKING_NOTES":
        return persona.statusMicroCaptions.notes;
      case "NODDING_APPROVAL":
        return persona.statusMicroCaptions.approval;
      case "LEANING_IN_INTERRUPT":
        return persona.statusMicroCaptions.interrupt;
      default:
        return persona.statusMicroCaptions.listening;
    }
  };

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 w-full ${className}`}>
      {VC_PERSONAS.map((persona) => {
        const isActive = persona.id === activePersonaId;
        const isInterrupting = interruptedPersonaId === persona.id;
        const facialState = isActive ? activeFacialState : "LISTENING";

        return (
          <div
            key={persona.id}
            onClick={() => onSelectPersona(persona.id)}
            className={`relative rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden backdrop-blur-md select-none min-h-[175px] ${
              isInterrupting
                ? "border-red-500 bg-red-950/60 shadow-[0_0_35px_rgba(239,68,68,0.5)] scale-[1.02] z-20"
                : isActive
                ? `${persona.themeBorder} ${persona.themeBg} shadow-[0_0_25px_rgba(15,23,42,0.9)] scale-[1.01] z-10`
                : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 opacity-80 hover:opacity-100"
            }`}
          >
            {/* Master Caution Strobe Bar on Interrupt */}
            {isInterrupting && (
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 animate-pulse" />
            )}

            {/* Top Bar: Persona Info & Status Indicator */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {/* Persona Avatar Silhouette with Reactive Posture */}
                <div
                  className={`relative w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-transform ${
                    facialState === "LEANING_IN_INTERRUPT"
                      ? "scale-110 shadow-lg"
                      : facialState === "NODDING_APPROVAL"
                      ? "animate-bounce"
                      : ""
                  }`}
                  style={{
                    borderColor: isInterrupting
                      ? "#ef4444"
                      : isActive
                      ? persona.themeColor
                      : "rgba(100, 116, 139, 0.4)",
                    backgroundColor: `${persona.themeColor}18`,
                    color: persona.themeColor,
                  }}
                >
                  {persona.avatarIcon === "Sparkles" && <Sparkles className="w-5 h-5" />}
                  {persona.avatarIcon === "ShieldAlert" && <ShieldAlert className="w-5 h-5" />}
                  {persona.avatarIcon === "Scale" && <Scale className="w-5 h-5" />}
                  {persona.avatarIcon === "Cpu" && <Cpu className="w-5 h-5" />}

                  {/* Reactive Audio Speaking Wave Ring */}
                  {isActive && isVCResponding && (
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                      style={{ backgroundColor: persona.themeColor }}
                    />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white truncate">
                      {persona.name}
                    </span>
                    {isActive && (
                      <span className="flex h-2 w-2 relative">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                          style={{ backgroundColor: persona.themeColor }}
                        />
                        <span
                          className="relative inline-flex rounded-full h-2 w-2"
                          style={{ backgroundColor: persona.themeColor }}
                        />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate">
                    {persona.title} • {persona.firm}
                  </span>
                </div>
              </div>

              {/* Facial State Badge */}
              <div className="shrink-0">
                {facialState === "LEANING_IN_INTERRUPT" ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/25 text-red-300 border border-red-500/40 flex items-center gap-1 animate-pulse">
                    <AlertOctagon className="w-3 h-3" />
                    <span>INTERRUPTING</span>
                  </span>
                ) : facialState === "SKEPTICAL_SQUINT" ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    <span>SKEPTICAL</span>
                  </span>
                ) : facialState === "TAKING_NOTES" ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                    <FileEdit className="w-3 h-3" />
                    <span>TAKING NOTES</span>
                  </span>
                ) : facialState === "NODDING_APPROVAL" ? (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>APPROVAL</span>
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-cyan-400" />
                    <span>LISTENING</span>
                  </span>
                )}
              </div>
            </div>

            {/* Middle: Tactical Executive Focus Chips */}
            <div className="flex flex-wrap gap-1 my-2">
              {persona.focusAreas.slice(0, 2).map((focus, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 text-slate-300 border border-slate-800 truncate"
                >
                  {focus}
                </span>
              ))}
            </div>

            {/* Bottom: Live Reactive Micro-Caption */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[10px] font-mono">
              <span
                className={`truncate italic ${
                  isInterrupting
                    ? "text-red-300 font-semibold"
                    : isActive
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                {getMicroCaption(persona, isActive)}
              </span>

              {isActive && isVCResponding && (
                <span className="flex items-center gap-1 text-[9px] text-amber-400 font-bold shrink-0">
                  <Volume2 className="w-3 h-3 animate-pulse" />
                  <span>VOCALIZING</span>
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
