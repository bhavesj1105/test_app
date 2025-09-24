import { Router, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { AppClient } from '../entities';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// POST /api/apps/register - developers register an app client
router.post('/register', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { name, sandboxOrigin, scopes } = (req.body || {}) as { name: string; sandboxOrigin?: string; scopes?: string[] };
    if (!name || name.length < 3) { res.status(400).json({ error: 'Name required' }); return; }

    const clientId = `app_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = crypto.randomBytes(24).toString('hex');
    const hash = await bcrypt.hash(clientSecret, 10);

    const repo = AppDataSource.getRepository(AppClient);
    const app = repo.create({ name, clientId, clientSecretHash: hash, createdByUserId: user.id, isApproved: false, sandboxOrigin: sandboxOrigin || null, scopes: scopes || null });
    await repo.save(app);

    res.status(201).json({ success: true, clientId, clientSecret });
  } catch (e) {
    console.error('App register error:', e);
    res.status(500).json({ error: 'Failed to register app' });
  }
});

// POST /api/apps/approve/:clientId - admin approves an app
router.post('/approve/:clientId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Simple admin gate: env var ADMIN_USER_ID list
    const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').filter(Boolean);
    if (!adminIds.includes(req.user!.id)) { res.status(403).json({ error: 'Admin only' }); return; }
  const { clientId } = req.params as { clientId: string };
    const repo = AppDataSource.getRepository(AppClient);
  const app = await repo.findOne({ where: { clientId: clientId as string } });
    if (!app) { res.status(404).json({ error: 'App not found' }); return; }
    await repo.update(app.id, { isApproved: true } as any);
    res.json({ success: true });
  } catch (e) {
    console.error('App approve error:', e);
    res.status(500).json({ error: 'Failed to approve app' });
  }
});

// POST /api/apps/oauth/token - issue short-lived JWT for app to call extension APIs
router.post('/oauth/token', async (req, res: Response): Promise<void> => {
  try {
    const { client_id, client_secret } = req.body as { client_id?: string; client_secret?: string };
    if (!client_id || !client_secret) { res.status(400).json({ error: 'Missing credentials' }); return; }
    const repo = AppDataSource.getRepository(AppClient);
    const app = await repo.findOne({ where: { clientId: client_id } });
    if (!app || !app.isApproved) { res.status(403).json({ error: 'Invalid or unapproved app' }); return; }
    const ok = await bcrypt.compare(client_secret, app.clientSecretHash);
    if (!ok) { res.status(403).json({ error: 'Invalid credentials' }); return; }
    const jwtSecret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'secret';
    const token = jwt.sign({ sub: app.id, cid: app.clientId, scopes: app.scopes || [] }, jwtSecret, { expiresIn: '30m', audience: 'bakbak-apps' });
    res.json({ access_token: token, token_type: 'bearer', expires_in: 1800 });
  } catch (e) {
    console.error('App token error:', e);
    res.status(500).json({ error: 'Failed to issue token' });
  }
});

export default router;
