"use client";

import React, { useState } from "react";
import { FlightMission, InFlightTelemetry } from "@/types/aviation";
import { SAMPLE_AIRSPACE_ZONES } from "@/lib/airspace";
import { DynamicRerouteLayer } from "./DynamicRerouteLayer";
import { Compass, Eye, Shield, Wind } from "lucide-react";

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

  const ponrRatio = Math.min(1, Math.max(0, energy.pointOfNoReturnKm / Math.max(1, routeDistanceKm)));
  const ponrPt = {
    x: originPt.x + (destPt.x - originPt.x) * ponrRatio,
    y: originPt.y + (destPt.y - originPt.y) * ponrRatio,
  };

  const hasActiveTfr = airspaceConflicts.some((c) => c.type === "TFR" || c.status === "RESTRICTION_CONFLICT");

  return (
    <div className="relative glass-panel rounded-3xl overflow-hidden flex flex-col h-[520px] 2xl:h-[600px] border border-white/[0.08]">
      {/* Top Floating Map Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="glass-pill rounded-full px-4 py-1.5 text-xs font-mono text-cyan-300 pointer-events-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-white font-sans">Vector Airspace & Corridor Radar</span>
          <span className="text-slate-500">|</span>
          <span className="text-cyan-300">{origin.icao} → {destination.icao}</span>
        </div>

        {/* Map Layer Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowAirspaceRings(!showAirspaceRings)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition border ${
              showAirspaceRings
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                : "bg-slate-950/60 text-slate-400 border-white/10"
            }`}
          >
            Controlled Airspace
          </button>
          <button
            onClick={() => setShowWindVectors(!showWindVectors)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition border ${
              showWindVectors
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/40"
                : "bg-slate-950/60 text-slate-400 border-white/10"
            }`}
          >
            Wind Vectors
          </button>
        </div>
      </div>

      {/* Main SVG Vector Canvas */}
      <div className="w-full h-full relative bg-[#070B12]">
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full select-none"
          style={{ background: "radial-gradient(ellipse at center, #0B132B 0%, #070B12 100%)" }}
        >
          <defs>
            {/* Subtle Grid Pattern */}
            <pattern id="radarGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
            </pattern>

            {/* Flight Corridor Gradient */}
            <linearGradient id="corridorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
              <stop offset={`${ponrRatio * 100}%`} stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
            </linearGradient>

            {/* Soft Glow */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Background */}
          <rect width="800" height="500" fill="url(#radarGrid)" />

          {/* Range Distance Concentric Rings */}
          <circle
            cx={originPt.x}
            cy={originPt.y}
            r="120"
            fill="none"
            stroke="rgba(56, 189, 248, 0.08)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <circle
            cx={originPt.x}
            cy={originPt.y}
            r="240"
            fill="none"
            stroke="rgba(56, 189, 248, 0.05)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={originPt.x + 125} y={originPt.y + 4} fill="#64748B" fontSize="9" fontFamily="monospace">
            20 NM
          </text>
          <text x={originPt.x + 245} y={originPt.y + 4} fill="#64748B" fontSize="9" fontFamily="monospace">
            40 NM
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
                    fill={zone.type === "CLASS_B" ? "rgba(56, 189, 248, 0.03)" : "rgba(245, 158, 11, 0.02)"}
                    stroke={zone.type === "CLASS_B" ? "rgba(56, 189, 248, 0.25)" : "rgba(245, 158, 11, 0.2)"}
                    strokeWidth="1.5"
                    strokeDasharray={zone.type === "CLASS_B" ? "none" : "6 4"}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - r - 4}
                    fill={zone.type === "CLASS_B" ? "#7DD3FC" : "#FDE68A"}
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {zone.name.split(" ")[0]} ({zone.type.replace("_", "-")})
                  </text>
                </g>
              );
            })}

          {/* Active TFR Polygon Hull */}
          {hasActiveTfr && (
            <g>
              <polygon
                points="360,180 440,180 440,240 360,240"
                fill="rgba(244, 63, 94, 0.12)"
                stroke="#F43F5E"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                className="animate-pulse"
              />
              <text x="400" y="215" fill="#F43F5E" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                ⚠️ VIP TFR RESTRICTION
              </text>
            </g>
          )}

          {/* Wind Streamline Overlay */}
          {showWindVectors && (
            <g opacity="0.4">
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
                const len = 22;
                const dx = Math.sin(windRad) * len;
                const dy = -Math.cos(windRad) * len;

                return (
                  <g key={i} transform={`translate(${pos.x}, ${pos.y})`}>
                    <line x1="0" y1="0" x2={dx} y2={dy} stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 2" />
                    <circle cx={dx} cy={dy} r="2" fill="#38BDF8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Flight Corridor Buffer Track */}
          <line
            x1={originPt.x}
            y1={originPt.y}
            x2={destPt.x}
            y2={destPt.y}
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth="16"
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
            filter="url(#softGlow)"
          />

          {/* Dynamic Point of No Return (PONR) Marker */}
          <g transform={`translate(${ponrPt.x}, ${ponrPt.y})`}>
            <circle r="7" fill="none" stroke="#F59E0B" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
            <circle r="4.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="2" />
            <rect x="-42" y="-26" width="84" height="18" rx="9" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />
            <text x="0" y="-14" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              PONR {energy.pointOfNoReturnKm}km
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
            <circle r="6.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="-36" y="10" width="72" height="18" rx="9" fill="#0F172A" stroke="#10B981" strokeWidth="1" />
            <text x="0" y="22" fill="#10B981" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {origin.icao}
            </text>
          </g>

          {/* Destination Vertiport Node */}
          <g transform={`translate(${destPt.x}, ${destPt.y})`}>
            <circle r="6.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="-36" y="10" width="72" height="18" rx="9" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
            <text x="0" y="22" fill="#38BDF8" fontSize="9.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {destination.icao}
            </text>
          </g>
        </svg>
      </div>

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 p-2.5 px-4 rounded-full bg-slate-950/70 border border-white/10 text-[11px] font-mono backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Departure ({origin.icao})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> PONR Boundary
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Destination ({destination.icao})
          </span>
          {hasActiveTfr && (
            <span className="flex items-center gap-1.5 text-rose-400 font-bold">
              ⚠️ VIP TFR Alert
            </span>
          )}
        </div>

        <div className="text-slate-400">
          Corridor: <span className="text-cyan-300 font-bold">{mission.routeHeadingDeg}°</span> •{" "}
          <span className="text-cyan-300 font-bold">{mission.routeDistanceKm} km</span>
        </div>
      </div>
    </div>
  );
};