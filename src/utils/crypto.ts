// WebCrypto End-to-End Encryption (AES-GCM 256-bit) and SHA-256 verification

/**
 * Generate a random 256-bit AES-GCM encryption key
 */
export async function generateSessionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export CryptoKey to Base64 string for exchange
 */
export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  const bytes = new Uint8Array(raw);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Import CryptoKey from Base64 string
 */
export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    'raw',
    bytes.buffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derive an AES-GCM key from a shared 6-digit PIN or room passcode
 */
export async function deriveKeyFromPasscode(passcode: string, salt: string = 'beamdrop-salt-v1'): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passcode),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a binary chunk using AES-GCM
 * Returns [12-byte IV][Encrypted Ciphertext with Auth Tag]
 */
export async function encryptChunk(chunk: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    chunk
  );

  // Combine IV (12 bytes) and ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return combined.buffer;
}

/**
 * Decrypt a binary chunk using AES-GCM
 * Expects [12-byte IV][Encrypted Ciphertext with Auth Tag]
 */
export async function decryptChunk(encryptedData: ArrayBuffer, key: CryptoKey): Promise<ArrayBuffer> {
  const combined = new Uint8Array(encryptedData);
  if (combined.byteLength < 28) {
    throw new Error(`Encrypted chunk too small (${combined.byteLength} bytes, minimum 28 bytes required)`);
  }

  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    ciphertext
  );
}

/**
 * Compute fast integrity hash of a Blob or ArrayBuffer without memory exhaustion or disk read stalls.
 * For huge files (1 GB - 20 GB), computes a rapid structural checksum (size + 64KB head + 64KB middle + 64KB tail)
 * in under 5ms, avoiding multi-second hashing delays before transfer starts.
 */
export async function computeFileHash(blob: Blob | ArrayBuffer): Promise<string> {
  if (blob instanceof Blob) {
    const size = blob.size;
    if (size > 8 * 1024 * 1024) {
      // Rapid structural sampling for large files: size + head + mid + tail
      const sampleSize = 64 * 1024; // 64 KB per sample
      const headSlice = await blob.slice(0, sampleSize).arrayBuffer();
      const midStart = Math.max(0, Math.floor(size / 2) - Math.floor(sampleSize / 2));
      const midSlice = await blob.slice(midStart, midStart + sampleSize).arrayBuffer();
      const tailSlice = await blob.slice(Math.max(0, size - sampleSize), size).arrayBuffer();

      const meta = new TextEncoder().encode(`sz:${size}:t:${blob.type}`);
      const combined = new Uint8Array(meta.byteLength + headSlice.byteLength + midSlice.byteLength + tailSlice.byteLength);
      let offset = 0;
      combined.set(meta, offset); offset += meta.byteLength;
      combined.set(new Uint8Array(headSlice), offset); offset += headSlice.byteLength;
      combined.set(new Uint8Array(midSlice), offset); offset += midSlice.byteLength;
      combined.set(new Uint8Array(tailSlice), offset);

      const hashBuffer = await crypto.subtle.digest('SHA-256', combined.buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    // Small files under 8 MB: complete SHA-256
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // ArrayBuffer input
  const hashBuffer = await crypto.subtle.digest('SHA-256', blob);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
