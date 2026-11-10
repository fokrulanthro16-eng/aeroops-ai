#ifndef AERO_OPS_SAFETY_KERNEL_H
#define AERO_OPS_SAFETY_KERNEL_H

#include <cstdint>
#include <cstddef>
#include "sha256.h"

#ifdef __cplusplus
extern "C" {
#endif

// ==============================================================================
// DO-178C DETERMINISTIC SAFETY KERNEL (BLACKBERRY QNX NEUTRINO 8.0 RTOS)
// Core Avionics Physics, Energy Derate, Dynamic PONR, Wind Shear & Diversion
// ==============================================================================

typedef enum {
    VERDICT_GO = 0,
    VERDICT_AMBER = 1,
    VERDICT_NO_GO = 2
} SafetyVerdict;

typedef enum {
    PHASE_PRE_DEPARTURE = 0,
    PHASE_CLIMB = 1,
    PHASE_CRUISE = 2,
    PHASE_DIVERTING = 3,
    PHASE_DESCENT = 4,
    PHASE_LANDED = 5
} FlightPhase;

typedef enum {
    ACTION_CONTINUE_NOMINAL = 0,
    ACTION_HOLD = 1,
    ACTION_DIVERT_TO_ALTERNATE = 2,
    ACTION_EMERGENCY_LANDING = 3
} RecommendedAction;

// Certified Aircraft Specifications
typedef struct {
    char id[32];
    char tailNumber[16];
    char model[32];
    double mtowKg;
    double emptyWeightKg;
    double maxPayloadKg;
    double batteryCapacityKwh;
    double basePowerHoverKw;
    double basePowerCruiseKw;
    double nominalCruiseSpeedKts;
    double maxCrosswindKts;
    double maxOperatingWindKts;
    double minReserveSocPercent;
} AircraftSpecs;

// 2D Circular Wind Decomposition
typedef struct {
    double routeHeadingDeg;
    double windSpeedKts;
    double windDirDeg;
    double crosswindKts;
    double headwindKts;
    double groundSpeedKts;
    double windCorrectionAngleDeg;
    int isCrosswindExceeded;
} WindDecomposition;

// Aerodynamic Energy & Dynamic Point of No Return (PONR)
typedef struct {
    double batteryCapacityKwh;
    double initialSocPercent;
    double tempDeratePercent;
    double usableCapacityKwh;
    double payloadKg;
    double hoverEnergyKwh;
    double cruiseEnergyKwh;
    double totalEnergyRequiredKwh;
    double estimatedFlightTimeMin;
    double projectedLandingSocPercent;
    double reserveDeficitPercent;
    double pointOfNoReturnKm;
    double totalDistanceKm;
    double ponrTimelinePercent;
} EnergyAnalysis;

// In-Flight Telemetry Frame (Zero Heap Allocations in Hot Loop)
typedef struct {
    uint64_t timestampMs;
    FlightPhase flightPhase;
    double distanceFlownKm;
    double distanceRemainingKm;
    double currentAltitudeFt;
    double currentAirspeedKts;
    double currentGroundSpeedKts;
    double liveBatterySoc;
    double theoreticalSoc;
    double batteryCellTempC;
    double instantaneousPowerKw;
    double headwindDriftKt;
    double crosswindDriftKt;
    double inFlightPonrKm;
    int isPastPonr;
    RecommendedAction recommendedAction;
    char diversionTargetIcao[8];
    char diversionReason[160];
    double distanceToAlternateNm;
    double currentLat;
    double currentLon;
} InFlightTelemetry;

// Cryptographic Ledger Block
typedef struct {
    int blockIndex;
    uint64_t timestampMs;
    char eventType[32];
    char eventPayload[160];
    char verdict[16];
    char previousHash[72];
    char blockHash[72];
} BlackboxBlock;

#define MAX_LEDGER_BLOCKS 64

typedef struct {
    BlackboxBlock blocks[MAX_LEDGER_BLOCKS];
    int blockCount;
    char rootHash[72];
    int isTamperProof;
} LedgerState;

// --- Physics & Dispatch APIs ---

// 2D Circular Trigonometric Wind Vector Decomposition
void decompose_wind(
    double windSpeedKts,
    double windDirDeg,
    double routeHeadingDeg,
    double airspeedKts,
    double maxCrosswindLimitKts,
    WindDecomposition* outWind
);

// Aerodynamic Power, Mass Scaling & Dynamic PONR
void calculate_energy_and_ponr(
    const AircraftSpecs* aircraft,
    double distanceKm,
    double payloadKg,
    double initialSocPercent,
    double ambientTempC,
    const WindDecomposition* wind,
    EnergyAnalysis* outEnergy
);

// Deterministic Hard Safety Gates & Risk Verdict
SafetyVerdict evaluate_dispatch_risk(
    const AircraftSpecs* aircraft,
    double payloadKg,
    const WindDecomposition* wind,
    const EnergyAnalysis* energy,
    int hasTfrConflict,
    double visibilitySm,
    int isSimulated,
    int* outCompositeScore
);

// Deterministic 100Hz Hot-Loop In-Flight Telemetry Step (ZERO Allocations)
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
);

// --- Cryptographic State Chain APIs ---

void initialize_ledger(LedgerState* ledger);

int append_ledger_block(
    LedgerState* ledger,
    uint64_t timestampMs,
    const char* eventType,
    const char* eventPayload,
    const char* verdict
);

int verify_ledger_integrity(const LedgerState* ledger, int* outTamperedBlockIndex);

#ifdef __cplusplus
}
#endif

#endif // AERO_OPS_SAFETY_KERNEL_H
