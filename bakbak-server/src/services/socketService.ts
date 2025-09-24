import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../config/database';
import { IsNull } from 'typeorm';
import { User, Message, Chat, ChatParticipant, MessageType, MessageStatus } from '../entities';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: User;
}

interface MessageData {
  chatId: string;
  content: string;
  type?: MessageType;
  replyTo?: string;
  effects?: { type: string; params?: any };
}

interface TypingData {
  chatId: string;
  isTyping: boolean;
}

interface CallData {
  targetUserId: string;
  isVideo: boolean;
  callId?: string;
}

interface WebRTCSignalingData {
  targetUserId: string;
  offer?: any;
  answer?: any;
  candidate?: any;
}

export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private userSockets: Map<string, string> = new Map(); // socketId -> userId

  constructor(io: Server) {
    this.io = io;
    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Accept JWT from auth token, Authorization header, or query param
        const token = socket.handshake.auth.token
          || (socket.handshake.headers.authorization?.replace('Bearer ', ''))
          || (socket.handshake.query?.token as string | undefined);
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          return next(new Error('JWT secret not configured'));
        }

        const decoded = jwt.verify(token, jwtSecret) as { userId: string };
        
        const userRepository = AppDataSource.getRepository(User);
        const user = await userRepository.findOne({
          where: { id: decoded.userId },
        });

        if (!user) {
          return next(new Error('Invalid token'));
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupConnectionHandlers(): void {
  this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔗 User connected: ${socket.user?.name} (${socket.id})`);
      this.handleConnection(socket);
      this.setupEventHandlers(socket);
    });
  }

  private async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId || !socket.user) return;

    // Update user online status
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.update(socket.userId, {
      isOnline: true,
      socketId: socket.id,
    } as any);

  // Store connection mapping
    this.connectedUsers.set(socket.userId, socket.id);
    this.userSockets.set(socket.id, socket.userId);

  // Join personal room by userId for direct emits
  socket.join(socket.userId);

    // Join user to their chat rooms
    await this.joinUserChatRooms(socket);

    // Notify contacts that user is online
    this.notifyUserOnline(socket.userId);
  }

  private async handleDisconnection(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    console.log(`🔌 User disconnected: ${socket.user?.name} (${socket.id})`);

    // Update user offline status
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.update(socket.userId, {
      isOnline: false,
      lastSeen: new Date(),
      // cast any to bypass exact optional check
      socketId: null as any,
    } as any);

    // Remove connection mapping
    this.connectedUsers.delete(socket.userId);
    this.userSockets.delete(socket.id);

    // Notify contacts that user is offline
    this.notifyUserOffline(socket.userId);
  }

  private setupEventHandlers(socket: AuthenticatedSocket): void {
  // Chat events
  socket.on('join-room', (chatId: string) => this.handleJoinRoom(socket, chatId));
  socket.on('leave-room', (chatId: string) => this.handleLeaveRoom(socket, chatId));
  socket.on('message:send', (data: any) => this.handleMessageSendCompat(socket, data));
  socket.on('send-message', (data: MessageData) => this.handleSendMessage(socket, data));
  socket.on('typing', (data: TypingData) => this.handleTyping(socket, data)); // legacy
  socket.on('typing:start', (data: { chatId: string }) => this.handleTypingStart(socket, data.chatId));
  socket.on('typing:stop', (data: { chatId: string }) => this.handleTypingStop(socket, data.chatId));
  socket.on('message-read', (messageId: string) => this.handleMessageRead(socket, messageId)); // legacy
  socket.on('message:read', (data: { messageId: string; chatId?: string }) => this.handleMessageReadV2(socket, data));

  // Call events (new names + legacy)
  socket.on('call:init', (data: any) => this.handleCallInit(socket, data));
  socket.on('call:signal', (data: any) => this.handleCallSignal(socket, data));
  socket.on('call-user', (data: CallData) => this.handleCallUser(socket, data));
    socket.on('answer-call', (callId: string) => this.handleAnswerCall(socket, callId));
    socket.on('reject-call', (callId: string) => this.handleRejectCall(socket, callId));
    socket.on('end-call', (callId: string) => this.handleEndCall(socket, callId));

    // WebRTC signaling events
  socket.on('webrtc-offer', (data: WebRTCSignalingData) => this.handleWebRTCOffer(socket, data));
  socket.on('webrtc-answer', (data: WebRTCSignalingData) => this.handleWebRTCAnswer(socket, data));
  socket.on('webrtc-ice-candidate', (data: WebRTCSignalingData) => this.handleWebRTCIceCandidate(socket, data));

    // Connection events
    socket.on('disconnect', () => this.handleDisconnection(socket));
  }

  private async joinUserChatRooms(socket: AuthenticatedSocket): Promise<void> {
    if (!socket.userId) return;

    try {
      const participantRepository = AppDataSource.getRepository(ChatParticipant);
      const userChats = await participantRepository.find({
        where: { userId: socket.userId, leftAt: IsNull() },
        select: ['chatId'],
      });

      userChats.forEach(participant => {
        socket.join(participant.chatId);
      });
    } catch (error) {
      console.error('Error joining chat rooms:', error);
    }
  }

  private handleJoinRoom(socket: AuthenticatedSocket, chatId: string): void {
    socket.join(chatId);
    socket.to(chatId).emit('user-joined', {
      userId: socket.userId,
      username: socket.user?.name,
    });
  }

  private handleLeaveRoom(socket: AuthenticatedSocket, chatId: string): void {
    socket.leave(chatId);
    socket.to(chatId).emit('user-left', {
      userId: socket.userId,
      username: socket.user?.name,
    });
  }

  private handleTypingStart(socket: AuthenticatedSocket, chatId: string): void {
    if (!socket.userId) return;
    socket.to(chatId).emit('typing:start', { chatId, userId: socket.userId });
  }

  private handleTypingStop(socket: AuthenticatedSocket, chatId: string): void {
    if (!socket.userId) return;
    socket.to(chatId).emit('typing:stop', { chatId, userId: socket.userId });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: MessageData): Promise<void> {
    if (!socket.userId) return;

    try {
      // Verify user is participant in chat
      const participantRepository = AppDataSource.getRepository(ChatParticipant);
      const participant = await participantRepository.findOne({
        where: { chatId: data.chatId, userId: socket.userId, leftAt: IsNull() },
      });

      if (!participant) {
        socket.emit('error', { message: 'Access denied to chat' });
        return;
      }

      // Create and save message
      const messageRepository = AppDataSource.getRepository(Message);
      const msgPayload: Partial<Message> = {
        chatId: data.chatId,
        senderId: socket.userId,
        content: data.content.trim(),
        type: data.type || MessageType.TEXT,
      };
      if (data.effects) {
        (msgPayload as any).effects = data.effects;
      }
      if (data.replyTo) msgPayload.replyTo = data.replyTo;
      const message = messageRepository.create(msgPayload);

      await messageRepository.save(message);

      // Update chat's last message timestamp
      const chatRepository = AppDataSource.getRepository(Chat);
      await chatRepository.update(data.chatId, {
        lastMessageAt: new Date(),
      });

      // Update unread counts for other participants
      await participantRepository
        .createQueryBuilder()
        .update(ChatParticipant)
        .set({ unreadCount: () => 'unread_count + 1' })
        .where('chatId = :chatId', { chatId: data.chatId })
        .andWhere('userId != :userId', { userId: socket.userId })
        .andWhere('leftAt IS NULL')
        .execute();

      // Fetch complete message with sender info
  const completeMessage = await messageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoinAndSelect('message.repliedMessage', 'repliedMessage')
        .leftJoinAndSelect('repliedMessage.sender', 'repliedSender')
        .where('message.id = :messageId', { messageId: message.id })
        .getOne();

      const messagePayload = {
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
  cardPayload: (completeMessage as any).cardPayload || null,
        replyTo: completeMessage!.replyTo ? {
          id: completeMessage!.repliedMessage?.id,
          content: completeMessage!.repliedMessage?.content,
          sender: {
            id: completeMessage!.repliedMessage?.sender?.id,
            name: completeMessage!.repliedMessage?.sender?.name,
          },
        } : null,
        createdAt: completeMessage!.createdAt,
    effects: completeMessage!.effects || null,
      };

      // Emit message to chat room and directly to involved users
      this.io.to(data.chatId).emit('new-message', messagePayload);
      // New event name to match mobile client requirement
      this.io.to(data.chatId).emit('message:receive', {
        id: messagePayload.id,
        chatId: messagePayload.chatId,
        senderId: messagePayload.sender.id,
        content: messagePayload.content,
        type: messagePayload.type,
        createdAt: new Date(messagePayload.createdAt).toISOString(),
  cardPayload: (messagePayload as any).cardPayload || undefined,
    effects: messagePayload.effects || undefined,
      });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Compatibility layer for new payload { toUserId, chatId, content, type }
  private async handleMessageSendCompat(socket: AuthenticatedSocket, data: any): Promise<void> {
    const mapped: MessageData = {
      chatId: data.chatId,
      content: data.content,
      type: data.type as any,
    };
    return this.handleSendMessage(socket, mapped);
  }

  private handleTyping(socket: AuthenticatedSocket, data: TypingData): void {
    if (!socket.userId) return;

    socket.to(data.chatId).emit('user-typing', {
      userId: socket.userId,
      username: socket.user?.name,
      isTyping: data.isTyping,
    });
  }

  private async handleMessageRead(socket: AuthenticatedSocket, messageId: string): Promise<void> {
    if (!socket.userId) return;

    try {
      const messageRepository = AppDataSource.getRepository(Message);
      const message = await messageRepository.findOne({ where: { id: messageId } });
      if (!message) return;
      const chatId = message.chatId;
      const readBy = new Set<string>(message.readBy || []);
      readBy.add(socket.userId);
      await messageRepository.update(messageId, {
        readBy: Array.from(readBy),
        status: MessageStatus.READ,
      } as any);
      // Broadcast to chat room
      this.io.to(chatId).emit('message:read', { chatId, messageId, userId: socket.userId, readAt: new Date() });
    } catch (error) {
      console.error('Message read error:', error);
    }
  }

  private async handleMessageReadV2(socket: AuthenticatedSocket, data: { messageId: string; chatId?: string }): Promise<void> {
    if (!socket.userId) return;
    const { messageId, chatId } = data;
    try {
      const messageRepository = AppDataSource.getRepository(Message);
      const message = await messageRepository.findOne({ where: { id: messageId } });
      if (!message) return;
      const resolvedChatId = chatId || message.chatId;
      const readBy = new Set<string>(message.readBy || []);
      readBy.add(socket.userId);
      await messageRepository.update(messageId, {
        readBy: Array.from(readBy),
        status: MessageStatus.READ,
      } as any);
      this.io.to(resolvedChatId).emit('message:read', { chatId: resolvedChatId, messageId, userId: socket.userId, readAt: new Date() });
    } catch (e) {
      console.error('message:read error', e);
    }
  }

  // Call handling methods
  private handleCallUser(socket: AuthenticatedSocket, data: CallData): void {
    const targetSocketId = this.connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      this.io.to(targetSocketId).emit('incoming-call', {
        callId,
        callerId: socket.userId,
        callerName: socket.user?.name,
        isVideo: data.isVideo,
      });

      // New event name for mobile client
      this.io.to(targetSocketId).emit('incoming:call', {
        callId,
        fromUserId: socket.userId,
        isVideo: data.isVideo,
        metadata: { callerName: socket.user?.name },
      });

      socket.emit('call-initiated', { callId });
    } else {
      socket.emit('call-failed', { error: 'User not available' });
    }
  }

  // New call:init handler
  private handleCallInit(socket: AuthenticatedSocket, data: { toUserId?: string; calleeId?: string; chatId?: string; isVideo: boolean; metadata?: any; callId?: string }): void {
    const targetId = data.toUserId || data.calleeId;
    if (!targetId) {
      socket.emit('call:failed', { error: 'Missing callee id' });
      return;
    }
    const targetSocketId = this.connectedUsers.get(targetId);
    if (targetSocketId) {
      const callId = data.callId || `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      this.io.to(targetSocketId).emit('incoming:call', {
        callId,
        fromUserId: socket.userId,
        isVideo: data.isVideo,
        metadata: data.metadata,
      });
      socket.emit('call:initiated', { callId });
    } else {
      socket.emit('call:failed', { error: 'User not available' });
    }
  }

  // New call:signal handler
  private handleCallSignal(socket: AuthenticatedSocket, data: { toUserId?: string; calleeId?: string; callId: string; type: 'offer'|'answer'|'candidate'; data: any }): void {
    const targetId = data.toUserId || data.calleeId;
    if (!targetId) return;
    const targetSocketId = this.connectedUsers.get(targetId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('call:signal', {
        fromUserId: socket.userId,
        callId: data.callId,
        type: data.type,
        data: data.data,
      });
    }
  }

  private handleAnswerCall(socket: AuthenticatedSocket, callId: string): void {
    // Notify caller that call was answered
    socket.broadcast.emit('call-answered', { callId, answeredBy: socket.userId });
  }

  private handleRejectCall(socket: AuthenticatedSocket, callId: string): void {
    // Notify caller that call was rejected
    socket.broadcast.emit('call-rejected', { callId, rejectedBy: socket.userId });
  }

  private handleEndCall(socket: AuthenticatedSocket, callId: string): void {
    // Notify all participants that call ended
    socket.broadcast.emit('call-ended', { callId, endedBy: socket.userId });
  }

  // WebRTC signaling methods
  private handleWebRTCOffer(socket: AuthenticatedSocket, data: WebRTCSignalingData): void {
    const targetSocketId = this.connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-offer', {
        fromUserId: socket.userId,
        offer: data.offer,
      });
    }
  }

  private handleWebRTCAnswer(socket: AuthenticatedSocket, data: WebRTCSignalingData): void {
    const targetSocketId = this.connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-answer', {
        fromUserId: socket.userId,
        answer: data.answer,
      });
    }
  }

  private handleWebRTCIceCandidate(socket: AuthenticatedSocket, data: WebRTCSignalingData): void {
    const targetSocketId = this.connectedUsers.get(data.targetUserId);
    if (targetSocketId) {
      this.io.to(targetSocketId).emit('webrtc-ice-candidate', {
        fromUserId: socket.userId,
        candidate: data.candidate,
      });
    }
  }

  private notifyUserOnline(userId: string): void {
    // Notify contacts about user coming online
    this.io.emit('user-online', { userId, timestamp: new Date() });
  }

  private notifyUserOffline(userId: string): void {
    // Notify contacts about user going offline
    this.io.emit('user-offline', { userId, timestamp: new Date() });
  }

  // Public methods for external use
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public sendToUser(userId: string, event: string, data: any): boolean {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }
}
