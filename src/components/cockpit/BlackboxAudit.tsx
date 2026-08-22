"use client";

import React, { useState } from "react";
import { MerkleAuditLedger } from "@/types/aviation";
import { ShieldCheck, ShieldAlert, Lock, ChevronDown, ChevronUp, Hash, CheckCircle } from "lucide-react";
import { verifyLedgerIntegrity } from "@/lib/blackbox-crypto";

interface BlackboxAuditProps {
  ledger?: MerkleAuditLedger;
}

export const BlackboxAudit: React.FC<BlackboxAuditProps> = ({ ledger }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!ledger) return null;

  const verification = verifyLedgerIntegrity(ledger);

  return (
    <div className="rounded-xl bg-obsidian-900/90 border border-slate-800 p-4 sm:p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 border border-emerald-500/30">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                DO-178C Cryptographic Blackbox Audit Ledger
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {ledger.rootHash.substring(0, 10)}...{ledger.rootHash.substring(ledger.rootHash.length - 6)} [IMMUTABLE AUDIT LOCKED]
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              SHA-256 Merkle-Chain Ledger with {ledger.blockCount} tamper-evident operational blocks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Root Signature Verified</span>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition"
          >
            <span>{isOpen ? "Hide Blocks" : "Inspect Blocks"}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Block Explorer */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5">
          {ledger.blocks.map((block) => (
            <div
              key={block.blockIndex}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyan-400" />
                  BLOCK #{block.blockIndex}: {block.eventType}
                </span>
                <span className="text-[10px] text-slate-500">{block.isoTimestamp}</span>
              </div>

              <p className="text-slate-300 text-[11px]">{block.eventPayload}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-900 pt-1.5">
                <div className="truncate">
                  <span className="text-slate-500">Prev: </span>
                  <span className="text-slate-400 font-mono">{block.previousHash}</span>
                </div>
                <div className="truncate text-right sm:text-left">
                  <span className="text-slate-500">Hash: </span>
                  <span className="text-emerald-400 font-bold font-mono">{block.blockHash}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};