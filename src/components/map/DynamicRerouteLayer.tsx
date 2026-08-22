"use client";

import React from "react";
import { InFlightTelemetry, MicroWeatherSegment } from "@/types/aviation";

interface DynamicRerouteLayerProps {
  telemetry?: InFlightTelemetry;
  microWeatherSegments?: MicroWeatherSegment[];
  originPt: { x: number; y: number };
  destPt: { x: number; y: number };
  alternatePt?: { x: number; y: number };
  isDiverting?: boolean;
}

export const DynamicRerouteLayer: React.FC<DynamicRerouteLayerProps> = ({
  telemetry,
  microWeatherSegments = [],
  originPt,
  destPt,
  alternatePt = { x: 480, y: 150 }, // Project coord for KBUR
  isDiverting = false,
}) => {
  if (!telemetry) return null;

  // Calculate live interpolated aircraft point
  const totalDist = 38.5; // default fallback
  const progressRatio = Math.min(1, Math.max(0, telemetry.distanceFlownKm / Math.max(1, totalDist)));
  const liveX = originPt.x + (destPt.x - originPt.x) * progressRatio;
  const liveY = originPt.y + (destPt.y - originPt.y) * progressRatio;

  return (
    <g>
      {/* 1. Urban Canyon Venturi Turbulence Sectors */}
      {microWeatherSegments.map((seg, idx) => {
        if (!seg.hasVenturiAlert && seg.turbulenceLevel !== "SEVERE") return null;

        const segStartRatio = seg.startKm / totalDist;
        const segEndRatio = seg.endKm / totalDist;

        const sx = originPt.x + (destPt.x - originPt.x) * segStartRatio;
        const sy = originPt.y + (destPt.y - originPt.y) * segStartRatio;
        const ex = originPt.x + (destPt.x - originPt.x) * segEndRatio;
        const ey = originPt.y + (destPt.y - originPt.y) * segEndRatio;

        return (
          <g key={seg.segmentId}>
            {/* Venturi Turbulence Corridor Tube */}
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke="rgba(245, 158, 11, 0.35)"
              strokeWidth="24"
              strokeDasharray="4 4"
            />
            <text
              x={(sx + ex) / 2 + 15}
              y={(sy + ey) / 2}
              fill="#F59E0B"
              fontSize="9"
              fontFamily="monospace"
              fontWeight="bold"
            >
              ⚠️ VENTURI TURBULENCE ({seg.amplifiedWindKt} kt)
            </text>
          </g>
        );
      })}

      {/* 2. In-Air Dynamic Diversion Polyline */}
      {isDiverting && (
        <g>
          {/* Diversion Vector Path to Alternate */}
          <line
            x1={liveX}
            y1={liveY}
            x2={alternatePt.x}
            y2={alternatePt.y}
            stroke="#F59E0B"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="animate-pulse"
          />

          {/* Alternate Vertiport Target Pin */}
          <g transform={`translate(${alternatePt.x}, ${alternatePt.y})`}>
            <circle r="9" fill="none" stroke="#F59E0B" strokeWidth="2" className="animate-ping" />
            <circle r="6" fill="#F59E0B" stroke="#0F141C" strokeWidth="2" />
            <rect x="-45" y="-28" width="90" height="18" rx="4" fill="#0F141C" stroke="#F59E0B" strokeWidth="1" />
            <text x="0" y="-16" fill="#F59E0B" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              DIVERT: KBUR (ALT)
            </text>
          </g>
        </g>
      )}

      {/* 3. Live Aircraft 1Hz Node with Vector Pulse */}
      <g transform={`translate(${liveX}, ${liveY})`}>
        <circle r="14" fill="none" stroke="#10B981" strokeWidth="1.5" className="animate-ping" opacity="0.6" />
        <circle r="6" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
        <rect x="-40" y="12" width="80" height="16" rx="3" fill="#0F141C" stroke="#10B981" strokeWidth="1" />
        <text x="0" y="23" fill="#10B981" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
          ALT: {telemetry.currentAltitudeFt}ft | {telemetry.liveBatterySoc}%
        </text>
      </g>
    </g>
  );
};