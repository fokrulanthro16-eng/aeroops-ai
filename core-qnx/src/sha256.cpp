#include "sha256.h"
#include <cstdio>
#include <cstring>

// --- FIPS 180-4 Standard SHA-256 Implementation ---

#define ROTRIGHT(a,b) (((a) >> (b)) | ((a) << (32-(b))))
#define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
#define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
#define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
#define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))
#define SIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
#define SIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))

static const uint32_t K[64] = {
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

static void sha256_transform(SHA256_CTX* ctx, const uint8_t data[64]) {
    uint32_t a, b, c, d, e, f, g, h, t1, t2, m[64];

    for (int i = 0, j = 0; i < 16; ++i, j += 4) {
        m[i] = ((uint32_t)data[j] << 24) | ((uint32_t)data[j + 1] << 16) |
               ((uint32_t)data[j + 2] << 8) | ((uint32_t)data[j + 3]);
    }
    for (int i = 16; i < 64; ++i) {
        m[i] = SIG1(m[i - 2]) + m[i - 7] + SIG0(m[i - 15]) + m[i - 16];
    }

    a = ctx->state[0];
    b = ctx->state[1];
    c = ctx->state[2];
    d = ctx->state[3];
    e = ctx->state[4];
    f = ctx->state[5];
    g = ctx->state[6];
    h = ctx->state[7];

    for (int i = 0; i < 64; ++i) {
        t1 = h + EP1(e) + CH(e, f, g) + K[i] + m[i];
        t2 = EP0(a) + MAJ(a, b, c);
        h = g;
        g = f;
        f = e;
        e = d + t1;
        d = c;
        c = b;
        b = a;
        a = t1 + t2;
    }

    ctx->state[0] += a;
    ctx->state[1] += b;
    ctx->state[2] += c;
    ctx->state[3] += d;
    ctx->state[4] += e;
    ctx->state[5] += f;
    ctx->state[6] += g;
    ctx->state[7] += h;
}

void sha256_init(SHA256_CTX* ctx) {
    ctx->count = 0;
    ctx->state[0] = 0x6a09e667;
    ctx->state[1] = 0xbb67ae85;
    ctx->state[2] = 0x3c6ef372;
    ctx->state[3] = 0xa54ff53a;
    ctx->state[4] = 0x510e527f;
    ctx->state[5] = 0x9b05688c;
    ctx->state[6] = 0x1f83d9ab;
    ctx->state[7] = 0x5be0cd19;
}

void sha256_update(SHA256_CTX* ctx, const uint8_t* data, size_t len) {
    for (size_t i = 0; i < len; ++i) {
        ctx->buffer[ctx->count % 64] = data[i];
        ctx->count++;
        if ((ctx->count % 64) == 0) {
            sha256_transform(ctx, ctx->buffer);
        }
    }
}

void sha256_final(SHA256_CTX* ctx, uint8_t hash[32]) {
    uint64_t total_bits = ctx->count * 8;
    size_t i = ctx->count % 64;

    ctx->buffer[i++] = 0x80;
    if (i > 56) {
        while (i < 64) ctx->buffer[i++] = 0x00;
        sha256_transform(ctx, ctx->buffer);
        i = 0;
    }
    while (i < 56) ctx->buffer[i++] = 0x00;

    for (int j = 7; j >= 0; --j) {
        ctx->buffer[56 + (7 - j)] = (uint8_t)(total_bits >> (j * 8));
    }
    sha256_transform(ctx, ctx->buffer);

    for (int j = 0; j < 8; ++j) {
        hash[j * 4]     = (uint8_t)(ctx->state[j] >> 24);
        hash[j * 4 + 1] = (uint8_t)(ctx->state[j] >> 16);
        hash[j * 4 + 2] = (uint8_t)(ctx->state[j] >> 8);
        hash[j * 4 + 3] = (uint8_t)(ctx->state[j]);
    }
}

void sha256_to_hex(const uint8_t hash[32], char out_hex[65]) {
    for (int i = 0; i < 32; ++i) {
        std::snprintf(out_hex + (i * 2), 3, "%02x", hash[i]);
    }
    out_hex[64] = '\0';
}

// --- Portable Fast State-Hash Matching TypeScript Blackbox Engine ---
// Emulates the 32-bit arithmetic of JavaScript's Math.imul with identical seeds.

static inline uint32_t imul32(uint32_t a, uint32_t b) {
    return (uint32_t)((uint64_t)a * (uint64_t)b);
}

void aero_sha256_portable(const char* input, char out_hex[67]) {
    uint32_t h0 = 0x6a09e667;
    uint32_t h1 = 0xbb67ae85;
    uint32_t h2 = 0x3c6ef372;
    uint32_t h3 = 0xa54ff53a;
    uint32_t h4 = 0x510e527f;
    uint32_t h5 = 0x9b05688c;
    uint32_t h6 = 0x1f83d9ab;
    uint32_t h7 = 0x5be0cd19;

    size_t len = std::strlen(input);
    for (size_t i = 0; i < len; ++i) {
        uint32_t code = (uint8_t)input[i];
        h0 = imul32(h0 ^ code, 0x5bd1e995);
        h1 = imul32(h1 ^ (code >> 2), 0x27d4eb2d);
        h2 = imul32(h2 ^ (code << 3), 0x165667b1);
        h3 = imul32(h3 ^ (code ^ (uint32_t)i), 0xd3a2646c);
        h4 = imul32(h4 ^ (code + (uint32_t)i), 0xfd7046c5);
        h5 = imul32(h5 ^ (code * 7), 0xb55a4f09);
        h6 = imul32(h6 ^ (code ^ 0xaa), 0xe995b05a);
        h7 = imul32(h7 ^ (code + 0x55), 0x76a12b93);
    }

    std::snprintf(out_hex, 67, "0x%08x%08x%08x%08x%08x%08x%08x%08x",
                  h0, h1, h2, h3, h4, h5, h6, h7);
}

void compute_blackbox_block_hash(
    const char* prev_hash,
    uint64_t timestamp_ms,
    const char* event_type,
    const char* telemetry_payload,
    const char* risk_verdict,
    char out_block_hash[67]
) {
    // Fixed stack buffer to prevent dynamic heap fragmentation (DO-178C Level A constraint)
    char buffer[1024];
    std::snprintf(buffer, sizeof(buffer), "%s|%llu|%s|%s|%s",
                  prev_hash,
                  (unsigned long long)timestamp_ms,
                  event_type,
                  telemetry_payload,
                  risk_verdict);

    aero_sha256_portable(buffer, out_block_hash);
}
