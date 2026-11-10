"use client";

import React, { useEffect, useRef } from "react";

export type AudioSpeakerState = "FOUNDER_SPEAKING" | "VC_SPEAKING" | "VC_INTERRUPTING" | "IDLE";

interface WaveformCanvasProps {
  speakerState: AudioSpeakerState;
  analyserNode: AnalyserNode | null;
  height?: number;
  className?: string;
  activePersonaColor?: string;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  speakerState,
  analyserNode,
  height = 96,
  className = "",
  activePersonaColor = "#f59e0b",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      ctx.clearRect(0, 0, width, h);

      // Background subtle grid lines
      ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(0, centerY - h / 4);
      ctx.lineTo(width, centerY - h / 4);
      ctx.moveTo(0, centerY + h / 4);
      ctx.lineTo(width, centerY + h / 4);
      ctx.stroke();

      // Determine wave styling based on speaker state
      let primaryColor = "rgba(6, 182, 212, 0.7)"; // Cyan idle
      let secondaryColor = "rgba(14, 165, 233, 0.3)";
      let waveSpeed = 0.04;
      let amplitude = 6;
      let numBars = 64;

      if (speakerState === "FOUNDER_SPEAKING") {
        primaryColor = "rgba(16, 185, 129, 0.95)"; // Emerald
        secondaryColor = "rgba(5, 150, 105, 0.35)";
        waveSpeed = 0.08;
        amplitude = 24;
      } else if (speakerState === "VC_INTERRUPTING") {
        primaryColor = "rgba(239, 68, 68, 0.95)"; // Crimson
        secondaryColor = "rgba(220, 38, 38, 0.45)";
        waveSpeed = 0.16;
        amplitude = 36;
      } else if (speakerState === "VC_SPEAKING") {
        primaryColor = activePersonaColor || "rgba(245, 158, 11, 0.95)"; // Amber
        secondaryColor = "rgba(217, 119, 6, 0.35)";
        waveSpeed = 0.09;
        amplitude = 28;
      }

      phaseRef.current += waveSpeed;
      const phase = phaseRef.current;

      // If we have live Web Audio AnalyserNode data
      let liveFreqData: Uint8Array | null = null;
      if (analyserNode && speakerState === "FOUNDER_SPEAKING") {
        try {
          const bufferLength = analyserNode.frequencyBinCount;
          liveFreqData = new Uint8Array(bufferLength);
          analyserNode.getByteFrequencyData(liveFreqData);
        } catch {
          liveFreqData = null;
        }
      }

      // Draw dual-channel mirrored frequency bars
      const barWidth = width / numBars;
      const barGap = 2;
      const effectiveWidth = Math.max(1, barWidth - barGap);

      for (let i = 0; i < numBars; i++) {
        let barHeight = 0;

        if (liveFreqData && liveFreqData.length > 0) {
          const dataIndex = Math.floor((i / numBars) * (liveFreqData.length / 2));
          const val = liveFreqData[dataIndex] || 0;
          barHeight = (val / 255) * (centerY - 8);
        } else {
          // Synthetic high-fidelity sinusoidal harmonic calculation
          const harmonic1 = Math.sin(i * 0.18 + phase) * amplitude;
          const harmonic2 = Math.cos(i * 0.32 - phase * 1.5) * (amplitude * 0.6);
          const harmonic3 = Math.sin(i * 0.08 + phase * 0.7) * (amplitude * 0.3);
          const rawHeight = Math.abs(harmonic1 + harmonic2 + harmonic3);
          barHeight = Math.max(3, rawHeight);
        }

        // Add taper at edges
        const edgeTaper = Math.sin((i / numBars) * Math.PI);
        barHeight = barHeight * edgeTaper;

        const x = i * barWidth;
        const topY = centerY - barHeight;
        const bottomY = centerY;

        // Gradient for bars
        const grad = ctx.createLinearGradient(0, topY, 0, centerY + barHeight);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(0.5, secondaryColor);
        grad.addColorStop(1, primaryColor);

        ctx.fillStyle = grad;
        // Upper bar
        ctx.fillRect(x, topY, effectiveWidth, barHeight);
        // Lower mirrored bar
        ctx.fillRect(x, bottomY, effectiveWidth, barHeight);
      }

      // Draw continuous oscilloscope wave overlay
      ctx.beginPath();
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x += 4) {
        const norm = x / width;
        const sineWave = Math.sin(norm * 14 + phase * 2) * Math.cos(norm * 8 - phase) * (amplitude * 0.8);
        const y = centerY + sineWave * Math.sin(norm * Math.PI);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [speakerState, analyserNode, activePersonaColor]);

  // Adjust canvas pixel buffer on mount / resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`relative w-full rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/80 backdrop-blur-md ${className}`}
      style={{ height: `${height}px` }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Real-time Oscilloscope HUD Telemetry Badges */}
      <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
        <span className="flex h-2 w-2 relative">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              speakerState === "FOUNDER_SPEAKING"
                ? "bg-emerald-400"
                : speakerState === "VC_INTERRUPTING"
                ? "bg-red-500"
                : speakerState === "VC_SPEAKING"
                ? "bg-amber-400"
                : "bg-cyan-400"
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              speakerState === "FOUNDER_SPEAKING"
                ? "bg-emerald-500"
                : speakerState === "VC_INTERRUPTING"
                ? "bg-red-500"
                : speakerState === "VC_SPEAKING"
                ? "bg-amber-500"
                : "bg-cyan-500"
            }`}
          />
        </span>
        <span className="text-[10px] font-mono tracking-wider font-semibold uppercase text-slate-300">
          {speakerState === "FOUNDER_SPEAKING"
            ? "FOUNDER AUDIO STREAM [ACTIVE]"
            : speakerState === "VC_INTERRUPTING"
            ? "VC INTERRUPT ACTIVE [STROBE]"
            : speakerState === "VC_SPEAKING"
            ? "VC AUDIO SYNTHESIS [TRANSMITTING]"
            : "AUDIO ENGINE STANDBY [READY]"}
        </span>
      </div>

      <div className="absolute top-2 right-3 flex items-center gap-2 text-[10px] font-mono text-slate-500 pointer-events-none">
        <span>60 FPS</span>
        <span>•</span>
        <span>48 kHz</span>
        <span>•</span>
        <span className="text-slate-400">
          {speakerState === "FOUNDER_SPEAKING"
            ? "-12.4 dB"
            : speakerState === "VC_INTERRUPTING"
            ? "+3.2 dB (PEAK)"
            : speakerState === "VC_SPEAKING"
            ? "-8.1 dB"
            : "-48.0 dB (FLOOR)"}
        </span>
      </div>
    </div>
  );
};
