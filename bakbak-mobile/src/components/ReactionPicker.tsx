import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';

export interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onPick: (emoji: string) => void;
  emojis?: string[];
}

const DEFAULT_EMOJIS = ['👍','❤️','😂','😮','😢','👏','🔥','😍'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ visible, onClose, onPick, emojis = DEFAULT_EMOJIS }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {emojis.map((e) => (
            <TouchableOpacity key={e} style={styles.emojiBtn} onPress={() => { onPick(e); onClose(); }}>
              <Text style={styles.emoji}>{e}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  container: { flexDirection: 'row', backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 24 },
  emojiBtn: { paddingHorizontal: 6 },
  emoji: { fontSize: 24 },
});

export default ReactionPicker;
