import crypto from 'crypto';

const CURVE = 'secp256k1';

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function base58Encode(buffer: Buffer | Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz';
  let bytes: number[] = Array.from(buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer);

  let leadingZeros = 0;
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    leadingZeros++;
  }

  const base58Chars: string[] = [];
  while (bytes.length > 0) {
    let carry = 0;
    for (let i = 0; i < bytes.length; i++) {
      carry = carry * 256 + bytes[i];
      bytes[i] = Math.floor(carry / 58);
      carry = carry % 58;
    }
    base58Chars.push(alphabet[carry]);
    while (bytes.length > 0 && bytes[bytes.length - 1] === 0) {
      bytes.pop();
    }
  }

  for (let i = 0; i < leadingZeros; i++) {
    base58Chars.push(alphabet[0]);
  }

  return base58Chars.reverse().join('');
}

function sha256sha256(data: Buffer): Buffer {
  const hash1 = crypto.createHash('sha256').update(data).digest();
  return crypto.createHash('sha256').update(hash1).digest();
}

function ripemd160(data: Buffer): Buffer {
  return crypto.createHash('ripemd160').update(data).digest();
}

export function tronAddressFromPrivateKey(privateKeyHex: string): string {
  const privateKey = hexToBytes(privateKeyHex);

  const publicKey = crypto.createPublicKey({
    key: crypto.createPrivateKey({ key: privateKey, curve: CURVE }),
    format: 'der',
    type: 'spki',
  });

  const publicKeyBytes = publicKey.export({ format: 'der' }).slice(2);

  const hash = sha256sha256(Buffer.from(publicKeyBytes));
  const addressBytes = new Uint8Array(21);
  addressBytes[0] = 0x41;
  addressBytes.set(hash.slice(0, 20), 1);

  const checksum = sha256sha256(Buffer.from(addressBytes)).slice(0, 4);
  const addressWithChecksum = new Uint8Array(25);
  addressWithChecksum.set(addressBytes);
  addressWithChecksum.set(checksum, 21);

  return base58Encode(addressWithChecksum);
}

export function generateRandomKey(): { privateKey: string; address: string } {
  const ecdh = crypto.createECDH(CURVE);
  ecdh.generateKeys();

  const privateKey = bytesToHex(ecdh.getPrivateKey());
  const address = tronAddressFromPrivateKey(privateKey);

  return { privateKey, address };
}

export function generateStealthAddress(
  receiverPublicKey: string,
  blindingFactor?: string
): { stealthAddress: string; viewKey: string; blindingFactor: string } {
  const bf = blindingFactor || bytesToHex(crypto.randomBytes(32));

  const receiverPub = hexToBytes(receiverPublicKey);

  const ecdh = crypto.createECDH(CURVE);
  ecdh.setPrivateKey(Buffer.from(receiverPub));

  const sharedSecret = ecdh.computeSecret(Buffer.from(hexToBytes(bf)));

  const hash = sha256sha256(Buffer.from(sharedSecret));
  const derivedKey = hash.slice(0, 32);

  const ecdh2 = crypto.createECDH(CURVE);
  ecdh2.setPrivateKey(derivedKey);
  const derivedPublic = ecdh2.getPublicKey();

  const address = tronAddressFromPrivateKey(bytesToHex(derivedKey));

  return {
    stealthAddress: address,
    viewKey: bytesToHex(derivedPublic),
    blindingFactor: bf,
  };
}

export function generatePaymentLinkId(): string {
  return crypto.randomBytes(8).toString('hex');
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