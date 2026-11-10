import { runPhysicsTests } from "./physics.test";
import { runRiskTests } from "./risk.test";
import { runTelemetryTests } from "./telemetry.test";
import { runCryptoTests } from "./crypto.test";
import { runQnxBridgeTests } from "../../tests/qnx-bridge.test";
import { runV3MoatTests } from "../../tests/v3-moat-capabilities.test";

console.log("=================================================================");
console.log("   AEROOPS AI v3.0 — ENTERPRISE AVIONICS & DO-178C QNX TEST SUITE");
console.log("=================================================================");

const t1 = runPhysicsTests();
const t2 = runRiskTests();
const t3 = runTelemetryTests();
const t4 = runCryptoTests();
const t5 = runQnxBridgeTests();
const t6 = runV3MoatTests();

const totalPassed = t1.passed + t2.passed + t3.passed + t4.passed + t5.passed + t6.passed;
const totalFailed = t1.failed + t2.failed + t3.failed + t4.failed + t5.failed + t6.failed;

console.log("\n=================================================================");
console.log(`TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log("=================================================================");

if (totalFailed > 0) {
  console.error("Test failures encountered.");
  process.exit(1);
} else {
  console.log("All AeroOps AI v3.0 Enterprise Avionics, QNX Kernel & Cryptographic tests passed perfectly!");
  process.exit(0);
}
