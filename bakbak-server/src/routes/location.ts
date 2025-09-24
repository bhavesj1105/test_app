import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { ChatParticipant, LiveLocationSession } from '../entities';

const router = Router();

// POST /api/location/start { chatId, durationSec? }
router.post('/start', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { chatId, durationSec = 900 } = (req.body || {}) as { chatId: string; durationSec?: number };
    if (!chatId) { res.status(400).json({ error: 'chatId required' }); return; }
    const participantRepo = AppDataSource.getRepository(ChatParticipant);
    const participant = await participantRepo.findOne({ where: { chatId, userId: user.id } });
    if (!participant || participant.leftAt) { res.status(403).json({ error: 'Access denied' }); return; }

    const expiresAt = new Date(Date.now() + Math.max(60, durationSec) * 1000);
    const repo = AppDataSource.getRepository(LiveLocationSession);
    const session = repo.create({ chatId, ownerUserId: user.id, expiresAt });
    const saved = await repo.save(session);
    res.json({ success: true, liveSessionId: saved.id, expiresAt });
  } catch (e) {
    console.error('Start live location error:', e);
    res.status(500).json({ error: 'Failed to start live location' });
  }
});

export default router;
