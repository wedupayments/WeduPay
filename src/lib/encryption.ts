/**
 * Encryption Utility
 *
 * Provides AES-256-GCM encryption for sensitive data:
 * - API keys
 * - Webhook secrets
 * - Provider credentials
 * - Internal service tokens
 *
 * Uses Node.js built-in crypto module.
 * Key must be 32 bytes (256 bits) and stored in environment variables.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from "node:crypto";

const ENCRYPTION_KEY_ENV = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY_ENV) {
  throw new Error("ENCRYPTION_KEY environment variable is required for encryption operations");
}

// Derive a 32-byte key from the environment variable using scrypt
const encryptionKey = ENCRYPTION_KEY_ENV as string;
const derivedKey = scryptSync(encryptionKey, "wedupay-salt", 32);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt
 * @returns EncryptedPayload object with ciphertext, iv, authTag, and salt
 *
 * @example
 * ```typescript
 * const encrypted = encrypt("my-secret-api-key");
 * // Store encrypted.ciphertext, encrypted.iv, etc. in database
 * ```
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive a unique key for this encryption operation
  const key = scryptSync(encryptionKey, salt, 32);

  const cipher = createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, "utf8", "base64");
  ciphertext += cipher.final("base64");

  const authTag = cipher.getAuthTag().toString("base64");

  return {
    ciphertext,
    iv: iv.toString("base64"),
    authTag,
    salt: salt.toString("base64"),
  };
}

/**
 * Decrypt sensitive data
 *
 * @param encrypted - EncryptedPayload object from encrypt()
 * @returns The original plaintext string
 *
 * @example
 * ```typescript
 * const decrypted = decrypt(encryptedPayload);
 * // decrypted === "my-secret-api-key"
 * ```
 */
export function decrypt(encrypted: EncryptedPayload): string {
  const iv = Buffer.from(encrypted.iv, "base64");
  const authTag = Buffer.from(encrypted.authTag, "base64");
  const salt = Buffer.from(encrypted.salt, "base64");

  // Derive the same key used during encryption
  const key = scryptSync(encryptionKey, salt, 32);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(encrypted.ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

/**
 * Encrypt and store as JSON string (for database storage)
 *
 * @param plaintext - The data to encrypt
 * @returns JSON string representation of EncryptedPayload
 */
export function encryptToJSON(plaintext: string): string {
  return JSON.stringify(encrypt(plaintext));
}

/**
 * Decrypt from JSON string (from database storage)
 *
 * @param jsonString - JSON string from encryptToJSON()
 * @returns The original plaintext string
 */
export function decryptFromJSON(jsonString: string): string {
  const encrypted = JSON.parse(jsonString) as EncryptedPayload;
  return decrypt(encrypted);
}

/**
 * Generate a new secure encryption key
 *
 * Run this once to generate ENCRYPTION_KEY for .env
 * Store the output securely - it cannot be recovered if lost
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
