import { PrismaClient } from "@prisma/client";
import { MOCK_AIRCRAFT_FLEET, MOCK_VERTIPORTS } from "../src/lib/simulation/scenarios";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding AeroOps AI database...");

  // Seed Aircraft
  for (const ac of MOCK_AIRCRAFT_FLEET) {
    await prisma.aircraft.upsert({
      where: { tailNumber: ac.tailNumber },
      update: {
        model: ac.model,
        type: ac.type,
        mtowKg: ac.mtowKg,
        emptyWeightKg: ac.emptyWeightKg,
        maxPayloadKg: ac.maxPayloadKg,
        batteryCapacityKwh: ac.batteryCapacityKwh,
        basePowerHoverKw: ac.basePowerHoverKw,
        basePowerCruiseKw: ac.basePowerCruiseKw,
        nominalCruiseSpeedKts: ac.nominalCruiseSpeedKts,
        maxCrosswindKts: ac.maxCrosswindKts,
        maxOperatingWindKts: ac.maxOperatingWindKts,
        minReserveSocPercent: ac.minReserveSocPercent,
      },
      create: {
        id: ac.id,
        tailNumber: ac.tailNumber,
        model: ac.model,
        type: ac.type,
        mtowKg: ac.mtowKg,
        emptyWeightKg: ac.emptyWeightKg,
        maxPayloadKg: ac.maxPayloadKg,
        batteryCapacityKwh: ac.batteryCapacityKwh,
        basePowerHoverKw: ac.basePowerHoverKw,
        basePowerCruiseKw: ac.basePowerCruiseKw,
        nominalCruiseSpeedKts: ac.nominalCruiseSpeedKts,
        maxCrosswindKts: ac.maxCrosswindKts,
        maxOperatingWindKts: ac.maxOperatingWindKts,
        minReserveSocPercent: ac.minReserveSocPercent,
        status: "READY",
        currentSocPercent: 92.0,
        locationIcao: "KLAX",
      },
    });
  }

  // Seed Vertiports
  for (const vp of MOCK_VERTIPORTS) {
    await prisma.vertiportLocation.upsert({
      where: { icao: vp.icao },
      update: {
        name: vp.name,
        lat: vp.lat,
        lon: vp.lon,
        elevationFt: vp.elevationFt,
        runwaysJson: JSON.stringify(vp.activeRunways),
      },
      create: {
        id: vp.id,
        icao: vp.icao,
        name: vp.name,
        lat: vp.lat,
        lon: vp.lon,
        elevationFt: vp.elevationFt,
        runwaysJson: JSON.stringify(vp.activeRunways),
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });