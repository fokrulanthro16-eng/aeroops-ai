"use client";

import dynamic from "next/dynamic";
import React from "react";
import { FlightMission, InFlightTelemetry } from "@/types/aviation";

const DynamicAirspaceMap = dynamic(
  () => import("./AirspaceMap").then((mod) => mod.AirspaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-obsidian-950 border border-slate-800 h-[520px] 2xl:h-[580px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">
          Initializing Dyson Vector Airspace Radar...
        </span>
      </div>
    ),
  }
);

export const AirspaceMapClient: React.FC<{
  mission: FlightMission;
  liveTelemetry?: InFlightTelemetry;
}> = ({ mission, liveTelemetry }) => {
  return <DynamicAirspaceMap mission={mission} liveTelemetry={liveTelemetry} />;
};