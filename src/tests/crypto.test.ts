import {
  createBlackboxBlock,
  initializeMissionBlackboxLedger,
  verifyLedgerIntegrity,
} from "../lib/blackbox-crypto";
import { buildScenario1Nominal } from "../lib/simulation/scenarios";

export function runCryptoTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      errors.push(message);
      console.error(`  ✗ FAIL: ${message}`);
    }
  }

  console.log("\n[RUNNING CRYPTOGRAPHIC LEDGER & MERKLE AUDIT TESTS]");
  const mission = buildScenario1Nominal();

  // Test 1: Ledger Initialization & Block Chain Generation
  const ledger = initializeMissionBlackboxLedger(mission);
  assert(
    ledger.blockCount === 3,
    `Initial ledger must contain exactly 3 operational blocks (Got ${ledger.blockCount})`
  );
  assert(
    ledger.rootHash.startsWith("0x") && ledger.rootHash.length === 66,
    `Root hash must be a valid 64-char hex string with 0x prefix (Got ${ledger.rootHash})`
  );

  // Test 2: Valid Ledger Cryptographic Verification
  const verification = verifyLedgerIntegrity(ledger);
  assert(
    verification.isValid === true,
    `Untampered ledger must pass cryptographic verification`
  );

  // Test 3: Tamper Detection (Simulate corrupted payload in block 1)
  const corruptedLedger = JSON.parse(JSON.stringify(ledger));
  corruptedLedger.blocks[1].eventPayload = "TAMPERED_MALICIOUS_TELEMETRY_PAYLOAD";

  const tamperedCheck = verifyLedgerIntegrity(corruptedLedger);
  assert(
    tamperedCheck.isValid === false,
    `Corrupted block payload must fail cryptographic verification`
  );
  assert(
    tamperedCheck.tamperedBlockIndex === 1,
    `Tamper detector must isolate the exact corrupted block index (Got index ${tamperedCheck.tamperedBlockIndex})`
  );

  // Test 4: Broken Hash-Chain Link Detection
  const brokenLinkLedger = JSON.parse(JSON.stringify(ledger));
  brokenLinkLedger.blocks[2].previousHash = "0xBAD000000000000000000000000000000000000000000000000000000000DEAD";
  const brokenLinkCheck = verifyLedgerIntegrity(brokenLinkLedger);
  assert(
    brokenLinkCheck.isValid === false,
    `Broken hash link pointer must be detected as invalid`
  );

  return { passed, failed, errors };
}