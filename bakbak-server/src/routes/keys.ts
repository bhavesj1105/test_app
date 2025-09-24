import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

// Simple in-memory storage for scaffolding; replace with DB persistence in production.
type SignedPreKey = { keyId: number; publicKey: string; signature: string };
type OneTimePreKey = { keyId: number; publicKey: string };

interface KeyBundle {
  userId: string;
  registrationId: number;
  identityKey: string; // base64
  signedPreKey: SignedPreKey;
  oneTimePreKeys: OneTimePreKey[]; // consumed on fetch
  updatedAt: number;
}

const keyStore = new Map<string, KeyBundle>();

const router = Router();

// POST /api/keys/register - upload identity + prekeys (auth required)
router.post('/register', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
  const { registrationId, identityKey, signedPreKey, oneTimePreKeys } = req.body as Partial<KeyBundle> & {
      signedPreKey?: SignedPreKey;
      oneTimePreKeys?: OneTimePreKey[];
    };

    if (!identityKey || !signedPreKey || !Array.isArray(oneTimePreKeys)) {
      res.status(400).json({ error: 'Missing identityKey, signedPreKey, or oneTimePreKeys' });
      return;
    }

    keyStore.set(userId, {
      userId,
      registrationId: registrationId as number,
      identityKey,
      signedPreKey,
      oneTimePreKeys: [...oneTimePreKeys],
      updatedAt: Date.now(),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('keys/register error', err);
    res.status(500).json({ error: 'Failed to register keys' });
  }
});

// GET /api/keys/bundle/:userId - fetch a recipient's bundle (auth required)
router.get('/bundle/:userId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
  const { userId } = req.params as { userId: string };
  const bundle = keyStore.get(userId as string);
    if (!bundle) {
      res.status(404).json({ error: 'No key bundle found' });
      return;
    }

    // Consume one-time pre-key if available
    const oneTime = bundle.oneTimePreKeys.shift();
  keyStore.set(userId as string, { ...bundle, oneTimePreKeys: bundle.oneTimePreKeys, updatedAt: Date.now() });

    res.json({
      success: true,
      bundle: {
        registrationId: bundle.registrationId,
        identityKey: bundle.identityKey,
        signedPreKey: bundle.signedPreKey,
        oneTimePreKey: oneTime || null,
      },
    });
  } catch (err) {
    console.error('keys/bundle error', err);
    res.status(500).json({ error: 'Failed to get bundle' });
  }
});

export default router;
