import React, { useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { theme } from '../constants/theme';

export const PosterBuilder: React.FC<{ name: string; avatar?: string; onExport: (pngDataUri: string, meta: { colors: string[] }) => void }>
  = ({ name, avatar, onExport }) => {
  const [colors, setColors] = useState<string[]>(['#4e54c8', '#8f94fb']);
  const ref = useRef<ViewShot>(null);
  const capture = async () => {
    const node = ref.current as any;
    const uri = node ? await captureRef(node, { format: 'png', quality: 1 }) : undefined;
    if (uri) onExport(uri, { colors });
  };
  return (
    <View>
      <ViewShot ref={ref} style={{ borderRadius: 20, overflow: 'hidden' }}>
  <LinearGradient colors={colors as any} style={styles.poster}>
          {avatar ? <Image source={{ uri: avatar }} style={styles.avatar} /> : null}
          <Text style={styles.name}>{name}</Text>
        </LinearGradient>
      </ViewShot>
      <View style={styles.row}>
        <TouchableOpacity style={styles.colorBtn} onPress={() => setColors(['#ff9966', '#ff5e62'])}><Text style={styles.btnText}>Sunset</Text></TouchableOpacity>
        <TouchableOpacity style={styles.colorBtn} onPress={() => setColors(['#36d1dc', '#5b86e5'])}><Text style={styles.btnText}>Ocean</Text></TouchableOpacity>
        <TouchableOpacity style={styles.colorBtn} onPress={capture}><Text style={styles.btnText}>Save</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  poster: { width: 320, height: 180, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 8, borderWidth: 2, borderColor: 'white' },
  name: { color: 'white', fontWeight: '800', fontSize: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  colorBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)' },
  btnText: { color: 'white', fontWeight: '700' },
});

export default PosterBuilder;
