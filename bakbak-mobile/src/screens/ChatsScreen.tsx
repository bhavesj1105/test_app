import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  LightGlassCard, 
  MediumGlassCard,
  GlassButton 
} from '../components/GlassCard';
import { theme } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';
import { getChats as getChatsApi, pinChat as pinChatApi, unpinChat as unpinChatApi } from '../api/chats';
import { socketService } from '../services/socket';

const { width } = Dimensions.get('window');

// Mock data for chat list (fallback)
const mockChats = [
  {
    id: 1,
    name: 'Sarah ✨',
    lastMessage: 'girl that outfit is SERVING 💅',
    timestamp: '2m',
    avatar: 'https://i.pravatar.cc/150?img=1',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 2,
    name: 'Alex 🌟',
    lastMessage: 'the tea is piping hot bestie ☕',
    timestamp: '15m',
    avatar: 'https://i.pravatar.cc/150?img=2',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 3,
    name: 'Jordan 💫',
    lastMessage: 'periodt no cap 🧢',
    timestamp: '1h',
    avatar: 'https://i.pravatar.cc/150?img=3',
    unreadCount: 5,
    isOnline: false,
  },
  {
    id: 4,
    name: 'Maya 🦋',
    lastMessage: 'living my best life rn fr 🌈',
    timestamp: '3h',
    avatar: 'https://i.pravatar.cc/150?img=4',
    unreadCount: 0,
    isOnline: true,
  },
  {
    id: 5,
    name: 'Riley 🎭',
    lastMessage: 'this is such a vibe check ✅',
    timestamp: '5h',
    avatar: 'https://i.pravatar.cc/150?img=5',
    unreadCount: 1,
    isOnline: false,
  },
  {
    id: 6,
    name: 'Casey 🚀',
    lastMessage: 'main character energy activated',
    timestamp: '1d',
    avatar: 'https://i.pravatar.cc/150?img=6',
    unreadCount: 0,
    isOnline: false,
  },
];

interface Chat {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: string; // human display, optional when fed from server
  avatar: string;
  unreadCount: number;
  isOnline: boolean;
  pinned?: boolean;
  lastMessageAt?: number; // epoch ms for stable sorting (server)
}

export const ChatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const baseUrl = 'http://localhost:5000';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = await SecureStore.getItemAsync('authToken');
        if (!token) throw new Error('no-auth');
        const data = await getChatsApi({ baseUrl, token, page: 1, limit: 50 });
        const mapped: Chat[] = (data.chats || []).map((c: any) => {
          const other = (c.participants && c.participants[0]) || {};
          const lastMsg = c.lastMessage || null;
          return {
            id: c.id,
            name: c.type === 'group' ? (c.groupName || c.title || 'Group') : (other.name || 'Contact'),
            avatar: c.type === 'group' ? (c.groupAvatar || 'https://i.pravatar.cc/150?img=9') : (other.profilePicture || 'https://i.pravatar.cc/150?img=10'),
            lastMessage: lastMsg ? (lastMsg.content || '') : '',
            timestamp: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString() : '',
            unreadCount: c.unreadCount || 0,
            isOnline: !!other.isOnline,
            pinned: !!c.pinned,
            lastMessageAt: c.lastMessageAt ? Date.parse(c.lastMessageAt) : 0,
          } as Chat;
        });
        setChats(mapped);
      } catch (e) {
        // Fallback to mock if unauth or error
        setChats(mockChats);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const off = socketService.onChatPinChange(({ chatId, pinned }) => {
      setChats((prev) => prev.map((c) => String(c.id) === String(chatId) ? { ...c, pinned } : c));
    });
    return () => off();
  }, []);

  const sortedChats = useMemo(() => {
    const byName = chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return byName.sort((a, b) => {
      if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) return a.pinned ? -1 : 1;
      const at = a.lastMessageAt ?? 0;
      const bt = b.lastMessageAt ?? 0;
      return bt - at;
    });
  }, [chats, searchQuery]);

  const hasPinned = useMemo(() => sortedChats.some(c => c.pinned), [sortedChats]);

  const pinAnim = useRef(new Map<number, { scale: any; opacity: any }>()).current;
  const ensureAnim = (id: number) => {
    if (!pinAnim.has(id)) {
      const { Animated } = require('react-native');
      pinAnim.set(id, { scale: new Animated.Value(1), opacity: new Animated.Value(1) });
    }
    return pinAnim.get(id)!;
  };

  const togglePin = async (id: number) => {
    // optimistic UI
    setChats(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
    const a = ensureAnim(id);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(a.scale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.timing(a.scale, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(a.opacity, { toValue: 0.7, duration: 120, useNativeDriver: true }),
        Animated.timing(a.opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
      ]),
    ]).start();
    try {
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) return;
      const chat = chats.find(c => c.id === id);
      if (!chat) return;
      if (chat.pinned) {
        await pinChatApi({ baseUrl, token, chatId: String(id) });
      } else {
        await unpinChatApi({ baseUrl, token, chatId: String(id) });
      }
    } catch (e) {
      // revert on failure
      setChats(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));
    }
  };

  const filteredChats = mockChats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChatItem = ({ item }: { item: Chat }) => (
    <TouchableOpacity
      onPress={() => (navigation.getParent() as any)?.navigate('ChatScreen', { 
        chatId: item.id,
        contactName: item.name,
        contactAvatar: item.avatar,
        isOnline: item.isOnline,
        contactPosterUrl: undefined,
        contactPosterColors: theme.colors.primary.gradient,
      })}
    >
      <LightGlassCard 
        style={[styles.chatCard, ...(item.pinned ? [styles.pinnedCard] : [])]} 
        elevation={3} 
        borderRadius={16}
      >
        <View style={styles.chatContent}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: item.avatar }} 
              style={styles.avatar}
            />
            {item.isOnline && <View style={styles.onlineIndicator} />}
          </View>

          {/* Chat Info */}
          <View style={styles.chatInfo}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.pinned && <Text style={styles.pinnedBadge}>Pinned</Text>}
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>

          {/* Timestamp and Badge */}
          <View style={styles.chatMeta}>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => togglePin(item.id)} accessibilityRole="button" style={styles.pinBtn}>
              <Animated.View style={{ transform: [{ scale: ensureAnim(item.id).scale }], opacity: ensureAnim(item.id).opacity }}>
                <Ionicons name={item.pinned ? 'pin' : 'pin-outline'} size={18} color={item.pinned ? theme.colors.primary.start : theme.colors.text.secondary} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </LightGlassCard>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MediumGlassCard style={styles.emptyCard} elevation={4} borderRadius={20}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>💭</Text>
          <Text style={styles.emptyTitle}>No chats yet!</Text>
          <Text style={styles.emptySubtitle}>
            Start your first convo and watch the magic happen ✨
          </Text>
          <GlassButton
            style={styles.startChatButton}
            onPress={() => {/* Handle start chat */}}
            elevation={4}
            borderRadius={12}
          >
            <View style={styles.startChatContent}>
              <Ionicons name="add" size={20} color={theme.colors.text.primary} />
              <Text style={styles.startChatText}>Start Chatting</Text>
            </View>
          </GlassButton>
        </View>
      </MediumGlassCard>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={styles.container}
    >
      {/* Fun Header Messages */}
      <View style={styles.headerMessages}>
        <Text style={styles.welcomeMessage}>
          Hey bestie! Ready to spill some tea? ☕✨
        </Text>
      </View>

  {/* Chat List */}
      <FlatList
        data={sortedChats}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.chatList,
          sortedChats.length === 0 && styles.emptyList
        ]}
        ListHeaderComponent={hasPinned ? (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeaderText}>Pinned</Text>
          </View>
        ) : null}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB for New Chat */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => (navigation.getParent() as any)?.navigate('NewChatScreen')}
      >
        <LinearGradient
          colors={[theme.colors.primary.start, theme.colors.primary.end]}
          style={styles.fabGradient}
        >
          <MediumGlassCard 
            style={styles.fabCard} 
            elevation={8} 
            borderRadius={28}
          >
            <Ionicons name="add" size={28} color="white" />
          </MediumGlassCard>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pinnedCard: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerMessages: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  welcomeMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  chatList: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  chatCard: {
    marginHorizontal: theme.spacing.xs,
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: 'white',
  },
  chatInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  pinnedBadge: {
    alignSelf: 'flex-start',
    color: theme.colors.primary.start,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  chatMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  pinBtn: {
    marginTop: 6,
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)'
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary.start,
    borderRadius: 12,
    minWidth: 24,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.sm,
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  startChatButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  startChatContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  startChatText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    borderRadius: 28,
    padding: 2,
  },
  fabCard: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  sectionHeaderText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
