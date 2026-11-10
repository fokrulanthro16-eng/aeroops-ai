"use client";

import React, { useEffect } from "react";
import { AlertOctagon, Flame, X, ShieldAlert, ArrowRight } from "lucide-react";
import { InterruptionEvent } from "@/lib/pitch-sim/interruption-engine";

interface InterruptionAlertProps {
  interruption: InterruptionEvent | null;
  onDismiss: () => void;
  onAcknowledgeRebut: () => void;
}

export const InterruptionAlert: React.FC<InterruptionAlertProps> = ({
  interruption,
  onDismiss,
  onAcknowledgeRebut,
}) => {
  // Play cockpit master caution synthesizer beep
  useEffect(() => {
    if (!interruption) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // 880Hz / 440Hz dual-tone master caution chirp
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.26);
      }
    } catch {
      // AudioContext disallowed or muted
    }
  }, [interruption]);

  if (!interruption) return null;

  const isCritical = interruption.severity === "CRITICAL";

  return (
    <div className="w-full relative animate-in fade-in slide-in-from-top-3 duration-200">
      <div
        className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 shadow-2xl backdrop-blur-xl ${
          isCritical
            ? "border-red-500/80 bg-red-950/80 shadow-[0_0_35px_rgba(239,68,68,0.4)]"
            : "border-amber-500/80 bg-amber-950/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]"
        }`}
      >
        {/* Animated Strobe Header Bar */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 animate-pulse ${
            isCritical ? "bg-red-500" : "bg-amber-400"
          }`}
        />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg border shrink-0 animate-bounce ${
                isCritical
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-400"
              }`}
            >
              <AlertOctagon className="w-6 h-6" />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-white flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  MASTER CAUTION • VC INTERRUPT
                </span>

                <span
                  className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                    isCritical
                      ? "bg-red-500/30 text-red-200 border border-red-500/40"
                      : "bg-amber-500/30 text-amber-200 border border-amber-500/40"
                  }`}
                >
                  {interruption.ruleName}
                </span>
              </div>

              {/* Speaker Interjection */}
              <div className="text-base sm:text-lg font-bold text-white mt-1">
                <span
                  style={{ color: interruption.interruptingPersona.themeColor }}
                  className="font-extrabold mr-1.5"
                >
                  {interruption.interruptingPersona.shortName}:
                </span>
                &ldquo;{interruption.interjectionText}&rdquo;
              </div>

              {/* Offending Statement Quote */}
              <div className="mt-2 text-xs font-mono p-2.5 rounded-lg bg-black/50 border border-slate-800 text-slate-300 flex flex-col gap-1">
                <div className="text-slate-400 text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>Offending Founder Trigger / Phrase:</span>
                </div>
                <div className="text-red-300 font-semibold italic">
                  &ldquo;{interruption.offendingSnippet}&rdquo;
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Dismiss Alert"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Footer Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-white/10">
          <button
            onClick={onDismiss}
            className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Acknowledge
          </button>
          <button
            onClick={onAcknowledgeRebut}
            className={`px-4 py-1.5 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md ${
              isCritical
                ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/50"
                : "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/50"
            }`}
          >
            <span>Rebut & Explain Boundary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
