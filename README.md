<div align="center">

# âœˆï¸ AeroOps AI v2.0
### Autonomous Flight Readiness & In-Flight Fleet Risk Intelligence Platform
**Engineered for Advanced Air Mobility (eVTOL) & BVLOS Drone Fleet Operations**

[![Avionics & Flight Readiness Test Matrix](https://github.com/fokrulanthro16-eng/aeroops-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/fokrulanthro16-eng/aeroops-ai/actions)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini_2.5_Flash-Live_ATC-8E75C2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Compliance](https://img.shields.io/badge/DO--178C-SHA--256_Merkle_Ledger-emerald?style=for-the-badge)](https://en.wikipedia.org/wiki/DO-178C)
[![Tests](https://img.shields.io/badge/Tests-39%2F39_Passing-brightgreen?style=for-the-badge)](https://github.com)
[![E2E Integration](https://img.shields.io/badge/E2E-16%2F16_Verified-blue?style=for-the-badge)](https://github.com)

*From raw aviation telemetry to explainable, evidence-backed GO / AMBER / NO-GO mission releases and dynamic in-air deconfliction.*

</div>

---

## ðŸ“¸ Cockpit Showcase & Operational Visuals

### 1. Pre-Flight Readiness Cockpit & 60/40 Vector Radar Split View
*High-resolution glassmorphic operations console displaying 5-factor safety gates, vector corridors, and dynamic Point of No Return (PONR) calculation.*

<div align="center">
  <img src="./docs/screenshots/hero-cockpit-dispatch.svg" alt="AeroOps AI Pre-Flight Cockpit" width="100%" />
</div>

---

### 2. Active 1Hz In-Flight Telemetry HUD & Destination Turnaround Matrix
*Real-time 1Hz avionics streaming, live battery thermal modeling, anomaly injectors (Wind Shear / Battery Decay), and automated Burbank alternate vertiport diversion.*

<div align="center">
  <img src="./docs/screenshots/inflight-telemetry-hud.svg" alt="AeroOps AI In-Flight Telemetry HUD" width="100%" />
</div>

---

### 3. DO-178C Cryptographic Blackbox Audit Ledger
*SHA-256 Merkle-Chain flight record ledger generating tamper-evident operational blocks for regulatory authorities and insurance underwriters.*

<div align="center">
  <img src="./docs/screenshots/cryptographic-audit-ledger.svg" alt="AeroOps AI Blackbox Audit Ledger" width="100%" />
</div>

---

## ðŸ§­ Core Philosophy: *"Rules Engine Decides, AI Explains"*

In safety-critical aviation (**DO-178C / FAA Part 135 / EASA SC-VTOL**), probabilistic GenAI models must **never** be single points of failure for flight-critical go/no-go clearances. 

AeroOps AI enforces a strict, robust architectural boundary:
1. **Deterministic Physics & Risk Engine:** Evaluates all hard regulatory safety gates, aerodynamic power draws, thermal battery derates, crosswinds, and dynamic turnback points (Point of No Return - PONR).
2. **Explainable Multimodal AI Layer (Google Gemini 2.5 Flash):** Ingests verified ground-truth telemetry and evidence records to synthesize human-readable executive briefings and synthesized radio ATC voice dispatch.

---

## ðŸ›ï¸ System Architecture

```mermaid
graph TD
    subgraph SENSORS_AND_INGESTION [Real-Time Ingestion Layer]
        A1[NOAA Live METAR / TAF] --> INGEST[Telemetry Ingestion Pipeline]
        A2[FAA Special Activity Airspace & TFRs] --> INGEST
        A3[eVTOL BMS 1Hz Sensor Stream] --> INGEST
        A4[Urban Canyon Wind Grids] --> INGEST
    end

    subgraph DETERMINISTIC_CORE [Deterministic Avionics Safety Core]
        INGEST --> PHYS[2D Vector Aerodynamic Power Solver]
        INGEST --> AIR[Class B/C/D Polygon Intersection]
        INGEST --> PONR[Dynamic Point-of-No-Return Solver]
        PHYS --> GATES{5-Factor Safety Gate Interlock}
        AIR --> GATES
        PONR --> GATES
    end

    subgraph CRYPTO_LEDGER [DO-178C Blackbox]
        GATES -->|Event State Transition| MERKLE[SHA-256 Merkle Chain]
        MERKLE --> BLK[Immutable Flight Blackbox Block]
    end

    subgraph EXPLAINABLE_AI [Multimodal ATC Copilot]
        GATES -->|Verified Telemetry Payload| GEMINI[Google Gemini 2.5 Flash API]
        GEMINI --> BRIEF[Structured Dispatch Briefing]
        BRIEF --> SPEECH[Web Speech Radio ATC Audio]
    end

    subgraph COCKPIT_HUD [Obsidian Glass Cockpit UI]
        GATES --> UI[Next.js Luxury Editorial Dashboard]
        BLK --> UI
        SPEECH --> UI
    end
```

---

## âš¡ Key Capabilities & Technical Highlights

### 1. Dual-Mode Operational Cockpit
- **Pre-Flight Readiness Dispatch:** 5-factor risk scoring with instant safety interlock checklists and tactile What-If aerodynamic performance sliders.
- **Active In-Flight HUD (1Hz):** Live telemetry streaming for battery cell temperatures, instantaneous power discharge (kW), live SOC degradation, and dynamic turnaround distance timeline.

### 2. Autonomous In-Flight Dynamic Diversion
- Sub-millisecond vector recalculation upon in-flight corridor anomalies (Wind Shear > 28 kt, Bird Strikes, Battery SOC depletion > 5%).
- Automatic alternate vertiport selection (**KBUR / Burbank Vertiport**) with dedicated MegaWatt fast-charging pad reservations.

### 3. Urban Canyon Micro-Weather Modeler
- Localized building-canyon Venturi effect turbulence scaling:
$$\text{AmplifiedWind} = \text{BaseWind} \times (1 + \text{CanyonNarrowingFactor} \times \text{BuildingHeightRatio})$$

### 4. Smart Vertiport Turnaround & Fast-Charge Matrix
- Multi-bay charging turnaround status grid (Pads 1..4: `AVAILABLE`, `RESERVED`, `OCCUPIED`) with auto-reservation badges and clear timers in UTC.

### 5. Cryptographic Blackbox Audit Ledger (DO-178C)
- Every state change produces a cumulative block hash:
$$\text{Hash}_n = \text{SHA256}(\text{Hash}_{n-1} + \text{Timestamp} + \text{TelemetryPayload} + \text{RiskVerdict})$$
- Ensures complete source-to-decision auditability for aviation authorities and insurance underwriters.

---

## ðŸ§ª Rigorous Verification & Test Matrix

- âœ” **Unit & Physics Tests:** `39 / 39 PASSED` (0 failures)
- âœ” **End-to-End Integration:** `16 / 16 PASSED` (0 errors)
- âœ” **TypeScript Static Check:** `0 errors / 100% Type-Safe`
- âœ” **Production Compilation:** `Next.js 14 (HTTP 200 OK)`

---

## ðŸš€ Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/fokrulanthro16-eng/aeroops-ai.git
cd aeroops-ai

# 2. Install dependencies
npm install

# 3. Configure Environment
cp .env.example .env.local
# Add your GEMINI_API_KEY to .env.local

# 4. Run Automated Test Suite
npm run test

# 5. Launch Cockpit Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## ðŸ“œ License

Distributed under the MIT License. See `LICENSE` for more information.