#pragma once
#include <string>
#include <vector>
#include <memory>
#include <openssl/evp.h>

namespace securevault::crypto {

struct EncryptedBlob {
    std::vector<uint8_t> ciphertext;
    std::vector<uint8_t> iv;
    std::vector<uint8_t> tag;
    std::string sha256_hash;
};

class CryptoEngine {
public:
    CryptoEngine();
    ~CryptoEngine();

    // Delete copy operations (RAII and secure state retention)
    CryptoEngine(const CryptoEngine&) = delete;
    CryptoEngine& operator=(const CryptoEngine&) = delete;

    // Password-based Key Derivation (PBKDF2-HMAC-SHA256)
    static std::vector<uint8_t> derive_key(
        const std::string& password, 
        const std::vector<uint8_t>& salt, 
        int iterations = 100000, 
        size_t key_len = 32
    );

    // Authenticated encryption (AES-256-GCM)
    EncryptedBlob encrypt(
        const std::vector<uint8_t>& plaintext, 
        const std::vector<uint8_t>& key
    );

    // Authenticated decryption (AES-256-GCM)
    std::vector<uint8_t> decrypt(
        const EncryptedBlob& blob, 
        const std::vector<uint8_t>& key
    );

    // Constant-time memory wiping
    static void secure_wipe(void* ptr, size_t size);

    // Constant-time comparison to prevent timing attacks
    static bool constant_time_compare(const uint8_t* a, const uint8_t* b, size_t length);

    // cryptographically secure random bytes generator
    static std::vector<uint8_t> generate_secure_bytes(size_t len);
};

}
