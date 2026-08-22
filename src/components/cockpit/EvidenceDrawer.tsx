"use client";

import React, { useState } from "react";
import { EvidenceAuditItem } from "@/types/aviation";
import { Table, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, Search, FileSpreadsheet } from "lucide-react";

interface EvidenceDrawerProps {
  evidence: EvidenceAuditItem[];
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [filterSubsystem, setFilterSubsystem] = useState<string>("ALL");

  const filteredItems = evidence.filter((item) =>
    filterSubsystem === "ALL" ? true : item.subsystem === filterSubsystem
  );

  const getStatusBadge = (status: "NOMINAL" | "MARGINAL" | "VIOLATION") => {
    switch (status) {
      case "NOMINAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-2.5 h-2.5" /> NOMINAL
          </span>
        );
      case "MARGINAL":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-2.5 h-2.5" /> MARGINAL
          </span>
        );
      case "VIOLATION":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/30 animate-pulse">
            <XCircle className="w-2.5 h-2.5" /> VIOLATION
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
            Traceable Source-to-Decision Evidence Audit Table
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {evidence.length} Verifiable Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Subsystem filter */}
          <div className="flex items-center gap-1 text-[11px] font-mono">
            {(["ALL", "WEATHER", "ENERGY", "AIRCRAFT", "AIRSPACE"] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setFilterSubsystem(sub)}
                className={`px-2 py-0.5 rounded transition ${
                  filterSubsystem === sub
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="py-2.5 px-3 font-medium">Record ID</th>
                <th className="py-2.5 px-3 font-medium">Subsystem</th>
                <th className="py-2.5 px-3 font-medium">Observed Parameter</th>
                <th className="py-2.5 px-3 font-medium">Measured Value</th>
                <th className="py-2.5 px-3 font-medium">Safety Envelope</th>
                <th className="py-2.5 px-3 font-medium">Status</th>
                <th className="py-2.5 px-3 font-medium">Origin Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">{item.id}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.subsystem}</td>
                  <td className="py-2.5 px-3 text-slate-200 font-medium">{item.parameter}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-100">{item.observedValue}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.safetyEnvelope}</td>
                  <td className="py-2.5 px-3">{getStatusBadge(item.status)}</td>
                  <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[140px]" title={item.sourceTag}>
                    {item.sourceTag}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};