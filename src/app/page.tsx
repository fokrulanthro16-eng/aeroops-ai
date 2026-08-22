"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { TopNav } from "@/components/cockpit/TopNav";
import { VerdictHero } from "@/components/cockpit/VerdictHero";
import { RiskMatrix } from "@/components/cockpit/RiskMatrix";
import { TelemetryGrid } from "@/components/cockpit/TelemetryGrid";
import { WhatIfSimulator } from "@/components/cockpit/WhatIfSimulator";
import { AIBriefingCard } from "@/components/cockpit/AIBriefingCard";
import { EvidenceDrawer } from "@/components/cockpit/EvidenceDrawer";
import { AirspaceMapClient } from "@/components/map/AirspaceMapClient";
import { DispatchSheet } from "@/components/reports/DispatchSheet";
import { FlightModeToggle, FlightViewMode } from "@/components/cockpit/FlightModeToggle";
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
          const next = prev + 5; // advance virtual flight timeline
          const nextTelemetry = computeInFlightTelemetryFrame(mission, next, {
            speedMultiplier: 2,
            injectedWindShearKt: injectedShearKt,
            injectedSocDegradationPercent: injectedSocDegradePercent,
          });
          setLiveTelemetry(nextTelemetry);

          // Stop stream if landed
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
  }, [isPlayingTelemetry, mission, injectedShearKt, injectedSocDegradePercent]);

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

  const handleResetFlightPlayback = () => {
    setFlightElapsedSec(0);
    setIsPlayingTelemetry(false);
    setInjectedShearKt(0);
    setInjectedSocDegradePercent(0);
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
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-obsidian-950">
      {/* Top Header Navigation */}
      <TopNav
        currentMode={currentMode}
        onModeChange={handleModeChange}
        activeScenarioKey={activeScenarioKey}
        onSelectScenario={handleSelectScenario}
        onOpenDispatchSheet={() => setIsDispatchSheetOpen(true)}
        isLiveLoading={isLiveLoading}
        onRefreshLive={handleFetchLiveWeather}
      />

      {/* Main Glass Cockpit Content Grid */}
      <main className="flex-1 w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 mx-auto py-6 space-y-6">
        {/* Mode Toggle: [PRE-FLIGHT DISPATCH] vs [ACTIVE IN-FLIGHT HUD] */}
        <FlightModeToggle
          viewMode={flightViewMode}
          onViewModeChange={setFlightViewMode}
          flightPhase={liveTelemetry.flightPhase}
          isSimulating={isPlayingTelemetry}
        />

        {/* 1. Verdict Hero Banner */}
        <VerdictHero mission={mission} />

        {/* In-Flight Live HUD Strip (Active when in-flight mode or playback running) */}
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
          />
        )}

        {/* 2. Vector Airspace Radar & 5-Factor Risk Matrix (Two-Column Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <AirspaceMapClient mission={mission} liveTelemetry={liveTelemetry} />
          </div>
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <RiskMatrix factors={mission.risk.factors} hardGates={mission.risk.hardGates} />
          </div>
        </div>

        {/* 3. Real-Time Telemetry Grid (Weather, Energy, Aircraft Envelope) */}
        <TelemetryGrid mission={mission} />

        {/* 4. Vertiport Pad Reservation & Fast-Charge Matrix (v2.0) */}
        <VertiportGrid vertiportState={mission.vertiportOps} />

        {/* 5. Explainable AI Briefing Card (Gemini 2.5 Flash & Voice Radio) */}
        <AIBriefingCard
          mission={mission}
          onRegenerateBriefing={handleRegenerateAIBriefing}
          isLoading={isAiLoading}
        />

        {/* 6. Aerodynamic "What-If" Telemetry Simulator */}
        <WhatIfSimulator
          params={whatIfParams}
          onChange={handleWhatIfChange}
          onReset={handleResetWhatIf}
          maxPayloadKg={mission.aircraft.maxPayloadKg}
          maxCrosswindKts={mission.aircraft.maxCrosswindKts}
        />

        {/* 7. DO-178C Cryptographic Blackbox Audit Ledger (v2.0) */}
        <BlackboxAudit ledger={mission.blackboxLedger} />

        {/* 8. Traceable Evidence Audit Drawer */}
        <EvidenceDrawer evidence={mission.evidence} />
      </main>

      {/* Printable Pre-Flight Release PDF Modal */}
      <DispatchSheet
        mission={mission}
        isOpen={isDispatchSheetOpen}
        onClose={() => setIsDispatchSheetOpen(false)}
      />

      {/* Cockpit Footer */}
      <footer className="border-t border-slate-900 bg-obsidian-950/80 py-4 px-6 text-center text-xs font-mono text-slate-500">
        <p>
          AeroOps AI v2.0 (Enterprise Fleet & In-Flight OS) • Deterministic Rules Safety Engine, 1Hz Live Telemetry & SHA-256 Merkle Ledger
        </p>
      </footer>
    </div>
  );
}