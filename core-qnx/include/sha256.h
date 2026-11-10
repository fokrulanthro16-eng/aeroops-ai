#ifndef AERO_OPS_SHA256_H
#define AERO_OPS_SHA256_H

#include <cstdint>
#include <cstddef>

#ifdef __cplusplus
extern "C" {
#endif

// SHA-256 state context for DO-178C deterministic operations (zero dynamic heap allocation)
typedef struct {
    uint32_t state[8];
    uint64_t count;
    uint8_t buffer[64];
} SHA256_CTX;

// Standard FIPS 180-4 SHA-256
void sha256_init(SHA256_CTX* ctx);
void sha256_update(SHA256_CTX* ctx, const uint8_t* data, size_t len);
void sha256_final(SHA256_CTX* ctx, uint8_t hash[32]);
void sha256_to_hex(const uint8_t hash[32], char out_hex[65]);

// Portable deterministic hash matching AeroOps Blackbox format:
// Generates: 0x<64-hex-chars> (total 66 chars null-terminated)
void aero_sha256_portable(const char* input, char out_hex[67]);

// High-level DO-178C block hash function:
// BlockHash_n = SHA256(PrevHash + "|" + Timestamp + "|" + EventType + "|" + TelemetryPayload + "|" + RiskVerdict)
void compute_blackbox_block_hash(
    const char* prev_hash,
    uint64_t timestamp_ms,
    const char* event_type,
    const char* telemetry_payload,
    const char* risk_verdict,
    char out_block_hash[67]
);

#ifdef __cplusplus
}
#endif

#endif // AERO_OPS_SHA256_H
