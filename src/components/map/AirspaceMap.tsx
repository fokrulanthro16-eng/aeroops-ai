"use client";

import React, { useState } from "react";
import { FlightMission, InFlightTelemetry } from "@/types/aviation";
import { SAMPLE_AIRSPACE_ZONES } from "@/lib/airspace";
import { DynamicRerouteLayer } from "./DynamicRerouteLayer";

interface AirspaceMapProps {
  mission: FlightMission;
  liveTelemetry?: InFlightTelemetry;
}

export const AirspaceMap: React.FC<AirspaceMapProps> = ({ mission, liveTelemetry }) => {
  const [showAirspaceRings, setShowAirspaceRings] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);

  const { origin, destination, energy, wind, airspaceConflicts, routeDistanceKm, microWeatherSegments } = mission;

  // ViewBox coordinates for Southern California Vertiport corridor
  const minLat = 33.55;
  const maxLat = 34.35;
  const minLon = -118.65;
  const maxLon = -117.75;

  const projectCoord = (lat: number, lon: number): { x: number; y: number } => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 800;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 500;
    return { x, y };
  };

  const originPt = projectCoord(origin.lat, origin.lon);
  const destPt = projectCoord(destination.lat, destination.lon);
  const altPt = projectCoord(34.2007, -118.3587); // KBUR Alternate

  // PONR point along the flight path
  const ponrRatio = Math.min(1, Math.max(0, energy.pointOfNoReturnKm / Math.max(1, routeDistanceKm)));
  const ponrPt = {
    x: originPt.x + (destPt.x - originPt.x) * ponrRatio,
    y: originPt.y + (destPt.y - originPt.y) * ponrRatio,
  };

  const hasActiveTfr = airspaceConflicts.some((c) => c.type === "TFR" || c.status === "RESTRICTION_CONFLICT");

  return (
    <div className="relative rounded-xl bg-obsidian-950 border border-slate-800 overflow-hidden flex flex-col h-[520px] 2xl:h-[580px]">
      {/* Top Map HUD Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 p-1.5 px-3 rounded-lg bg-obsidian-900/90 border border-slate-800 text-xs font-mono text-cyan-300 pointer-events-auto backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold">VECTOR AIRSPACE & PONR RADAR</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">CORRIDOR: {origin.icao} → {destination.icao}</span>
        </div>

        {/* Map Layer Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowAirspaceRings(!showAirspaceRings)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
              showAirspaceRings
                ? "bg-slate-800 text-cyan-300 border-cyan-500/40"
                : "bg-obsidian-900/90 text-slate-400 border-slate-800"
            }`}
          >
            Airspace Rings
          </button>
          <button
            onClick={() => setShowWindVectors(!showWindVectors)}
            className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
              showWindVectors
                ? "bg-slate-800 text-cyan-300 border-cyan-500/40"
                : "bg-obsidian-900/90 text-slate-400 border-slate-800"
            }`}
          >
            Wind Streamlines
          </button>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="w-full h-full relative bg-[#06080D]">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full select-none"
          style={{ background: "radial-gradient(ellipse at center, #0B111A 0%, #05070B 100%)" }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.05)" strokeWidth="1" />
            </pattern>

            {/* Flight Corridor Gradient */}
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset={`${ponrRatio * 100}%`} stopColor="#06B6D4" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
            </linearGradient>

            {/* Neon Glow Filters */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="800" height="500" fill="url(#radarGrid)" />

          {/* Range Distance Concentric Rings from Origin */}
          <circle
            cx={originPt.x}
            cy={originPt.y}
            r="120"
            fill="none"
            stroke="rgba(6, 182, 212, 0.12)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx={originPt.x}
            cy={originPt.y}
            r="240"
            fill="none"
            stroke="rgba(6, 182, 212, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={originPt.x + 125} y={originPt.y + 4} fill="#64748B" fontSize="10" fontFamily="monospace">
            20 NM Range
          </text>
          <text x={originPt.x + 245} y={originPt.y + 4} fill="#64748B" fontSize="10" fontFamily="monospace">
            40 NM Range
          </text>

          {/* Controlled Airspace Zones */}
          {showAirspaceRings &&
            SAMPLE_AIRSPACE_ZONES.map((zone) => {
              if (zone.type === "TFR") return null;
              const pt = projectCoord(zone.centerLat, zone.centerLon);
              const r = (zone.radiusNm || 5) * 6.5;

              return (
                <g key={zone.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={r}
                    fill={zone.type === "CLASS_B" ? "rgba(6, 182, 212, 0.05)" : "rgba(245, 158, 11, 0.04)"}
                    stroke={zone.type === "CLASS_B" ? "rgba(6, 182, 212, 0.4)" : "rgba(245, 158, 11, 0.35)"}
                    strokeWidth="1.5"
                    strokeDasharray={zone.type === "CLASS_B" ? "none" : "6 4"}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - r - 4}
                    fill={zone.type === "CLASS_B" ? "#22D3EE" : "#FBBF24"}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {zone.name.split(" ")[0]} ({zone.type.replace("_", "-")})
                  </text>
                </g>
              );
            })}

          {/* Active TFR Polygon Hull (VIP Security Zone) */}
          {hasActiveTfr && (
            <g>
              <polygon
                points="360,180 440,180 440,240 360,240"
                fill="rgba(239, 68, 68, 0.18)"
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
              <text x="400" y="215" fill="#EF4444" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚠️ VIP TFR PROHIBITED
              </text>
            </g>
          )}

          {/* Wind Streamline Overlay */}
          {showWindVectors && (
            <g opacity="0.6">
              {[
                { x: 150, y: 120 },
                { x: 300, y: 100 },
                { x: 450, y: 150 },
                { x: 600, y: 120 },
                { x: 200, y: 350 },
                { x: 380, y: 380 },
                { x: 550, y: 320 },
              ].map((pos, i) => {
                const windRad = ((wind.windDirDeg + 180) * Math.PI) / 180;
                const len = 25;
                const dx = Math.sin(windRad) * len;
                const dy = -Math.cos(windRad) * len;

                return (
                  <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                    <line x1="0" y1="0" x2={dx} y2={dy} stroke="#06B6D4" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx={dx} cy={dy} r="2" fill="#06B6D4" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Flight Corridor Track (Thick buffer tube) */}
          <line
            x1={originPt.x}
            y1={originPt.y}
            x2={destPt.x}
            y2={destPt.y}
            stroke="rgba(6, 182, 212, 0.15)"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Main Flight Vector Path */}
          <line
            x1={originPt.x}
            y1={originPt.y}
            x2={destPt.x}
            y2={destPt.y}
            stroke="url(#corridorGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glow)"
          />

          {/* Dynamic Point of No Return (PONR) Marker */}
          <g transform={`translate(${ponrPt.x}, ${ponrPt.y})`}>
            <circle r="8" fill="none" stroke="#F59E0B" strokeWidth="2" className="animate-ping" opacity="0.7" />
            <circle r="5" fill="#F59E0B" stroke="#0F141C" strokeWidth="2" />
            <rect x="-45" y="-28" width="90" height="18" rx="4" fill="#0F141C" stroke="#F59E0B" strokeWidth="1" />
            <text x="0" y="-16" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              PONR: {energy.pointOfNoReturnKm} km
            </text>
          </g>

          {/* Dynamic Reroute & Micro-Weather In-Flight Layer */}
          <DynamicRerouteLayer
            telemetry={liveTelemetry}
            microWeatherSegments={microWeatherSegments}
            originPt={originPt}
            destPt={destPt}
            alternatePt={altPt}
            isDiverting={liveTelemetry?.flightPhase === "DIVERTING"}
          />

          {/* Origin Vertiport Node */}
          <g transform={`translate(${originPt.x}, ${originPt.y})`}>
            <circle r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="-40" y="12" width="80" height="18" rx="4" fill="#0F141C" stroke="#10B981" strokeWidth="1" />
            <text x="0" y="24" fill="#10B981" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              DEP: {origin.icao}
            </text>
          </g>

          {/* Destination Vertiport Node */}
          <g transform={`translate(${destPt.x}, ${destPt.y})`}>
            <circle r="7" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="-40" y="12" width="80" height="18" rx="4" fill="#0F141C" stroke="#06B6D4" strokeWidth="1" />
            <text x="0" y="24" fill="#22D3EE" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              ARR: {destination.icao}
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 p-2 px-3 rounded-lg bg-obsidian-900/90 border border-slate-800 text-[11px] font-mono backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Origin ({origin.icao})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> PONR Threshold
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Destination ({destination.icao})
          </span>
          {hasActiveTfr && (
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              ⚠️ VIP TFR Alert
            </span>
          )}
        </div>

        <div className="text-slate-400">
          Heading: <span className="text-cyan-300 font-bold">{mission.routeHeadingDeg}°</span> |
          Dist: <span className="text-cyan-300 font-bold">{mission.routeDistanceKm} km</span>
        </div>
      </div>
    </div>
  );
};