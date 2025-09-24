import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { socketService } from '../services/socket';

type TypingUser = {
  userId: string;
  lastSeen: number;
};

export function useTyping(chatId: string | undefined, selfUserId?: string) {
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastInputAtRef = useRef<number>(0);

  // Cleanup remote typing users that have not sent stop within 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers((prev) => {
        const next: Record<string, TypingUser> = {};
        let changed = false;
        for (const [uid, info] of Object.entries(prev)) {
          if (now - info.lastSeen < 2500) {
            next[uid] = info;
          } else {
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to socket typing events
  useEffect(() => {
    if (!chatId) return;
    const off = socketService.onTyping((data) => {
      if (data.chatId !== chatId) return;
      if (data.userId === selfUserId) return; // ignore self echoes if any
      setTypingUsers((prev) => {
        const copy = { ...prev };
        if (data.type === 'start') {
          copy[data.userId] = { userId: data.userId, lastSeen: Date.now() };
        } else {
          delete copy[data.userId];
        }
        return copy;
      });
    });
    return () => off();
  }, [chatId, selfUserId]);

  const onInputChange = useCallback(() => {
    if (!chatId) return;
    const now = Date.now();
    lastInputAtRef.current = now;
    socketService.sendTyping(chatId);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // After 1.2s of inactivity, emit stop
    timerRef.current = setTimeout(() => {
      // Only stop if no input since timer scheduled
      if (Date.now() - lastInputAtRef.current >= 1200) {
        socketService.stopTyping(chatId);
      }
    }, 1200);
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isSomeoneTyping = useMemo(() => Object.keys(typingUsers).length > 0, [typingUsers]);
  const usersTyping = useMemo(() => Object.keys(typingUsers), [typingUsers]);

  return {
    onInputChange,
    isSomeoneTyping,
    usersTyping,
  };
}
