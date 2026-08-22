import { runPhysicsTests } from "./physics.test";
import { runRiskTests } from "./risk.test";
import { runTelemetryTests } from "./telemetry.test";
import { runCryptoTests } from "./crypto.test";

console.log("=================================================================");
console.log("   AERTOPS AI v2.0 — ENTERPRISE AVIONICS TEST SUITE");
console.log("=================================================================");

const t1 = runPhysicsTests();
const t2 = runRiskTests();
const t3 = runTelemetryTests();
const t4 = runCryptoTests();

const totalPassed = t1.passed + t2.passed + t3.passed + t4.passed;
const totalFailed = t1.failed + t2.failed + t3.failed + t4.failed;

console.log("\n=================================================================");
console.log(`TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log("=================================================================");

if (totalFailed > 0) {
  console.error("Test failures encountered.");
  process.exit(1);
} else {
  console.log("All AeroOps AI v2.0 Enterprise Avionics & Cryptographic tests passed perfectly!");
  process.exit(0);
}