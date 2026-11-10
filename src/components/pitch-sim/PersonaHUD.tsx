"use client";

import React from "react";
import {
  Sparkles,
  ShieldAlert,
  Scale,
  Cpu,
  Flame,
  CheckCircle2,
  Circle,
  Users,
  User,
  Sliders,
} from "lucide-react";
import { VCPersona, VC_PERSONAS } from "@/lib/pitch-sim/personas";
import { THESIS_PILLARS } from "@/lib/pitch-sim/knowledge-vault";

interface PersonaHUDProps {
  activePersonaId: string;
  isGauntletMode: boolean;
  hostilityLevel: number;
  coveredPillarIds: string[];
  isVCResponding: boolean;
  onSelectPersona: (personaId: string) => void;
  onToggleGauntletMode: (isGauntlet: boolean) => void;
  onChangeHostility: (level: number) => void;
}

const PERSONA_ICONS: Record<string, React.ElementType> = {
  Sparkles,
  ShieldAlert,
  Scale,
  Cpu,
};

export const PersonaHUD: React.FC<PersonaHUDProps> = ({
  activePersonaId,
  isGauntletMode,
  hostilityLevel,
  coveredPillarIds,
  isVCResponding,
  onSelectPersona,
  onToggleGauntletMode,
  onChangeHostility,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Panel Mode & Hostility Controls */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Panel Operating Mode
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800">
            <button
              onClick={() => onToggleGauntletMode(true)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                isGauntletMode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Full Panel Gauntlet</span>
            </button>
            <button
              onClick={() => onToggleGauntletMode(false)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${
                !isGauntletMode
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <User className="w-3 h-3" />
              <span>Solo Sparring</span>
            </button>
          </div>
        </div>

        {/* Hostility Dial */}
        <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Flame
                className={`w-3.5 h-3.5 ${
                  hostilityLevel >= 4
                    ? "text-red-400 animate-pulse"
                    : hostilityLevel >= 3
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              />
              <span>HOSTILITY INTENSITY:</span>
            </div>
            <span
              className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                hostilityLevel === 1
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : hostilityLevel <= 3
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
              }`}
            >
              LEVEL {hostilityLevel}:{" "}
              {hostilityLevel === 1
                ? "DISCOVERY"
                : hostilityLevel === 2
                ? "DUE DILIGENCE"
                : hostilityLevel === 3
                ? "PRESSURE DRILL"
                : hostilityLevel === 4
                ? "DEEP-TECH GRILL"
                : "HOSTILE TERM-SHEET"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={hostilityLevel}
              onChange={(e) => onChangeHostility(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-950 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4 VC Persona Cards */}
      <div className="flex flex-col gap-2.5">
        <div className="text-[11px] font-mono font-semibold tracking-wider uppercase text-slate-400 px-1">
          Active Investor / Auditor Panel
        </div>

        {VC_PERSONAS.map((persona) => {
          const isActive = persona.id === activePersonaId;
          const IconComp = PERSONA_ICONS[persona.avatarIcon] || Sparkles;

          return (
            <div
              key={persona.id}
              onClick={() => onSelectPersona(persona.id)}
              className={`relative p-3 rounded-xl border transition-all cursor-pointer select-none ${
                isActive
                  ? `${persona.themeBorder} ${persona.themeBg} shadow-[0_0_20px_rgba(15,23,42,0.8)] scale-[1.01]`
                  : "border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70 opacity-75 hover:opacity-100"
              }`}
            >
              {/* Active Speaker Ring Indicator */}
              {isActive && (
                <div
                  className="absolute -top-1.5 -right-1.5 flex h-3 w-3"
                  title="Active Interlocutor"
                >
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75`}
                    style={{ backgroundColor: persona.themeColor }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3 border border-slate-950"
                    style={{ backgroundColor: persona.themeColor }}
                  />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center w-9 h-9 rounded-lg border shrink-0"
                  style={{
                    borderColor: `${persona.themeColor}55`,
                    backgroundColor: `${persona.themeColor}15`,
                    color: persona.themeColor,
                  }}
                >
                  <IconComp className="w-5 h-5" />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {persona.name}
                    </span>
                    {isActive && isVCResponding && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                        TRANSMITTING
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    {persona.title} • {persona.firm}
                  </span>

                  {/* Focus Area Pill */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {persona.focusAreas.slice(0, 2).map((focus, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 text-slate-300 border border-slate-800 truncate"
                      >
                        {focus}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Thesis Pillars Real-Time Signal Matrix */}
      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-200">
              Thesis Signal Density
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {coveredPillarIds.length} / {THESIS_PILLARS.length} PILLARS
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {THESIS_PILLARS.map((pillar) => {
            const isCovered = coveredPillarIds.includes(pillar.id);

            return (
              <div
                key={pillar.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                  isCovered
                    ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950/50 border-slate-800 text-slate-500"
                }`}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  {isCovered ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                  <span className="truncate">{pillar.name}</span>
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                    isCovered
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-900 text-slate-600"
                  }`}
                >
                  {pillar.code}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
