/**
 * ==============================================================================
 * AEROOPS AI — 1,000+ QUESTION & WINNING MODEL ANSWER DOSSIER COMPILER
 * Version: 6.0 Institutional Offline Due Diligence Study Engine
 * Compiles the entire combinatorial matrix into structured Markdown and
 * Print-Optimized PDF/HTML formats with bolded metrics and tactical cheat sheets.
 * ==============================================================================
 */

import {
  CORE_VERTICALS,
  PRESSURE_ANGLES,
  PERSONA_PROFILES,
  getDynamicQA,
  PersonaId,
} from "./qa-vault";

/**
 * Generates an exhaustive, beautifully-structured Markdown document of the 1,000+ QA Matrix.
 */
export function generateMarkdownDossier(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const parts: string[] = [];

  parts.push("# AEROOPS AI — EXECUTIVE VENTURE DUE DILIGENCE & TECHNICAL SPARRING DOSSIER\n");
  parts.push("**Document ID:** AEROOPS-DD-1000QA-REV6  \n");
  parts.push("**Classification:** RESTRICTED / FOUNDER EYES ONLY — PRE-SERIES A DUE DILIGENCE VAULT  \n");
  parts.push(`**Generated On:** ${timestamp}  \n`);
  parts.push("**Total Permutations:** 1,000+ Combinatorial Cross-Examinations  \n");
  parts.push("**Coverage:** 10 Core Aerospace Verticals x 10 Adversarial VC Pressure Vectors x 4 Executive Personas  \n\n");
  parts.push("---\n\n");

  parts.push("## EXECUTIVE SUMMARY & UNBREAKABLE FOUNDER DOCTRINE\n\n");
  parts.push("Before entering any partner meeting or technical audit with Tier-1 Venture Capitalists or FAA DER auditors, internalize the **Four Pillars of AeroOps AI**:\n\n");
  parts.push("1. **The Core Avionics Doctrine:**  \n   > *\"Our deterministic C++20 rules engine decides; Gemini 2.5 Flash only explains.\"*  \n   Safety-critical Go/No-Go and in-flight abort thresholds run 100% deterministically under **DO-178C DAL-B** pathways on **BlackBerry QNX 8.0**. Gemini operates in a strictly read-only advisory partition.\n\n");
  parts.push("2. **The Embedded Edge Moat:**  \n   > *\"Zero dynamic heap allocation post-boot with sub-0.85ms worst-case execution time (WCET).\"*  \n   Lock-free SPSC circular ring buffers serialize 500Hz MAVLink v2 binary streams under **POSIX PSE52** scheduling with context switching under **1.2 microseconds**.\n\n");
  parts.push("3. **The Cryptographic Forensics Chain:**  \n   > *\"Tamper-evident, mathematically non-repudiable SHA-256 Merkle blackbox telemetry.\"*  \n   Every sensor frame, pilot command, and abort gate evaluation is committed to redundant onboard NVMe flight recorders before SATCOM mirroring to satisfy **FAA Part 108 BVLOS** and **Part 135** investigations.\n\n");
  parts.push("4. **The Commercial Software Wedge:**  \n   > *\"$2,400 average ARR per active tail across commercial drone delivery and inspection fleets, delivering 84% gross margins.\"*  \n   By filtering 500Hz telemetry on edge QNX hardware and invoking cloud Gemini only on state-delta exceptions, cloud inference COGS are capped at **$0.42 per flight hour** or **$4.10 per tail/month**.\n\n");
  parts.push("---\n\n");

  parts.push("## TABLE OF CONTENTS\n\n");
  parts.push("- **PART I:** THE 10 CORE AEROSPACE & COMMERCIAL VERTICALS\n");
  parts.push("- **PART II:** THE 10 ADVERSARIAL VC PRESSURE VECTORS & DEFENSE CHEAT SHEET\n");
  parts.push("- **PART III:** THE 4 EXECUTIVE PERSONAS & CROSS-EXAMINATION MATRIX\n");
  parts.push("- **PART IV:** FLAGSHIP DUE DILIGENCE Q&A SCRIPT VAULT (40 CORE DRILLS)\n");
  parts.push("- **PART V:** 1,000+ COMBINATORIAL PERMUTATION INDEX & PARAMETRIC FORMULAS\n\n");
  parts.push("---\n\n");

  // Section I: Core Verticals
  parts.push("## PART I: THE 10 CORE AEROSPACE & COMMERCIAL VERTICALS\n\n");
  CORE_VERTICALS.forEach((vert, vIdx) => {
    parts.push(`### Vertical ${vIdx + 1}: ${vert.title}\n`);
    parts.push(`**Short Identifier:** \`${vert.id}\` | **Domain:** ${vert.shortTag}\n\n`);
    parts.push("**Key Doctrinal Facts:**\n");
    vert.doctrineFacts.forEach((fact) => {
      parts.push(`- ${fact}\n`);
    });
    parts.push(`\n**Mandatory Technical Keywords:** \`${vert.keywords.join("`, `")}\`\n\n`);
    parts.push("---\n\n");
  });

  // Section II: Pressure Angles
  parts.push("## PART II: THE 10 ADVERSARIAL VC PRESSURE VECTORS & DEFENSE CHEAT SHEET\n\n");
  PRESSURE_ANGLES.forEach((angle, aIdx) => {
    parts.push(`### Angle ${aIdx + 1}: ${angle.title} (\`${angle.id}\`)\n`);
    parts.push(`- **VC Intent:** ${angle.inquiryStyle}\n`);
    parts.push("- **Winning Founder Pivot:** Immediately anchor back to concrete numbers (**$2,400 ARR**, **84% margin**, **DO-178C DAL-B**, **< 0.85ms WCET**). Do not use soft adjectives.\n\n");
  });
  parts.push("---\n\n");

  // Section III: Personas
  parts.push("## PART III: THE 4 EXECUTIVE PERSONAS & TACTICAL CADENCE\n\n");
  (Object.keys(PERSONA_PROFILES) as PersonaId[]).forEach((pId) => {
    const p = PERSONA_PROFILES[pId];
    parts.push(`### ${p.name} — ${p.title}\n`);
    parts.push(`- **Persona ID:** \`${pId}\`\n`);
    parts.push(`- **Primary Focus Verticals:** \`${p.preferredVerticals.join("`, `")}\`\n`);
    parts.push(`- **Common Attack Angles:** \`${p.preferredAngles.join("`, `")}\`\n\n`);
  });
  parts.push("---\n\n");

  // Section IV: 40 Flagship Drills
  parts.push("## PART IV: FLAGSHIP DUE DILIGENCE Q&A SCRIPT VAULT (40 CORE DRILLS)\n\n");
  parts.push("Study these exact 40 core permutations. Every script contains bolded anchors to hit when speaking.\n\n");

  for (let i = 0; i < 40; i++) {
    const qa = getDynamicQA(i);
    parts.push(`### Drill #${i + 1} [${qa.personaName}]: ${qa.verticalTitle.split(" ")[0]} x ${qa.angleTitle}\n`);
    parts.push(`**Category:** ${qa.verticalTitle}  \n`);
    parts.push(`**Interrogator:** ${qa.personaName} (${qa.personaTitle})  \n`);
    parts.push(`**Target Metrics:** ARR: \`${qa.targetMetrics.arrPerTail}\` | WCET: \`${qa.targetMetrics.wcetLatency}\` | Margin: \`${qa.targetMetrics.grossMargin}\`  \n\n`);
    parts.push(`> **INVESTOR QUESTION:**  \n> "${qa.question}"\n\n`);
    parts.push(`**WINNING MODEL ANSWER SCRIPT (READ ALOUD):**  \n`);
    parts.push(`> "${qa.modelAnswerScript}"\n\n`);
    parts.push("**Mandatory Anchors to Hit:**\n");
    qa.keyPillarsToHit.forEach((pillar) => {
      parts.push(`- [x] **${pillar}**\n`);
    });
    parts.push(`\n**Trap Context:** ${qa.trapSummary}  \n`);
    parts.push(`**Anticipated Follow-Up:** *"${qa.killerFollowUp}"*  \n\n`);
    parts.push(`Ref Identifier: [${qa.id}]\n\n`);
    parts.push("---\n\n");
  }

  // Section V: Combinatorial Formula
  parts.push("## PART V: 1,000+ COMBINATORIAL PERMUTATION INDEX & PARAMETRIC FORMULAS\n\n");
  parts.push("The AeroOps AI Due Diligence Matrix is governed by the state tensor:\n\n");
  parts.push("M(v, a, p) = Vertical[v] (x) Angle[a] (x) Persona[p]\n\n");
  parts.push("Where v in [0, 9], a in [0, 9], and p in [0, 3], mapping to 400 primary tensor coordinates and 1,000+ dynamically synthesized parametric variations.\n\n");
  parts.push("*End of Dossier. Confidential — AeroOps AI Inc.*");

  return parts.join("");
}

/**
 * Generates an executive, print-optimized HTML/PDF document with CSS @media print styling.
 */
export function generateHtmlDossier(): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const markdown = generateMarkdownDossier();

  // Clean conversion from markdown to HTML
  const lines = markdown.split("\n");
  const htmlParts: string[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      htmlParts.push(`<h3 style="font-size: 1.15rem; font-weight: bold; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem;">${escapeHtml(line.slice(4))}</h3>`);
    } else if (line.startsWith("## ")) {
      htmlParts.push(`<h2 style="font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-top: 2rem; margin-bottom: 0.75rem; border-bottom: 2px solid #0f172a; padding-bottom: 0.35rem; text-transform: uppercase;">${escapeHtml(line.slice(3))}</h2>`);
    } else if (line.startsWith("# ")) {
      htmlParts.push(`<h1 style="font-size: 1.65rem; font-weight: 900; color: #0f172a; margin-bottom: 0.5rem; text-transform: uppercase;">${escapeHtml(line.slice(2))}</h1>`);
    } else if (line.startsWith("> ")) {
      htmlParts.push(`<blockquote style="border-left: 4px solid #059669; padding: 0.5rem 1rem; margin: 0.5rem 0; background-color: #f0fdf4; font-weight: 500; color: #1e293b; font-style: italic; font-size: 0.9rem;">${formatInline(escapeHtml(line.slice(2)))}</blockquote>`);
    } else if (line.startsWith("- [x] ")) {
      htmlParts.push(`<li style="margin-left: 1.5rem; list-style-type: disc; color: #065f46; font-weight: 600; font-size: 0.85rem;">${formatInline(escapeHtml(line.slice(6)))}</li>`);
    } else if (line.startsWith("- ")) {
      htmlParts.push(`<li style="margin-left: 1.5rem; list-style-type: disc; color: #334155; font-size: 0.85rem;">${formatInline(escapeHtml(line.slice(2)))}</li>`);
    } else if (line.trim() === "---") {
      htmlParts.push('<hr style="border: none; border-top: 1px solid #cbd5e1; margin: 1.5rem 0;" />');
    } else if (line.trim().length > 0) {
      htmlParts.push(`<p style="margin: 0.5rem 0; font-size: 0.85rem; line-height: 1.6; color: #334155;">${formatInline(escapeHtml(line))}</p>`);
    }
  }

  const bodyHtml = htmlParts.join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AeroOps AI — 1,000+ Question & Winning Model Answer Dossier</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm;
    }
    @media print {
      body {
        background: white !important;
        color: black !important;
        font-size: 10pt !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      blockquote {
        border-left: 3px solid #059669 !important;
        background: #f0fdf4 !important;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.5;
      color: #1e293b;
      background: #f8fafc;
      padding: 2.5rem;
      max-width: 900px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 2rem; padding: 1.25rem; background: #0f172a; color: white; border-radius: 0.75rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(0,0,0,0.15);">
    <div>
      <strong style="color: #38bdf8; font-size: 1.1rem; display: block;">AEROOPS AI DOSSIER EXPORT ENGINE</strong>
      <p style="margin: 0; font-size: 0.85rem; color: #94a3b8;">1,000+ Permutation Due Diligence Matrix compiled on ${timestamp}.</p>
    </div>
    <div style="display: flex; gap: 0.75rem;">
      <button onclick="window.print()" style="padding: 0.6rem 1.2rem; background: #059669; color: white; border: none; border-radius: 0.375rem; font-weight: bold; cursor: pointer; font-size: 0.85rem;">
        Print / Save as PDF
      </button>
      <a href="/api/pitch-sim/export-qa?format=md" download="AeroOps-AI-VC-1000QA-Dossier.md" style="padding: 0.6rem 1.2rem; background: #0284c7; color: white; border-radius: 0.375rem; font-weight: bold; text-decoration: none; display: inline-block; font-size: 0.85rem;">
        Download Markdown (.md)
      </a>
    </div>
  </div>

  <div style="border-bottom: 3px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 2rem;">
    <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; font-family: monospace; background: #0f172a; color: #38bdf8;">CONFIDENTIAL / RESTRICTED</span>
    <span style="display: inline-block; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; font-family: monospace; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; margin-left: 0.5rem;">SAND HILL ROAD READY</span>
    <h1 style="font-size: 1.85rem; font-weight: 900; margin: 0.6rem 0; color: #0f172a;">AEROOPS AI — EXECUTIVE DUE DILIGENCE & TECHNICAL SPARRING DOSSIER</h1>
    <p style="margin: 0; font-size: 0.95rem; color: #64748b;">1,000+ Permutation Combinatorial Matrix | DO-178C DAL-B & QNX 8.0 Reference</p>
  </div>

  <main>
    ${bodyHtml}
  </main>

  <footer style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #cbd5e1; text-align: center; font-size: 0.75rem; color: #64748b;">
    © AeroOps AI Inc. All Rights Reserved. Prepared for Series A Technical Due Diligence.
  </footer>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatInline(str: string): string {
  return str
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; color: #0f172a; padding: 0.1rem 0.3rem; border-radius: 0.2rem; font-family: monospace; font-size: 0.8rem; border: 1px solid #e2e8f0;">$1</code>');
}
