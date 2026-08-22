"use client";

import React from "react";
import { RadialGauge } from "../ui/RadialGauge";
import { FlightMission } from "@/types/aviation";
import { Wind, BatteryCharging, Gauge, Navigation, AlertCircle, Compass, Thermometer } from "lucide-react";

interface TelemetryGridProps {
  mission: FlightMission;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({ mission }) => {
  const { weather, wind, energy, aircraft, plannedPayloadKg } = mission;

  const totalGrossMass = aircraft.emptyWeightKg + plannedPayloadKg;
  const massRatio = Math.round((totalGrossMass / aircraft.mtowKg) * 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* 1. Aerodynamic Wind & Weather Vector Card */}
      <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-400" />
              Atmospheric & Wind Vectors
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
              METAR: {weather.station}
            </span>
          </div>

          <div className="flex items-center justify-around py-2">
            {/* Radial Crosswind Gauge */}
            <RadialGauge
              value={wind.crosswindKts}
              max={aircraft.maxCrosswindKts}
              label="Crosswind"
              unit="kt"
              color={wind.isCrosswindExceeded ? "red" : wind.crosswindKts > aircraft.maxCrosswindKts * 0.7 ? "amber" : "cyan"}
              size={110}
              subtext={`Limit: ${aircraft.maxCrosswindKts} kts`}
            />

            <div className="flex flex-col space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Total Wind:</span>
                <span className="font-bold text-slate-200">
                  {wind.windSpeedKts} kts @ {wind.windDirDeg}°
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Headwind:</span>
                <span className={`font-bold ${wind.headwindKts > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {wind.headwindKts > 0 ? `+${wind.headwindKts} kts` : `${wind.headwindKts} kts`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Ground Speed:</span>
                <span className="font-bold text-cyan-400">
                  {wind.groundSpeedKts} kts
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">WCA Angle:</span>
                <span className="font-bold text-slate-200">
                  {wind.windCorrectionAngleDeg}°
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weather conditions pill row */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[11px] font-mono">
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/60">
            <span className="text-slate-400 block text-[9px] uppercase">Temp</span>
            <span className="text-slate-200 font-bold">{weather.tempC}°C</span>
          </div>
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/60">
            <span className="text-slate-400 block text-[9px] uppercase">Visibility</span>
            <span className="text-slate-200 font-bold">{weather.visibilitySm} SM</span>
          </div>
          <div className="p-1.5 rounded bg-slate-900/80 border border-slate-800/60">
            <span className="text-slate-400 block text-[9px] uppercase">Ceiling</span>
            <span className="text-slate-200 font-bold">{weather.cloudCeilingFt} ft</span>
          </div>
        </div>
      </div>

      {/* 2. Battery SOC & Dynamic Point of No Return Card */}
      <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              Battery Energy & Dynamic PONR
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
              Cap: {aircraft.batteryCapacityKwh} kWh
            </span>
          </div>

          <div className="flex items-center justify-around py-2">
            {/* Radial Landing SOC Gauge */}
            <RadialGauge
              value={Math.max(0, energy.projectedLandingSocPercent)}
              max={100}
              label="Landing SOC"
              unit="%"
              color={
                energy.projectedLandingSocPercent < aircraft.minReserveSocPercent
                  ? "red"
                  : energy.projectedLandingSocPercent < 35
                  ? "amber"
                  : "emerald"
              }
              size={110}
              subtext={`Reserve: ${aircraft.minReserveSocPercent}%`}
            />

            <div className="flex flex-col space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Initial SOC:</span>
                <span className="font-bold text-slate-200">{energy.initialSocPercent}%</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Temp Derate:</span>
                <span className={`font-bold ${energy.tempDeratePercent > 0 ? "text-amber-400" : "text-slate-400"}`}>
                  -{energy.tempDeratePercent}%
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-800/60 pb-1">
                <span className="text-slate-400">Energy Burn:</span>
                <span className="font-bold text-cyan-400">{energy.totalEnergyRequiredKwh} kWh</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">Flight Time:</span>
                <span className="font-bold text-slate-200">{energy.estimatedFlightTimeMin} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic PONR Visual Timeline */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Navigation className="w-3 h-3 text-cyan-400" />
              Dynamic PONR Marker
            </span>
            <span className="font-bold text-cyan-300">
              {energy.pointOfNoReturnKm} km / {energy.totalDistanceKm} km
            </span>
          </div>

          <div className="relative w-full h-3 rounded-full bg-slate-800 overflow-hidden flex items-center">
            {/* Safe return zone */}
            <div
              className="h-full bg-emerald-500/80 transition-all duration-500"
              style={{ width: `${energy.ponrTimelinePercent}%` }}
              title={`Safe Turnback Zone: Up to ${energy.pointOfNoReturnKm} km`}
            />
            {/* Beyond PONR commit zone */}
            <div
              className="h-full bg-amber-500/80 flex-1"
              title="Commit-to-Destination Zone"
            />
          </div>

          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span>TAKEOFF ({mission.origin.icao})</span>
            <span className="text-emerald-400 font-bold">PONR ({energy.pointOfNoReturnKm}km)</span>
            <span>DEST ({mission.destination.icao})</span>
          </div>
        </div>
      </div>

      {/* 3. Aircraft Weight & Balance / Airspace Clearance Card */}
      <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 flex flex-col justify-between md:col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              Weight & Airspace Envelopes
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              Type: {aircraft.type}
            </span>
          </div>

          <div className="space-y-3">
            {/* Gross Weight Envelope */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Gross Weight:</span>
                <span className={`font-bold ${totalGrossMass > aircraft.mtowKg ? "text-red-400" : "text-slate-200"}`}>
                  {totalGrossMass} kg / {aircraft.mtowKg} kg MTOW
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${massRatio > 100 ? "bg-red-500" : massRatio > 90 ? "bg-amber-500" : "bg-cyan-500"}`}
                  style={{ width: `${Math.min(100, massRatio)}%` }}
                />
              </div>
            </div>

            {/* Payload Utilization */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Cargo / Pax Payload:</span>
                <span className={`font-bold ${plannedPayloadKg > aircraft.maxPayloadKg ? "text-red-400" : "text-slate-200"}`}>
                  {plannedPayloadKg} kg / {aircraft.maxPayloadKg} kg Max
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{ width: `${Math.min(100, (plannedPayloadKg / aircraft.maxPayloadKg) * 100)}%` }}
                />
              </div>
            </div>

            {/* Airspace Summary */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs font-mono space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Airspace Clearances:</span>
                <span className={`font-bold ${mission.airspaceConflicts.length === 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {mission.airspaceConflicts.length === 0 ? "CLEAR" : `${mission.airspaceConflicts.length} ZONES`}
                </span>
              </div>
              {mission.airspaceConflicts.length > 0 ? (
                <div className="text-[11px] text-amber-300/90 truncate">
                  {mission.airspaceConflicts[0].details}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500">
                  Unrestricted class corridor trajectory
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Tail: {aircraft.tailNumber}</span>
          <span className="text-cyan-400">Cruise: {aircraft.nominalCruiseSpeedKts} kts</span>
        </div>
      </div>
    </div>
  );
};