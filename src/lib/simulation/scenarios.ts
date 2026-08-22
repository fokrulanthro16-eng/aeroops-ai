import { AircraftSpecs, FlightMission, Vertiport } from "@/types/aviation";
import { decomposeWindVector } from "../weather";
import { calculateEnergyAndPONR } from "../energy";
import { evaluateAirspaceConflicts } from "../airspace";
import { compileEvidenceAudit, evaluateMissionRisk } from "../risk";
import { generateCorridorMicroWeatherSegments } from "../micro-weather";
import { reserveVertiportArrivalSlot } from "../vertiport-ops";
import { initializeMissionBlackboxLedger } from "../blackbox-crypto";

export const MOCK_AIRCRAFT_FLEET: AircraftSpecs[] = [
  {
    id: "AC-DYSON-SKY-01",
    tailNumber: "N701DS",
    model: "Dyson Sky AeroVect-6 (eVTOL)",
    type: "eVTOL",
    mtowKg: 2450,
    emptyWeightKg: 1650,
    maxPayloadKg: 450,
    batteryCapacityKwh: 180,
    basePowerHoverKw: 240,
    basePowerCruiseKw: 75,
    nominalCruiseSpeedKts: 110,
    maxCrosswindKts: 22,
    maxOperatingWindKts: 35,
    minReserveSocPercent: 25.0,
  },
  {
    id: "AC-AERO-CRUISER-02",
    tailNumber: "N802AC",
    model: "AeroCruiser Fixed-Wing e9",
    type: "FIXED_WING_ELECTRIC",
    mtowKg: 3100,
    emptyWeightKg: 2100,
    maxPayloadKg: 650,
    batteryCapacityKwh: 260,
    basePowerHoverKw: 0,
    basePowerCruiseKw: 95,
    nominalCruiseSpeedKts: 145,
    maxCrosswindKts: 28,
    maxOperatingWindKts: 40,
    minReserveSocPercent: 20.0,
  },
  {
    id: "AC-DYSON-SWIFT-03",
    tailNumber: "N903SW",
    model: "Dyson SwiftPulse Cargo eVTOL",
    type: "eVTOL",
    mtowKg: 1850,
    emptyWeightKg: 1200,
    maxPayloadKg: 380,
    batteryCapacityKwh: 140,
    basePowerHoverKw: 210,
    basePowerCruiseKw: 60,
    nominalCruiseSpeedKts: 120,
    maxCrosswindKts: 25,
    maxOperatingWindKts: 35,
    minReserveSocPercent: 25.0,
  },
];

export const MOCK_VERTIPORTS: Vertiport[] = [
  {
    id: "VP-LAX",
    icao: "KLAX",
    name: "Los Angeles International Vertiport Alpha",
    lat: 33.9425,
    lon: -118.4081,
    elevationFt: 125,
    activeRunways: ["06L", "07R", "FATO-1", "FATO-2"],
  },
  {
    id: "VP-BUR",
    icao: "KBUR",
    name: "Burbank SkyLink VertiHub",
    lat: 34.2007,
    lon: -118.3587,
    elevationFt: 778,
    activeRunways: ["15", "33", "PAD-A"],
  },
  {
    id: "VP-SNA",
    icao: "KSNA",
    name: "John Wayne Orange County Skyport",
    lat: 33.6757,
    lon: -117.8682,
    elevationFt: 56,
    activeRunways: ["20R", "02L", "PAD-1"],
  },
  {
    id: "VP-SMO",
    icao: "KSMO",
    name: "Santa Monica Pacific AeroPort",
    lat: 34.0158,
    lon: -118.4513,
    elevationFt: 177,
    activeRunways: ["21", "03", "FATO-WEST"],
  },
];

export function augmentMissionWithV2Systems(baseMission: FlightMission): FlightMission {
  const microWeatherSegments = generateCorridorMicroWeatherSegments(baseMission);
  const { state: vertiportOps } = reserveVertiportArrivalSlot(
    baseMission.destination.icao,
    baseMission.callsign,
    baseMission.energy.estimatedFlightTimeMin
  );
  const blackboxLedger = initializeMissionBlackboxLedger(baseMission);

  return {
    ...baseMission,
    microWeatherSegments,
    vertiportOps,
    blackboxLedger,
  };
}

/**
 * Builds full mission twin for Scenario 1: Nominal Flight (GO)
 */
export function buildScenario1Nominal(): FlightMission {
  const aircraft = MOCK_AIRCRAFT_FLEET[0];
  const origin = MOCK_VERTIPORTS[0]; // KLAX
  const destination = MOCK_VERTIPORTS[1]; // KBUR
  const distanceKm = 38.5;
  const headingDeg = 22;
  const payloadKg = 240;
  const initialSoc = 92;

  const weather = {
    station: "KLAX",
    timestamp: new Date().toISOString(),
    tempC: 19,
    dewpointC: 12,
    windSpeedKts: 6,
    windDirDeg: 240,
    windGustKts: 0,
    visibilitySm: 10,
    altimeterInHg: 29.95,
    cloudCeilingFt: 12000,
    flightCategory: "VFR" as const,
    rawMetar: "KLAX 221100Z 24006KT 10SM CLR 19/12 A2995 RMK AO2",
    isSimulated: true,
  };

  const wind = decomposeWindVector(
    weather.windSpeedKts,
    weather.windDirDeg,
    headingDeg,
    aircraft.nominalCruiseSpeedKts,
    aircraft.maxCrosswindKts
  );

  const energy = calculateEnergyAndPONR(
    aircraft,
    distanceKm,
    payloadKg,
    initialSoc,
    weather.tempC,
    wind
  );

  const airspaceConflicts = evaluateAirspaceConflicts(origin, destination, undefined, false);
  const risk = evaluateMissionRisk(aircraft, payloadKg, wind, energy, airspaceConflicts, weather, "SIM");
  const evidence = compileEvidenceAudit(aircraft, payloadKg, weather, wind, energy, airspaceConflicts);

  const mission: FlightMission = {
    id: "MISSION-SCENARIO-01-NOMINAL",
    callsign: "AERO-101-NOMINAL",
    aircraft,
    origin,
    destination,
    routeDistanceKm: distanceKm,
    routeHeadingDeg: headingDeg,
    plannedPayloadKg: payloadKg,
    initialSocPercent: initialSoc,
    mode: "SIM",
    weather,
    wind,
    energy,
    airspaceConflicts,
    risk,
    evidence,
    aiBriefing: {
      executive_summary: "All deterministic safety gates verified. Weather is pristine VFR with negligible crosswind (3.7 kts). Battery reserves project a comfortable 48.2% landing SOC, well clear of the 25% minimum threshold.",
      primary_drivers: [
        "Calm atmospheric boundary layer with 6 kt wind component",
        "Battery state of charge at 92% provides ample 48.2% landing margin",
        "Aircraft gross weight within 85% MTOW envelope"
      ],
      critical_hazards: [
        "None detected within designated flight corridor"
      ],
      mitigation_steps: [
        "Maintain standard Class-C corridor entry protocols into Burbank SkyLink",
        "Monitor battery thermal envelope during initial vertical ascent"
      ],
      data_quality_notes: [
        "Direct simulated METAR vector verified against Dyson Sky benchmark models"
      ],
      voice_briefing_transcript: "AeroOps dispatch to flight Aero 101. Mission status is affirmative GO. Surface winds are light at 6 knots, route ceiling clear, and projected landing reserve is 48 percent. You are cleared for pre-flight initialization.",
      model_used: "Gemini 2.5 Flash",
    },
  };

  return augmentMissionWithV2Systems(mission);
}

/**
 * Builds full mission twin for Scenario 2: Edge Case (AMBER)
 */
export function buildScenario2Amber(): FlightMission {
  const aircraft = MOCK_AIRCRAFT_FLEET[0];
  const origin = MOCK_VERTIPORTS[0]; // KLAX
  const destination = MOCK_VERTIPORTS[2]; // KSNA
  const distanceKm = 62.0;
  const headingDeg = 125;
  const payloadKg = 380;
  const initialSoc = 72;

  const weather = {
    station: "KLAX",
    timestamp: new Date().toISOString(),
    tempC: 8, // triggers temperature derating!
    dewpointC: 4,
    windSpeedKts: 22,
    windDirDeg: 220,
    windGustKts: 28,
    visibilitySm: 7,
    altimeterInHg: 29.88,
    cloudCeilingFt: 3200,
    flightCategory: "MVFR" as const,
    rawMetar: "KLAX 221100Z 22022G28KT 7SM SCT032 08/04 A2988 RMK AO2",
    isSimulated: true,
  };

  const wind = decomposeWindVector(
    weather.windSpeedKts,
    weather.windDirDeg,
    headingDeg,
    aircraft.nominalCruiseSpeedKts,
    aircraft.maxCrosswindKts
  );

  const energy = calculateEnergyAndPONR(
    aircraft,
    distanceKm,
    payloadKg,
    initialSoc,
    weather.tempC,
    wind
  );

  const airspaceConflicts = evaluateAirspaceConflicts(origin, destination, undefined, false);
  const risk = evaluateMissionRisk(aircraft, payloadKg, wind, energy, airspaceConflicts, weather, "SIM");
  const evidence = compileEvidenceAudit(aircraft, payloadKg, weather, wind, energy, airspaceConflicts);

  const mission: FlightMission = {
    id: "MISSION-SCENARIO-02-AMBER",
    callsign: "AERO-202-AMBER",
    aircraft,
    origin,
    destination,
    routeDistanceKm: distanceKm,
    routeHeadingDeg: headingDeg,
    plannedPayloadKg: payloadKg,
    initialSocPercent: initialSoc,
    mode: "SIM",
    weather,
    wind,
    energy,
    airspaceConflicts,
    risk,
    evidence,
    aiBriefing: {
      executive_summary: "Operational caution advised. Cold temperature derating (8°C) combined with a 21.9 kt crosswind and headwind reduces projected landing battery reserves to 21.4%, which is 3.6% below the standard 25% reserve envelope.",
      primary_drivers: [
        "Crosswind of 21.9 kts approaching absolute airframe limit of 22 kts",
        "Ambient temperature 8°C causing 1.6% chemical capacity derate",
        "Projected landing reserve at 21.4% triggers AMBER supervisory gate"
      ],
      critical_hazards: [
        "Gust front turbulence during coastal transition leg",
        "Potential divert fuel deficit if holding pattern exceeds 4 minutes"
      ],
      mitigation_steps: [
        "Reduce non-essential auxiliary avionics cabin loads",
        "File secondary divert waypoint at Long Beach Vertiport",
        "Operator manual concurrence required before pushback"
      ],
      data_quality_notes: [
        "High confidence in temperature derating and aerodynamic drag penalty"
      ],
      voice_briefing_transcript: "AeroOps dispatch caution to Aero 202. Mission status is evaluated as AMBER. High crosswinds at 22 knots and cold temperature derate reduce landing reserve to 21 percent. Operator review and divert waypoint filing required.",
      model_used: "Gemini 2.5 Flash",
    },
  };

  return augmentMissionWithV2Systems(mission);
}

/**
 * Builds full mission twin for Scenario 3: Severe Hazard (NO-GO)
 */
export function buildScenario3Severe(): FlightMission {
  const aircraft = MOCK_AIRCRAFT_FLEET[0];
  const origin = MOCK_VERTIPORTS[0]; // KLAX
  const destination = MOCK_VERTIPORTS[1]; // KBUR
  const distanceKm = 38.5;
  const headingDeg = 22;
  const payloadKg = 480; // Exceeds max payload 450kg!
  const initialSoc = 50; // Insufficient SOC!

  const weather = {
    station: "KLAX",
    timestamp: new Date().toISOString(),
    tempC: 4,
    dewpointC: 3,
    windSpeedKts: 32,
    windDirDeg: 120,
    windGustKts: 44,
    visibilitySm: 2.5,
    altimeterInHg: 29.62,
    cloudCeilingFt: 800,
    flightCategory: "IFR" as const,
    rawMetar: "KLAX 221100Z 12032G44KT 2 1/2SM +RA OVC008 04/03 A2962 RMK AO2",
    isSimulated: true,
  };

  const wind = decomposeWindVector(
    weather.windSpeedKts,
    weather.windDirDeg,
    headingDeg,
    aircraft.nominalCruiseSpeedKts,
    aircraft.maxCrosswindKts
  );

  const energy = calculateEnergyAndPONR(
    aircraft,
    distanceKm,
    payloadKg,
    initialSoc,
    weather.tempC,
    wind
  );

  // Active TFR Enabled!
  const airspaceConflicts = evaluateAirspaceConflicts(origin, destination, undefined, true);
  const risk = evaluateMissionRisk(aircraft, payloadKg, wind, energy, airspaceConflicts, weather, "SIM");
  const evidence = compileEvidenceAudit(aircraft, payloadKg, weather, wind, energy, airspaceConflicts);

  const mission: FlightMission = {
    id: "MISSION-SCENARIO-03-NOGO",
    callsign: "AERO-303-HAZARD",
    aircraft,
    origin,
    destination,
    routeDistanceKm: distanceKm,
    routeHeadingDeg: headingDeg,
    plannedPayloadKg: payloadKg,
    initialSocPercent: initialSoc,
    mode: "SIM",
    weather,
    wind,
    energy,
    airspaceConflicts,
    risk,
    evidence,
    aiBriefing: {
      executive_summary: "MISSION REJECTED: Triple Fatal Safety Gate Violations. 1) Active VIP TFR prohibited airspace corridor intersection. 2) Planned payload of 480 kg exceeds certified 450 kg max payload (Gross mass 2,130 kg vs MTOW 2,450 kg). 3) Battery landing margin deficit with crosswind (31.7 kts) exceeding airframe maximum (22 kts).",
      primary_drivers: [
        "Hard Gate 01 MTOW/Payload: 480 kg exceeds max payload limit (450 kg)",
        "Hard Gate 03 TFR: Active FAA NOTAM 4/1922 emergency security perimeter intersection",
        "Hard Gate 04 Crosswind: 31.7 kt crosswind exceeds 22 kt limit",
        "Hard Gate 02 Energy: Landing SOC falls to 9.2% (15.8% deficit below reserve)"
      ],
      critical_hazards: [
        "Inadvertent airspace violation with potential FAA enforcement action",
        "Aerodynamic loss of lateral control during vertical transition in 44 kt gusts",
        "Premature emergency landing on public terrain prior to reaching vertiport"
      ],
      mitigation_steps: [
        "CANCEL MISSION IMMEDIATELY",
        "Re-route around TFR perimeter once restriction expires",
        "De-manifest 50 kg payload and recharge aircraft to minimum 90% SOC"
      ],
      data_quality_notes: [
        "Multi-sensor confirmation: IFR METAR + Active TFR polygon confirmed"
      ],
      voice_briefing_transcript: "AeroOps critical abort. Mission status is strictly NO-GO. Flight is barred due to active VIP TFR airspace conflict, payload limit exceedance, and severe crosswinds of 32 knots. All launch sequences are locked.",
      model_used: "Gemini 2.5 Flash",
    },
  };

  return augmentMissionWithV2Systems(mission);
}

export const PRESET_SCENARIOS = {
  scenario1: buildScenario1Nominal(),
  scenario2: buildScenario2Amber(),
  scenario3: buildScenario3Severe(),
};
