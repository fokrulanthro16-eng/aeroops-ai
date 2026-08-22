# AeroOps AI — Autonomous Aviation Flight Readiness & Operational Risk Intelligence Platform
*Dyson Sky Industrial Aerodynamic UI & Precision Aviation Glass Cockpit Edition*

> **"From live aviation data to an explainable, evidence-backed GO / AMBER / NO-GO mission decision."**

---

## 🛫 Architecture Overview

AeroOps AI is a production-grade flight release and operational risk platform designed under the **"Rules Engine Decides. AI Explains."** paradigm. Deterministic mathematical models compute all aerodynamic flight physics, battery state-of-charge (SOC), 2D wind vector decompositions, and airspace intersections. **Google Gemini 2.5 Flash** acts strictly as the evidence-grounded explanation and voice-briefing dispatcher.

```
aeroops-ai/
├── prisma/
│   ├── schema.prisma              # Dual-compatible SQLite / PostgreSQL Prisma schema
│   └── seed.ts                    # Fleet twins, vertiports & scenario database seeder
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Obsidian dark cockpit layout
│   │   ├── page.tsx               # Primary Mission Cockpit Dashboard
│   │   ├── fleet/page.tsx         # Fleet Management & Vertiport Network View
│   │   ├── api/
│   │   │   ├── weather/route.ts   # Live NOAA METAR ingestion with offline fallback
│   │   │   ├── analyze/route.ts   # Deterministic Risk & Hard Safety Gate evaluator
│   │   │   ├── ai/briefing/route.ts # Gemini 2.5 Flash structured explainer
│   │   │   └── missions/route.ts  # CRUD for Mission Twins
│   ├── components/
│   │   ├── cockpit/
│   │   │   ├── TopNav.tsx         # Dyson-styled header, live UTC clock, mode switcher
│   │   │   ├── VerdictHero.tsx    # High-impact Dyson GO / AMBER / NO-GO Banner
│   │   │   ├── RiskMatrix.tsx     # 5-Factor Score bars + Hard Gate status indicators
│   │   │   ├── TelemetryGrid.tsx  # Weather, aerodynamic energy & airspace cards
│   │   │   ├── WhatIfSimulator.tsx# Tactile sliders for wind, payload, battery SOC
│   │   │   ├── AIBriefingCard.tsx # Gemini 2.5 Flash rationale & Web Speech Voice Radio
│   │   │   └── EvidenceDrawer.tsx # Traceable source-to-decision audit table
│   │   ├── map/
│   │   │   ├── AirspaceMap.tsx    # Vector Flight Path, PONR node & TFR polygon map
│   │   │   └── AirspaceMapClient.tsx # Dynamic SSR-safe wrapper
│   │   ├── reports/
│   │   │   └── DispatchSheet.tsx  # Printable Official Pre-Flight Release PDF modal
│   │   └── ui/
│   │       └── RadialGauge.tsx    # Dyson-style sub-pixel circular arc HUD gauge
│   ├── lib/
│   │   ├── weather.ts             # NOAA METAR parser & 2D Wind Vector Engine
│   │   ├── energy.ts              # Aerodynamic Power Draw & Dynamic PONR Engine
│   │   ├── airspace.ts            # Polygon Geo-fence & NOTAM Intersection
│   │   ├── risk.ts                # Deterministic 5-Factor Scoring & Hard Gates
│   │   ├── gemini.ts              # Google Gen AI SDK (Gemini 2.5 Flash) integration
│   │   ├── tts.ts                 # Web Speech API Pilot Voice Dispatcher
│   │   ├── db.ts                  # Prisma Client singleton
│   │   └── simulation/
│   │       └── scenarios.ts       # Preset demo scenarios (Nominal, Edge, Severe)
│   ├── types/
│   │   └── aviation.ts            # Strictly-typed domain models
│   └── tests/
│       ├── physics.test.ts        # Unit tests for wind & energy calculations
│       ├── risk.test.ts           # Unit tests for hard gates & scoring
│       └── runner.ts              # CLI test runner
├── .env.example
├── package.json
└── tsconfig.json
```

---

## ⚡ Mathematical & Deterministic Safety Engines

### 1. 2D Wind Vector & Weather Engine (`src/lib/weather.ts`)
Exact circular trigonometric decomposition:
- **Crosswind:** $X_{\text{wind}} = |V_{\text{wind}} \cdot \sin(\theta_{\text{wind}} - \theta_{\text{route}})|$
- **Headwind / Tailwind:** $H_{\text{wind}} = V_{\text{wind}} \cdot \cos(\theta_{\text{wind}} - \theta_{\text{route}})$
- **Ground Speed:** $V_{\text{ground}} = \max(5, V_{\text{airspeed}} - H_{\text{wind}})$

### 2. Aerodynamic Energy & Dynamic PONR Engine (`src/lib/energy.ts`)
- **Temperature Derating:** Battery capacity derates by $0.8\%$ per $^\circ\text{C}$ below $10^\circ\text{C}$.
- **Mass Scaling:** Hover power scales as $(\text{Mass} / \text{MTOW})^{1.5}$; Cruise power scales linearly with induced drag.
- **Dynamic Point of No Return (PONR):** Outbound nautical miles where aircraft can safely turn back to origin against current headwind vector while landing with $\ge 25\%$ reserve SOC.

### 3. Hard Safety Gates & 5-Factor Risk Model (`src/lib/risk.ts`)
- **Hard Safety Gates (Immediate NO-GO regardless of score):**
  1. Payload exceeds MTOW.
  2. Usable energy insufficient to complete mission + reserve.
  3. Active Critical TFR / Prohibited Airspace conflict.
  4. Crosswind exceeds Aircraft Absolute Maximum limit.
  5. Critical weather data unavailable in Live Mode.
- **Weighted Heuristic Risk Model (0–100 score):**
  $$\text{Risk Score} = 0.30 W_{\text{weather}} + 0.25 W_{\text{energy}} + 0.20 W_{\text{airspace}} + 0.15 W_{\text{aircraft}} + 0.10 W_{\text{route}}$$
  - $0 - 29 \to \textbf{GO}$ (Laser Emerald)
  - $30 - 59 \to \textbf{AMBER}$ (Dyson Electric Amber)
  - $60 - 100 \to \textbf{NO-GO}$ (High-G Alert Red)

---

## 🚀 Quickstart & Verification

```bash
# 1. Install dependencies
npm install

# 2. Setup SQLite Database & Seed Data
npx prisma db push
npm run db:seed

# 3. Run Automated Deterministic Physics & Safety Gate Tests
npm run test

# 4. Start Development Server
npm run dev
```

Visit `http://localhost:3000` to access the Mission Cockpit and `http://localhost:3000/fleet` for the Fleet Twin View.