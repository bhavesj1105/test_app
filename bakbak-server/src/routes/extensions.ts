import { Router, Response, Request } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { AppClient, ChatParticipant, Message, MessageType, Chat } from '../entities';
import { getIO } from '../services/io';

const router = Router();

// App token middleware
function authenticateApp(req: Request, res: Response, next: Function) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : undefined;
    if (!token) return void res.status(401).json({ error: 'Missing token' });
    const secret = process.env.APP_JWT_SECRET || process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as any;
    (req as any).appToken = decoded;
    next();
  } catch (e) {
    return void res.status(401).json({ error: 'Invalid token' });
  }
}

// POST /api/extensions/rich-card { chatId, title, url, image?, action? }
router.post('/rich-card', authenticateApp, async (req: Request, res: Response): Promise<void> => {
  try {
    const appToken = (req as any).appToken as { sub: string; cid: string };
    const { chatId, title, url, image, action } = (req.body || {}) as { chatId: string; title: string; url: string; image?: string; action?: string };
    if (!chatId || !title || !url) { res.status(400).json({ error: 'chatId, title, url required' }); return; }

    const appRepo = AppDataSource.getRepository(AppClient);
    const app = await appRepo.findOne({ where: { id: appToken.sub } });
    if (!app) { res.status(403).json({ error: 'App not found' }); return; }

    // System message from app (senderId is null), but we need a sender. Use a synthetic senderId of appId.
    const participantRepo = AppDataSource.getRepository(ChatParticipant);
    const partCount = await participantRepo.count({ where: { chatId, leftAt: null as any } });
    if (partCount === 0) { res.status(404).json({ error: 'Chat not found' }); return; }

    const messageRepo = AppDataSource.getRepository(Message);
    const chatRepo = AppDataSource.getRepository(Chat);
    const participantRepo2 = AppDataSource.getRepository(ChatParticipant);
    const payload = { title, url, image, action, appId: app.id, appName: app.name };
    const msg = messageRepo.create({ chatId, senderId: app.id, content: title, type: MessageType.SYSTEM, cardPayload: payload } as any);
    const saved = await messageRepo.save(msg);

    // Update chat last message timestamp
    await chatRepo.update(chatId, { lastMessageAt: new Date() });

    // Increment unread for other participants
    await participantRepo2.createQueryBuilder()
      .update(ChatParticipant)
      .set({ unreadCount: () => 'unread_count + 1' })
      .where('chatId = :chatId', { chatId })
      .andWhere('leftAt IS NULL')
      .execute();

    // Broadcast via socket
    try {
      const io = getIO();
      io.to(chatId).emit('message:receive', {
        id: (saved as any).id,
        chatId,
        senderId: app.id,
        content: title,
        type: 'system',
        createdAt: new Date().toISOString(),
        cardPayload: payload,
      });
    } catch {}

    res.status(201).json({ success: true, messageId: (saved as any).id });
  } catch (e) {
    console.error('Rich card post error:', e);
    res.status(500).json({ error: 'Failed to post card' });
  }
});

export default router;
