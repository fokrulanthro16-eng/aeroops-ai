"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plane, Battery, ShieldCheck, MapPin, Gauge, Activity, RefreshCw } from "lucide-react";
import { MOCK_AIRCRAFT_FLEET, MOCK_VERTIPORTS } from "@/lib/simulation/scenarios";
import { FALLBACK_METAR_VECTORS } from "@/lib/weather";

export default function FleetPage() {
  const [selectedAircraft, setSelectedAircraft] = useState(MOCK_AIRCRAFT_FLEET[0]);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-obsidian-950">
      {/* Fleet Top Nav */}
      <header className="border-b border-slate-800 bg-obsidian-900/80 px-6 py-4 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cockpit Dashboard</span>
          </Link>
          <div className="h-4 w-px bg-slate-800" />
          <h1 className="text-sm font-bold font-mono text-slate-200 tracking-tight flex items-center gap-2">
            <Plane className="w-4 h-4 text-cyan-400" />
            FLEET DIGITAL TWINS & VERTIPORT NETWORK
          </h1>
        </div>

        <span className="text-xs font-mono text-slate-400">
          3 Aircraft Active • 4 Vertiports Online
        </span>
      </header>

      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 flex-1">
        {/* Section 1: Aircraft Fleet Twins */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-cyan-400" />
              Aircraft Fleet Telemetry & Airworthiness State
            </h2>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> All Airframes Certified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MOCK_AIRCRAFT_FLEET.map((ac) => {
              const isSelected = selectedAircraft.id === ac.id;
              return (
                <div
                  key={ac.id}
                  onClick={() => setSelectedAircraft(ac)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-obsidian-900 border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                      : "bg-obsidian-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-slate-800 text-cyan-300">
                      {ac.tailNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      READY FOR DISPATCH
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-100 mb-1">
                    {ac.model}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mb-4">
                    Type: {ac.type.replace("_", " ")}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-slate-800/80 pt-3">
                    <div>
                      <span className="text-slate-500 block text-[10px]">MTOW</span>
                      <span className="font-bold text-slate-200">{ac.mtowKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">MAX PAYLOAD</span>
                      <span className="font-bold text-slate-200">{ac.maxPayloadKg} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">BATTERY CAP</span>
                      <span className="font-bold text-emerald-400">{ac.batteryCapacityKwh} kWh</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">CRUISE SPEED</span>
                      <span className="font-bold text-cyan-400">{ac.nominalCruiseSpeedKts} kts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Vertiport Hub Network */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-emerald-400" />
              Vertiport Network Nodes & Live METAR Station Ingestion
            </h2>
            <span className="text-[11px] font-mono text-cyan-400">
              NOAA Aviation Weather Center Synced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {MOCK_VERTIPORTS.map((vp) => {
              const metar = FALLBACK_METAR_VECTORS[vp.icao] || FALLBACK_METAR_VECTORS["KLAX"];
              return (
                <div
                  key={vp.id}
                  className="p-4 rounded-xl bg-obsidian-900/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-cyan-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {vp.icao}
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {vp.elevationFt} ft Elev
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 leading-tight line-clamp-2">
                    {vp.name}
                  </h4>

                  <div className="text-[11px] font-mono space-y-1 text-slate-400 border-t border-slate-800/60 pt-2">
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-slate-300">{vp.lat.toFixed(2)}°, {vp.lon.toFixed(2)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Runways / FATOs:</span>
                      <span className="text-slate-300">{vp.activeRunways.join(", ")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather:</span>
                      <span className="text-emerald-400 font-bold">{metar.tempC}°C • {metar.flightCategory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Surface Wind:</span>
                      <span className="text-slate-300">{metar.windSpeedKts} kts @ {metar.windDirDeg}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}