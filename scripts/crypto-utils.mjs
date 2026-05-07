import { webcrypto } from "node:crypto";

const crypto = webcrypto;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const DEFAULT_ITERATIONS = 210000;

export async function encryptJson(data, password, options = {}) {
  const salt = options.saltBase64 ? fromBase64(options.saltBase64) : randomBytes(16);
  const iterations = options.iterations || DEFAULT_ITERATIONS;
  const key = await deriveAesKey(password, salt, iterations, ["encrypt"]);
  const iv = randomBytes(12);
  const plaintext = encoder.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  return {
    version: 1,
    algorithm: "AES-GCM",
    kdf: "PBKDF2-SHA256",
    iterations,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext))
  };
}

export async function decryptJson(envelope, password) {
  const key = await deriveAesKey(password, fromBase64(envelope.salt), envelope.iterations, ["decrypt"]);
  return decryptJsonWithKey(envelope, key);
}

async function deriveAesKey(password, salt, iterations, usages) {
  const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    usages
  );
}

async function decryptJsonWithKey(envelope, key) {
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(envelope.iv) },
    key,
    fromBase64(envelope.ciphertext)
  );
  return JSON.parse(decoder.decode(plaintext));
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value) {
  return new Uint8Array(Buffer.from(value, "base64"));
}
