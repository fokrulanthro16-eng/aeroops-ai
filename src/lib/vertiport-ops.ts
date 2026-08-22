import { VertiportPadSlot, VertiportTurnaroundState } from "@/types/aviation";

/**
 * Smart Vertiport Slot Reservation & Fast-Charge Turnaround Matrix
 * Manages charging pad status, turnaround countdowns, and dynamic slot reservations.
 */

export const INITIAL_VERTIPORT_NETWORK_STATES: Record<string, VertiportTurnaroundState> = {
  KLAX: {
    vertiportIcao: "KLAX",
    name: "Los Angeles International Vertiport Alpha",
    totalPads: 4,
    availablePads: 2,
    pads: [
      {
        padId: "PAD-LAX-01",
        padName: "Pad 1 (MegaWatt Fast-Charge)",
        status: "OCCUPIED",
        assignedCallsign: "AERO-701-DS",
        chargerPowerKw: 450,
        currentSocTargetPercent: 95,
        turnaroundTimerSec: 340,
        estimatedClearTimeUtc: "18:45 UTC",
      },
      {
        padId: "PAD-LAX-02",
        padName: "Pad 2 (Standard DC Fast)",
        status: "AVAILABLE",
        chargerPowerKw: 300,
        turnaroundTimerSec: 0,
        estimatedClearTimeUtc: "READY NOW",
      },
      {
        padId: "PAD-LAX-03",
        padName: "Pad 3 (High-Power FATO)",
        status: "OCCUPIED",
        assignedCallsign: "SKY-CARGO-09",
        chargerPowerKw: 450,
        currentSocTargetPercent: 90,
        turnaroundTimerSec: 720,
        estimatedClearTimeUtc: "18:52 UTC",
      },
      {
        padId: "PAD-LAX-04",
        padName: "Pad 4 (Auxiliary FATO)",
        status: "AVAILABLE",
        chargerPowerKw: 250,
        turnaroundTimerSec: 0,
        estimatedClearTimeUtc: "READY NOW",
      },
    ],
  },
  KBUR: {
    vertiportIcao: "KBUR",
    name: "Burbank SkyLink VertiHub",
    totalPads: 4,
    availablePads: 3,
    pads: [
      {
        padId: "PAD-BUR-01",
        padName: "Gate 1 (AeroVect Fast Bay)",
        status: "AVAILABLE",
        chargerPowerKw: 450,
        turnaroundTimerSec: 0,
        estimatedClearTimeUtc: "READY NOW",
      },
      {
        padId: "PAD-BUR-02",
        padName: "Gate 2 (Dual DC Charger)",
        status: "OCCUPIED",
        assignedCallsign: "N802AC",
        chargerPowerKw: 350,
        currentSocTargetPercent: 88,
        turnaroundTimerSec: 180,
        estimatedClearTimeUtc: "18:42 UTC",
      },
      {
        padId: "PAD-BUR-03",
        padName: "Gate 3 (Urban Ingress FATO)",
        status: "AVAILABLE",
        chargerPowerKw: 450,
        turnaroundTimerSec: 0,
        estimatedClearTimeUtc: "READY NOW",
      },
      {
        padId: "PAD-BUR-04",
        padName: "Gate 4 (Reserve Divert Pad)",
        status: "AVAILABLE",
        chargerPowerKw: 300,
        turnaroundTimerSec: 0,
        estimatedClearTimeUtc: "READY NOW",
      },
    ],
  },
};

/**
 * Reserves a fast-charging pad slot at the destination vertiport for the incoming mission.
 */
export function reserveVertiportArrivalSlot(
  destIcao: string,
  missionCallsign: string,
  estimatedFlightTimeMin: number
): { state: VertiportTurnaroundState; reservedPadId: string | null } {
  const baseState = INITIAL_VERTIPORT_NETWORK_STATES[destIcao] || INITIAL_VERTIPORT_NETWORK_STATES["KBUR"];
  const clonedState: VertiportTurnaroundState = JSON.parse(JSON.stringify(baseState));

  // Find first available pad
  const availablePad = clonedState.pads.find((p) => p.status === "AVAILABLE");

  if (availablePad) {
    availablePad.status = "RESERVED";
    availablePad.assignedCallsign = missionCallsign;
    availablePad.turnaroundTimerSec = Math.round(estimatedFlightTimeMin * 60);
    const clearDate = new Date(Date.now() + estimatedFlightTimeMin * 60000);
    availablePad.estimatedClearTimeUtc = `${clearDate.toISOString().substring(11, 16)} UTC (LOCKED)`;
    clonedState.availablePads = Math.max(0, clonedState.availablePads - 1);
    clonedState.lockedSlotPadId = availablePad.padId;
    return { state: clonedState, reservedPadId: availablePad.padId };
  }

  return { state: clonedState, reservedPadId: null };
}