"use client";

import React, { useState } from "react";
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  ShieldAlert,
  Award,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Cpu,
  Scale,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  DueDiligenceReport,
  exportReportAsMarkdown,
} from "@/lib/pitch-sim/scoring-rubric";

interface ScorecardModalProps {
  report: DueDiligenceReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopyMarkdown = () => {
    const md = exportReportAsMarkdown(report);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const md = exportReportAsMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.sessionId}-DUE-DILIGENCE-AUDIT.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.sessionId}-TELEMETRY-DOSSIER.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isRejected = report.investmentVerdict.status === "DILIGENCE_REJECTED";
  const isExtended = report.investmentVerdict.status === "TERM_SHEET_EXTENDED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                isRejected
                  ? "bg-red-500/20 border-red-500/40 text-red-400"
                  : isExtended
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-amber-500/20 border-amber-500/40 text-amber-400"
              }`}
            >
              {isRejected ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isExtended ? (
                <Award className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  AeroOps AI • Institutional Due Diligence Audit Dossier
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {report.sessionId}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Evaluated against DO-178C DAL-B, QNX 8.0 RTOS, and $1,200-$3,500 ARR/tail metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Copy Markdown Report"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy MD"}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download Markdown Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export .MD</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Download JSON Telemetry"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Report Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Investment Verdict Hero */}
          <div
            className={`p-5 rounded-xl border relative overflow-hidden ${
              isRejected
                ? "bg-red-950/40 border-red-500/50"
                : isExtended
                ? "bg-emerald-950/40 border-emerald-500/50"
                : "bg-amber-950/40 border-amber-500/50"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span
                  className={`text-[11px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 rounded border ${
                    isRejected
                      ? "bg-red-500/20 text-red-300 border-red-500/40"
                      : isExtended
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  }`}
                >
                  {report.investmentVerdict.tier}
                </span>

                <h3 className="text-lg sm:text-xl font-bold text-white mt-2">
                  {report.investmentVerdict.headline}
                </h3>
              </div>

              <div className="text-right sm:text-center shrink-0">
                <div className="text-xs font-mono text-slate-400 uppercase">
                  Composite Rating
                </div>
                <div
                  className={`text-3xl sm:text-4xl font-mono font-extrabold ${
                    report.scores.composite >= 75
                      ? "text-emerald-400"
                      : report.scores.composite >= 55
                      ? "text-amber-400"
                      : "text-red-400"
                  }`}
                >
                  {report.scores.composite}
                  <span className="text-lg font-light text-slate-500">/100</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-300 mt-3 leading-relaxed border-t border-white/10 pt-3">
              {report.investmentVerdict.summary}
            </p>
          </div>

          {/* Section 2: 4 Core Quantitative Indices */}
          <div>
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Avionics & Diligence Quantitative Indices</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* TDI */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Technical (TDI)</span>
                  </div>
                  <span className="text-base font-mono font-bold text-emerald-400">
                    {report.scores.tdi}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${report.scores.tdi}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  QNX 8.0, static memory, lock-free ring buffers, sub-1ms WCET
                </span>
              </div>

              {/* RMR */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Scale className="w-3.5 h-3.5 text-red-400" />
                    <span>Regulatory (RMR)</span>
                  </div>
                  <span className="text-base font-mono font-bold text-red-400">
                    {report.scores.rmr}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${report.scores.rmr}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  DO-178C DAL-B, partition isolation, SHA-256 Merkle ledger
                </span>
              </div>

              {/* ICV */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>Commercial (ICV)</span>
                  </div>
                  <span className="text-base font-mono font-bold text-amber-400">
                    {report.scores.icv}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${report.scores.icv}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  $1,200-$3,500 ARR/tail, Part 108 wedge, 82%+ gross margin
                </span>
              </div>

              {/* VCP */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-sky-400" />
                    <span>Conviction (VCP)</span>
                  </div>
                  <span className="text-base font-mono font-bold text-sky-400">
                    {report.scores.vcp}
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400"
                    style={{ width: `${report.scores.vcp}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {report.subsystemBreakdown.delivery.wpm} WPM,{" "}
                  {report.subsystemBreakdown.delivery.fillerCount} fillers,{" "}
                  {report.subsystemBreakdown.delivery.interruptionCount} interrupts
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Red Flag vs Winning Pivot Cross-Examination Matrix */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>The &ldquo;Red Flag vs. Winning Pivot&rdquo; Cross-Examination Matrix</span>
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {report.redFlagPivotMatrix.length} ITEMS DIAGNOSED
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {report.redFlagPivotMatrix.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col gap-2.5 ${
                    item.severity === "CRITICAL"
                      ? "bg-red-950/25 border-red-500/40"
                      : "bg-slate-900/50 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-200">
                      {idx + 1}. {item.topic}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        item.severity === "CRITICAL"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {item.severity} RED FLAG
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mt-1">
                    {/* Founder Claim */}
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                        Exact Founder Claim / Trigger:
                      </span>
                      <p className="text-red-300 italic font-mono">
                        &ldquo;{item.founderQuote}&rdquo;
                      </p>
                    </div>

                    {/* Investor Diagnosis */}
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">
                          Investor Red Flag Diagnosis:
                        </span>
                        <span className="text-[10px] font-mono text-amber-400 truncate max-w-[120px]">
                          {item.personaTriggered}
                        </span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {item.investorDiagnosis}
                      </p>
                    </div>

                    {/* Winning Pivot Script */}
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex flex-col gap-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Institutional Winning Pivot Script:</span>
                      </span>
                      <p className="text-emerald-200 leading-relaxed font-mono">
                        &ldquo;{item.winningPivotScript}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Thesis Pillars Coverage */}
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Aerospace & Venture Thesis Pillar Coverage
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                {report.pillarsSummary.coveredCount} / {report.pillarsSummary.total} Addressed
              </span>
            </div>

            {report.pillarsSummary.uncoveredPillars.length > 0 ? (
              <div className="text-xs text-amber-300 font-mono">
                <span className="text-slate-400 mr-2">Unaddressed Pillars in this Drill:</span>
                {report.pillarsSummary.uncoveredPillars.join(" • ")}
              </div>
            ) : (
              <div className="text-xs text-emerald-300 font-mono">
                ✅ Pristine coverage: All 8 core aerospace, RTOS, regulatory, and commercial pillars articulated.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/60">
          <span className="text-xs font-mono text-slate-500">
            AeroOps AI v3.0 Enterprise VC Pitch Sparring Simulator
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
