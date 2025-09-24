import { useEffect, useMemo, useRef, useState } from 'react';
import { socketService } from '../services/socket';

type Receipt = { messageId: string; userId: string; readAt: number };

export function useReadReceipts(chatId?: string, selfUserId?: string) {
  const [readBy, setReadBy] = useState<Record<string, Set<string>>>({}); // messageId -> Set<userId>
  const readyRef = useRef(false);

  useEffect(() => {
    if (!chatId) return;
    const off = socketService.onMessageRead(({ chatId: cid, messageId, userId }) => {
      if (cid !== chatId) return;
      setReadBy((prev) => {
        const next = { ...prev };
        const set = new Set(next[messageId] || []);
        set.add(userId);
        next[messageId] = set;
        return next;
      });
    });
    readyRef.current = true;
    return () => off();
  }, [chatId]);

  const isReadBySomeoneElse = (messageId: string) => {
    const set = readBy[messageId];
    if (!set) return false;
    // Consider read if any participant other than self has read (for group, you can refine)
    if (!selfUserId) return set.size > 0;
    return Array.from(set).some((uid) => uid !== selfUserId);
  };

  const readersFor = (messageId: string) => Array.from(readBy[messageId] || []);

  return { isReady: readyRef.current, isReadBySomeoneElse, readersFor };
}
