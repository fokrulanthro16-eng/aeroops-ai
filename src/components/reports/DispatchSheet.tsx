"use client";

import React from "react";
import { FlightMission } from "@/types/aviation";
import { X, Printer, ShieldCheck, ShieldAlert, Plane, Check, AlertCircle } from "lucide-react";

interface DispatchSheetProps {
  mission: FlightMission;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchSheet: React.FC<DispatchSheetProps> = ({ mission, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { aircraft, origin, destination, weather, wind, energy, risk, evidence, aiBriefing } = mission;
  const releaseId = `REL-${mission.id.substring(0, 8).toUpperCase()}-${new Date().getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-4xl rounded-xl bg-obsidian-900 border border-slate-700 text-slate-100 shadow-2xl overflow-hidden my-8">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-obsidian-950">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
              Official Pre-Flight Release Document
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 text-obsidian-950 font-mono text-xs font-bold hover:bg-cyan-400 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="p-6 sm:p-8 space-y-6 font-mono text-xs print:p-0 print:bg-white print:text-black">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-700 print:border-black pb-4 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-cyan-400 print:text-black" />
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white print:text-black">
                  AERTOPS AI — FLIGHT DISPATCH RELEASE
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 print:text-gray-600 mt-0.5">
                Autonomous Operational Risk & Flight Readiness Clearance System
              </p>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-cyan-300 print:text-black">
                {releaseId}
              </div>
              <div className="text-[10px] text-slate-400 print:text-gray-600">
                DATE: {new Date().toISOString().replace("T", " ").substring(0, 19)} UTC
              </div>
            </div>
          </div>

          {/* Verdict Callout */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              risk.verdict === "GO"
                ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 print:border-green-600 print:text-green-800"
                : risk.verdict === "AMBER"
                ? "bg-amber-950/40 border-amber-500/60 text-amber-300 print:border-yellow-600 print:text-yellow-800"
                : "bg-red-950/40 border-red-500/60 text-red-300 print:border-red-600 print:text-red-800"
            }`}
          >
            <div>
              <span className="font-bold text-sm">
                AUTHORIZATION DECISION: {risk.verdict}
              </span>
              <span className="ml-2 text-[11px]">
                (Composite Risk Index: {risk.compositeScore}/100)
              </span>
            </div>
            <div className="text-[11px] font-bold">
              HARD GATES PASSED: {5 - risk.failedGatesCount}/5
            </div>
          </div>

          {/* 2-Column Flight & Aircraft Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Flight Corridor Details */}
            <div className="p-3 rounded-lg border border-slate-800 print:border-gray-300 space-y-1.5">
              <span className="text-slate-400 print:text-gray-600 font-bold uppercase block border-b border-slate-800 print:border-gray-300 pb-1">
                Flight Plan & Corridor
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Callsign:</span>
                <span className="font-bold">{mission.callsign}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Route:</span>
                <span className="font-bold">
                  {origin.icao} ({origin.name.split(" ")[0]}) → {destination.icao} ({destination.name.split(" ")[0]})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Distance / Heading:</span>
                <span>{mission.routeDistanceKm} km ({Math.round(mission.routeDistanceKm * 0.539957)} NM) / {mission.routeHeadingDeg}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Est. En-route Flight Time:</span>
                <span>{energy.estimatedFlightTimeMin} minutes</span>
              </div>
            </div>

            {/* Aircraft & Weight & Balance */}
            <div className="p-3 rounded-lg border border-slate-800 print:border-gray-300 space-y-1.5">
              <span className="text-slate-400 print:text-gray-600 font-bold uppercase block border-b border-slate-800 print:border-gray-300 pb-1">
                Aircraft Weight & Balance
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Aircraft Model:</span>
                <span className="font-bold">{aircraft.model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Tail Number:</span>
                <span>{aircraft.tailNumber} ({aircraft.type})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Gross Weight / MTOW:</span>
                <span>{aircraft.emptyWeightKg + mission.plannedPayloadKg} kg / {aircraft.mtowKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Payload Manifest:</span>
                <span>{mission.plannedPayloadKg} kg (Max: {aircraft.maxPayloadKg} kg)</span>
              </div>
            </div>
          </div>

          {/* Energy & Meteorology Audit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-slate-800 print:border-gray-300 space-y-1.5">
              <span className="text-slate-400 print:text-gray-600 font-bold uppercase block border-b border-slate-800 print:border-gray-300 pb-1">
                Meteorological Ingestion
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Surface Wind / Gust:</span>
                <span>{wind.windSpeedKts} kts @ {wind.windDirDeg}° (Gust: {weather.windGustKts} kts)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Resolved Crosswind / Limit:</span>
                <span className="font-bold">{wind.crosswindKts} kts / {aircraft.maxCrosswindKts} kts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Resolved Headwind / Ground Speed:</span>
                <span>{wind.headwindKts} kts / {wind.groundSpeedKts} kts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Visibility & Ceiling:</span>
                <span>{weather.visibilitySm} SM / {weather.cloudCeilingFt} ft ({weather.flightCategory})</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-800 print:border-gray-300 space-y-1.5">
              <span className="text-slate-400 print:text-gray-600 font-bold uppercase block border-b border-slate-800 print:border-gray-300 pb-1">
                Energy & Dynamic PONR
              </span>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Initial SOC / Usable Cap:</span>
                <span>{energy.initialSocPercent}% / {energy.usableCapacityKwh} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Total Projected Energy Burn:</span>
                <span>{energy.totalEnergyRequiredKwh} kWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Projected Landing Reserve:</span>
                <span className="font-bold">{energy.projectedLandingSocPercent}% (Min: {aircraft.minReserveSocPercent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 print:text-gray-600">Point of No Return (PONR):</span>
                <span>{energy.pointOfNoReturnKm} km from departure</span>
              </div>
            </div>
          </div>

          {/* Hard Safety Gates Table */}
          <div className="border border-slate-800 print:border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-slate-950 print:bg-gray-100 p-2 font-bold text-slate-300 print:text-black">
              DETERMINISTIC SAFETY GATES COMPLIANCE AUDIT
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 print:border-gray-300 text-slate-400 print:text-gray-600">
                  <th className="p-2">Gate ID</th>
                  <th className="p-2">Safety Invariant</th>
                  <th className="p-2">Observed Telemetry</th>
                  <th className="p-2">Regulatory Threshold</th>
                  <th className="p-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {risk.hardGates.map((g) => (
                  <tr key={g.gateId}>
                    <td className="p-2 font-bold text-cyan-400 print:text-black">{g.gateId}</td>
                    <td className="p-2">{g.name}</td>
                    <td className="p-2">{g.telemetryValue}</td>
                    <td className="p-2 text-slate-400 print:text-gray-600">{g.limitThreshold}</td>
                    <td className="p-2 text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${g.passed ? "text-emerald-400 print:text-green-700" : "text-red-400 print:text-red-700"}`}>
                        {g.passed ? "PASSED" : "FAILED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Briefing Summary */}
          {aiBriefing && (
            <div className="p-3 rounded-lg border border-slate-800 print:border-gray-300 space-y-1">
              <span className="font-bold text-cyan-300 print:text-black block">
                EXPLAINABLE AI DISPATCH BRIEFING:
              </span>
              <p className="text-slate-300 print:text-gray-800 text-[11px] leading-relaxed">
                {aiBriefing.executive_summary}
              </p>
            </div>
          )}

          {/* Pilot Sign-Off & Legal Disclaimer */}
          <div className="pt-4 border-t-2 border-slate-700 print:border-black space-y-3">
            <div className="grid grid-cols-2 gap-8 text-[11px]">
              <div>
                <span className="text-slate-400 print:text-gray-600 block mb-4">
                  DISPATCHER / OPERATOR SIGNATURE:
                </span>
                <div className="border-b border-slate-600 print:border-black w-48 pb-1">
                  AERTOPS AUTOMATED DISPATCH 2.5
                </div>
              </div>

              <div>
                <span className="text-slate-400 print:text-gray-600 block mb-4">
                  PILOT-IN-COMMAND (PIC) ACCEPTANCE:
                </span>
                <div className="border-b border-slate-600 print:border-black w-48 pb-1">
                  ___________________________
                </div>
              </div>
            </div>

            <p className="text-[9px] text-slate-500 print:text-gray-500 italic pt-2">
              SAFETY NOTICE: AeroOps AI is an operational decision-support tool. It does not replace certified ATC communications or formal FAA/EASA airworthiness filings. Final legal and operational responsibility rests solely with the certified Pilot-in-Command (PIC).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};