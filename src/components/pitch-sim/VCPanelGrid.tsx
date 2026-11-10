"use client";

import React from "react";
import { VC_PERSONAS, VCFacialState } from "@/lib/pitch-sim/personas";
import { AnimatedVCAvatar } from "./AnimatedVCAvatar";

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
  return (
    <div className={`grid grid-cols-2 gap-2 sm:gap-2.5 w-full h-full ${className}`}>
      {VC_PERSONAS.map((persona) => {
        const isActive = persona.id === activePersonaId;
        const isInterrupting = interruptedPersonaId === persona.id;
        const facialState = isActive ? activeFacialState : "LISTENING";
        const isSpeaking = isActive && isVCResponding;

        return (
          <div
            key={persona.id}
            onClick={() => onSelectPersona(persona.id)}
            className="w-full h-full min-h-[140px] max-h-[175px] cursor-pointer"
          >
            <AnimatedVCAvatar
              personaId={persona.id}
              name={persona.name}
              title={persona.title}
              firm={persona.firm}
              themeColor={persona.themeColor}
              facialState={facialState}
              isSpeaking={isSpeaking}
              isInterrupting={isInterrupting}
            />
          </div>
        );
      })}
    </div>
  );
};
