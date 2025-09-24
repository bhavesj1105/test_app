import { io, Socket } from 'socket.io-client';
import { Message, User } from '../types';

class SocketService {
  private socket: Socket | null = null;
  private serverUrl = 'http://localhost:5000'; // Replace with your server URL

  connectWithToken(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.serverUrl, {
          transports: ['websocket'],
          auth: { token },
        });

        this.socket.on('connect', () => {
          console.log('Connected to server');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });

  this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('message', (message: Message) => {
      // Handle incoming message
      console.log('New message:', message);
    });

    this.socket.on('user_online', (user: User) => {
      // Handle user coming online
      console.log('User online:', user);
    });

    this.socket.on('user_offline', (userId: string) => {
      // Handle user going offline
      console.log('User offline:', userId);
    });

    // New typing events
    this.socket.on('typing:start', (data: { chatId: string; userId: string }) => {
      console.log('Typing start:', data);
      // Could notify subscribers via callback
      this.onTypingCallbacks.forEach((cb) => cb({ ...data, type: 'start' }));
    });
    this.socket.on('typing:stop', (data: { chatId: string; userId: string }) => {
      console.log('Typing stop:', data);
      this.onTypingCallbacks.forEach((cb) => cb({ ...data, type: 'stop' }));
    });

    // Read receipts
    this.socket.on('message:read', (data: { chatId: string; messageId: string; userId: string; readAt: string | Date }) => {
      this.onReadCallbacks.forEach((cb) => cb(data));
    });

    // Message reactions
    this.socket.on('message:reaction', (data: { chatId: string; messageId: string; emoji: string; userId: string; action: 'added'|'removed'; counts: Record<string, number> }) => {
      this.onReactionCallbacks.forEach((cb) => cb(data));
    });

    // Message edits
    this.socket.on('message:edited', (data: { chatId: string; messageId: string; content: string; isEdited: boolean; editedAt: string }) => {
      this.onEditedCallbacks.forEach((cb) => cb(data));
    });

    // Message deletes
    this.socket.on('message:deleted', (data: { chatId: string; messageId: string; deletedAt: string }) => {
      this.onDeletedCallbacks.forEach((cb) => cb(data));
    });

    // Message restored
    this.socket.on('message:restored', (data: { chatId: string; messageId: string; restoredAt: string }) => {
      this.onRestoredCallbacks.forEach((cb) => cb(data));
    });

    // Chat pin/unpin events
    this.socket.on('chat:pin', (data: { chatId: string; pinned: true; pinnedAt?: string | Date }) => {
      this.onChatPinCallbacks.forEach((cb) => cb({ ...data, event: 'pin' }));
    });
    this.socket.on('chat:unpin', (data: { chatId: string; pinned: false }) => {
      this.onChatPinCallbacks.forEach((cb) => cb({ ...data, event: 'unpin' }));
    });
  }

  // Chat methods
  joinChat(chatId: string): void {
    if (this.socket) {
      this.socket.emit('join-room', chatId);
    }
  }

  leaveChat(chatId: string): void {
    if (this.socket) {
      this.socket.emit('leave-room', chatId);
    }
  }

  sendMessage(message: Omit<Message, 'id' | 'timestamp'>): void {
    if (this.socket) {
      this.socket.emit('send-message', message);
    }
  }

  sendTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing:start', { chatId });
    }
  }

  stopTyping(chatId: string): void {
    if (this.socket) {
      this.socket.emit('typing:stop', { chatId });
    }
  }

  markMessageRead(messageId: string, chatId?: string): void {
    if (this.socket) {
      this.socket.emit('message:read', { messageId, chatId });
    }
  }

  // Simple pub-sub for typing and read updates
  private onTypingCallbacks: Array<(data: { chatId: string; userId: string; type: 'start' | 'stop' }) => void> = [];
  onTyping(cb: (data: { chatId: string; userId: string; type: 'start' | 'stop' }) => void): () => void {
    this.onTypingCallbacks.push(cb);
    return () => {
      this.onTypingCallbacks = this.onTypingCallbacks.filter((c) => c !== cb);
    };
  }

  private onReadCallbacks: Array<(data: { chatId: string; messageId: string; userId: string; readAt: string | Date }) => void> = [];
  onMessageRead(cb: (data: { chatId: string; messageId: string; userId: string; readAt: string | Date }) => void): () => void {
    this.onReadCallbacks.push(cb);
    return () => {
      this.onReadCallbacks = this.onReadCallbacks.filter((c) => c !== cb);
    };
  }

  private onReactionCallbacks: Array<(data: { chatId: string; messageId: string; emoji: string; userId: string; action: 'added'|'removed'; counts: Record<string, number> }) => void> = [];
  onMessageReaction(cb: (data: { chatId: string; messageId: string; emoji: string; userId: string; action: 'added'|'removed'; counts: Record<string, number> }) => void): () => void {
    this.onReactionCallbacks.push(cb);
    return () => {
      this.onReactionCallbacks = this.onReactionCallbacks.filter((c) => c !== cb);
    };
  }

  private onEditedCallbacks: Array<(data: { chatId: string; messageId: string; content: string; isEdited: boolean; editedAt: string }) => void> = [];
  onMessageEdited(cb: (data: { chatId: string; messageId: string; content: string; isEdited: boolean; editedAt: string }) => void): () => void {
    this.onEditedCallbacks.push(cb);
    return () => {
      this.onEditedCallbacks = this.onEditedCallbacks.filter((c) => c !== cb);
    };
  }

  private onDeletedCallbacks: Array<(data: { chatId: string; messageId: string; deletedAt: string }) => void> = [];
  onMessageDeleted(cb: (data: { chatId: string; messageId: string; deletedAt: string }) => void): () => void {
    this.onDeletedCallbacks.push(cb);
    return () => {
      this.onDeletedCallbacks = this.onDeletedCallbacks.filter((c) => c !== cb);
    };
  }

  private onRestoredCallbacks: Array<(data: { chatId: string; messageId: string; restoredAt: string }) => void> = [];
  onMessageRestored(cb: (data: { chatId: string; messageId: string; restoredAt: string }) => void): () => void {
    this.onRestoredCallbacks.push(cb);
    return () => {
      this.onRestoredCallbacks = this.onRestoredCallbacks.filter((c) => c !== cb);
    };
  }

  // Chat pin pub-sub
  private onChatPinCallbacks: Array<(data: { chatId: string; pinned: boolean; pinnedAt?: string | Date; event: 'pin' | 'unpin' }) => void> = [];
  onChatPinChange(cb: (data: { chatId: string; pinned: boolean; pinnedAt?: string | Date; event: 'pin' | 'unpin' }) => void): () => void {
    this.onChatPinCallbacks.push(cb);
    return () => {
      this.onChatPinCallbacks = this.onChatPinCallbacks.filter((c) => c !== cb);
    };
  }

  // Call methods
  sendCallInit(payload: { calleeId: string; callId: string; isVideo: boolean; metadata?: any }): void {
    if (this.socket) {
      this.socket.emit('call:init', payload);
    }
  }

  sendCallSignal(payload: { toUserId?: string; calleeId?: string; callId: string; type: 'offer'|'answer'|'candidate'; data: any }): void {
    if (this.socket) {
      this.socket.emit('call:signal', payload);
    }
  }

  initiateCall(targetUserId: string, isVideo: boolean): void {
    if (this.socket) {
      this.socket.emit('call-user', { targetUserId, isVideo });
    }
  }

  answerCall(callId: string): void {
    if (this.socket) {
      this.socket.emit('answer-call', { callId });
    }
  }

  rejectCall(callId: string): void {
    if (this.socket) {
      this.socket.emit('reject-call', { callId });
    }
  }

  endCall(callId: string): void {
    if (this.socket) {
      this.socket.emit('end-call', { callId });
    }
  }

  // WebRTC signaling
  sendOffer(targetUserId: string, offer: any): void {
    if (this.socket) {
      this.socket.emit('webrtc-offer', { targetUserId, offer });
    }
  }

  sendAnswer(targetUserId: string, answer: any): void {
    if (this.socket) {
      this.socket.emit('webrtc-answer', { targetUserId, answer });
    }
  }

  sendIceCandidate(targetUserId: string, candidate: any): void {
    if (this.socket) {
      this.socket.emit('webrtc-ice-candidate', { targetUserId, candidate });
    }
  }

  // Event listeners for external use
  onMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  onUserOnline(callback: (user: User) => void): void {
    if (this.socket) {
      this.socket.on('user_online', callback);
    }
  }

  onUserOffline(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('user_offline', callback);
    }
  }

  onIncomingCall(callback: (callData: any) => void): void {
    if (this.socket) {
      this.socket.on('incoming-call', callback);
      this.socket.on('incoming:call', callback);
    }
  }

  onCallSignal(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('call:signal', callback);
    }
  }

  onCallInitiated(callback: (data: { callId: string }) => void): void {
    if (this.socket) {
      this.socket.on('call:initiated', callback);
    }
  }

  onWebRTCOffer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('webrtc-offer', callback);
    }
  }

  onWebRTCAnswer(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('webrtc-answer', callback);
    }
  }

  onWebRTCIceCandidate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('webrtc-ice-candidate', callback);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();

// Optional helper to bootstrap socket connection with stored token
export async function ensureSocketConnected(getToken: () => Promise<string | null>) {
  if (socketService.isConnected()) return;
  const token = await getToken();
  if (token) {
    try {
      await socketService.connectWithToken(token);
    } catch (e) {
      console.warn('Socket connect failed', e);
    }
  }
}
