/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Avichas Metrics Limited - Central Security, Cryptography & Licence Generation
 * Strictly adheres to AES-256-GCM encryption with random IVs and 128-bit cryptographic licence generation.
 */

import crypto from 'crypto';

/**
 * Returns a 32-byte key buffer for AES-256-GCM from ENCRYPTION_KEY environment variable.
 * Refuses execution if ENCRYPTION_KEY is missing or invalid. Never falls back to a default.
 */
export function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || !key.trim()) {
    throw new Error('FATAL: ENCRYPTION_KEY environment variable is missing. Refusing to proceed.');
  }

  const trimmed = key.trim();

  // If 64 hex characters (32 bytes)
  if (trimmed.length === 64 && /^[0-9a-fA-F]+$/.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }

  // If 32 raw utf8 bytes
  if (Buffer.byteLength(trimmed, 'utf8') === 32) {
    return Buffer.from(trimmed, 'utf8');
  }

  // If base64 encoded 32 bytes
  try {
    const buf = Buffer.from(trimmed, 'base64');
    if (buf.length === 32) {
      return buf;
    }
  } catch {
    // ignore
  }

  throw new Error('FATAL: ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters or 32 raw bytes).');
}

/**
 * Verifies that the ENCRYPTION_KEY is present and valid at application startup.
 * Called in createApp() to guarantee the server refuses to start if ENCRYPTION_KEY is missing.
 */
export function assertEncryptionConfigured(): void {
  getEncryptionKey();
}

/**
 * Encrypts sensitive credentials using AES-256-GCM with a fresh random 12-byte IV per record.
 * Returns formatted as: `${ivHex}:${authTagHex}:${ciphertextHex}`.
 * Refuses to save if ENCRYPTION_KEY is missing. Never falls back to a default.
 */
export function encryptAiCredential(plaintext: string): string {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext credential provided for encryption.');
  }

  const key = getEncryptionKey(); // Throws if ENCRYPTION_KEY is missing
  const iv = crypto.randomBytes(12); // NIST recommended 96-bit (12 bytes) IV for AES-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypts sensitive credentials using AES-256-GCM.
 * Validates cryptographic authentication tag before returning plaintext.
 */
export function decryptAiCredential(payload: string): string {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Invalid encrypted payload provided for decryption.');
  }

  const parts = payload.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted credential format. Expected iv:tag:ciphertext.');
  }

  const [ivHex, tagHex, ciphertextHex] = parts;
  const key = getEncryptionKey(); // Throws if ENCRYPTION_KEY is missing
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertextHex, 'hex', 'utf8');
  plaintext += decipher.final('utf8');
  return plaintext;
}

/**
 * Generates a 128-bit cryptographic licence key using crypto.randomBytes(16).
 * Formats key as AVC-SCH- plus 8 groups of 4 hex characters.
 * Stores only a SHA-256 hash plus the last 4 characters.
 */
export function generateLicenceKey(): { licenceKey: string; keyHash: string; last4: string } {
  // 128 bits of cryptographic entropy = 16 bytes = 32 hex characters
  const hex = crypto.randomBytes(16).toString('hex').toUpperCase();

  // Format as AVC-SCH- followed by 8 groups of 4 hex characters (all 32 hex characters, 128 bits)
  const chunks = hex.match(/.{4}/g) as string[];
  const licenceKey = `AVC-SCH-${chunks.join('-')}`;

  // SHA-256 hash for database storage and index lookup
  const keyHash = crypto.createHash('sha256').update(licenceKey).digest('hex');

  // Last 4 characters of the licence key
  const last4 = licenceKey.slice(-4);

  return {
    licenceKey,
    keyHash,
    last4,
  };
}

/**
 * True when running in production: NODE_ENV=production, or inside a serverless function
 * (Netlify/AWS Lambda), where NODE_ENV is not guaranteed to be set.
 */
export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}
