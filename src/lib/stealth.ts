import crypto from 'crypto';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak_256 } from '@noble/hashes/sha3';

const CURVE_ORDER = secp256k1.CURVE.n;

function hexToBytes(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error('Invalid hex length');
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }

  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('hex');
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/^0x/, '').toLowerCase().padStart(64, '0');
}

function sha256(data: Uint8Array): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

function doubleSha256(data: Uint8Array): Buffer {
  return sha256(sha256(data));
}

function base58Encode(buffer: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const digits = [0];

  for (const byte of buffer) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      const value = digits[i] * 256 + carry;
      digits[i] = value % 58;
      carry = Math.floor(value / 58);
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let zeros = 0;
  while (zeros < buffer.length && buffer[zeros] === 0) {
    zeros++;
  }

  let result = '1'.repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) {
    result += alphabet[digits[i]];
  }

  return result;
}

function base58CheckEncode(payload: Uint8Array): string {
  const checksum = doubleSha256(payload).subarray(0, 4);
  const buffer = new Uint8Array(payload.length + checksum.length);
  buffer.set(payload, 0);
  buffer.set(checksum, payload.length);
  return base58Encode(buffer);
}

function tronAddressFromPublicKey(publicKey: Uint8Array): string {
  const uncompressed = publicKey.length === 65 ? publicKey.subarray(1) : publicKey;
  const hash = keccak_256(uncompressed);
  const payload = new Uint8Array(21);
  payload[0] = 0x41;
  payload.set(hash.subarray(hash.length - 20), 1);
  return base58CheckEncode(payload);
}

function scalarToHex(scalar: bigint): string {
  return scalar.toString(16).padStart(64, '0');
}

function hashToScalar(parts: Uint8Array[]): bigint {
  const hash = crypto.createHash('sha256');
  for (const part of parts) {
    hash.update(part);
  }
  const scalar = BigInt(`0x${hash.digest('hex')}`) % CURVE_ORDER;
  return scalar === BigInt(0) ? BigInt(1) : scalar;
}

export function generatePaymentLinkId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function generateStealthRootKeyPair(): {
  privateKey: string;
  publicKey: string;
} {
  const privateKey = bytesToHex(secp256k1.utils.randomPrivateKey());
  const publicKey = bytesToHex(secp256k1.getPublicKey(privateKey, false));

  return {
    privateKey,
    publicKey,
  };
}

export function deriveSenderStealthAddress(
  receiverPublicKey: string,
  context: string
): {
  stealthAddress: string;
  stealthPublicKey: string;
  ephemeralPrivateKey: string;
  ephemeralPublicKey: string;
  sharedSecretHash: string;
} {
  const ephemeralPrivateKey = normalizePrivateKey(bytesToHex(secp256k1.utils.randomPrivateKey()));
  const receiverPublicKeyBytes = hexToBytes(receiverPublicKey);
  const ephemeralPublicKey = bytesToHex(secp256k1.getPublicKey(ephemeralPrivateKey, false));
  const sharedSecret = secp256k1.getSharedSecret(ephemeralPrivateKey, receiverPublicKeyBytes, false);
  const tweak = hashToScalar([sharedSecret, Buffer.from(context, 'utf8')]);

  const receiverPoint = secp256k1.ProjectivePoint.fromHex(receiverPublicKeyBytes);
  const stealthPublicKey = receiverPoint.add(secp256k1.ProjectivePoint.BASE.multiply(tweak)).toHex(false);
  const stealthAddress = tronAddressFromPublicKey(hexToBytes(stealthPublicKey));

  return {
    stealthAddress,
    stealthPublicKey,
    ephemeralPrivateKey,
    ephemeralPublicKey,
    sharedSecretHash: bytesToHex(sharedSecret),
  };
}

export function deriveReceiverStealthKey(
  receiverPrivateKey: string,
  ephemeralPublicKey: string,
  context: string
): {
  stealthAddress: string;
  stealthPrivateKey: string;
  stealthPublicKey: string;
  ephemeralPublicKey: string;
  sharedSecretHash: string;
} {
  const receiverPrivateKeyHex = normalizePrivateKey(receiverPrivateKey);
  const receiverPrivateScalar = secp256k1.utils.normPrivateKeyToScalar(receiverPrivateKeyHex);
  const receiverPublicKey = bytesToHex(secp256k1.getPublicKey(receiverPrivateKeyHex, false));
  const sharedSecret = secp256k1.getSharedSecret(receiverPrivateKeyHex, hexToBytes(ephemeralPublicKey), false);
  const tweak = hashToScalar([sharedSecret, Buffer.from(context, 'utf8')]);
  const stealthPrivateScalar = (receiverPrivateScalar + tweak) % CURVE_ORDER;

  if (stealthPrivateScalar === BigInt(0)) {
    throw new Error('Derived invalid stealth private key');
  }

  const stealthPrivateKey = scalarToHex(stealthPrivateScalar);
  const receiverPoint = secp256k1.ProjectivePoint.fromHex(hexToBytes(receiverPublicKey));
  const stealthPublicKey = receiverPoint.add(secp256k1.ProjectivePoint.BASE.multiply(tweak)).toHex(false);
  const stealthAddress = tronAddressFromPublicKey(hexToBytes(stealthPublicKey));

  return {
    stealthAddress,
    stealthPrivateKey,
    stealthPublicKey,
    ephemeralPublicKey,
    sharedSecretHash: bytesToHex(sharedSecret),
  };
}

export function encodePaymentLink(
  linkId: string,
  receiverId: string,
  amount?: string
): string {
  const data = {
    id: linkId,
    r: receiverId,
    ...(amount && { a: amount }),
  };
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

export function decodePaymentLink(encoded: string): {
  id: string;
  r: string;
  a?: string;
} | null {
  try {
    const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
