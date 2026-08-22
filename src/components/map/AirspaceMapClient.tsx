"use client";

import dynamic from "next/dynamic";
import React from "react";
import { FlightMission } from "@/types/aviation";

// Strict SSR Protection for dynamic vector map
const DynamicAirspaceMap = dynamic(
  () => import("./AirspaceMap").then((mod) => mod.AirspaceMap),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl bg-obsidian-950 border border-slate-800 h-[520px] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">
          Initializing Dyson Vector Airspace Canvas...
        </span>
      </div>
    ),
  }
);

export const AirspaceMapClient: React.FC<{ mission: FlightMission }> = ({ mission }) => {
  return <DynamicAirspaceMap mission={mission} />;
};