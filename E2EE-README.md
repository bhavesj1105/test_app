# Bak Bak E2EE Scaffolding (Signal Protocol)

This is a scaffold to integrate 1:1 end-to-end encryption using libsignal.

## Client (mobile) helpers
File: `bakbak-mobile/src/services/e2ee.ts`

Exports:
- `initIdentity()`: creates registration/identity keys + signed prekey + 50 one-time prekeys; stores in a simple in-memory store (replace with secure storage / IndexedDB/AsyncStorage).
- `uploadPrekeys(serverUrl, token)`: uploads identity + prekeys to the server; also stores serverUrl/token for later session setup.
- `encryptMessage(recipientId, plaintext)`: fetches a recipient bundle, initializes a session if needed, returns `{ type, body }` payload to send.
- `decryptMessage(senderId, payload)`: decrypts incoming `{ type, body }` back to plaintext.
- `exportKeys()` / `importKeys()`: basic key export/import for backup (do not use in production unencrypted).

TODOs:
- Replace SimpleSignalStore with a secure persistent store per platform.
- Handle session caching and one-time pre-key exhaustion (re-upload).
- Handle device IDs and multi-device.

## Server (Express) stubs
File: `bakbak-server/src/routes/keys.ts`

Endpoints:
- `POST /api/keys/register` (auth): store identityKey, signedPreKey, and oneTimePreKeys for the authenticated user.
- `GET /api/keys/bundle/:userId` (auth): returns a prekey bundle for the recipient, consuming one one-time key when available.

These stubs use an in-memory `Map` for storage. Replace with DB tables keyed by userId and rotate one-time prekeys on fetch.

## How to send an encrypted message
1. On first login/device setup:
   - Call `const { identity, prekeys } = await initIdentity()`
   - Call `await uploadPrekeys(API_URL, token)`
2. To send:
   - `const cipher = await encryptMessage(recipientId, 'hello')`
   - Send `cipher` in your Socket.IO `message:send` payload
3. To receive:
   - On `message:receive`, call `const text = await decryptMessage(senderId, payload)`

## Group chats (design note)
Group E2EE is more complex; recommended approaches:
- Signal Sender Keys (group ratchet) per group, per sender; rotate on membership changes.
- Use an open-source group E2EE library that implements sender-key ratchets.
- For MVP, consider server-side encrypted groups and keep 1:1 chats E2EE, or do calls via SFU (P2P media) without persisting media.

## Security notes
- This scaffold is for development. In production you must:
  - Move to secure key storage (Keychain/Keystore) and never export private keys unencrypted.
  - Implement proper device IDs and signed prekey rotation.
  - Validate payload sizes and types on server routes.
  - Consider rate limits and abuse prevention on key endpoints.
