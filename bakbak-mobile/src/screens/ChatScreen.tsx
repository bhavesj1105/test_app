import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LightGlassCard, MediumGlassCard } from '../components/GlassCard';
import PosterCover from '../components/PosterCover';
import { theme } from '../constants/theme';
import { socketService } from '../services/socket';
import { useTyping } from '../hooks/useTyping';
import { useVisibilityReporter } from '../hooks/useVisibilityReporter';
import { useReadReceipts } from '../hooks/useReadReceipts';
import MessageEffect from '../components/MessageEffect';
import ExtensionCard from '../components/ExtensionCard';
import SummaryCard from '../components/SummaryCard';
import { getSummary, refreshSummary } from '../api/summaries';

interface MessageItem {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  effects?: { type: string; params?: any } | null;
  cardPayload?: { title: string; url: string; image?: string; action?: string } | null;
}

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatId, contactName, contactAvatar, isOnline, contactPosterUrl, contactPosterColors } = (route.params || {}) as any;

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [showEffects, setShowEffects] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<{ type: string; params?: any } | null>(null);
  const [showAppPicker, setShowAppPicker] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Hooks: typing indicator + read receipts
  const { onInputChange, isSomeoneTyping } = useTyping(chatId ? String(chatId) : undefined, 'me');
  const { onViewableItemsChanged, viewabilityConfig } = useVisibilityReporter({ chatId: chatId ? String(chatId) : undefined, minVisiblePercent: 0.5 });
  const { isReadBySomeoneElse } = useReadReceipts(chatId ? String(chatId) : undefined, 'me');

  useEffect(() => {
    // Join chat room
    if (chatId) socketService.joinChat(String(chatId));

    // Listen for messages
  const handleIncoming = (msg: any) => {
      if (!msg || msg.chatId !== chatId) return;
      setMessages((prev) => [
        ...prev,
        {
          id: String(msg.id || Date.now()),
          content: msg.content,
          senderId: msg.senderId,
          timestamp: Date.now(),
          effects: msg.effects || null,
          cardPayload: msg.cardPayload || null,
        },
      ]);
    };
    socketService.onMessage(handleIncoming);

    return () => {
      if (chatId) socketService.leaveChat(String(chatId));
    };
  }, [chatId]);

  useEffect(() => {
    // Fetch latest summary (requires baseUrl/token from your auth/config)
    const run = async () => {
      try {
        setSummaryLoading(true);
        // TODO: replace with actual baseUrl/token
        const baseUrl = 'http://localhost:5000';
        const token = 'JWT_TOKEN';
        const res = await getSummary({ baseUrl, token, chatId: String(chatId) });
        setSummary(res.summary?.text || null);
      } catch (e) {
        // noop
      } finally {
        setSummaryLoading(false);
      }
    };
    if (chatId) run();
  }, [chatId]);

  const onRefreshSummary = async () => {
    try {
      setSummaryLoading(true);
      const baseUrl = 'http://localhost:5000';
      const token = 'JWT_TOKEN';
      const res = await refreshSummary({ baseUrl, token, chatId: String(chatId), limit: 100, queue: false });
      if (!res.queued) setSummary(res.summary?.text || null);
    } catch {}
    finally { setSummaryLoading(false); }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg: MessageItem = {
      id: String(Date.now()),
      content: input.trim(),
      senderId: 'me',
      timestamp: Date.now(),
      effects: selectedEffect,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    socketService.sendMessage({ chatId: String(chatId || 'demo'), senderId: 'me', content: newMsg.content, type: 'text', status: 'sent', effects: selectedEffect } as any);
    setSelectedEffect(null);
    requestAnimationFrame(() => flatListRef.current?.scrollToEnd({ animated: true }));
  };

  const renderItem = ({ item }: { item: MessageItem }) => {
    const isMine = item.senderId === 'me';
    const read = isMine ? isReadBySomeoneElse(item.id) : false;
    return (
      <View style={[styles.messageRow, isMine ? styles.rowRight : styles.rowLeft]}>
        {!isMine && (
          <Image source={{ uri: contactAvatar }} style={styles.bubbleAvatar} />
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <View style={[styles.textPanel, isMine ? styles.textPanelMine : styles.textPanelTheirs]}>
            {item.cardPayload ? (
              <ExtensionCard {...item.cardPayload} />
            ) : (
              <Text style={[styles.bubbleText, isMine && { color: 'white' }]}>{item.content}</Text>
            )}
            {isMine && (
              <View style={styles.readRow}>
                <Ionicons name={read ? 'checkmark-done' : 'checkmark'} size={14} color={read ? 'white' : 'rgba(255,255,255,0.6)'} />
              </View>
            )}
          </View>
          {/* Effect overlay */}
          {!!item.effects && <MessageEffect effect={item.effects} playOnceId={item.id} />}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={theme.colors.primary.gradient as any} style={styles.container}>
      {/* Header with poster cover */}
      <View>
        <PosterCover uri={contactPosterUrl} colors={(contactPosterColors || theme.colors.primary.gradient) as any} height={110} />
      </View>
      <MediumGlassCard style={[styles.header, { position: 'absolute', top: 0, left: 0, right: 0 }]} elevation={6} borderRadius={0}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.headerBack}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Image source={{ uri: contactAvatar }} style={styles.headerAvatar} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{contactName || 'Chat'}</Text>
          <Text style={styles.headerSub}>{isSomeoneTyping ? 'Typing…' : (isOnline ? 'Online' : 'Offline')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons name="call-outline" size={22} color="white" style={{ marginRight: 16 }} />
          <Ionicons name="videocam-outline" size={22} color="white" />
        </View>
      </MediumGlassCard>

  {/* Summary Card */}
  <SummaryCard summary={summary} loading={summaryLoading} onRefresh={onRefreshSummary} />

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onViewableItemsChanged={onViewableItemsChanged as any}
        viewabilityConfig={viewabilityConfig as any}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <LightGlassCard style={styles.inputBar} elevation={6} borderRadius={0}>
          <TouchableOpacity style={styles.iconBtn}><Ionicons name="happy-outline" size={22} color={theme.colors.text.primary} /></TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Drop your thoughts... ✍️"
            placeholderTextColor={theme.colors.text.secondary}
            value={input}
            onChangeText={(text) => { setInput(text); onInputChange(); }}
            onBlur={() => socketService.stopTyping(String(chatId || 'demo'))}
          />
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAppPicker(true)}>
            <Ionicons name="apps-outline" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowEffects(true)}>
            <Ionicons name="sparkles-outline" size={22} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} onPress={sendMessage} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </LightGlassCard>
      </KeyboardAvoidingView>

      {/* Effects chooser modal */}
      <Modal visible={showEffects} transparent animationType="fade" onRequestClose={() => setShowEffects(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pick an effect</Text>
            <View style={styles.effectsRow}>
              <TouchableOpacity style={styles.effectBtn} onPress={() => { setSelectedEffect({ type: 'confetti' }); setShowEffects(false); }}>
                <Text style={styles.effectLabel}>Confetti</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.effectBtn} onPress={() => { setSelectedEffect({ type: 'fireworks' }); setShowEffects(false); }}>
                <Text style={styles.effectLabel}>Fireworks</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.previewWrap}>
              {/* Simple preview using MessageEffect */}
              <MessageEffect effect={selectedEffect || { type: 'confetti' }} autoplay loop={false} />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setShowEffects(false)}>
                <Text style={styles.modalActionText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Picker modal (simulated) */}
      <Modal visible={showAppPicker} transparent animationType="fade" onRequestClose={() => setShowAppPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Share via App</Text>
            <View style={styles.effectsRow}>
              <TouchableOpacity style={styles.effectBtn} onPress={() => {
                // Simulate an extension returning a card
                const card = { title: 'Cool Article', url: 'https://example.com', image: 'https://picsum.photos/400/200', action: undefined };
                const newMsg: MessageItem = { id: String(Date.now()), content: card.title, senderId: 'me', timestamp: Date.now(), cardPayload: card };
                setMessages((prev) => [...prev, newMsg]);
                setShowAppPicker(false);
              }}>
                <Text style={styles.effectLabel}>Sample App</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalAction} onPress={() => setShowAppPicker(false)}>
                <Text style={styles.modalActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Chat/Call toggle (pill) + center quick Call button) */}
      <View style={styles.toggleWrap} pointerEvents="box-none">
        <View style={styles.toggleBar}>
          <TouchableOpacity accessibilityRole="button" style={styles.toggleBtn} onPress={() => {}}>
            <Ionicons name="chatbubbles" size={18} color={theme.colors.primary.start} />
            <Text style={styles.toggleText}>Chat</Text>
          </TouchableOpacity>
          <View style={styles.toggleDivider} />
          <TouchableOpacity 
            accessibilityRole="button"
            style={styles.toggleBtn}
            onPress={() => (navigation as any).navigate('CallInProgress', { contactName, contactAvatar, isVideo: false })}
          >
            <Ionicons name="call" size={18} color={theme.colors.primary.start} />
            <Text style={styles.toggleText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Floating center call CTA */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Quick Call"
          style={styles.quickCall}
          onPress={() => (navigation as any).navigate('CallInProgress', { contactName, contactAvatar, isVideo: true })}
        >
          <LinearGradient colors={theme.colors.primary.gradient as any} style={styles.quickCallInner}>
            <Ionicons name="call" size={20} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 44,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBack: { marginRight: 8 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerInfo: { flex: 1 },
  headerName: { color: 'white', fontWeight: '700', fontSize: 16 },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  headerActions: { flexDirection: 'row' },
  listContent: { padding: theme.spacing.md, paddingBottom: 100 },
  messageRow: { flexDirection: 'row', marginBottom: 8, alignItems: 'flex-end' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 6 },
  bubble: { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleMine: { backgroundColor: theme.colors.primary.start, borderTopRightRadius: 4, marginLeft: 40 },
  bubbleTheirs: { backgroundColor: 'rgba(255,255,255,0.12)', borderTopLeftRadius: 4, marginRight: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  bubbleText: { color: theme.colors.text.primary },
  readRow: { marginTop: 4, alignSelf: 'flex-end' },
  textPanel: { borderRadius: 12, paddingHorizontal: 6, paddingVertical: 4 },
  textPanelMine: { backgroundColor: 'rgba(0,0,0,0.0)' },
  textPanelTheirs: { backgroundColor: 'rgba(255,255,255,0.85)' },
  inputBar: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  textInput: { flex: 1, paddingHorizontal: 10, color: theme.colors.text.primary },
  sendBtn: { backgroundColor: theme.colors.primary.start, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  toggleWrap: { position: 'absolute', bottom: 82, left: 0, right: 0, alignItems: 'center' },
  toggleBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 24, paddingHorizontal: 14, paddingVertical: 8 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  toggleText: { marginLeft: 6, color: theme.colors.text.primary, fontWeight: '600' },
  toggleDivider: { width: 1, height: 18, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 6 },
  quickCall: { position: 'absolute', bottom: 50, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  quickCallInner: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  // Effects modal styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md },
  modalCard: { width: '90%', borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.85)', padding: theme.spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  effectsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  effectBtn: { flex: 1, marginHorizontal: 6, paddingVertical: 12, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.05)', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
  effectLabel: { color: theme.colors.text.primary, fontWeight: '600' },
  previewWrap: { alignItems: 'center', justifyContent: 'center', height: 180 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  modalAction: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.colors.primary.start, borderRadius: 10 },
  modalActionText: { color: 'white', fontWeight: '700' },
});

export default ChatScreen;
