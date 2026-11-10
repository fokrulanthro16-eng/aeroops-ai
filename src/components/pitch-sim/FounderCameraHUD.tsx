"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  FlipHorizontal,
  Eye,
  Crosshair,
  Gauge,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface FounderCameraHUDProps {
  wpm: number;
  wpmZone: "SLOW" | "OPTIMAL" | "RUSHED";
  presenceScore?: number;
  visualComment?: string | null;
  onFrameCaptureReady?: (captureFn: () => string | null) => void;
  className?: string;
}

export const FounderCameraHUD: React.FC<FounderCameraHUDProps> = ({
  wpm,
  wpmZone,
  presenceScore = 84,
  visualComment,
  onFrameCaptureReady,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reticleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMirrored, setIsMirrored] = useState(true);
  const [showReticle, setShowReticle] = useState(true);
  const [showPrompter, setShowPrompter] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [liveEyeContactPct, setLiveEyeContactPct] = useState(85);

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("[Camera HUD access failed]:", err);
      setCameraError("Camera unavailable or permission denied. Using synthetic presence telemetry.");
      setIsCameraActive(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    // Attempt auto-start camera on mount
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Frame capture function for Nebius Vision API
  const captureFrameBase64 = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;

    try {
      const width = 360;
      const height = 240;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Draw scaled video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);
      return canvas.toDataURL("image/jpeg", 0.65);
    } catch (err) {
      console.warn("[Capture frame error]:", err);
      return null;
    }
  }, []);

  // Expose capture function to parent
  useEffect(() => {
    if (onFrameCaptureReady) {
      onFrameCaptureReady(captureFrameBase64);
    }
  }, [onFrameCaptureReady, captureFrameBase64]);

  // Tactical Reticle & Eye-Tracking Animation
  useEffect(() => {
    const canvas = reticleCanvasRef.current;
    if (!canvas || !showReticle) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let tick = 0;

    const renderReticle = () => {
      tick += 0.03;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 - h * 0.06; // Eye level slightly above center

      // Subtle breathing motion for head-box bounding box
      const boxW = w * 0.44 + Math.sin(tick) * 2;
      const boxH = h * 0.6 + Math.cos(tick) * 2;
      const left = cx - boxW / 2;
      const top = cy - boxH / 2;

      // 4 Corner Brackets
      ctx.strokeStyle = "rgba(6, 182, 212, 0.55)"; // Cyan
      ctx.lineWidth = 1.5;
      const len = 20;

      // Top-Left
      ctx.beginPath();
      ctx.moveTo(left, top + len);
      ctx.lineTo(left, top);
      ctx.lineTo(left + len, top);
      ctx.stroke();

      // Top-Right
      ctx.beginPath();
      ctx.moveTo(left + boxW - len, top);
      ctx.lineTo(left + boxW, top);
      ctx.lineTo(left + boxW, top + len);
      ctx.stroke();

      // Bottom-Left
      ctx.beginPath();
      ctx.moveTo(left, top + boxH - len);
      ctx.lineTo(left, top + boxH);
      ctx.lineTo(left + len, top + boxH);
      ctx.stroke();

      // Bottom-Right
      ctx.beginPath();
      ctx.moveTo(left + boxW - len, top + boxH);
      ctx.lineTo(left + boxW, top + boxH);
      ctx.lineTo(left + boxW, top + boxH - len);
      ctx.stroke();

      // Center Eye-Level Optical Reticle
      const eyeY = cy - boxH * 0.15;
      ctx.strokeStyle = "rgba(16, 185, 129, 0.4)"; // Emerald
      ctx.beginPath();
      ctx.arc(cx, eyeY, 12 + Math.sin(tick * 2) * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = "rgba(16, 185, 129, 0.7)";
      ctx.beginPath();
      ctx.arc(cx, eyeY, 2, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal Eye Horizon Line
      ctx.strokeStyle = "rgba(16, 185, 129, 0.25)";
      ctx.beginPath();
      ctx.moveTo(cx - 35, eyeY);
      ctx.lineTo(cx + 35, eyeY);
      ctx.stroke();

      animId = requestAnimationFrame(renderReticle);
    };

    renderReticle();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [showReticle]);

  // Adjust reticle canvas on resize
  useEffect(() => {
    const handleResize = () => {
      if (reticleCanvasRef.current) {
        reticleCanvasRef.current.width = reticleCanvasRef.current.clientWidth;
        reticleCanvasRef.current.height = reticleCanvasRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col group ${
        isFullscreen ? "fixed inset-4 z-50 bg-black/95" : ""
      } ${className}`}
    >
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Video Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
        {isCameraActive ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover transition-transform duration-300 ${
              isMirrored ? "scale-x-[-1]" : ""
            }`}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500 font-mono">
            <VideoOff className="w-12 h-12 text-slate-700 mb-2" />
            <span className="text-xs font-semibold text-slate-400">CAMERA STREAM STANDBY</span>
            <span className="text-[10px] text-slate-600 mt-1 max-w-xs">
              {cameraError || "Enable camera to engage Nebius Vision real-time eye contact & posture analysis."}
            </span>
            <button
              onClick={startCamera}
              className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-all"
            >
              Start Live Camera
            </button>
          </div>
        )}

        {/* Reticle Overlay Canvas */}
        {isCameraActive && showReticle && (
          <canvas
            ref={reticleCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />
        )}

        {/* Top Avionics Video Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono font-bold text-white shadow-lg">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE FOUNDER CAM</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-400 font-semibold">HD 720p</span>
            </span>

            {isCameraActive && (
              <span className="px-2 py-1 rounded-full bg-black/70 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                <Crosshair className="w-3 h-3 text-cyan-400" />
                <span>RETICLE LOCKED</span>
              </span>
            )}
          </div>

          {/* Eye Contact & Presence Telemetry Pill */}
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                presenceScore >= 75
                  ? "border-emerald-500/50 text-emerald-300"
                  : presenceScore >= 55
                  ? "border-amber-500/50 text-amber-300"
                  : "border-red-500/50 text-red-300"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>PRESENCE: {presenceScore}%</span>
            </span>

            <span
              className={`px-2 py-1 rounded-full bg-black/70 backdrop-blur-md border text-[10px] font-mono ${
                wpmZone === "OPTIMAL"
                  ? "border-emerald-500/50 text-emerald-300"
                  : "border-slate-700 text-slate-300"
              }`}
            >
              {wpm} WPM
            </span>
          </div>
        </div>

        {/* Translucent Eye-Level Teleprompter (Positioned directly below camera lens) */}
        {showPrompter && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-[85%] max-w-md p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-center pointer-events-none z-20 transition-all">
            <div className="text-[9px] font-mono uppercase tracking-widest text-cyan-400/90 mb-0.5 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Eye-Level Focus Anchor (Look Directly into the Lens)</span>
            </div>
            <p className="text-[11px] text-slate-200 font-medium leading-snug">
              &ldquo;Deterministic QNX kernel decides, Gemini explains. Wedge in Part 108 BVLOS at $1,200-$3,500 ARR/tail.&rdquo;
            </p>
          </div>
        )}

        {/* Bottom Vision Feedback Banner */}
        {visualComment && (
          <div className="absolute bottom-3 left-3 right-3 p-2 rounded-lg bg-black/75 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-200 pointer-events-none z-20 flex items-center gap-2">
            <span className="text-cyan-400 font-bold shrink-0">NEBIUS VISION:</span>
            <span className="truncate italic">&ldquo;{visualComment}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Camera Control Deck */}
      <div className="px-3 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => (isCameraActive ? stopCamera() : startCamera())}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all ${
              isCameraActive
                ? "bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300"
                : "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/40 text-emerald-300"
            }`}
          >
            {isCameraActive ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            <span>{isCameraActive ? "Stop Cam" : "Start Cam"}</span>
          </button>

          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMirrored
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Mirror Video Feed"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowReticle(!showReticle)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showReticle
                ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Toggle Reticle Overlay"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setShowPrompter(!showPrompter)}
            className={`p-1.5 rounded-lg border transition-colors ${
              showPrompter
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Toggle Eye-Level Prompter"
          >
            {showPrompter ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">
            {isCameraActive ? "Vision Streaming: 8s Delta" : "Camera Standby"}
          </span>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Boardroom"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
