"use client";

import React, { useEffect, useState, useRef } from "react";
import { VCFacialState } from "@/lib/pitch-sim/personas";
import { Volume2, Mic, Eye, FileEdit, AlertOctagon } from "lucide-react";

interface AnimatedVCAvatarProps {
  personaId: string;
  name: string;
  title: string;
  firm: string;
  themeColor: string;
  facialState: VCFacialState;
  isSpeaking: boolean;
  isInterrupting: boolean;
  className?: string;
}

export const AnimatedVCAvatar: React.FC<AnimatedVCAvatarProps> = ({
  personaId,
  name,
  title,
  firm,
  themeColor,
  facialState,
  isSpeaking,
  isInterrupting,
  className = "",
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthShapeIndex, setMouthShapeIndex] = useState(0);

  // Eye blinking cycle
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const scheduleBlink = () => {
      const nextDelay = 2800 + Math.random() * 3200;
      blinkTimer = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 160);
      }, nextDelay);
    };

    scheduleBlink();
    return () => clearTimeout(blinkTimer);
  }, []);

  // Lip-sync mouth animation loop when speaking
  useEffect(() => {
    let animId: NodeJS.Timeout;
    if (isSpeaking) {
      animId = setInterval(() => {
        setMouthShapeIndex((prev) => (prev + 1) % 4);
      }, 110);
    } else {
      setMouthShapeIndex(0);
    }
    return () => clearInterval(animId);
  }, [isSpeaking]);

  // Head posture style transforms
  let headTransform = "translate(0px, 0px) rotate(0deg) scale(1)";
  if (facialState === "NODDING_APPROVAL") {
    headTransform = "translate(0px, 2px) rotate(0.5deg)";
  } else if (facialState === "SKEPTICAL_SQUINT") {
    headTransform = "translate(2px, -1px) rotate(2deg)";
  } else if (facialState === "LEANING_IN_INTERRUPT" || isInterrupting) {
    headTransform = "translate(0px, -4px) scale(1.04)";
  } else if (facialState === "TAKING_NOTES") {
    headTransform = "translate(0px, 4px) rotate(-1.5deg)";
  }

  // Eye height for squint / blink
  const eyeHeight = isBlinking ? 1 : facialState === "SKEPTICAL_SQUINT" ? 3.5 : 7;
  const pupilOffset = facialState === "TAKING_NOTES" ? 2.5 : 0;

  // Mouth path calculation
  const getMouthPath = () => {
    if (!isSpeaking) {
      if (facialState === "NODDING_APPROVAL") {
        return "M 88 126 Q 100 132 112 126"; // subtle smile
      }
      if (facialState === "SKEPTICAL_SQUINT") {
        return "M 88 127 Q 100 124 112 127"; // skeptical straight line
      }
      return "M 89 126 Q 100 128 111 126"; // neutral closed
    }

    // Phonetic speech cycling shapes: 0=open oval, 1=wide, 2=narrow round, 3=semi-open
    switch (mouthShapeIndex) {
      case 0:
        return "M 88 124 Q 100 135 112 124 Q 100 130 88 124"; // Open talk
      case 1:
        return "M 86 125 Q 100 138 114 125 Q 100 128 86 125"; // Wide vowel
      case 2:
        return "M 92 124 Q 100 133 108 124 Q 100 131 92 124"; // Round 'O'
      case 3:
      default:
        return "M 88 125 Q 100 132 112 125 Q 100 129 88 125"; // Semi-open
    }
  };

  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden border bg-gradient-to-b from-slate-900 via-slate-950 to-black select-none flex flex-col justify-between ${
        isInterrupting
          ? "border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.45)] ring-2 ring-red-500/50"
          : isSpeaking
          ? "border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400/50"
          : "border-slate-800/80 hover:border-slate-700"
      } ${className}`}
    >
      {/* Background: Executive Boardroom Office Blur Lighting */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute -top-10 -left-10 w-36 h-36 rounded-full blur-3xl"
          style={{ backgroundColor: `${themeColor}25` }}
        />
        <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full blur-3xl bg-indigo-900/15" />
        {/* Subtle office window blinds silhouette */}
        <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_16px]" />
      </div>

      {/* Top HUD Badges */}
      <div className="relative z-10 px-2.5 pt-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-slate-300">
          <span
            className={`h-2 w-2 rounded-full ${
              isSpeaking
                ? "bg-emerald-400 animate-ping"
                : isInterrupting
                ? "bg-red-500 animate-pulse"
                : "bg-slate-500"
            }`}
          />
          <span className="font-semibold">{isSpeaking ? "SPEAKING" : isInterrupting ? "INTERRUPT" : "VC ONLINE"}</span>
        </div>

        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
          {facialState === "LEANING_IN_INTERRUPT" ? (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <AlertOctagon className="w-3 h-3" />
              <span>CAUTION</span>
            </span>
          ) : facialState === "SKEPTICAL_SQUINT" ? (
            <span className="text-amber-300 flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>SKEPTIC</span>
            </span>
          ) : facialState === "TAKING_NOTES" ? (
            <span className="text-purple-300 flex items-center gap-1">
              <FileEdit className="w-3 h-3" />
              <span>NOTES</span>
            </span>
          ) : facialState === "NODDING_APPROVAL" ? (
            <span className="text-emerald-300 flex items-center gap-1">
              <span>APPROVAL</span>
            </span>
          ) : (
            <span className="text-slate-400">1080p HD</span>
          )}
        </div>
      </div>

      {/* Main Animated Human Executive SVG Avatar */}
      <div className="relative z-0 flex-1 flex items-center justify-center overflow-hidden py-1">
        <svg
          viewBox="0 0 200 180"
          className="w-full h-full max-h-[145px] transition-transform duration-300"
          style={{ transform: headTransform }}
        >
          <defs>
            {/* Skin Tone Gradient */}
            <linearGradient id={`skin-${personaId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              {personaId === "sarah-chen" ? (
                <>
                  <stop offset="0%" stopColor="#fae0d4" />
                  <stop offset="100%" stopColor="#eec5b4" />
                </>
              ) : personaId === "marcus-vance" ? (
                <>
                  <stop offset="0%" stopColor="#8d5538" />
                  <stop offset="100%" stopColor="#6e3d24" />
                </>
              ) : personaId === "viktor-krenz" ? (
                <>
                  <stop offset="0%" stopColor="#edd8c8" />
                  <stop offset="100%" stopColor="#d5baaa" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#f7d9c4" />
                  <stop offset="100%" stopColor="#e8be9e" />
                </>
              )}
            </linearGradient>

            {/* Suit Gradient */}
            <linearGradient id={`suit-${personaId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {personaId === "sarah-chen" ? (
                <>
                  <stop offset="0%" stopColor="#2c3038" />
                  <stop offset="100%" stopColor="#14171d" />
                </>
              ) : personaId === "marcus-vance" ? (
                <>
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </>
              ) : personaId === "viktor-krenz" ? (
                <>
                  <stop offset="0%" stopColor="#242831" />
                  <stop offset="100%" stopColor="#12151b" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#1e3a5f" />
                  <stop offset="100%" stopColor="#0d1b2a" />
                </>
              )}
            </linearGradient>
          </defs>

          {/* Shoulders & Executive Suit */}
          <path
            d="M 30 180 Q 55 140 100 140 Q 145 140 170 180 Z"
            fill={`url(#suit-${personaId})`}
          />

          {/* Shirt Collar / Tie */}
          {personaId === "marcus-vance" ? (
            <>
              {/* White Shirt Collar */}
              <polygon points="86,140 100,160 114,140 100,146" fill="#f8fafc" />
              {/* Burgundy FAA Tie */}
              <polygon points="97,146 103,146 105,178 95,178" fill="#991b1b" />
            </>
          ) : personaId === "sarah-chen" ? (
            <>
              {/* Elegant Silk Blouse V-Neck */}
              <polygon points="90,140 100,158 110,140" fill="#38bdf8" opacity="0.8" />
            </>
          ) : personaId === "viktor-krenz" ? (
            <>
              {/* Charcoal Mock Turtleneck */}
              <rect x="88" y="136" width="24" height="12" rx="3" fill="#18181b" />
            </>
          ) : (
            <>
              {/* Light Blue Crisp Open-Collar Shirt */}
              <polygon points="88,140 100,155 112,140 100,144" fill="#e0f2fe" />
            </>
          )}

          {/* Neck */}
          <rect x="91" y="118" width="18" height="24" rx="3" fill={`url(#skin-${personaId})`} />

          {/* Head Shape */}
          <ellipse cx="100" cy="94" rx="32" ry="38" fill={`url(#skin-${personaId})`} />

          {/* Ears */}
          <ellipse cx="67" cy="96" rx="5" ry="9" fill={`url(#skin-${personaId})`} />
          <ellipse cx="133" cy="96" rx="5" ry="9" fill={`url(#skin-${personaId})`} />

          {/* Hair Stying per Persona */}
          {personaId === "sarah-chen" ? (
            // Sleek Dark Bob with Side Part
            <path
              d="M 66 95 C 64 68 78 52 100 52 C 122 52 136 68 134 95 C 132 105 128 115 124 116 C 122 96 118 70 100 70 C 82 70 78 96 76 116 C 72 115 68 105 66 95 Z"
              fill="#18181b"
            />
          ) : personaId === "marcus-vance" ? (
            // Distinguished Salt & Pepper Side-Sweep
            <>
              <path
                d="M 68 85 C 66 65 78 54 100 54 C 122 54 134 65 132 85 C 128 64 116 60 100 60 C 84 60 72 64 68 85 Z"
                fill="#475569"
              />
              {/* Silver Temple Accents */}
              <path d="M 68 88 Q 72 75 78 72" stroke="#cbd5e1" strokeWidth="2" fill="none" />
              <path d="M 132 88 Q 128 75 122 72" stroke="#cbd5e1" strokeWidth="2" fill="none" />
            </>
          ) : personaId === "viktor-krenz" ? (
            // Silver-Grey Receding Hair & Trimmed Goatee
            <>
              <path
                d="M 70 85 C 68 66 78 58 100 58 C 122 58 132 66 130 85 C 126 66 114 64 100 64 C 86 64 74 66 70 85 Z"
                fill="#64748b"
              />
              {/* Goatee / Beard */}
              <ellipse cx="100" cy="126" rx="11" ry="8" fill="#475569" opacity="0.8" />
            </>
          ) : (
            // Jason Kraus: Modern Structured Brown Pompadour
            <path
              d="M 68 82 C 66 62 76 50 100 48 C 124 50 134 62 132 82 C 128 60 118 56 100 56 C 82 56 72 60 68 82 Z"
              fill="#3e2723"
            />
          )}

          {/* Eyebrows */}
          <path
            d={
              facialState === "SKEPTICAL_SQUINT"
                ? "M 80 81 Q 88 77 94 82" // Left raised
                : "M 81 83 Q 88 81 94 83"
            }
            stroke="#27272a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 106 83 Q 112 81 119 83"
            stroke="#27272a"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyeglasses for Sarah Chen & Dr. Viktor Krenz */}
          {(personaId === "sarah-chen" || personaId === "viktor-krenz") && (
            <g stroke="#94a3b8" strokeWidth="1.5" fill="none">
              <rect x="76" y="85" width="20" height="14" rx="4" />
              <rect x="104" y="85" width="20" height="14" rx="4" />
              <line x1="96" y1="91" x2="104" y2="91" />
              <line x1="68" y1="89" x2="76" y2="90" />
              <line x1="124" y1="90" x2="132" y2="89" />
            </g>
          )}

          {/* Eyes & Blinking */}
          <ellipse
            cx="87"
            cy={91 + pupilOffset}
            rx="5.5"
            ry={eyeHeight}
            fill="#ffffff"
          />
          <ellipse
            cx="113"
            cy={91 + pupilOffset}
            rx="5.5"
            ry={eyeHeight}
            fill="#ffffff"
          />

          {!isBlinking && (
            <>
              {/* Pupils */}
              <circle
                cx="87"
                cy={91 + pupilOffset}
                r="3"
                fill={personaId === "sarah-chen" ? "#18181b" : "#1e293b"}
              />
              <circle
                cx="113"
                cy={91 + pupilOffset}
                r="3"
                fill={personaId === "sarah-chen" ? "#18181b" : "#1e293b"}
              />
              {/* Eye Light Reflection Dot */}
              <circle cx="88.5" cy={89.5 + pupilOffset} r="1" fill="#ffffff" />
              <circle cx="114.5" cy={89.5 + pupilOffset} r="1" fill="#ffffff" />
            </>
          )}

          {/* Nose */}
          <path
            d="M 100 93 L 98 107 L 103 107"
            stroke="#ba8f79"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Animated Speaking / Reacting Mouth */}
          <path
            d={getMouthPath()}
            stroke={isSpeaking ? "#991b1b" : "#8d5b4c"}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill={isSpeaking ? "#7f1d1d" : "none"}
          />
        </svg>
      </div>

      {/* Bottom Conference Call Card HUD */}
      <div className="relative z-10 px-2.5 py-1.5 bg-black/75 backdrop-blur-md border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px] font-mono">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold text-white truncate">{name}</span>
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: themeColor }}
            />
          </div>
          <span className="text-[9px] text-slate-400 truncate">
            {title} • {firm}
          </span>
        </div>

        {/* Live Speaking Equalizer Bars */}
        {isSpeaking ? (
          <div className="flex items-end gap-0.5 h-3.5 shrink-0 px-1">
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2" style={{ animationDelay: "0ms" }} />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3.5" style={{ animationDelay: "150ms" }} />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-2.5" style={{ animationDelay: "300ms" }} />
            <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" style={{ animationDelay: "75ms" }} />
          </div>
        ) : (
          <Volume2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
        )}
      </div>
    </div>
  );
};
