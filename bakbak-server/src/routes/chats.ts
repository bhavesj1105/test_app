import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Chat, ChatParticipant, User, ChatType, ParticipantRole, ChatPin } from '../entities';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getIO } from '../services/io';

const router = Router();

// GET /chats - Get user's chats (protected route)
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    const chatRepository = AppDataSource.getRepository(Chat);
    
    // Get chats where user is a participant
    const [chats, total] = await chatRepository
      .createQueryBuilder('chat')
      .innerJoin('chat.chatParticipants', 'participant')
      .leftJoinAndSelect('chat.chatParticipants', 'allParticipants')
      .leftJoinAndSelect('allParticipants.user', 'participantUser')
      .leftJoinAndSelect('chat.messages', 'lastMessage')
      .where('participant.userId = :userId', { userId: user.id })
      .andWhere('participant.leftAt IS NULL')
      .orderBy('chat.lastMessageAt', 'DESC')
      .addOrderBy('lastMessage.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Load pinned chat ids for this user
    const pinRepository = AppDataSource.getRepository(ChatPin);
    const pins = await pinRepository.find({ where: { userId: user.id } });
    const pinnedSet = new Set(pins.map((p) => p.chatId));

    const formattedChats = chats.map(chat => {
      const otherParticipants = chat.chatParticipants
        .filter(p => p.userId !== user.id)
        .map(p => ({
          id: p.user.id,
          name: p.user.name,
          profilePicture: p.user.profilePicture,
          isOnline: p.user.isOnline,
          lastSeen: p.user.lastSeen,
        }));

      const lastMessage = chat.messages?.[0];
      const currentUserParticipant = chat.chatParticipants.find(p => p.userId === user.id);

      return {
        id: chat.id,
        type: chat.type,
        groupName: chat.groupName,
        groupDescription: chat.groupDescription,
        groupAvatar: chat.groupAvatar,
        participants: otherParticipants,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          type: lastMessage.type,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        } : null,
        unreadCount: currentUserParticipant?.unreadCount || 0,
        lastMessageAt: chat.lastMessageAt,
        createdAt: chat.createdAt,
        pinned: pinnedSet.has(chat.id),
      };
    });

    // Reorder: pinned first, then by lastMessageAt desc (already roughly sorted)
    formattedChats.sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });

    res.json({
      success: true,
      chats: formattedChats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// POST /chats - Create a new chat (protected route)
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { participantIds, type = 'direct', groupName, groupDescription } = req.body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      res.status(400).json({ error: 'Participant IDs are required' });
      return;
    }

    if (type === 'group' && !groupName) {
      res.status(400).json({ error: 'Group name is required for group chats' });
      return;
    }

    if (type === 'direct' && participantIds.length !== 1) {
      res.status(400).json({ error: 'Direct chats must have exactly one other participant' });
      return;
    }

    const userRepository = AppDataSource.getRepository(User);
    const chatRepository = AppDataSource.getRepository(Chat);
    const participantRepository = AppDataSource.getRepository(ChatParticipant);

    // Verify all participants exist
    const participants = await userRepository.findByIds([user.id, ...participantIds]);
    if (participants.length !== participantIds.length + 1) {
      res.status(400).json({ error: 'One or more participants not found' });
      return;
    }

    // For direct chats, check if chat already exists
    if (type === 'direct') {
      const existingChat = await chatRepository
        .createQueryBuilder('chat')
        .innerJoin('chat.chatParticipants', 'p1')
        .innerJoin('chat.chatParticipants', 'p2')
        .where('chat.type = :type', { type: 'direct' })
        .andWhere('p1.userId = :userId1 AND p2.userId = :userId2', {
          userId1: user.id,
          userId2: participantIds[0],
        })
        .getOne();

      if (existingChat) {
        res.status(400).json({ error: 'Direct chat already exists between these users' });
        return;
      }
    }

    // Create chat
    const chat = chatRepository.create({
      type: type as ChatType,
      groupName: type === 'group' ? groupName : undefined,
      groupDescription: type === 'group' ? groupDescription : undefined,
      createdBy: user.id,
    });

    await chatRepository.save(chat);

    // Add participants
    const chatParticipants = participants.map(participant =>
      participantRepository.create({
        chatId: chat.id,
        userId: participant.id,
        role: participant.id === user.id ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
      })
    );

    await participantRepository.save(chatParticipants);

    res.status(201).json({
      success: true,
      chat: {
        id: chat.id,
        type: chat.type,
        groupName: chat.groupName,
        groupDescription: chat.groupDescription,
        participants: participants.filter(p => p.id !== user.id).map(p => ({
          id: p.id,
          name: p.name,
          profilePicture: p.profilePicture,
          isOnline: p.isOnline,
        })),
        createdAt: chat.createdAt,
      },
    });
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// GET /chats/:chatId - Get specific chat details (protected route)
router.get('/:chatId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { chatId } = req.params;

    const chatRepository = AppDataSource.getRepository(Chat);
    
    const chat = await chatRepository
      .createQueryBuilder('chat')
      .leftJoinAndSelect('chat.chatParticipants', 'participants')
      .leftJoinAndSelect('participants.user', 'participantUser')
      .where('chat.id = :chatId', { chatId })
      .getOne();

    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Check if user is a participant
    const isParticipant = chat.chatParticipants.some(p => p.userId === user.id && !p.leftAt);
    if (!isParticipant) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const otherParticipants = chat.chatParticipants
      .filter(p => p.userId !== user.id && !p.leftAt)
      .map(p => ({
        id: p.user.id,
        name: p.user.name,
        profilePicture: p.user.profilePicture,
        isOnline: p.user.isOnline,
        lastSeen: p.user.lastSeen,
      }));

    res.json({
      success: true,
      chat: {
        id: chat.id,
        type: chat.type,
        groupName: chat.groupName,
        groupDescription: chat.groupDescription,
        groupAvatar: chat.groupAvatar,
        participants: otherParticipants,
        createdAt: chat.createdAt,
        lastMessageAt: chat.lastMessageAt,
      },
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

export default router;

// Pin a chat for current user
router.post('/:chatId/pin', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
  const { chatId: chatIdParam } = req.params;
  const chatId = String(chatIdParam);
    const user = req.user!;

    const chatRepo = AppDataSource.getRepository(Chat);
    const pinRepo = AppDataSource.getRepository(ChatPin);

  const chat = await chatRepo.findOne({ where: { id: chatId } as any });
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    // Ensure user is participant
  const isParticipant = await AppDataSource.getRepository(ChatParticipant).count({ where: { chatId: chatId as any, userId: user.id } });
    if (!isParticipant) {
      res.status(403).json({ error: 'Not a participant' });
      return;
    }

  const existing = await pinRepo.findOne({ where: { chatId: chatId as any, userId: user.id } });
    if (existing) {
      // Emit event to user's room anyway to sync other sessions
      try { getIO().to(user.id).emit('chat:pin', { chatId, pinned: true, pinnedAt: existing.pinnedAt }); } catch {}
      res.json({ success: true, pinned: true, pinnedAt: existing.pinnedAt });
      return;
    }

  const pin = pinRepo.create({ chatId, userId: user.id } as any) as unknown as ChatPin;
    await pinRepo.save(pin);
    // Notify the pinning user's active sessions (they join personal room user.id)
    try { getIO().to(user.id).emit('chat:pin', { chatId, pinned: true, pinnedAt: pin.pinnedAt }); } catch {}
    res.status(201).json({ success: true, pinned: true, pinnedAt: pin.pinnedAt });
  } catch (err) {
    console.error('Pin chat error:', err);
    res.status(500).json({ error: 'Failed to pin chat' });
  }
});

// Unpin a chat for current user
router.delete('/:chatId/pin', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
  const { chatId: chatIdParam } = req.params;
  const chatId = String(chatIdParam);
    const user = req.user!;
    const pinRepo = AppDataSource.getRepository(ChatPin);
  const existing = await pinRepo.findOne({ where: { chatId: chatId as any, userId: user.id } });
    if (!existing) {
      // Emit event to ensure other sessions unpin
      try { getIO().to(user.id).emit('chat:unpin', { chatId, pinned: false }); } catch {}
      res.json({ success: true, pinned: false });
      return;
    }
    await pinRepo.remove(existing);
    try { getIO().to(user.id).emit('chat:unpin', { chatId, pinned: false }); } catch {}
    res.json({ success: true, pinned: false });
  } catch (err) {
    console.error('Unpin chat error:', err);
    res.status(500).json({ error: 'Failed to unpin chat' });
  }
});
