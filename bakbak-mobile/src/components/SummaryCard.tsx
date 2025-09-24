import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

export function SummaryCard(props: { summary?: string | null; loading?: boolean; onRefresh?: () => void }) {
  const { summary, loading, onRefresh } = props;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Summary</Text>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text} numberOfLines={3}>{summary || 'No summary yet. Tap refresh.'}</Text>
      )}
      <TouchableOpacity style={styles.refresh} onPress={onRefresh}>
        <Text style={styles.refreshText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 8, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  title: { color: 'white', fontWeight: '700', marginBottom: 6, fontSize: 14 },
  text: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  refresh: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#111827', borderRadius: 8 },
  refreshText: { color: 'white', fontWeight: '600', fontSize: 12 },
});

export default SummaryCard;
