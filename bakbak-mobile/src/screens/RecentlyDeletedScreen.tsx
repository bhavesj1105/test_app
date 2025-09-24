import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LightGlassCard, MediumGlassCard } from '../components/GlassCard';
import { theme } from '../constants/theme';
import { listRecentlyDeleted, restoreMessage, permanentDeleteMessage } from '../api/messages';

export const RecentlyDeletedScreen: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const baseUrl = 'http://localhost:5000';
  const token = 'JWT_TOKEN';

  const load = async () => {
    try {
      setLoading(true);
      const res = await listRecentlyDeleted({ baseUrl, token });
      setItems(res.items);
    } catch (e) {
      // noop
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRestore = async (messageId: string) => {
    await restoreMessage({ baseUrl, token, messageId });
    await load();
  };
  const onPermanent = async (messageId: string) => {
    await permanentDeleteMessage({ baseUrl, token, messageId });
    await load();
  };

  const renderItem = ({ item }: { item: any }) => {
    const isMessage = item.itemType === 'message';
    const preview = isMessage ? (item.payload?.content ? String(item.payload.content).slice(0, 80) : '[attachment]') : '[chat]';
    return (
      <LightGlassCard style={styles.card} elevation={3} borderRadius={14}>
        <View style={styles.row}>
          <Ionicons name={isMessage ? 'chatbox-ellipses-outline' : 'albums-outline'} size={22} color={theme.colors.text.primary} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.title}>{isMessage ? 'Message' : 'Conversation'}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{preview}</Text>
            <Text style={styles.meta}>Expires {new Date(item.expiryAt).toLocaleDateString()}</Text>
          </View>
          {isMessage && (
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onRestore(item.itemId)} style={[styles.btn, styles.restore]}>
                <Ionicons name="arrow-undo" size={16} color="white" />
                <Text style={styles.btnText}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onPermanent(item.itemId)} style={[styles.btn, styles.delete]}>
                <Ionicons name="trash" size={16} color="white" />
                <Text style={styles.btnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LightGlassCard>
    );
  };

  return (
    <LinearGradient colors={theme.colors.primary.gradient as any} style={{ flex: 1 }}>
      <MediumGlassCard style={styles.header} elevation={6} borderRadius={0}>
        <Text style={styles.headerTitle}>Recently Deleted</Text>
      </MediumGlassCard>
      <FlatList
        data={items}
        refreshing={loading}
        onRefresh={load}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.empty}>Nothing here. Deleted items appear for 30 days.</Text>}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: { paddingTop: 44, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm },
  headerTitle: { color: 'white', fontWeight: '800', fontSize: 18 },
  card: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  title: { fontWeight: '700', color: theme.colors.text.primary },
  subtitle: { color: theme.colors.text.secondary, marginTop: 4 },
  meta: { color: theme.colors.text.secondary, marginTop: 6, fontSize: 12 },
  actions: { flexDirection: 'row' },
  btn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  restore: { backgroundColor: '#4CAF50' },
  delete: { backgroundColor: '#E53935' },
  btnText: { color: 'white', fontWeight: '700', marginLeft: 6 },
  empty: { textAlign: 'center', color: 'white', opacity: 0.8, marginTop: 40 },
});

export default RecentlyDeletedScreen;
