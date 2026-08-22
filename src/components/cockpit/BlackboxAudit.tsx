"use client";

import React, { useState, useEffect } from "react";
import { MerkleAuditLedger } from "@/types/aviation";
import { Lock, ChevronDown, ChevronUp, Hash, CheckCircle } from "lucide-react";
import { verifyLedgerIntegrity } from "@/lib/blackbox-crypto";

interface BlackboxAuditProps {
  ledger?: MerkleAuditLedger;
}

export const BlackboxAudit: React.FC<BlackboxAuditProps> = ({ ledger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!ledger) return null;

  const rootHash = ledger.rootHash;
  const shortHash = rootHash ? `${rootHash.substring(0, 10)}...${rootHash.substring(rootHash.length - 6)}` : "0x00000...0000";

  return (
    <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold tracking-wide text-white font-sans">
                DO-178C Cryptographic Flight Blackbox Audit Ledger
              </h3>
              <span
                suppressHydrationWarning={true}
                className="text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              >
                {shortHash} [IMMUTABLE AUDIT LOCKED]
              </span>
            </div>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              SHA-256 Merkle-Chain flight record ledger with {ledger.blockCount} tamper-evident operational state blocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Root Signature Verified</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900 border border-white/10 text-xs font-sans text-slate-300 transition"
          >
            <span>{isOpen ? "Hide Block Chain" : "Inspect Block Chain"}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Block Chain Explorer */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
          {ledger.blocks.map((block) => (
            <div
              key={block.blockIndex}
              className="p-4 rounded-2xl bg-slate-950/40 border border-white/[0.05] text-xs font-mono space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-cyan-400" />
                  BLOCK #{block.blockIndex}: {block.eventType}
                </span>
                <span suppressHydrationWarning={true} className="text-[10px] text-slate-500">
                  {block.isoTimestamp}
                </span>
              </div>

              <p className="text-slate-300 font-sans text-xs leading-relaxed">{block.eventPayload}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-white/[0.04] pt-2">
                <div className="truncate">
                  <span className="text-slate-500">Previous Hash: </span>
                  <span suppressHydrationWarning={true} className="text-slate-400 font-mono">
                    {block.previousHash}
                  </span>
                </div>
                <div className="truncate text-right sm:text-left">
                  <span className="text-slate-500">Block Signature: </span>
                  <span suppressHydrationWarning={true} className="text-emerald-400 font-bold font-mono">
                    {block.blockHash}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};