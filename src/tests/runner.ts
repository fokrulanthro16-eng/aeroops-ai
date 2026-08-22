import { runPhysicsTests } from "./physics.test";
import { runRiskTests } from "./risk.test";

console.log("=================================================");
console.log("   AERTOPS AI — TEST SUITE EXECUTION");
console.log("=================================================");

const t1 = runPhysicsTests();
const t2 = runRiskTests();

const totalPassed = t1.passed + t2.passed;
const totalFailed = t1.failed + t2.failed;

console.log("\n=================================================");
console.log(`TEST SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED`);
console.log("=================================================");

if (totalFailed > 0) {
  console.error("Test failures encountered.");
  process.exit(1);
} else {
  console.log("All deterministic aviation math & safety tests passed perfectly!");
  process.exit(0);
}