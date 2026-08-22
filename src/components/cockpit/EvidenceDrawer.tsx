"use client";

import React, { useState } from "react";
import { EvidenceAuditItem } from "@/types/aviation";
import { Table, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Lock } from "lucide-react";

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
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
            <CheckCircle className="w-2.5 h-2.5" /> NOMINAL
          </span>
        );
      case "MARGINAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25">
            <AlertTriangle className="w-2.5 h-2.5" /> MARGINAL
          </span>
        );
      case "VIOLATION":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
            <XCircle className="w-2.5 h-2.5" /> VIOLATION
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                Traceable Source-to-Decision Evidence Audit Ledger
              </h3>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> 0x89be...1fc7 [IMMUTABLE AUDIT LOCKED]
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              100% deterministic traceability mapping observed physical telemetry directly to regulatory safety limits
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Subsystem filter pill bar */}
          <div className="flex items-center p-1 rounded-full bg-slate-950/60 border border-white/5 text-xs font-mono">
            {(["ALL", "WEATHER", "ENERGY", "AIRCRAFT", "AIRSPACE"] as const).map((sub) => (
              <button
                key={sub}
                onClick={() => setFilterSubsystem(sub)}
                className={`px-3 py-1 rounded-full transition-all ${
                  filterSubsystem === sub
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-slate-300 transition"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.05]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-slate-400 bg-slate-950/60">
                <th className="py-3 px-4 font-semibold">Record ID</th>
                <th className="py-3 px-4 font-semibold">Subsystem</th>
                <th className="py-3 px-4 font-semibold">Parameter</th>
                <th className="py-3 px-4 font-semibold">Measured Value</th>
                <th className="py-3 px-4 font-semibold">Safety Envelope</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Origin Ingestion Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-slate-950/20">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-400">{item.id}</td>
                  <td className="py-3 px-4 text-slate-400">{item.subsystem}</td>
                  <td className="py-3 px-4 text-slate-200 font-sans font-medium">{item.parameter}</td>
                  <td className="py-3 px-4 font-bold text-slate-100">{item.observedValue}</td>
                  <td className="py-3 px-4 text-slate-400">{item.safetyEnvelope}</td>
                  <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]" title={item.sourceTag}>
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