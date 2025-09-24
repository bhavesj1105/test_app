import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AuthenticatedRequest, authenticate } from '../middleware/auth';
import { ChatParticipant, ChatSummary } from '../entities';
import { processJob, enqueueSummary } from '../services/summaryWorker';

const router = Router();

// GET /api/summarize/:chatId - latest summary
router.get('/:chatId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const chatId = req.params.chatId as string;
    const participantRepo = AppDataSource.getRepository(ChatParticipant);
  const participant = await participantRepo.findOne({ where: { chatId, userId: user.id } });
  if (!participant || participant.leftAt) { res.status(403).json({ error: 'Access denied' }); return; }

    const repo = AppDataSource.getRepository(ChatSummary);
    const latest = await repo.find({ where: { chatId }, order: { createdAt: 'DESC' }, take: 1 });
  if (!latest[0]) { res.json({ success: true, summary: null }); return; }
  res.json({ success: true, summary: { text: latest[0].summaryText, createdAt: latest[0].createdAt, modelVersion: latest[0].modelVersion } });
  } catch (e) {
    console.error('Get summary error', e);
    res.status(500).json({ error: 'Failed to get summary' });
  }
});

// POST /api/summarize/:chatId - generate and persist summary; supports inline or queued
router.post('/:chatId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const chatId = req.params.chatId as string;
    const { limit = 100, mode = 'inline' } = (req.body || {}) as { limit?: number; mode?: 'inline'|'queue' };
    const participantRepo = AppDataSource.getRepository(ChatParticipant);
  const participant = await participantRepo.findOne({ where: { chatId, userId: user.id } });
  if (!participant || participant.leftAt) { res.status(403).json({ error: 'Access denied' }); return; }

    if (mode === 'queue' && process.env.REDIS_URL) {
      await enqueueSummary(chatId, limit);
  res.json({ success: true, queued: true });
  return;
    } else {
  await processJob({ chatId, limit });
      // Return the latest summary
      const repo = AppDataSource.getRepository(ChatSummary);
      const latest = await repo.find({ where: { chatId }, order: { createdAt: 'DESC' }, take: 1 });
  res.json({ success: true, queued: false, summary: latest[0] ? { text: latest[0].summaryText, createdAt: latest[0].createdAt, modelVersion: latest[0].modelVersion } : null });
  return;
    }
  } catch (e) {
    console.error('Summarize error', e);
    res.status(500).json({ error: 'Failed to summarize chat' });
  }
});

export default router;
