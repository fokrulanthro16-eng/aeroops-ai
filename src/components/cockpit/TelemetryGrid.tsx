"use client";

import React from "react";
import { RadialGauge } from "../ui/RadialGauge";
import { FlightMission } from "@/types/aviation";
import { Wind, BatteryCharging, Shield, Gauge, ArrowRight, Navigation, Thermometer } from "lucide-react";

interface TelemetryGridProps {
  mission: FlightMission;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({ mission }) => {
  const { weather, wind, energy, aircraft, plannedPayloadKg, airspaceConflicts } = mission;

  const totalGrossMass = aircraft.emptyWeightKg + plannedPayloadKg;
  const massRatio = Math.round((totalGrossMass / aircraft.mtowKg) * 100);
  const hasTfrConflict = airspaceConflicts.some(c => c.status === "RESTRICTION_CONFLICT");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 1. Atmospheric & Wind Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Wind className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-sans">
                Atmospheric & Wind
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-cyan-300">
              METAR {weather.station}
            </span>
          </div>

          <div className="flex items-center justify-around py-1">
            <RadialGauge
              value={wind.crosswindKts}
              max={aircraft.maxCrosswindKts}
              label="Crosswind"
              unit="kt"
              color={wind.isCrosswindExceeded ? "red" : wind.crosswindKts > aircraft.maxCrosswindKts * 0.7 ? "amber" : "cyan"}
              size={95}
              subtext={`Max ${aircraft.maxCrosswindKts} kt`}
            />

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Total Wind:</span>
                <span className="text-slate-200 font-bold">{wind.windSpeedKts} kt @ {wind.windDirDeg}°</span>
              </div>
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Headwind:</span>
                <span className={`font-bold ${wind.headwindKts > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {wind.headwindKts > 0 ? `+${wind.headwindKts} kt` : `${wind.headwindKts} kt`}
                </span>
              </div>
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Ground Spd:</span>
                <span className="text-cyan-300 font-bold">{wind.groundSpeedKts} kt</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-center text-[10px] font-mono">
          <div className="p-2 rounded-xl bg-slate-950/40 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9px]">TEMP</span>
            <span className="text-slate-200 font-bold">{weather.tempC}°C</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/40 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9px]">VISIBILITY</span>
            <span className="text-slate-200 font-bold">{weather.visibilitySm} SM</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950/40 border border-white/[0.04]">
            <span className="text-slate-400 block text-[9px]">CEILING</span>
            <span className="text-slate-200 font-bold">{weather.cloudCeilingFt} ft</span>
          </div>
        </div>
      </div>

      {/* 2. Energy & Dynamic PONR Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <BatteryCharging className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-sans">
                Energy & PONR
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-emerald-300">
              {aircraft.batteryCapacityKwh} kWh
            </span>
          </div>

          <div className="flex items-center justify-around py-1">
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
              size={95}
              subtext={`Min ${aircraft.minReserveSocPercent}%`}
            />

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Initial SOC:</span>
                <span className="text-slate-200 font-bold">{energy.initialSocPercent}%</span>
              </div>
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Derate:</span>
                <span className={`font-bold ${energy.tempDeratePercent > 0 ? "text-amber-400" : "text-slate-400"}`}>
                  -{energy.tempDeratePercent}%
                </span>
              </div>
              <div className="text-slate-400 flex justify-between gap-3">
                <span>Burn:</span>
                <span className="text-cyan-300 font-bold">{energy.totalEnergyRequiredKwh} kWh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic PONR Visual Bar */}
        <div className="pt-3 border-t border-white/[0.06] space-y-1.5 font-mono text-[10px]">
          <div className="flex justify-between text-slate-400">
            <span>Dynamic PONR:</span>
            <span className="text-cyan-300 font-bold">{energy.pointOfNoReturnKm} km / {energy.totalDistanceKm} km</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950/60 border border-white/5 overflow-hidden flex">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${energy.ponrTimelinePercent}%` }}
            />
            <div className="h-full bg-amber-400/80 flex-1" />
          </div>
        </div>
      </div>

      {/* 3. Airspace & NOTAM Corridor Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-sans">
                Airspace & NOTAMs
              </h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                hasTfrConflict
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : airspaceConflicts.length === 0
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}
            >
              {hasTfrConflict ? "TFR CONFLICT" : airspaceConflicts.length === 0 ? "CLEAR" : "CAUTION"}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/[0.04] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block">Corridor Ingress</span>
              <div className="font-semibold text-slate-200">
                {airspaceConflicts.length === 0 ? "Class-G Unrestricted Corridor" : `${airspaceConflicts.length} Intersecting Controlled Zones`}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/[0.04] space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block">Nearest Vertiport Hub</span>
              <div className="font-semibold text-cyan-300 flex items-center justify-between">
                <span>{mission.destination.name.split(" ")[0]} ({mission.destination.icao})</span>
                <span>{Math.round(mission.routeDistanceKm * 0.539957)} NM</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Flight Corridor Safe</span>
          <span className="text-cyan-300 font-semibold">1,500 ft Ceiling</span>
        </div>
      </div>

      {/* 4. Aircraft & Payload Card */}
      <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 font-sans">
                Weight & Balance
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/60 border border-white/5 text-slate-300">
              {aircraft.tailNumber}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Gross vs MTOW:</span>
                <span className={`font-bold ${totalGrossMass > aircraft.mtowKg ? "text-rose-400" : "text-slate-200"}`}>
                  {totalGrossMass} / {aircraft.mtowKg} kg
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden">
                <div
                  className={`h-full rounded-full ${massRatio > 100 ? "bg-rose-400" : massRatio > 90 ? "bg-amber-400" : "bg-cyan-400"}`}
                  style={{ width: `${Math.min(100, massRatio)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Payload Manifest:</span>
                <span className={`font-bold ${plannedPayloadKg > aircraft.maxPayloadKg ? "text-rose-400" : "text-slate-200"}`}>
                  {plannedPayloadKg} / {aircraft.maxPayloadKg} kg
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-950/60 overflow-hidden">
                <div
                  className="h-full bg-indigo-400 rounded-full"
                  style={{ width: `${Math.min(100, (plannedPayloadKg / aircraft.maxPayloadKg) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span>Type: {aircraft.type}</span>
          <span className="text-emerald-400 font-semibold">Ready for Dispatch</span>
        </div>
      </div>
    </div>
  );
};