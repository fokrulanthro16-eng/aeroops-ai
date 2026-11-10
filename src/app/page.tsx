"use client";

import React, { useState, useEffect, useCallback } from "react";
import { TopNav } from "@/components/cockpit/TopNav";
import { VerdictHero } from "@/components/cockpit/VerdictHero";
import { TelemetryGrid } from "@/components/cockpit/TelemetryGrid";
import { WhatIfSimulator } from "@/components/cockpit/WhatIfSimulator";
import { AIBriefingCard } from "@/components/cockpit/AIBriefingCard";
import { EvidenceDrawer } from "@/components/cockpit/EvidenceDrawer";
import { AirspaceMapClient } from "@/components/map/AirspaceMapClient";
import { DispatchSheet } from "@/components/reports/DispatchSheet";
import { FlightViewMode } from "@/components/cockpit/FlightModeToggle";
import { LiveTelemetryHUD } from "@/components/cockpit/LiveTelemetryHUD";
import { VertiportGrid } from "@/components/cockpit/VertiportGrid";
import { BlackboxAudit } from "@/components/cockpit/BlackboxAudit";
import { PRESET_SCENARIOS, buildScenario1Nominal, buildScenario2Amber, buildScenario3Severe } from "@/lib/simulation/scenarios";
import { decomposeWindVector, fetchLiveMetar } from "@/lib/weather";
import { calculateEnergyAndPONR } from "@/lib/energy";
import { evaluateAirspaceConflicts } from "@/lib/airspace";
import { compileEvidenceAudit, evaluateMissionRisk } from "@/lib/risk";
import { computeInFlightTelemetryFrame } from "@/lib/telemetry-stream";
import { generateCorridorMicroWeatherSegments } from "@/lib/micro-weather";
import { reserveVertiportArrivalSlot } from "@/lib/vertiport-ops";
import { initializeMissionBlackboxLedger } from "@/lib/blackbox-crypto";
import { FlightMission, InFlightTelemetry, WeatherData } from "@/types/aviation";
import { pilotVoice } from "@/lib/tts";
import {
  generateSyntheticBatteryStatus,
  generateSyntheticGlobalPosition,
  parseMavlinkV2Packet,
  convertMavlinkToTelemetry,
} from "@/lib/telemetry/mavlink-parser";
import { defaultLossOfLinkManager } from "@/lib/telemetry/loss-of-link";
import { defaultSitlInjector } from "@/lib/telemetry/sitl-injector";

export default function MissionCockpitPage() {
  const [mission, setMission] = useState<FlightMission>(PRESET_SCENARIOS.scenario1);
  const [activeScenarioKey, setActiveScenarioKey] = useState<"scenario1" | "scenario2" | "scenario3" | "custom">("scenario1");
  const [currentMode, setCurrentMode] = useState<"LIVE" | "SIM" | "HYBRID">("SIM");
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDispatchSheetOpen, setIsDispatchSheetOpen] = useState(false);

  // v2.0 In-Flight HUD & Live Telemetry State
  const [flightViewMode, setFlightViewMode] = useState<FlightViewMode>("PREFLIGHT");
  const [flightElapsedSec, setFlightElapsedSec] = useState(0);
  const [isPlayingTelemetry, setIsPlayingTelemetry] = useState(false);
  const [injectedShearKt, setInjectedShearKt] = useState(0);
  const [injectedSocDegradePercent, setInjectedSocDegradePercent] = useState(0);
  const [telemetrySource, setTelemetrySource] = useState<"SIMULATED" | "MAVLINK_V2" | "QNX_POSIX" | "PX4_SITL">("PX4_SITL");
  const [isC2Severed, setIsC2Severed] = useState(false);

  // Live 1Hz In-Flight Telemetry Object
  const [liveTelemetry, setLiveTelemetry] = useState<InFlightTelemetry>(() =>
    computeInFlightTelemetryFrame(PRESET_SCENARIOS.scenario1, 0)
  );

  // What-If Parameters
  const [whatIfParams, setWhatIfParams] = useState({
    windSpeedKts: mission.weather.windSpeedKts,
    windDirDeg: mission.weather.windDirDeg,
    payloadKg: mission.plannedPayloadKg,
    initialSocPercent: mission.energy.initialSocPercent,
    tempC: mission.weather.tempC,
    enableTfr: false,
  });

  // Re-run deterministic physics and risk model whenever parameters change
  const recalculateMission = useCallback(
    (params: typeof whatIfParams, currentMission: FlightMission, mode: "LIVE" | "SIM" | "HYBRID") => {
      const updatedWeather: WeatherData = {
        ...currentMission.weather,
        windSpeedKts: params.windSpeedKts,
        windDirDeg: params.windDirDeg,
        tempC: params.tempC,
      };

      const updatedWind = decomposeWindVector(
        params.windSpeedKts,
        params.windDirDeg,
        currentMission.routeHeadingDeg,
        currentMission.aircraft.nominalCruiseSpeedKts,
        currentMission.aircraft.maxCrosswindKts
      );

      const updatedEnergy = calculateEnergyAndPONR(
        currentMission.aircraft,
        currentMission.routeDistanceKm,
        params.payloadKg,
        params.initialSocPercent,
        params.tempC,
        updatedWind
      );

      const updatedAirspace = evaluateAirspaceConflicts(
        currentMission.origin,
        currentMission.destination,
        undefined,
        params.enableTfr
      );

      const updatedRisk = evaluateMissionRisk(
        currentMission.aircraft,
        params.payloadKg,
        updatedWind,
        updatedEnergy,
        updatedAirspace,
        updatedWeather,
        mode
      );

      const updatedEvidence = compileEvidenceAudit(
        currentMission.aircraft,
        params.payloadKg,
        updatedWeather,
        updatedWind,
        updatedEnergy,
        updatedAirspace
      );

      const baseUpdated: FlightMission = {
        ...currentMission,
        plannedPayloadKg: params.payloadKg,
        initialSocPercent: params.initialSocPercent,
        mode,
        weather: updatedWeather,
        wind: updatedWind,
        energy: updatedEnergy,
        airspaceConflicts: updatedAirspace,
        risk: updatedRisk,
        evidence: updatedEvidence,
      };

      // v2.0 Subsystem Extensions
      const microWeatherSegments = generateCorridorMicroWeatherSegments(baseUpdated);
      const { state: vertiportOps } = reserveVertiportArrivalSlot(
        baseUpdated.destination.icao,
        baseUpdated.callsign,
        baseUpdated.energy.estimatedFlightTimeMin
      );
      const blackboxLedger = initializeMissionBlackboxLedger(baseUpdated);

      const newMission: FlightMission = {
        ...baseUpdated,
        microWeatherSegments,
        vertiportOps,
        blackboxLedger,
      };

      setMission(newMission);
    },
    []
  );

  // 1Hz In-Flight Telemetry Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlayingTelemetry) {
      interval = setInterval(() => {
        setFlightElapsedSec((prev) => {
          const next = prev + 5;
          let nextTelemetry = computeInFlightTelemetryFrame(mission, next, {
            speedMultiplier: 2,
            injectedWindShearKt: injectedShearKt,
            injectedSocDegradationPercent: injectedSocDegradePercent,
          });

          // High-Fidelity SITL 10Hz binary frame injection
          if (telemetrySource === "PX4_SITL") {
            const sitlFrame = defaultSitlInjector.generateFrame(nextTelemetry, next);
            nextTelemetry = defaultSitlInjector.injectIntoTelemetry(sitlFrame, nextTelemetry);
          } else if (telemetrySource === "MAVLINK_V2") {
            // Ingest telemetry via real-time MAVLink v2 binary packet roundtrip
            const posPacket = generateSyntheticGlobalPosition(
              nextTelemetry.currentCoordinates.lat,
              nextTelemetry.currentCoordinates.lon,
              nextTelemetry.currentAltitudeFt,
              nextTelemetry.currentGroundSpeedKts,
              mission.routeHeadingDeg
            );
            const battPacket = generateSyntheticBatteryStatus(
              nextTelemetry.liveBatterySoc,
              nextTelemetry.batteryCellTempC,
              120
            );
            const decodedPos = parseMavlinkV2Packet(posPacket);
            const decodedBatt = parseMavlinkV2Packet(battPacket);

            if (decodedPos?.type === "GLOBAL_POSITION_INT" && decodedBatt?.type === "BATTERY_STATUS") {
              nextTelemetry = convertMavlinkToTelemetry(decodedPos.payload, decodedBatt.payload, nextTelemetry);
            }
          }

          // If C2 link is severed, enforce deterministic fail-safe diversion & queue offline telemetry
          if (isC2Severed) {
            nextTelemetry = {
              ...nextTelemetry,
              flightPhase: "DIVERTING",
              recommendedAction: "DIVERT_TO_ALTERNATE",
              diversionTargetIcao: "KBUR",
              diversionReason: "C2 LINK SEVERED: Dual-radio ground link lost. Airborne autonomous fail-safe active.",
              distanceToAlternateNm: 12.4,
              c2LinkStatus: "SEVERED",
              failSafeMode: "AIRBORNE_AUTONOMOUS_FAILSAFE",
            };
            defaultLossOfLinkManager.queueOfflineTelemetryBlock(nextTelemetry, "NO_GO");
          }

          setLiveTelemetry(nextTelemetry);

          if (nextTelemetry.flightPhase === "LANDED") {
            setIsPlayingTelemetry(false);
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTelemetry, mission, injectedShearKt, injectedSocDegradePercent, telemetrySource, isC2Severed]);

  const handleWhatIfChange = (updated: Partial<typeof whatIfParams>) => {
    const nextParams = { ...whatIfParams, ...updated };
    setWhatIfParams(nextParams);
    setActiveScenarioKey("custom");
    recalculateMission(nextParams, mission, currentMode);
  };

  const handleSelectScenario = (key: "scenario1" | "scenario2" | "scenario3") => {
    setActiveScenarioKey(key);
    let selected: FlightMission;
    let tfr = false;

    if (key === "scenario1") {
      selected = buildScenario1Nominal();
    } else if (key === "scenario2") {
      selected = buildScenario2Amber();
    } else {
      selected = buildScenario3Severe();
      tfr = true;
    }

    setWhatIfParams({
      windSpeedKts: selected.weather.windSpeedKts,
      windDirDeg: selected.weather.windDirDeg,
      payloadKg: selected.plannedPayloadKg,
      initialSocPercent: selected.energy.initialSocPercent,
      tempC: selected.weather.tempC,
      enableTfr: tfr,
    });

    setMission(selected);
    setFlightElapsedSec(0);
    setInjectedShearKt(0);
    setInjectedSocDegradePercent(0);
    setIsC2Severed(false);
    setLiveTelemetry(computeInFlightTelemetryFrame(selected, 0));
  };

  const handleResetWhatIf = () => {
    if (activeScenarioKey === "scenario2") handleSelectScenario("scenario2");
    else if (activeScenarioKey === "scenario3") handleSelectScenario("scenario3");
    else handleSelectScenario("scenario1");
  };

  // In-Flight Anomaly Injections
  const handleInjectWindShear = () => {
    const newShear = injectedShearKt > 0 ? 0 : 32;
    setInjectedShearKt(newShear);
    const updated = computeInFlightTelemetryFrame(mission, flightElapsedSec, {
      speedMultiplier: 2,
      injectedWindShearKt: newShear,
      injectedSocDegradationPercent: injectedSocDegradePercent,
    });
    setLiveTelemetry(updated);

    if (newShear > 0) {
      pilotVoice.speak("Caution. Severe wind shear of 32 knots detected past Point of No Return. Autonomous diversion vector to Burbank Vertiport initiated.");
    }
  };

  const handleInjectBatteryDegrade = () => {
    const newDegrade = injectedSocDegradePercent > 0 ? 0 : 8;
    setInjectedSocDegradePercent(newDegrade);
    const updated = computeInFlightTelemetryFrame(mission, flightElapsedSec, {
      speedMultiplier: 2,
      injectedWindShearKt: injectedShearKt,
      injectedSocDegradationPercent: newDegrade,
    });
    setLiveTelemetry(updated);

    if (newDegrade > 0) {
      pilotVoice.speak("Alert. Battery state-of-charge decay anomaly. 8 percent deficit below theoretical burn curve. Diverting to alternate vertiport.");
    }
  };

  // Dual-Radio C2 Link Severance Toggle
  const handleToggleC2Link = () => {
    if (!isC2Severed) {
      const { updatedTelemetry, eventBlock } = defaultLossOfLinkManager.severC2Link(
        liveTelemetry,
        mission.blackboxLedger
      );
      setIsC2Severed(true);
      setLiveTelemetry(updatedTelemetry);
      if (mission.blackboxLedger) {
        setMission((prev) => ({
          ...prev,
          blackboxLedger: {
            ...prev.blackboxLedger!,
            rootHash: eventBlock.blockHash,
            blockCount: prev.blackboxLedger!.blockCount + 1,
            blocks: [...prev.blackboxLedger!.blocks, eventBlock],
          },
        }));
      }
      pilotVoice.speak(
        "Warning. C2 command and control link severed. Airborne autonomous fail-safe engaged. Routing locked to Burbank Pad 2."
      );
    } else {
      if (mission.blackboxLedger) {
        const { reconciledLedger } = defaultLossOfLinkManager.restoreC2Link(mission.blackboxLedger);
        setMission((prev) => ({
          ...prev,
          blackboxLedger: reconciledLedger,
        }));
      }
      setIsC2Severed(false);
      setLiveTelemetry((prev) => ({
        ...prev,
        c2LinkStatus: "CONNECTED",
        failSafeMode: "NOMINAL",
      }));
      pilotVoice.speak(
        "C2 link restored. Flushed offline telemetry buffer. Ledger reconciled with zero cryptographic fragmentation."
      );
    }
  };

  const handleResetFlightPlayback = () => {
    setFlightElapsedSec(0);
    setIsPlayingTelemetry(false);
    setInjectedShearKt(0);
    setInjectedSocDegradePercent(0);
    setIsC2Severed(false);
    setLiveTelemetry(computeInFlightTelemetryFrame(mission, 0));
  };

  // Live NOAA METAR Ingestion handler
  const handleFetchLiveWeather = async () => {
    setIsLiveLoading(true);
    try {
      const res = await fetch(`/api/weather?icao=${mission.origin.icao}`);
      const data = await res.json();
      if (data.success && data.data) {
        const liveWx: WeatherData = data.data;
        const nextParams = {
          ...whatIfParams,
          windSpeedKts: liveWx.windSpeedKts,
          windDirDeg: liveWx.windDirDeg,
          tempC: liveWx.tempC,
        };
        setWhatIfParams(nextParams);
        const missionWithWx = { ...mission, weather: liveWx };
        recalculateMission(nextParams, missionWithWx, "LIVE");
      }
    } catch (e) {
      console.error("Live weather fetch error:", e);
    } finally {
      setIsLiveLoading(false);
    }
  };

  const handleModeChange = (mode: "LIVE" | "SIM" | "HYBRID") => {
    setCurrentMode(mode);
    if (mode === "LIVE") {
      handleFetchLiveWeather();
    } else {
      recalculateMission(whatIfParams, mission, mode);
    }
  };

  // Request new AI Briefing from Gemini 2.5 Flash
  const handleRegenerateAIBriefing = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mission),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setMission((prev) => ({ ...prev, aiBriefing: result.data }));
      }
    } catch (e) {
      console.error("AI briefing generation error:", e);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex flex-col selection:bg-cyan-400 selection:text-slate-950 font-sans pb-12">
      {/* Floating Glass Navbar */}
      <TopNav
        currentMode={currentMode}
        onModeChange={handleModeChange}
        activeScenarioKey={activeScenarioKey}
        onSelectScenario={handleSelectScenario}
        onOpenDispatchSheet={() => setIsDispatchSheetOpen(true)}
        isLiveLoading={isLiveLoading}
        onRefreshLive={handleFetchLiveWeather}
        flightViewMode={flightViewMode}
        onFlightViewModeChange={setFlightViewMode}
      />

      {/* Main Luxury Glass Cockpit Grid */}
      <main className="flex-1 w-full max-w-[1840px] px-4 sm:px-6 mx-auto mt-4 space-y-8">
        {/* HERO SECTION: Split View (60% Vector Radar Map + 40% Executive Verdict Card) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          {/* Left (60% Width) — Expansive Vector Airspace Canvas */}
          <div className="xl:col-span-7 2xl:col-span-7 flex flex-col">
            <AirspaceMapClient mission={mission} liveTelemetry={liveTelemetry} />
          </div>

          {/* Right (40% Width) — Executive Flight Verdict Card with Circular Ring Gauge */}
          <div className="xl:col-span-5 2xl:col-span-5 flex flex-col">
            <VerdictHero mission={mission} />
          </div>
        </div>

        {/* 1Hz Live In-Flight HUD Strip (Active in Live Flight Mode) */}
        {flightViewMode === "INFLIGHT_HUD" && (
          <LiveTelemetryHUD
            telemetry={liveTelemetry}
            isPlaying={isPlayingTelemetry}
            onTogglePlayback={() => setIsPlayingTelemetry(!isPlayingTelemetry)}
            onResetFlight={handleResetFlightPlayback}
            onInjectWindShear={handleInjectWindShear}
            onInjectBatteryDegrade={handleInjectBatteryDegrade}
            hasInjectedShear={injectedShearKt > 0}
            hasInjectedDegrade={injectedSocDegradePercent > 0}
            telemetrySource={telemetrySource}
            onSelectTelemetrySource={setTelemetrySource}
            onToggleC2Link={handleToggleC2Link}
            isC2Severed={isC2Severed}
          />
        )}

        {/* 4 Telemetry & Physical Performance Widget Cards */}
        <TelemetryGrid mission={mission} />

        {/* Vertiport Turnaround & Fast-Charge Matrix */}
        <VertiportGrid vertiportState={mission.vertiportOps} />

        {/* Gemini AI & Radio Voice Dispatch Hub */}
        <AIBriefingCard
          mission={mission}
          onRegenerateBriefing={handleRegenerateAIBriefing}
          isLoading={isAiLoading}
        />

        {/* Modern "What-If" Performance Studio */}
        <WhatIfSimulator
          params={whatIfParams}
          onChange={handleWhatIfChange}
          onReset={handleResetWhatIf}
          maxPayloadKg={mission.aircraft.maxPayloadKg}
          maxCrosswindKts={mission.aircraft.maxCrosswindKts}
        />

        {/* DO-178C Cryptographic Blackbox Audit Ledger with NTSB Incident Replay */}
        <BlackboxAudit ledger={mission.blackboxLedger} />

        {/* Traceable Evidence Audit Drawer */}
        <EvidenceDrawer evidence={mission.evidence} />
      </main>

      {/* Printable Pre-Flight Release PDF Modal */}
      <DispatchSheet
        mission={mission}
        isOpen={isDispatchSheetOpen}
        onClose={() => setIsDispatchSheetOpen(false)}
      />

      {/* Luxury Editorial Footer */}
      <footer className="w-full max-w-[1840px] mx-auto px-6 mt-12 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-sans gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">AeroOps AI</span>
          <span>• Luxury Aero-Editorial Edition</span>
        </div>
        <div className="font-mono text-[11px] text-slate-400">
          Deterministic Safety Physics Engine • Google Gemini 2.5 Flash • SHA-256 DO-178C Ledger
        </div>
      </footer>
    </div>
  );
}
