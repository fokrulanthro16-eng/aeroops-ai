"use client";

import React from "react";

interface RadialGaugeProps {
  value: number; // 0 to 100 or actual
  max?: number;
  label: string;
  unit?: string;
  color?: "cyan" | "emerald" | "amber" | "red";
  size?: number;
  strokeWidth?: number;
  subtext?: string;
}

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  value,
  max = 100,
  label,
  unit = "%",
  color = "cyan",
  size = 120,
  strokeWidth = 8,
  subtext,
}) => {
  const normalizedValue = Math.min(max, Math.max(0, value));
  const percentage = (normalizedValue / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc is 240 degrees (leaving a gap at bottom)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  const colorStyles = {
    cyan: {
      stroke: "#06B6D4",
      glow: "rgba(6, 182, 212, 0.4)",
      text: "text-cyan-400",
    },
    emerald: {
      stroke: "#10B981",
      glow: "rgba(16, 185, 129, 0.4)",
      text: "text-emerald-400",
    },
    amber: {
      stroke: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.4)",
      text: "text-amber-400",
    },
    red: {
      stroke: "#EF4444",
      glow: "rgba(239, 68, 68, 0.4)",
      text: "text-red-400",
    },
  }[color];

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-[135deg]"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#1E293B"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          {/* Active Gauge Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colorStyles.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${colorStyles.glow})`,
              transition: "stroke-dashoffset 0.5s ease-out",
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-xl font-bold font-mono tracking-tight ${colorStyles.text}`}>
            {value}
            <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-0.5">
            {label}
          </span>
        </div>
      </div>
      {subtext && (
        <span className="text-[11px] text-slate-400 font-mono mt-1 text-center">
          {subtext}
        </span>
      )}
    </div>
  );
};