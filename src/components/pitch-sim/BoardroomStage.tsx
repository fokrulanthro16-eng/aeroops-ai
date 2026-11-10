"use client";

import React, { useState } from "react";
import {
  Users,
  Video,
  Radio,
  Eye,
  ShieldAlert,
  Zap,
  Building2,
  Sliders,
} from "lucide-react";
import { FounderCameraHUD } from "./FounderCameraHUD";
import { VCPanelGrid } from "./VCPanelGrid";
import { VCFacialState, VCPersona, getPersonaById } from "@/lib/pitch-sim/personas";

interface BoardroomStageProps {
  wpm: number;
  wpmZone: "SLOW" | "OPTIMAL" | "RUSHED";
  presenceScore: number;
  visualComment: string | null;
  activePersonaId: string;
  activeFacialState: VCFacialState;
  isVCResponding: boolean;
  interruptedPersonaId: string | null;
  onSelectPersona: (id: string) => void;
  onFrameCaptureReady?: (captureFn: () => string | null) => void;
  className?: string;
}

export const BoardroomStage: React.FC<BoardroomStageProps> = ({
  wpm,
  wpmZone,
  presenceScore,
  visualComment,
  activePersonaId,
  activeFacialState,
  isVCResponding,
  interruptedPersonaId,
  onSelectPersona,
  onFrameCaptureReady,
  className = "",
}) => {
  const [boardroomLayout, setBoardroomLayout] = useState<"SPLIT" | "VC_FOCUS" | "FOUNDER_FOCUS">("SPLIT");
  const activePersona = getPersonaById(activePersonaId);

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Boardroom Header Banner */}
      <div className="px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Sand Hill Road & FAA DER Executive Boardroom
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                LIVE MULTIMODAL WAR ROOM
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Evaluated in real-time by Nebius Token Factory (DeepSeek V4.1 Flash 1017)
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setBoardroomLayout("SPLIT")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              boardroomLayout === "SPLIT"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Split War Room
          </button>
          <button
            onClick={() => setBoardroomLayout("VC_FOCUS")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              boardroomLayout === "VC_FOCUS"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            VC Panel Focus
          </button>
          <button
            onClick={() => setBoardroomLayout("FOUNDER_FOCUS")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              boardroomLayout === "FOUNDER_FOCUS"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Founder Cam Focus
          </button>
        </div>
      </div>

      {/* Main Boardroom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        {/* Left Stage: Founder Live HD Camera HUD */}
        {(boardroomLayout === "SPLIT" || boardroomLayout === "FOUNDER_FOCUS") && (
          <div
            className={`${
              boardroomLayout === "FOUNDER_FOCUS" ? "lg:col-span-12" : "lg:col-span-5"
            } w-full transition-all duration-300`}
          >
            <FounderCameraHUD
              wpm={wpm}
              wpmZone={wpmZone}
              presenceScore={presenceScore}
              visualComment={visualComment}
              onFrameCaptureReady={onFrameCaptureReady}
            />
          </div>
        )}

        {/* Right Stage: 4-Persona Reactive Executive Grid */}
        {(boardroomLayout === "SPLIT" || boardroomLayout === "VC_FOCUS") && (
          <div
            className={`${
              boardroomLayout === "VC_FOCUS" ? "lg:col-span-12" : "lg:col-span-7"
            } w-full transition-all duration-300`}
          >
            <VCPanelGrid
              activePersonaId={activePersonaId}
              isVCResponding={isVCResponding}
              activeFacialState={activeFacialState}
              interruptedPersonaId={interruptedPersonaId}
              onSelectPersona={onSelectPersona}
            />
          </div>
        )}
      </div>
    </div>
  );
};
