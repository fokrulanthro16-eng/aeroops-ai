"use client";

import React from "react";

interface RadialGaugeProps {
  value: number;
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
  size = 110,
  strokeWidth = 7,
  subtext,
}) => {
  const normalizedValue = Math.min(max, Math.max(0, value));
  const percentage = (normalizedValue / max) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * percentage) / 100;

  const colorStyles = {
    cyan: {
      stroke: "#38BDF8",
      glow: "rgba(56, 189, 248, 0.35)",
      text: "text-cyan-300",
    },
    emerald: {
      stroke: "#10B981",
      glow: "rgba(16, 185, 129, 0.35)",
      text: "text-emerald-300",
    },
    amber: {
      stroke: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.35)",
      text: "text-amber-300",
    },
    red: {
      stroke: "#F43F5E",
      glow: "rgba(244, 63, 94, 0.35)",
      text: "text-rose-300",
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
            stroke="rgba(255, 255, 255, 0.08)"
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
              transition: "stroke-dashoffset 0.6s ease-out",
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`text-xl font-black font-mono tracking-tight ${colorStyles.text}`}>
            {value}
            <span className="text-[11px] font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
          <span className="text-[9px] uppercase font-sans font-semibold tracking-wider text-slate-400 mt-0.5">
            {label}
          </span>
        </div>
      </div>
      {subtext && (
        <span className="text-[10px] text-slate-400 font-mono mt-1 text-center">
          {subtext}
        </span>
      )}
    </div>
  );
};