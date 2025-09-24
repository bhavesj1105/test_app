import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, FlatList, Modal, ActivityIndicator } from 'react-native';

type Category = { id: string; title: string; stickers: { id: string; url: string }[] };

export interface StickerPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (sticker: { id: string; url: string }) => void;
  fetchUrl?: string; // e.g., http://localhost:5000/api/stickers
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ visible, onClose, onSelect, fetchUrl }) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!fetchUrl) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(fetchUrl);
        const json = await res.json();
        if (active) setCategories(json.categories || []);
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load stickers');
      } finally {
        if (active) setLoading(false);
      }
    }
    if (visible) load();
    return () => { active = false; };
  }, [visible, fetchUrl]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Stickers</Text>
            <TouchableOpacity onPress={onClose}><Text style={styles.close}>Close</Text></TouchableOpacity>
          </View>
          {loading && <ActivityIndicator style={{ margin: 16 }} />}
          {error && <Text style={styles.error}>{error}</Text>}
          <FlatList
            data={categories}
            keyExtractor={(c) => c.id}
            renderItem={({ item }) => (
              <View style={styles.category}>
                <Text style={styles.catTitle}>{item.title}</Text>
                <FlatList
                  data={item.stickers}
                  keyExtractor={(s) => s.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item: s }) => (
                    <TouchableOpacity style={styles.stickerBtn} onPress={() => onSelect(s)}>
                      <Image source={{ uri: s.url }} style={styles.sticker} />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '70%', backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  close: { color: '#007AFF', fontWeight: '600' },
  error: { color: 'red', paddingHorizontal: 16 },
  category: { paddingHorizontal: 16, paddingBottom: 12 },
  catTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  stickerBtn: { marginRight: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  sticker: { width: 72, height: 72, backgroundColor: '#f7f7f7' },
});

export default StickerPicker;
