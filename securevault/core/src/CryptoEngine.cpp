#include "CryptoEngine.hpp"
#include <openssl/rand.h>
#include <openssl/sha.h>
#include <stdexcept>
#include <cstring>
#include <iomanip>
#include <sstream>

namespace securevault::crypto {

CryptoEngine::CryptoEngine() {}

CryptoEngine::~CryptoEngine() {}

std::vector<uint8_t> CryptoEngine::derive_key(
    const std::string& password, 
    const std::vector<uint8_t>& salt, 
    int iterations, 
    size_t key_len
) {
    if (salt.size() < 16) {
        throw std::invalid_argument("Salt size must be at least 16 bytes for enterprise security");
    }

    std::vector<uint8_t> derived_key(key_len);
    int success = PKCS5_PBKDF2_HMAC(
        password.c_str(), password.length(),
        salt.data(), salt.size(),
        iterations,
        EVP_sha256(),
        key_len, derived_key.data()
    );

    if (success != 1) {
        secure_wipe(derived_key.data(), derived_key.size());
        throw std::runtime_error("Key derivation via PBKDF2 failed");
    }

    return derived_key;
}

EncryptedBlob CryptoEngine::encrypt(
    const std::vector<uint8_t>& plaintext, 
    const std::vector<uint8_t>& key
) {
    if (key.size() != 32) {
        throw std::invalid_argument("Key length must be 256 bits (32 bytes)");
    }

    EncryptedBlob blob;
    blob.iv = generate_secure_bytes(12); // Standard 96-bit AES-GCM IV length
    blob.tag.resize(16);                 // Recommendation for AES GCM tag is 128 bits
    blob.ciphertext.resize(plaintext.size());

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) throw std::runtime_error("Failed to allocate EVP cipher context");

    int len = 0;
    int ciphertext_len = 0;

    try {
        if (1 != EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr)) {
            throw std::runtime_error("Cipher initialization failed");
        }

        if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, blob.iv.size(), nullptr)) {
            throw std::runtime_error("Setting IV length failed");
        }

        if (1 != EVP_EncryptInit_ex(ctx, nullptr, nullptr, key.data(), blob.iv.data())) {
            throw std::runtime_error("Key and IV assignment failed");
        }

        if (1 != EVP_EncryptUpdate(ctx, blob.ciphertext.data(), &len, plaintext.data(), plaintext.size())) {
            throw std::runtime_error("Plaintext block update failed");
        }
        ciphertext_len = len;

        if (1 != EVP_EncryptFinal_ex(ctx, blob.ciphertext.data() + len, &len)) {
            throw std::runtime_error("Cipher final block generation failed");
        }
        ciphertext_len += len;
        blob.ciphertext.resize(ciphertext_len);

        if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, 16, blob.tag.data())) {
            throw std::runtime_error("Authentication tag retrieval failed");
        }

        EVP_CIPHER_CTX_free(ctx);
    } catch (...) {
        EVP_CIPHER_CTX_free(ctx);
        throw;
    }

    SHA255_HASH:
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, plaintext.data(), plaintext.size());
    uint8_t hash[SHA256_DIGEST_LENGTH];
    SHA256_Final(hash, &sha256);

    std::stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)hash[i];
    }
    blob.sha256_hash = ss.str();

    return blob;
}

std::vector<uint8_t> CryptoEngine::decrypt(
    const EncryptedBlob& blob, 
    const std::vector<uint8_t>& key
) {
    if (key.size() != 32) {
        throw std::invalid_argument("Key length must be 32 bytes");
    }

    std::vector<uint8_t> plaintext(blob.ciphertext.size());
    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) throw std::runtime_error("Failed to allocate context");

    int len = 0;
    int plaintext_len = 0;
    int ret = 0;

    try {
        if (1 != EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr)) {
            throw std::runtime_error("Cipher decryption setup failed");
        }

        if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, blob.iv.size(), nullptr)) {
            throw std::runtime_error("Set Decrypt IV Length failed");
        }

        if (1 != EVP_DecryptInit_ex(ctx, nullptr, nullptr, key.data(), blob.iv.data())) {
            throw std::runtime_error("Key & IV mapping failed");
        }

        if (1 != EVP_DecryptUpdate(ctx, plaintext.data(), &len, blob.ciphertext.data(), blob.ciphertext.size())) {
            throw std::runtime_error("Ciphertext decryption update failed");
        }
        plaintext_len = len;

        if (1 != EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, const_cast<uint8_t*>(blob.tag.data()))) {
            throw std::runtime_error("Mapping tag verification parameters failed");
        }

        ret = EVP_DecryptFinal_ex(ctx, plaintext.data() + len, &len);
        EVP_CIPHER_CTX_free(ctx);
    } catch (...) {
        EVP_CIPHER_CTX_free(ctx);
        throw;
    }

    if (ret > 0) {
        plaintext_len += len;
        plaintext.resize(plaintext_len);
        return plaintext;
    } else {
        secure_wipe(plaintext.data(), plaintext.size());
        throw std::runtime_error("Decryption integrity check failed: MAC mismatch (malicious modification raw tamper)");
    }
}

void CryptoEngine::secure_wipe(void* ptr, size_t size) {
    if (ptr == nullptr || size == 0) return;
    volatile uint8_t* p = static_cast<volatile uint8_t*>(ptr);
    while (size--) {
        *p++ = 0;
    }
}

bool CryptoEngine::constant_time_compare(const uint8_t* a, const uint8_t* b, size_t length) {
    volatile uint8_t diff = 0;
    for (size_t i = 0; i < length; ++i) {
        diff |= (a[i] ^ b[i]);
    }
    return (diff == 0);
}

std::vector<uint8_t> CryptoEngine::generate_secure_bytes(size_t len) {
    std::vector<uint8_t> buf(len);
    if (RAND_bytes(buf.data(), len) != 1) {
        throw std::runtime_error("OpenSSL PRNG failed to gather sufficient entropy");
    }
    return buf;
}

}
