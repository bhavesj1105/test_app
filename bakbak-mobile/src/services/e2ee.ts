// E2EE scaffolding using libsignal-protocol-typescript
// NOTE: This is a scaffold: handle secure storage and proper key lifecycle in production.

// Attempt to import libsignal, but allow build to pass if it's not installed
let libsignal: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  libsignal = require('libsignal-protocol-typescript');
} catch {
  libsignal = {} as any;
}

// Simple Storage adapter using an in-memory Map; replace with
// AsyncStorage/IndexedDB/SecureStore in your app (per platform).
class SimpleSignalStore {
  private store = new Map<string, any>();

  get identityKey(): ArrayBuffer | undefined { return this.get('identityKey'); }
  get registrationId(): number | undefined { return this.get('registrationId'); }

  get(key: string, defaultValue?: any): any {
    if (this.store.has(key)) return this.store.get(key);
    return defaultValue;
  }
  put(key: string, value: any): void {
    this.store.set(key, value);
  }
  remove(key: string): void {
    this.store.delete(key);
  }
}

export type EncryptedPayload = {
  type: number; // libsignal message type
  body: string; // base64
};

const store = new SimpleSignalStore();
let serverConfig: { serverUrl: string; token: string } | null = null;

// Utility encoding helpers
const toB64 = (buf: ArrayBuffer) => Buffer.from(new Uint8Array(buf)).toString('base64');
const fromB64 = (b64: string) => Uint8Array.from(Buffer.from(b64, 'base64')).buffer;

// 1. Initialize identity and prekeys
export async function initIdentity(): Promise<{ identity: { registrationId: number; identityKey: string }, prekeys: { signedPreKey: { keyId: number; publicKey: string; signature: string }, oneTimePreKeys: { keyId: number; publicKey: string }[] } }> {
  // registration id
  const registrationId = libsignal.KeyHelper.generateRegistrationId();
  store.put('registrationId', registrationId);

  // identity key pair
  const identityKey = await libsignal.KeyHelper.generateIdentityKeyPair();
  store.put('identityKey', identityKey);

  // signed pre-key
  const signedPreKeyId = 1;
  const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(identityKey, signedPreKeyId);
  store.put(`signedPreKey${signedPreKeyId}`, signedPreKey);

  // a batch of one-time pre-keys
  const preKeyStart = 1;
  const preKeyCount = 50;
  const oneTimePreKeys: { keyId: number; publicKey: string }[] = [];
  for (let i = preKeyStart; i < preKeyStart + preKeyCount; i++) {
    const preKey = await libsignal.KeyHelper.generatePreKey(i);
    store.put(`preKey${i}`, preKey);
    oneTimePreKeys.push({ keyId: i, publicKey: toB64(preKey.keyPair.publicKey) });
  }

  return {
    identity: {
      registrationId,
      identityKey: toB64(identityKey.publicKey),
    },
    prekeys: {
      signedPreKey: {
        keyId: signedPreKeyId,
        publicKey: toB64(signedPreKey.keyPair.publicKey),
        signature: toB64(signedPreKey.signature),
      },
      oneTimePreKeys,
    },
  };
}

// 2. Upload keys to server
export async function uploadPrekeys(serverUrl: string, token: string): Promise<void> {
  serverConfig = { serverUrl, token };
  const registrationId = store.registrationId!;
  const identityKeyPair: any = store.identityKey;
  const signedPreKey: any = store.get('signedPreKey1');
  const oneTimePreKeys: any[] = [];
  for (let i = 1; i <= 50; i++) {
    const pk = store.get(`preKey${i}`);
    if (pk) oneTimePreKeys.push({ keyId: i, publicKey: toB64(pk.keyPair.publicKey) });
  }

  await fetch(`${serverUrl}/api/keys/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      registrationId,
      identityKey: toB64(identityKeyPair.publicKey),
      signedPreKey: {
        keyId: 1,
        publicKey: toB64(signedPreKey.keyPair.publicKey),
        signature: toB64(signedPreKey.signature),
      },
      oneTimePreKeys,
    }),
  });
}

// Session helpers
async function ensureSession(recipientId: string): Promise<any> {
  if (!serverConfig) throw new Error('Server config not set. Call uploadPrekeys(serverUrl, token) first.');
  const { serverUrl, token } = serverConfig;
  // Load bundle
  const resp = await fetch(`${serverUrl}/api/keys/bundle/${recipientId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error('No bundle for recipient');
  const data = await resp.json();
  const b = data.bundle;

  // Build address and session
  const addr = new libsignal.SignalProtocolAddress(recipientId, 1);
  const sessionBuilder = new libsignal.SessionBuilder(store as any, addr);

  const preKeyBundle: any = {
    registrationId: b.registrationId,
    identityKey: fromB64(b.identityKey),
    signedPreKey: b.signedPreKey ? { keyId: b.signedPreKey.keyId, publicKey: fromB64(b.signedPreKey.publicKey), signature: fromB64(b.signedPreKey.signature) } : undefined,
    preKey: b.oneTimePreKey ? { keyId: b.oneTimePreKey.keyId, publicKey: fromB64(b.oneTimePreKey.publicKey) } : undefined,
  };

  await sessionBuilder.processPreKey(preKeyBundle);
  return new libsignal.SessionCipher(store as any, addr);
}

// 3. Encrypt/decrypt
export async function encryptMessage(recipientId: string, plaintext: string): Promise<EncryptedPayload> {
  const session = await ensureSession(recipientId);
  const msg = await session.encrypt(plaintext);
  // msg can be PreKeySignalMessage or SignalMessage
  if ((msg as any).type !== undefined) {
    return { type: (msg as any).type, body: toB64((msg as any).body) };
  }
  // Fallback
  return { type: (msg as any).type || 3, body: toB64((msg as any).serialize()) } as any;
}

export async function decryptMessage(senderId: string, payload: EncryptedPayload): Promise<string> {
  const addr = new libsignal.SignalProtocolAddress(senderId, 1);
  const cipher = new libsignal.SessionCipher(store as any, addr);
  const body = fromB64(payload.body);
  let plaintext: ArrayBuffer;
  if (payload.type === 3 /* PREKEY */) {
    plaintext = await cipher.decryptPreKeyWhisperMessage(body as any, 'binary');
  } else {
    plaintext = await cipher.decryptWhisperMessage(body as any, 'binary');
  }
  return Buffer.from(new Uint8Array(plaintext)).toString('utf8');
}

// 4. Export/import keys (basic)
export function exportKeys(): any {
  // NOTE: For real apps, never export private keys unencrypted.
  const dump: Record<string, any> = {};
  (store as any).store.forEach((v: any, k: string) => { dump[k] = v; });
  return dump;
}

export function importKeys(dump: Record<string, any>) {
  Object.entries(dump).forEach(([k, v]) => (store as any).store.set(k, v));
}
