import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

export type ReactionSummary = {
  emoji: string;
  count: number;
  users?: { id: string; avatar?: string }[];
};

export interface MessageReactionsProps {
  messageId: string;
  chatId: string;
  summaries: ReactionSummary[];
  onToggle: (emoji: string) => void;
}

export const MessageReactions: React.FC<MessageReactionsProps> = ({ summaries, onToggle }) => {
  if (!summaries || summaries.length === 0) return null;
  return (
    <View style={styles.wrap}>
      {summaries.map((s) => (
        <TouchableOpacity key={s.emoji} style={styles.pill} onPress={() => onToggle(s.emoji)}>
          <Text style={styles.emoji}>{s.emoji}</Text>
          {s.users && s.users.length > 0 ? (
            <View style={styles.stack}>
              {s.users.slice(0,3).map((u, idx) => (
                <Image key={u.id} source={{ uri: u.avatar || undefined }} style={[styles.avatar, { left: idx * 10 }]} />
              ))}
            </View>
          ) : (
            <Text style={styles.count}>{s.count}</Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', borderRadius: 16, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  emoji: { fontSize: 14 },
  count: { marginLeft: 6, fontSize: 12, color: '#111827' },
  stack: { width: 36, height: 18, marginLeft: 6 },
  avatar: { width: 18, height: 18, borderRadius: 9, position: 'absolute', borderWidth: 1, borderColor: 'white', backgroundColor: '#DDD' },
});

export default MessageReactions;
