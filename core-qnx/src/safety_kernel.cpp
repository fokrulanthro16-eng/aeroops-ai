#include "safety_kernel.h"
#include "sha256.h"
#include <cmath>
#include <cstdio>
#include <cstring>
#include <algorithm>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// ==============================================================================
// 1. 2D Circular Trigonometric Wind Vector Decomposition
// ==============================================================================
void decompose_wind(
    double windSpeedKts,
    double windDirDeg,
    double routeHeadingDeg,
    double airspeedKts,
    double maxCrosswindLimitKts,
    WindDecomposition* outWind
) {
    if (!outWind) return;

    double angleDiffRad = ((windDirDeg - routeHeadingDeg) * M_PI) / 180.0;

    // Crosswind = |WindSpeed * sin(WindDir - RouteHeading)|
    double crosswind = std::fabs(windSpeedKts * std::sin(angleDiffRad));

    // Headwind = WindSpeed * cos(WindDir - RouteHeading)
    // Positive = Headwind, Negative = Tailwind
    double headwind = windSpeedKts * std::cos(angleDiffRad);

    // Effective Ground Speed = max(5, Airspeed - Headwind)
    double rawGroundSpeed = airspeedKts - headwind;
    double groundSpeed = (rawGroundSpeed < 5.0) ? 5.0 : std::round(rawGroundSpeed * 10.0) / 10.0;

    // Wind Correction Angle: arcsin(Crosswind / Airspeed)
    double ratio = (airspeedKts > 1.0) ? (crosswind / airspeedKts) : 1.0;
    if (ratio > 1.0) ratio = 1.0;
    double rawWca = std::asin(ratio) * (180.0 / M_PI);
    double wca = std::round(rawWca * 10.0) / 10.0;

    int isExceeded = (crosswind > maxCrosswindLimitKts) ? 1 : 0;

    outWind->routeHeadingDeg = routeHeadingDeg;
    outWind->windSpeedKts = std::round(windSpeedKts * 10.0) / 10.0;
    outWind->windDirDeg = std::round(windDirDeg);
    outWind->crosswindKts = std::round(crosswind * 10.0) / 10.0;
    outWind->headwindKts = std::round(headwind * 10.0) / 10.0;
    outWind->groundSpeedKts = groundSpeed;
    outWind->windCorrectionAngleDeg = wca;
    outWind->isCrosswindExceeded = isExceeded;
}

// ==============================================================================
// 2. Aerodynamic Power, Mass Scaling & Dynamic PONR
// ==============================================================================
void calculate_energy_and_ponr(
    const AircraftSpecs* aircraft,
    double distanceKm,
    double payloadKg,
    double initialSocPercent,
    double ambientTempC,
    const WindDecomposition* wind,
    EnergyAnalysis* outEnergy
) {
    if (!aircraft || !wind || !outEnergy) return;

    // 1. Temperature Derating: 0.8% capacity penalty per °C below 10°C (capped at 30%)
    double tempDeratePercent = 0.0;
    if (ambientTempC < 10.0) {
        double degBelow10 = 10.0 - ambientTempC;
        tempDeratePercent = std::min(30.0, degBelow10 * 0.8);
    }

    double effectiveNominalCapacityKwh =
        aircraft->batteryCapacityKwh * (1.0 - tempDeratePercent / 100.0);
    double usableCapacityKwh =
        effectiveNominalCapacityKwh * (initialSocPercent / 100.0);

    // 2. Mass & Aerodynamic Power Scaling
    double totalMassKg = aircraft->emptyWeightKg + payloadKg;
    double massRatio = std::max(0.5, totalMassKg / (aircraft->mtowKg > 0.0 ? aircraft->mtowKg : 1.0));

    // Hover power scales with mass^1.5 for momentum disc theory
    double effectiveHoverPowerKw = aircraft->basePowerHoverKw * std::pow(massRatio, 1.5);
    // Cruise power scales linearly with mass induced drag
    double effectiveCruisePowerKw = aircraft->basePowerCruiseKw * (0.5 + 0.5 * massRatio);

    // 5 minutes total hover (takeoff + landing)
    double totalHoverHours = 5.0 / 60.0;
    double hoverEnergyKwh = effectiveHoverPowerKw * totalHoverHours;

    // Flight time based on ground speed (1 km = 0.539957 NM)
    double distanceNm = distanceKm * 0.539957;
    double outboundGroundSpeedKts = std::max(10.0, wind->groundSpeedKts);
    double outboundFlightTimeHours = distanceNm / outboundGroundSpeedKts;
    double estimatedFlightTimeMin = std::round((outboundFlightTimeHours * 60.0 + 5.0) * 10.0) / 10.0;

    double cruiseEnergyKwh = effectiveCruisePowerKw * outboundFlightTimeHours;
    double totalEnergyRequiredKwh = hoverEnergyKwh + cruiseEnergyKwh;

    // Projected landing SOC
    double energyRemainingKwh = usableCapacityKwh - totalEnergyRequiredKwh;
    double rawProjectedSoc = (effectiveNominalCapacityKwh > 0.0)
        ? ((energyRemainingKwh / effectiveNominalCapacityKwh) * 100.0)
        : 0.0;
    double projectedLandingSocPercent = std::round(rawProjectedSoc * 10.0) / 10.0;

    // Reserve deficit against aircraft's minimum reserve
    double minReservePercent = (aircraft->minReserveSocPercent > 0.0) ? aircraft->minReserveSocPercent : 25.0;
    double reserveDeficitPercent = (projectedLandingSocPercent < minReservePercent)
        ? std::round((minReservePercent - projectedLandingSocPercent) * 10.0) / 10.0
        : 0.0;

    // 3. Dynamic Point of No Return (PONR) Calculation
    double returnGroundSpeedKts = std::max(10.0, aircraft->nominalCruiseSpeedKts + wind->headwindKts);
    double reserveEnergyKwh = effectiveNominalCapacityKwh * (minReservePercent / 100.0);
    double availableCruiseEnergyKwh = std::max(0.0, usableCapacityKwh - hoverEnergyKwh - reserveEnergyKwh);

    double energyPerNmOut = effectiveCruisePowerKw / outboundGroundSpeedKts;
    double energyPerNmRet = effectiveCruisePowerKw / returnGroundSpeedKts;
    double burnPerRoundtripNm = energyPerNmOut + energyPerNmRet;

    double maxOutboundDistanceNm = (burnPerRoundtripNm > 0.0001)
        ? (availableCruiseEnergyKwh / burnPerRoundtripNm)
        : 0.0;
    double calculatedPonrKm = maxOutboundDistanceNm / 0.539957;

    double pointOfNoReturnKm = std::min(
        distanceKm,
        std::max(0.0, std::round(calculatedPonrKm * 10.0) / 10.0)
    );

    double ponrTimelinePercent = (distanceKm > 0.0)
        ? std::min(100.0, std::max(0.0, std::round((pointOfNoReturnKm / distanceKm) * 100.0)))
        : 0.0;

    outEnergy->batteryCapacityKwh = aircraft->batteryCapacityKwh;
    outEnergy->initialSocPercent = std::round(initialSocPercent * 10.0) / 10.0;
    outEnergy->tempDeratePercent = std::round(tempDeratePercent * 10.0) / 10.0;
    outEnergy->usableCapacityKwh = std::round(usableCapacityKwh * 10.0) / 10.0;
    outEnergy->payloadKg = std::round(payloadKg * 10.0) / 10.0;
    outEnergy->hoverEnergyKwh = std::round(hoverEnergyKwh * 10.0) / 10.0;
    outEnergy->cruiseEnergyKwh = std::round(cruiseEnergyKwh * 10.0) / 10.0;
    outEnergy->totalEnergyRequiredKwh = std::round(totalEnergyRequiredKwh * 10.0) / 10.0;
    outEnergy->estimatedFlightTimeMin = estimatedFlightTimeMin;
    outEnergy->projectedLandingSocPercent = projectedLandingSocPercent;
    outEnergy->reserveDeficitPercent = reserveDeficitPercent;
    outEnergy->pointOfNoReturnKm = pointOfNoReturnKm;
    outEnergy->totalDistanceKm = distanceKm;
    outEnergy->ponrTimelinePercent = ponrTimelinePercent;
}

// ==============================================================================
// 3. Deterministic Hard Safety Gates & Risk Verdict
// ==============================================================================
SafetyVerdict evaluate_dispatch_risk(
    const AircraftSpecs* aircraft,
    double payloadKg,
    const WindDecomposition* wind,
    const EnergyAnalysis* energy,
    int hasTfrConflict,
    double visibilitySm,
    int isSimulated,
    int* outCompositeScore
) {
    if (!aircraft || !wind || !energy) {
        if (outCompositeScore) *outCompositeScore = 100;
        return VERDICT_NO_GO;
    }

    // 5 Hard Safety Gates
    double totalMassKg = aircraft->emptyWeightKg + payloadKg;
    int gate1_mtow = (totalMassKg <= aircraft->mtowKg && payloadKg <= aircraft->maxPayloadKg) ? 1 : 0;

    double minReserve = (aircraft->minReserveSocPercent > 0.0) ? aircraft->minReserveSocPercent : 25.0;
    int gate2_energy = (energy->projectedLandingSocPercent >= minReserve) ? 1 : 0;

    int gate3_tfr = (!hasTfrConflict) ? 1 : 0;

    int gate4_crosswind = (wind->crosswindKts <= aircraft->maxCrosswindKts) ? 1 : 0;

    int gate5_weather = (isSimulated || visibilitySm > 0.0) ? 1 : 0;

    int failedGates = (!gate1_mtow) + (!gate2_energy) + (!gate3_tfr) + (!gate4_crosswind) + (!gate5_weather);

    // 5-Factor Risk Model Scores (0-100)
    // 1. Weather
    double weatherRisk = 10.0;
    if (visibilitySm < 3.0) weatherRisk += 30.0;
    else if (visibilitySm < 5.0) weatherRisk += 15.0;
    if (wind->windSpeedKts > 15.0) weatherRisk += 15.0;
    weatherRisk = std::min(100.0, std::max(5.0, weatherRisk));

    // 2. Energy
    double energyRisk = 10.0;
    double landingSoc = energy->projectedLandingSocPercent;
    if (landingSoc < 10.0) energyRisk = 95.0;
    else if (landingSoc < 25.0) energyRisk = 75.0;
    else if (landingSoc < 35.0) energyRisk = 45.0;
    else if (landingSoc < 50.0) energyRisk = 25.0;
    else energyRisk = 10.0;

    if (energy->tempDeratePercent > 10.0) energyRisk += 15.0;
    energyRisk = std::min(100.0, std::max(5.0, energyRisk));

    // 3. Airspace
    double airspaceRisk = hasTfrConflict ? 90.0 : 5.0;
    airspaceRisk = std::min(100.0, std::max(5.0, airspaceRisk));

    // 4. Aircraft
    double aircraftRisk = 10.0;
    double massRatio = totalMassKg / (aircraft->mtowKg > 0.0 ? aircraft->mtowKg : 1.0);
    if (massRatio > 1.0) aircraftRisk = 95.0;
    else if (massRatio > 0.9) aircraftRisk = 50.0;
    else if (massRatio > 0.8) aircraftRisk = 25.0;
    if (wind->crosswindKts > aircraft->maxCrosswindKts * 0.8) {
        aircraftRisk += 25.0;
    }
    aircraftRisk = std::min(100.0, std::max(5.0, aircraftRisk));

    // 5. Route
    double routeRisk = 10.0;
    if (energy->totalDistanceKm > 80.0) routeRisk += 25.0;
    else if (energy->totalDistanceKm > 50.0) routeRisk += 15.0;
    if (wind->headwindKts > 15.0) routeRisk += 20.0;
    routeRisk = std::min(100.0, std::max(5.0, routeRisk));

    // Weighted Heuristic: Weather 30%, Energy 25%, Airspace 20%, Aircraft 15%, Route 10%
    double rawComposite = weatherRisk * 0.3 +
                          energyRisk * 0.25 +
                          airspaceRisk * 0.2 +
                          aircraftRisk * 0.15 +
                          routeRisk * 0.1;
    int compositeScore = (int)std::round(rawComposite);

    SafetyVerdict verdict = VERDICT_GO;
    if (compositeScore >= 60) {
        verdict = VERDICT_NO_GO;
    } else if (compositeScore >= 30) {
        verdict = VERDICT_AMBER;
    } else {
        verdict = VERDICT_GO;
    }

    // Hard Gates override: if ANY fatal hard gate fails, FORCE NO_GO!
    if (failedGates > 0) {
        verdict = VERDICT_NO_GO;
        compositeScore = std::max(compositeScore, 78);
    }

    if (outCompositeScore) {
        *outCompositeScore = compositeScore;
    }

    return verdict;
}

// ==============================================================================
// 4. Deterministic 100Hz Hot-Loop In-Flight Telemetry Step (ZERO Allocations)
// ==============================================================================
void step_telemetry_100hz(
    const AircraftSpecs* aircraft,
    double originLat,
    double originLon,
    double destLat,
    double destLon,
    double routeDistanceKm,
    const EnergyAnalysis* energy,
    const WindDecomposition* wind,
    double elapsedSeconds,
    double speedMultiplier,
    double injectedShearKt,
    double injectedSocDegrade,
    int forceDivert,
    InFlightTelemetry* outFrame
) {
    if (!aircraft || !energy || !wind || !outFrame) return;

    double nominalGroundSpeedKts = std::max(10.0, wind->groundSpeedKts);
    double groundSpeedKmh = nominalGroundSpeedKts * 1.852;
    double totalFlightTimeSec = (routeDistanceKm / groundSpeedKmh) * 3600.0;
    if (totalFlightTimeSec < 1.0) totalFlightTimeSec = 1.0;

    double virtualElapsedSec = elapsedSeconds * (speedMultiplier > 0.0 ? speedMultiplier : 1.0);
    double progressRatio = virtualElapsedSec / totalFlightTimeSec;
    if (progressRatio < 0.0) progressRatio = 0.0;
    if (progressRatio > 1.0) progressRatio = 1.0;

    double distanceFlownKm = std::min(routeDistanceKm, std::round(routeDistanceKm * progressRatio * 10.0) / 10.0);
    double distanceRemainingKm = std::max(0.0, std::round((routeDistanceKm - distanceFlownKm) * 10.0) / 10.0);

    // Flight Phase Determination
    FlightPhase phase = PHASE_PRE_DEPARTURE;
    double altitudeFt = 0.0;

    if (progressRatio == 0.0) {
        phase = PHASE_PRE_DEPARTURE;
        altitudeFt = 0.0;
    } else if (progressRatio < 0.15) {
        phase = PHASE_CLIMB;
        altitudeFt = std::round(progressRatio * 10000.0);
    } else if (progressRatio >= 0.85 && progressRatio < 1.0) {
        phase = PHASE_DESCENT;
        altitudeFt = std::max(0.0, std::round((1.0 - progressRatio) * 10000.0));
    } else if (progressRatio >= 1.0) {
        phase = PHASE_LANDED;
        altitudeFt = 0.0;
    } else {
        phase = PHASE_CRUISE;
        altitudeFt = 1500.0;
    }

    // Battery & Thermal Depletion Model
    double initialSoc = energy->initialSocPercent;
    double totalProjectedBurnSoc = initialSoc - energy->projectedLandingSocPercent;
    double theoreticalSoc = std::max(0.0, std::round((initialSoc - totalProjectedBurnSoc * progressRatio) * 10.0) / 10.0);
    double liveSoc = std::max(0.0, std::round((theoreticalSoc - injectedSocDegrade) * 10.0) / 10.0);

    // Cell Temperature (°C)
    double baseTempC = 19.0;
    double climbThermalBoost = (phase == PHASE_CLIMB) ? 14.0 : (phase == PHASE_CRUISE) ? 9.0 : 2.0;
    double batteryCellTempC = std::round((baseTempC + 15.0 + climbThermalBoost + progressRatio * 4.0) * 10.0) / 10.0;

    // Instantaneous Power (kW)
    double powerKw = 0.0;
    if (phase == PHASE_CLIMB) {
        powerKw = std::round(aircraft->basePowerHoverKw * 0.9);
    } else if (phase == PHASE_CRUISE) {
        powerKw = std::round(aircraft->basePowerCruiseKw * 1.05);
    } else if (phase == PHASE_DESCENT) {
        powerKw = std::round(aircraft->basePowerCruiseKw * 0.5);
    }

    // Wind Drift & Micro-Turbulence
    double headwindDriftKt = std::round((wind->headwindKts + injectedShearKt * 0.7) * 10.0) / 10.0;
    double crosswindDriftKt = std::round((wind->crosswindKts + injectedShearKt * 0.3) * 10.0) / 10.0;

    // Dynamic PONR
    double inFlightPonrKm = energy->pointOfNoReturnKm;
    int isPastPonr = (distanceFlownKm >= inFlightPonrKm) ? 1 : 0;

    // In-Air Autonomous Rerouting Engine
    RecommendedAction action = ACTION_CONTINUE_NOMINAL;
    char targetIcao[8] = "";
    char reason[160] = "";
    double distAlternateNm = 0.0;

    double socDeficit = theoreticalSoc - liveSoc;
    int isSevereWindShear = (injectedShearKt > 28.0) ? 1 : 0;
    int canDivert = (progressRatio > 0.0 && phase != PHASE_LANDED) ? 1 : 0;

    if (canDivert && (forceDivert || socDeficit >= 5.0 || isSevereWindShear)) {
        phase = PHASE_DIVERTING;
        action = ACTION_DIVERT_TO_ALTERNATE;
        std::strncpy(targetIcao, "KBUR", sizeof(targetIcao) - 1);
        if (socDeficit >= 5.0) {
            std::snprintf(reason, sizeof(reason),
                "Battery depletion anomaly: live SOC (%.1f%%) is %.1f%% below theoretical curve.",
                liveSoc, socDeficit);
        } else {
            std::snprintf(reason, sizeof(reason),
                "Critical wind shear (%.1f kts) detected past Point of No Return.",
                injectedShearKt);
        }
        distAlternateNm = 12.4;
    } else if (canDivert && liveSoc < 15.0) {
        phase = PHASE_DIVERTING;
        action = ACTION_EMERGENCY_LANDING;
        std::strncpy(targetIcao, "KSMO", sizeof(targetIcao) - 1);
        std::strncpy(reason, "Critical battery reserve depletion (< 15% SOC). Immediate precautionary touchdown required.", sizeof(reason) - 1);
        distAlternateNm = 4.2;
    }

    // Interpolated GPS Coordinates
    double curLat = std::round((originLat + (destLat - originLat) * progressRatio) * 10000.0) / 10000.0;
    double curLon = std::round((originLon + (destLon - originLon) * progressRatio) * 10000.0) / 10000.0;

    // Zero-allocation frame write
    outFrame->timestampMs = (uint64_t)(elapsedSeconds * 1000.0);
    outFrame->flightPhase = phase;
    outFrame->distanceFlownKm = distanceFlownKm;
    outFrame->distanceRemainingKm = distanceRemainingKm;
    outFrame->currentAltitudeFt = altitudeFt;
    outFrame->currentAirspeedKts = aircraft->nominalCruiseSpeedKts;
    double groundSpeed = nominalGroundSpeedKts - headwindDriftKt;
    outFrame->currentGroundSpeedKts = (groundSpeed < 5.0) ? 5.0 : groundSpeed;
    outFrame->liveBatterySoc = liveSoc;
    outFrame->theoreticalSoc = theoreticalSoc;
    outFrame->batteryCellTempC = batteryCellTempC;
    outFrame->instantaneousPowerKw = powerKw;
    outFrame->headwindDriftKt = headwindDriftKt;
    outFrame->crosswindDriftKt = crosswindDriftKt;
    outFrame->inFlightPonrKm = inFlightPonrKm;
    outFrame->isPastPonr = isPastPonr;
    outFrame->recommendedAction = action;
    std::strncpy(outFrame->diversionTargetIcao, targetIcao, sizeof(outFrame->diversionTargetIcao));
    std::strncpy(outFrame->diversionReason, reason, sizeof(outFrame->diversionReason));
    outFrame->distanceToAlternateNm = distAlternateNm;
    outFrame->currentLat = curLat;
    outFrame->currentLon = curLon;
}

// ==============================================================================
// 5. Cryptographic State Chain Audit Ledger
// ==============================================================================
void initialize_ledger(LedgerState* ledger) {
    if (!ledger) return;
    std::memset(ledger, 0, sizeof(LedgerState));
    ledger->blockCount = 0;
    ledger->isTamperProof = 1;
    const char* genesis = "0x0000000000000000000000000000000000000000000000000000000000000000";
    std::snprintf(ledger->rootHash, sizeof(ledger->rootHash), "%s", genesis);
}

int append_ledger_block(
    LedgerState* ledger,
    uint64_t timestampMs,
    const char* eventType,
    const char* eventPayload,
    const char* verdict
) {
    if (!ledger || ledger->blockCount >= MAX_LEDGER_BLOCKS) return -1;

    int idx = ledger->blockCount;
    BlackboxBlock* block = &ledger->blocks[idx];
    block->blockIndex = idx;
    block->timestampMs = timestampMs;

    std::snprintf(block->eventType, sizeof(block->eventType), "%s", eventType ? eventType : "");
    std::snprintf(block->eventPayload, sizeof(block->eventPayload), "%s", eventPayload ? eventPayload : "");
    std::snprintf(block->verdict, sizeof(block->verdict), "%s", verdict ? verdict : "");

    const char* prevHash = (idx == 0)
        ? "0x0000000000000000000000000000000000000000000000000000000000000000"
        : ledger->blocks[idx - 1].blockHash;

    std::snprintf(block->previousHash, sizeof(block->previousHash), "%s", prevHash);

    compute_blackbox_block_hash(
        block->previousHash,
        block->timestampMs,
        block->eventType,
        block->eventPayload,
        block->verdict,
        block->blockHash
    );

    std::snprintf(ledger->rootHash, sizeof(ledger->rootHash), "%s", block->blockHash);
    ledger->blockCount++;
    return idx;
}

int verify_ledger_integrity(const LedgerState* ledger, int* outTamperedBlockIndex) {
    if (!ledger) return 0;

    const char* prevHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

    for (int i = 0; i < ledger->blockCount; ++i) {
        const BlackboxBlock* block = &ledger->blocks[i];

        // 1. Previous hash pointer integrity
        if (std::strcmp(block->previousHash, prevHash) != 0) {
            if (outTamperedBlockIndex) *outTamperedBlockIndex = i;
            return 0;
        }

        // 2. Cryptographic recalculation of block hash
        char calculatedHash[67];
        compute_blackbox_block_hash(
            block->previousHash,
            block->timestampMs,
            block->eventType,
            block->eventPayload,
            block->verdict,
            calculatedHash
        );

        if (std::strcmp(calculatedHash, block->blockHash) != 0) {
            if (outTamperedBlockIndex) *outTamperedBlockIndex = i;
            return 0;
        }

        prevHash = block->blockHash;
    }

    return 1;
}
