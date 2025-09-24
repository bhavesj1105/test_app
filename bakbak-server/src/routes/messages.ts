import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Message, Chat, ChatParticipant, MessageType, MessageStatus, MessageReaction, RecentlyDeleted } from '../entities';
import { getIO } from '../services/io';
import { IsNull } from 'typeorm';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /chats/:chatId/messages - Get messages for a specific chat (protected route)
router.get('/:chatId/messages', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
  const { chatId } = req.params;
    const { page = '1', limit = '50', before } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Verify user is a participant in the chat
    const participantRepository = AppDataSource.getRepository(ChatParticipant);
    const participant = await participantRepository.findOne({
      where: { chatId: chatId as string, userId: user.id },
    });

    if (!participant || participant.leftAt) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const messageRepository = AppDataSource.getRepository(Message);
    
    let query = messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.repliedMessage', 'repliedMessage')
      .leftJoinAndSelect('repliedMessage.sender', 'repliedSender')
      .where('message.chatId = :chatId', { chatId })
      .orderBy('message.createdAt', 'DESC');

    // If 'before' timestamp is provided, get messages before that time
    if (before) {
      query = query.andWhere('message.createdAt < :before', { before: new Date(before as string) });
    }

    const [messages, total] = await query
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    const formattedMessages = messages.map(message => ({
      id: message.id,
      chatId: message.chatId,
      sender: {
        id: message.sender.id,
        name: message.sender.name,
        profilePicture: message.sender.profilePicture,
      },
      content: message.content,
      type: message.type,
      status: message.status,
      replyTo: message.replyTo ? {
        id: message.repliedMessage?.id,
        content: message.repliedMessage?.content,
        sender: {
          id: message.repliedMessage?.sender?.id,
          name: message.repliedMessage?.sender?.name,
        },
      } : null,
      fileUrl: message.fileUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      thumbnailUrl: message.thumbnailUrl,
  cardPayload: (message as any).cardPayload || null,
      isEdited: message.isEdited,
      editedAt: message.editedAt,
      createdAt: message.createdAt,
    }));

    // Mark messages as read
    await messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ status: MessageStatus.READ })
  .where('chatId = :chatId', { chatId: chatId as string })
      .andWhere('senderId != :userId', { userId: user.id })
      .andWhere('status != :status', { status: MessageStatus.READ })
      .execute();

    // Update participant's unread count and last read timestamp
    await participantRepository.update(
      { chatId: chatId as string, userId: user.id },
      {
        unreadCount: 0,
        lastReadAt: new Date(),
  lastReadMessageId: (messages[0]?.id ?? undefined) as any,
      }
    );

    res.json({
      success: true,
      messages: formattedMessages.reverse(), // Reverse to get chronological order
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// POST /messages - Send a new message (protected route)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
  const { chatId, content, type = 'text', replyTo } = req.body as { chatId: string; content: string; type?: string; replyTo?: string };

    if (!chatId || !content) {
      res.status(400).json({ error: 'Chat ID and content are required' });
      return;
    }

    // Verify user is a participant in the chat
    const participantRepository = AppDataSource.getRepository(ChatParticipant);
    const participant = await participantRepository.findOne({
      where: { chatId: chatId as string, userId: user.id },
    });

    if (!participant || participant.leftAt) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Validate reply message if provided
    if (replyTo) {
      const messageRepository = AppDataSource.getRepository(Message);
      const replyMessage = await messageRepository.findOne({
        where: { id: replyTo as string, chatId: chatId as string },
      });

      if (!replyMessage) {
        res.status(400).json({ error: 'Reply message not found' });
        return;
      }
    }

    const messageRepository = AppDataSource.getRepository(Message);
    const chatRepository = AppDataSource.getRepository(Chat);

    // Create message
    const payload: Partial<Message> = {
      chatId: chatId as string,
      senderId: user.id,
      content: content.trim(),
      type: type as MessageType,
    };
    if (replyTo) payload.replyTo = replyTo as string;
    const message = messageRepository.create(payload);

    await messageRepository.save(message);

    // Update chat's last message timestamp
  await chatRepository.update(chatId as string, {
      lastMessageAt: new Date(),
    });

    // Update unread count for other participants
    await participantRepository
      .createQueryBuilder()
      .update(ChatParticipant)
      .set({ 
        unreadCount: () => 'unread_count + 1',
      })
      .where('chatId = :chatId', { chatId })
      .andWhere('userId != :userId', { userId: user.id })
      .andWhere('leftAt IS NULL')
      .execute();

    // Fetch the complete message with sender info
    const completeMessage = await messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.repliedMessage', 'repliedMessage')
      .leftJoinAndSelect('repliedMessage.sender', 'repliedSender')
      .where('message.id = :messageId', { messageId: message.id })
      .getOne();

    res.status(201).json({
      success: true,
      message: {
        id: completeMessage!.id,
        chatId: completeMessage!.chatId,
        sender: {
          id: completeMessage!.sender.id,
          name: completeMessage!.sender.name,
          profilePicture: completeMessage!.sender.profilePicture,
        },
        content: completeMessage!.content,
        type: completeMessage!.type,
        status: completeMessage!.status,
        replyTo: completeMessage!.replyTo ? {
          id: completeMessage!.repliedMessage?.id,
          content: completeMessage!.repliedMessage?.content,
          sender: {
            id: completeMessage!.repliedMessage?.sender?.id,
            name: completeMessage!.repliedMessage?.sender?.name,
          },
        } : null,
        isEdited: completeMessage!.isEdited,
        createdAt: completeMessage!.createdAt,
      },
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /messages/:messageId - Edit a message (protected route)
router.put('/:messageId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
  const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const messageRepository = AppDataSource.getRepository(Message);
    
    const message = await messageRepository.findOne({
      where: { id: messageId as string },
      relations: ['sender'],
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message.senderId !== user.id) {
      res.status(403).json({ error: 'You can only edit your own messages' });
      return;
    }

    // Update message
  await messageRepository.update(messageId as string, {
      content: content.trim(),
      isEdited: true,
      editedAt: new Date(),
    });

    // Fetch updated message
    const updatedMessage = await messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
  .where('message.id = :messageId', { messageId: messageId as string })
      .getOne();

    res.json({
      success: true,
      message: {
        id: updatedMessage!.id,
        chatId: updatedMessage!.chatId,
        sender: {
          id: updatedMessage!.sender.id,
          name: updatedMessage!.sender.name,
          profilePicture: updatedMessage!.sender.profilePicture,
        },
        content: updatedMessage!.content,
        type: updatedMessage!.type,
        status: updatedMessage!.status,
        isEdited: updatedMessage!.isEdited,
        editedAt: updatedMessage!.editedAt,
        createdAt: updatedMessage!.createdAt,
      },
    });
  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// DELETE /messages/:messageId - Delete a message (protected route)
// DELETE /messages/:messageId - Soft delete + Recently Deleted log (30 days)
router.delete('/:messageId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { messageId } = req.params;
    const messageRepo = AppDataSource.getRepository(Message);
    const recentlyRepo = AppDataSource.getRepository(RecentlyDeleted);

    const msg = await messageRepo.findOne({ where: { id: messageId as string } });
    if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }
    if (msg.senderId !== user.id) { res.status(403).json({ error: 'You can only delete your own messages' }); return; }

    // Mark message as deleted (content cleared for privacy)
    const now = new Date();
    await messageRepo.update(messageId as string, { isDeleted: true, deletedAt: now, content: '' } as any);

    // Insert into RecentlyDeleted with 30-day expiry
    const retentionDays = parseInt(process.env.RECENTLY_DELETED_RETENTION_DAYS || '30', 10);
    const expiryAt = new Date(now.getTime() + retentionDays * 24 * 60 * 60 * 1000);
    const payload = {
      id: msg.id,
      chatId: msg.chatId,
      senderId: msg.senderId,
      type: msg.type,
      content: msg.content,
      fileUrl: msg.fileUrl,
      fileName: msg.fileName,
      fileSize: msg.fileSize,
      thumbnailUrl: msg.thumbnailUrl,
      replyTo: msg.replyTo,
      createdAt: msg.createdAt,
    };
    const rec = recentlyRepo.create({
      itemType: 'message',
      itemId: msg.id,
      userId: user.id,
      chatId: msg.chatId,
      deletedAt: now,
      expiryAt,
      payload,
    });
    await recentlyRepo.save(rec);

    // Emit socket event for deletion state to chat room
    try {
      const io = getIO();
      io.to(msg.chatId).emit('message:deleted', { messageId: msg.id, chatId: msg.chatId, deletedAt: now });
    } catch {}

    res.json({ success: true, expiryAt });
  } catch (e) {
    console.error('Delete message error:', e);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

export default router;

// PATCH /messages/:messageId - Edit content within a time window (protected)
router.patch('/:messageId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const messageId = req.params.messageId as string;
    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }

    const messageRepo = AppDataSource.getRepository(Message);
    const msg = await messageRepo.findOne({ where: { id: messageId } });
    if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }
    if (msg.senderId !== user.id) { res.status(403).json({ error: 'You can only edit your own messages' }); return; }
    if (msg.isDeleted) { res.status(400).json({ error: 'Message is deleted' }); return; }

    const windowMinutes = parseInt(process.env.EDIT_WINDOW_MINUTES || '15', 10);
    const cutoff = new Date(msg.createdAt.getTime() + windowMinutes * 60 * 1000);
    if (new Date() > cutoff) {
      res.status(400).json({ error: 'Edit window expired' });
      return;
    }

    await messageRepo.update(messageId, { content: content.trim(), isEdited: true, editedAt: new Date() } as any);
    const updated = await messageRepo.findOne({ where: { id: messageId } });

    // Emit socket event
    try {
      const io = getIO();
      io.to(updated!.chatId).emit('message:edited', {
        messageId,
        chatId: updated!.chatId,
        content: updated!.content,
        isEdited: true,
        editedAt: updated!.editedAt,
      });
    } catch {}

    res.json({ success: true, message: { id: messageId, content: updated!.content, isEdited: true, editedAt: updated!.editedAt } });
  } catch (e) {
    console.error('Edit message error:', e);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// GET /messages/recently-deleted - list user's items not expired and not permanently deleted
router.get('/recently-deleted', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const repo = AppDataSource.getRepository(RecentlyDeleted);
    const now = new Date();
    const items = await repo.createQueryBuilder('rd')
      .where('rd.user_id = :userId', { userId: user.id })
      .andWhere('rd.permanently_deleted = false')
      .andWhere('rd.expiry_at > :now', { now })
      .orderBy('rd.deleted_at', 'DESC')
      .getMany();
    res.json({ success: true, items });
  } catch (e) {
    console.error('List recently deleted error:', e);
    res.status(500).json({ error: 'Failed to load recently deleted' });
  }
});

// POST /messages/:messageId/restore - restore if within retention window
router.post('/:messageId/restore', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const messageId = req.params.messageId as string;
    const messageRepo = AppDataSource.getRepository(Message);
    const repo = AppDataSource.getRepository(RecentlyDeleted);
    const rd = await repo.findOne({ where: { itemId: messageId, itemType: 'message', userId: user.id, permanentlyDeleted: false } });
    if (!rd) { res.status(404).json({ error: 'Not found in Recently Deleted' }); return; }
    if (new Date(rd.expiryAt) < new Date()) { res.status(400).json({ error: 'Retention period expired' }); return; }

    // Restore message content from payload
    const payload = rd.payload || {};
    await messageRepo.update(messageId, {
      isDeleted: false,
      deletedAt: null as any,
      content: payload.content || '',
      fileUrl: payload.fileUrl || null as any,
      fileName: payload.fileName || null as any,
      fileSize: payload.fileSize || null as any,
      thumbnailUrl: payload.thumbnailUrl || null as any,
    } as any);

    await repo.update(rd.id, { restoredAt: new Date() } as any);

    // Emit socket event
    try {
      const io = getIO();
      io.to(payload.chatId || rd.chatId!).emit('message:restored', {
        messageId,
        chatId: payload.chatId || rd.chatId,
        restoredAt: new Date(),
      });
    } catch {}

    res.json({ success: true });
  } catch (e) {
    console.error('Restore message error:', e);
    res.status(500).json({ error: 'Failed to restore message' });
  }
});

// POST /messages/:messageId/permanent-delete - purge immediately
router.post('/:messageId/permanent-delete', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const messageId = req.params.messageId as string;
    const messageRepo = AppDataSource.getRepository(Message);
    const repo = AppDataSource.getRepository(RecentlyDeleted);
    const msg = await messageRepo.findOne({ where: { id: messageId } });
    if (!msg) { res.status(404).json({ error: 'Message not found' }); return; }
    if (msg.senderId !== user.id) { res.status(403).json({ error: 'Not your message' }); return; }

    await messageRepo.delete(messageId);
    await repo.createQueryBuilder().update(RecentlyDeleted)
      .set({ permanentlyDeleted: true, permanentlyDeletedAt: new Date() } as any)
      .where('item_id = :messageId AND user_id = :userId AND item_type = :type', { messageId, userId: user.id, type: 'message' })
      .execute();

    res.json({ success: true });
  } catch (e) {
    console.error('Permanent delete error:', e);
    res.status(500).json({ error: 'Failed to permanently delete message' });
  }
});
// POST /messages/:messageId/reaction - Add or remove a reaction (protected)
router.post('/:messageId/reaction', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const messageId = req.params.messageId as string;
    const { emoji } = req.body as { emoji?: string };
    if (!emoji || typeof emoji !== 'string' || emoji.length > 32) {
      res.status(400).json({ error: 'Valid emoji is required' });
      return;
    }

    const messageRepo = AppDataSource.getRepository(Message);
    const reactionRepo = AppDataSource.getRepository(MessageReaction);
    const participantRepo = AppDataSource.getRepository(ChatParticipant);

  const message = await messageRepo.findOne({ where: { id: messageId as string } });
    if (!message) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    // Check user is participant of the chat
  const participant = await participantRepo.findOne({ where: { chatId: message.chatId, userId: user.id, leftAt: IsNull() } });
    if (!participant) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Toggle reaction: if exists remove, else add
  const existing = await reactionRepo.findOne({ where: { messageId: messageId as string, userId: user.id, emoji } });
    let action: 'added' | 'removed' = 'added';
    if (existing) {
      await reactionRepo.remove(existing);
      action = 'removed';
    } else {
  const created = reactionRepo.create({ messageId: messageId as string, userId: user.id, emoji });
      await reactionRepo.save(created);
    }

    // Aggregate counts per emoji
  const allForMessage = await reactionRepo.find({ where: { messageId: messageId as string } });
    const counts = allForMessage.reduce<Record<string, number>>((acc, r) => {
      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
      return acc;
    }, {});

    // Emit to chat room
    try {
      const io = getIO();
      io.to(message.chatId).emit('message:reaction', {
        messageId,
        chatId: message.chatId,
        emoji,
        userId: user.id,
        action,
        counts,
      });
    } catch (e) {
      // io not initialized
      console.warn('Socket emit skipped:', e);
    }

    res.json({ success: true, action, counts });
  } catch (error) {
    console.error('Reaction error:', error);
    res.status(500).json({ error: 'Failed to process reaction' });
  }
});
