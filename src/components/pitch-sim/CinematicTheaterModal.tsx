"use client";

import React, { useState, useEffect } from "react";
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Download,
  FileText,
  Sliders,
  Sparkles,
  Shield,
  Layers,
  Radio,
  ExternalLink,
  ChevronRight,
  Maximize2,
  X,
  Volume1,
} from "lucide-react";
import {
  cinematicAudioPipeline,
  MASTERCLASS_SCENES,
  MasterclassScene,
  AudioPlaybackState,
} from "@/lib/media/cinematic-audio";

interface CinematicTheaterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CinematicTheaterModal: React.FC<CinematicTheaterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(
    cinematicAudioPipeline.getState()
  );
  const [activeTab, setActiveTab] = useState<"VOICEOVER" | "PROMPTS" | "TECHNICAL">(
    "VOICEOVER"
  );
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = cinematicAudioPipeline.subscribe((state) => {
      setPlaybackState(state);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentScene = playbackState.activeScene;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const formatElapsed = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-6xl my-auto rounded-3xl bg-[#070B14] border border-cyan-500/30 shadow-[0_0_80px_rgba(0,242,254,0.15)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide font-sans">
                  8K Masterclass Cinematic Video & Voiceover Assets
                </h2>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-cyan-500/15 border border-cyan-400/40 text-cyan-300">
                  8K UHD • 2.39:1 ANAMORPHIC
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-semibold bg-indigo-500/15 border border-indigo-400/40 text-indigo-300 hidden md:inline">
                  60 FPS • REC.2020 ACES
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Executive technical teaser script and broadcast-grade audio pipeline for AeroOps AI v3.0
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/assets/video/storyboard-manifest.json"
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 transition"
              title="Download JSON Manifest"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Manifest.json</span>
            </a>
            <a
              href="/assets/video/generate-prompts.txt"
              download
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-xs font-mono text-slate-300 transition"
              title="Download Prompts Bank"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Prompts.txt</span>
            </a>
            <button
              onClick={() => {
                cinematicAudioPipeline.stop();
                onClose();
              }}
              className="p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2.39:1 Anamorphic Cinema Viewer / Video Projection Stage */}
        <div className="relative w-full aspect-[2.39/1] max-h-[360px] bg-gradient-to-b from-[#0A0F1D] via-[#050811] to-[#04060B] border-b border-white/[0.08] flex flex-col justify-between p-6 overflow-hidden">
          {/* Subtle Anamorphic Lens Flare Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none blur-[1px]" />
          <div className="absolute -top-24 left-1/4 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          {/* Top Cinema HUD Overlay */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-rose-400 font-bold uppercase tracking-wider">
                {playbackState.isPlaying ? "PLAYING MASTERCLASS" : "CINEMA READY"}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300">
                SCENE {currentScene.sceneNumber}: {currentScene.title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-400">
                TIMECODE: <span className="text-cyan-300 font-bold">{currentScene.timecodeFormatted}</span>
              </span>
              <span className="text-slate-500">
                (ELAPSED: {formatElapsed(playbackState.elapsedSec)})
              </span>
            </div>
          </div>

          {/* Center Visual Cue / Title Card */}
          <div className="text-center space-y-2 py-4 relative z-10 max-w-3xl mx-auto">
            <span className="text-[11px] font-mono tracking-widest text-cyan-400 uppercase font-semibold block">
              SCENE 0{currentScene.sceneNumber} OF 04 • 8K MASTERCLASS
            </span>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-sans drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              {currentScene.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl mx-auto font-sans italic opacity-90">
              &ldquo;{currentScene.voiceoverText}&rdquo;
            </p>
          </div>

          {/* Bottom Live Foley Notification & Soundboard */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono relative z-10">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-400">Active Foley Synthesizer:</span>
              <span className="text-amber-300 font-bold">
                {playbackState.lastFoleyTriggered || "Atmospheric Ambient Hum (Rec.2020)"}
              </span>
            </div>

            {/* Live Audio Foley Synthesizer Triggers */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
              <button
                onClick={() => cinematicAudioPipeline.playCinematicBraam()}
                className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[10px] transition"
                title="Trigger 24Hz Sub-Bass Braam Impact"
              >
                💥 24Hz Braam
              </button>
              <button
                onClick={() => cinematicAudioPipeline.playAvionicsTone()}
                className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 text-[10px] transition"
                title="Trigger Avionics Telemetry Tone"
              >
                📡 Avionics Chime
              </button>
              <button
                onClick={() => cinematicAudioPipeline.playQnxClockTick()}
                className="px-2.5 py-1 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] transition"
                title="Trigger QNX RTOS Watchdog Tick"
              >
                ⏱️ QNX Tick
              </button>
              <button
                onClick={() => cinematicAudioPipeline.playTurbineSpool()}
                className="px-2.5 py-1 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-indigo-300 text-[10px] transition"
                title="Trigger Turbine Frequency Ramp"
              >
                🌀 Turbine Spool
              </button>
              <button
                onClick={() => cinematicAudioPipeline.playWarningAlarm()}
                className="px-2.5 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-[10px] transition"
                title="Trigger DO-178C Master Caution Siren"
              >
                🚨 Caution Siren
              </button>
              <button
                onClick={() => cinematicAudioPipeline.playCryptographicSealTone()}
                className="px-2.5 py-1 rounded-md bg-purple-500/15 hover:bg-purple-500/25 border border-purple-400/30 text-purple-300 text-[10px] transition"
                title="Trigger SHA-256 Merkle Block Snap"
              >
                🔒 Block Seal
              </button>
            </div>
          </div>
        </div>

        {/* Masterclass Playback Control & Scene Scrubber Bar */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-white/[0.06] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Primary Controls */}
            <div className="flex items-center gap-3">
              {playbackState.isPlaying ? (
                <button
                  onClick={() => cinematicAudioPipeline.pause()}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-sans transition shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pause Masterclass</span>
                </button>
              ) : (
                <button
                  onClick={() => cinematicAudioPipeline.startPipeline(playbackState.activeSceneIndex)}
                  className="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-slate-950 font-bold text-xs font-sans transition shadow-[0_0_20px_rgba(0,242,254,0.35)]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play 8K Masterclass Audio</span>
                </button>
              )}

              <button
                onClick={() => cinematicAudioPipeline.stop()}
                className="p-2.5 rounded-full bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 transition"
                title="Reset Timeline to 0:00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => cinematicAudioPipeline.toggleMute()}
                className={`p-2.5 rounded-full border transition ${
                  playbackState.isMuted
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                    : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10"
                }`}
                title={playbackState.isMuted ? "Unmute Audio" : "Mute Audio"}
              >
                {playbackState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Scene Selector Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MASTERCLASS_SCENES.map((scene, idx) => {
                const isActive = playbackState.activeSceneIndex === idx;
                return (
                  <button
                    key={scene.sceneId}
                    onClick={() => cinematicAudioPipeline.selectScene(idx)}
                    className={`px-3 py-2 rounded-xl text-left font-mono transition border ${
                      isActive
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_12px_rgba(0,242,254,0.2)]"
                        : "bg-slate-900/50 hover:bg-slate-800/60 text-slate-400 border-white/5"
                    }`}
                  >
                    <div className="text-[10px] uppercase text-slate-500 font-semibold">
                      SCENE 0{scene.sceneNumber} • {scene.durationSec}s
                    </div>
                    <div className="text-xs font-bold truncate text-slate-200">
                      {scene.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tabbed Inspector: Voiceover / 8K Prompts / Technical Specs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <button
              onClick={() => setActiveTab("VOICEOVER")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 ${
                activeTab === "VOICEOVER"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>1. Masterclass Voiceover & Foley Sync</span>
            </button>
            <button
              onClick={() => setActiveTab("PROMPTS")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 ${
                activeTab === "PROMPTS"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. 8K AI Generation Prompts (Sora 2 / Midjourney / Runway)</span>
            </button>
            <button
              onClick={() => setActiveTab("TECHNICAL")}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center gap-2 ${
                activeTab === "TECHNICAL"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>3. Lens & Production Specification</span>
            </button>
          </div>

          {/* TAB 1: Masterclass Voiceover */}
          {activeTab === "VOICEOVER" && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-cyan-300" />
                    SCENE 0{currentScene.sceneNumber}: {currentScene.title}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(currentScene.voiceoverText, `vo-${currentScene.sceneId}`)
                    }
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/60 hover:bg-slate-900 text-xs font-mono text-slate-300 border border-white/10 transition"
                  >
                    {copiedPromptId === `vo-${currentScene.sceneId}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copied Script</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/70 border border-white/[0.04] text-sm sm:text-base text-slate-100 font-sans leading-relaxed">
                  {currentScene.voiceoverText}
                </div>

                {/* Key Emphasized Phrases */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-mono text-slate-400 uppercase">Key Accents:</span>
                  {currentScene.accentWords.map((word) => (
                    <span
                      key={word}
                      className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-400/25 text-cyan-300 font-medium"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Foley Cue List for Active Scene */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-white/[0.05] space-y-2 font-mono text-xs">
                <span className="text-slate-400 uppercase font-semibold text-[11px] block">
                  Synchronized Sound Design & Foley Cues:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentScene.foleyTriggers.map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 flex items-center justify-between"
                    >
                      <span className="text-cyan-400 font-bold">T+{f.atSec}s</span>
                      <span className="text-slate-300 text-[11px] truncate ml-2">{f.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 8K AI Generation Prompts */}
          {activeTab === "PROMPTS" && (
            <div className="space-y-4">
              {/* Sora 2 Motion Prompt */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                    OpenAI Sora 2 / Luma Dream Machine Camera Motion Prompt
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Slow macro dolly shot moving along the sleek matte-carbon fiber wing of an electric vertical takeoff aircraft cutting through dense coastal turbulence clouds at sunset. Rain droplets streak horizontally across the pressurized glass canopy. Inside the cockpit, minimalist avionics HUD screens glow in amber and crimson wireframes warning of microburst shear exceeding 28 knots. Blade Runner 2049 cinematic lighting, 60fps, 8k resolution, photorealistic aerodynamics, 2.39:1 anamorphic ratio.`,
                        "sora-prompt"
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/60 hover:bg-slate-900 text-xs font-mono text-slate-300 border border-white/10 transition"
                  >
                    {copiedPromptId === "sora-prompt" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Sora 2 Prompt</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono p-3 rounded-xl bg-slate-950/70 border border-white/5 leading-relaxed">
                  Slow macro dolly shot moving along the sleek matte-carbon fiber wing of an electric vertical takeoff aircraft cutting through dense coastal turbulence clouds at sunset. Rain droplets streak horizontally across the pressurized glass canopy. Inside the cockpit, minimalist avionics HUD screens glow in amber and crimson wireframes warning of microburst shear exceeding 28 knots. Blade Runner 2049 cinematic lighting, 60fps, 8k resolution, photorealistic aerodynamics, 2.39:1 anamorphic ratio.
                </p>
              </div>

              {/* Midjourney v6.1 Keyframe Prompt */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    Midjourney v6.1 / Flux.1 Pro Keyframe Prompt
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `Cinematic 8K, photorealistic macro 35mm anamorphic shot of modern eVTOL aircraft navigating dense storm clouds over futuristic Los Angeles, volumetric rain streaks on composite canopy, amber HUD warning graphics reflected on glass, ultra-detailed textures, moody contrast, atmospheric lighting, Unreal Engine 5.4 render --ar 2.39:1 --style raw --v 6.1`,
                        "mj-prompt"
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/60 hover:bg-slate-900 text-xs font-mono text-slate-300 border border-white/10 transition"
                  >
                    {copiedPromptId === "mj-prompt" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Midjourney Prompt</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono p-3 rounded-xl bg-slate-950/70 border border-white/5 leading-relaxed">
                  Cinematic 8K, photorealistic macro 35mm anamorphic shot of modern eVTOL aircraft navigating dense storm clouds over futuristic Los Angeles, volumetric rain streaks on composite canopy, amber HUD warning graphics reflected on glass, ultra-detailed textures, moody contrast, atmospheric lighting, Unreal Engine 5.4 render --ar 2.39:1 --style raw --v 6.1
                </p>
              </div>

              {/* Runway Gen-3 Alpha Prompt */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Runway Gen-3 Alpha Motion Control Prompt
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `[Camera: Slow tracking dolly in, 35mm anamorphic] Autonomous eVTOL aircraft wing slice through dense volumetric clouds over Los Angeles skyline at golden hour, raindrops hitting canopy, amber cockpit HUD reflections, moody cinematic atmosphere, titanium blue color grade, photorealistic 8k.`,
                        "runway-prompt"
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-950/60 hover:bg-slate-900 text-xs font-mono text-slate-300 border border-white/10 transition"
                  >
                    {copiedPromptId === "runway-prompt" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copy Runway Prompt</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 font-mono p-3 rounded-xl bg-slate-950/70 border border-white/5 leading-relaxed">
                  [Camera: Slow tracking dolly in, 35mm anamorphic] Autonomous eVTOL aircraft wing slice through dense volumetric clouds over Los Angeles skyline at golden hour, raindrops hitting canopy, amber cockpit HUD reflections, moody cinematic atmosphere, titanium blue color grade, photorealistic 8k.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Technical Specifications */}
          {activeTab === "TECHNICAL" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2.5">
                <span className="text-cyan-400 font-bold uppercase tracking-wider block">
                  Optics & Cinematography Spec
                </span>
                <div className="space-y-1.5 text-slate-300">
                  <div>• Resolution: 8K DCI (7680x3213 anamorphic active / 7680x4320 container)</div>
                  <div>• Aspect Ratio: 2.39:1 Anamorphic Widescreen</div>
                  <div>• Camera / Sensor: Panavision Ultra Panavision 70 65mm Anamorphic, T1.8</div>
                  <div>• Frame Rate: 60.00 FPS Cinema Master</div>
                  <div>• Color Space: Rec.2020 / DCI-P3, HDR10+, ACEScc linear workflow</div>
                  <div>• Key Grade LUT: Titanium Teal & Radar Amber Chiaroscuro</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.06] space-y-2.5">
                <span className="text-indigo-400 font-bold uppercase tracking-wider block">
                  Avionics System Architecture Standards
                </span>
                <div className="space-y-1.5 text-slate-300">
                  <div>• Hard Safety Kernel: BlackBerry QNX Neutrino RTOS 8.0 POSIX PSE52</div>
                  <div>• Certification Target: RTCA DO-178C Level A / EASA SC-VTOL</div>
                  <div>• Audit Chain: In-Memory SHA-256 Merkle Chaining Ledger</div>
                  <div>• Telemetry Bridge: 10Hz MAVLink v2 binary (#0, #30, #33, #147)</div>
                  <div>• Offline Fail-Safe: Dual-Radio C2 Severance Lock to KBUR Pad 2</div>
                  <div>• Continuous Tests: 135 / 135 passing with 0 regressions</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
