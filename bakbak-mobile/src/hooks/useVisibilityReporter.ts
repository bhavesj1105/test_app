import { useCallback, useEffect, useRef } from 'react';
import { socketService } from '../services/socket';

type Options = {
  chatId?: string;
  minVisiblePercent?: number; // default 50%
  debounceMs?: number; // default 100ms
};

// Tracks which messageIds we've already reported as read in this session
const reported = new Set<string>();

export function useVisibilityReporter(opts: Options = {}) {
  const { chatId, minVisiblePercent = 0.5, debounceMs = 100 } = opts;
  const pendingRef = useRef<Map<string, number>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!chatId) return;
    const now = Date.now();
    const toSend: string[] = [];
    pendingRef.current.forEach((t, id) => {
      if (now - t >= debounceMs) {
        toSend.push(id);
        pendingRef.current.delete(id);
      }
    });
    toSend.forEach((messageId) => {
      if (!reported.has(messageId)) {
        socketService.markMessageRead(messageId, chatId);
        reported.add(messageId);
      }
    });
  }, [chatId, debounceMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onViewableItemsChanged = useCallback(
    (info: { viewableItems: Array<{ key?: string; item?: any; index?: number; isViewable: boolean; }
      >; changed: Array<{ key?: string; item?: any; index?: number; isViewable: boolean; }>; }) => {
      if (!chatId) return;
      const now = Date.now();
      for (const v of info.viewableItems) {
        if (!v.isViewable) continue;
        const item = v.item as { id: string; visibilityPercent?: number } | undefined;
        const messageId = item?.id || v.key;
        if (!messageId) continue;
        const visible = (item?.visibilityPercent ?? 1) >= minVisiblePercent;
        if (visible) {
          pendingRef.current.set(messageId, now);
        }
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, debounceMs);
    },
    [chatId, minVisiblePercent, debounceMs, flush]
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: Math.round(minVisiblePercent * 100) } as const;

  return { onViewableItemsChanged, viewabilityConfig };
}
