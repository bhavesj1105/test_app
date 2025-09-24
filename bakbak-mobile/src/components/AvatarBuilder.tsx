import React, { useMemo, useRef, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text } from 'react-native';
import ViewShot from 'react-native-view-shot';

type Layer = { id: string; uri: string; z: number };

export interface AvatarBuilderProps {
  skin?: string;
  eyes?: string;
  hair?: string;
  accessory?: string;
  size?: number;
  onExport?: (result: { png?: string; lottie?: any }) => void;
}

export const AvatarBuilder: React.FC<AvatarBuilderProps> = ({ skin, eyes, hair, accessory, size = 160, onExport }) => {
  const [animateBlink, setAnimateBlink] = useState(false);
  const shotRef = useRef<ViewShot>(null);

  const layers: Layer[] = useMemo(() => {
    const L: Layer[] = [];
    if (skin) L.push({ id: 'skin', uri: skin, z: 1 });
    if (hair) L.push({ id: 'hair', uri: hair, z: 2 });
    if (eyes) L.push({ id: 'eyes', uri: eyes, z: 3 });
    if (accessory) L.push({ id: 'acc', uri: accessory, z: 4 });
    return L.sort((a, b) => a.z - b.z);
  }, [skin, eyes, hair, accessory]);

  const exportPng = async () => {
    const uri = await shotRef.current?.capture?.();
    onExport?.({ png: uri });
  };

  // For demo: return a minimal Lottie JSON blink animation stub
  const exportLottie = () => {
    const lottie = {
      v: '5.8.1', fr: 30, ip: 0, op: 60, w: size, h: size, nm: 'avatar_blink', ddd: 0, assets: [],
      layers: [
        { ddd: 0, ind: 1, ty: 4, nm: 'blink', ks: { o: { a: 1, k: [{ t: 0, s: 0 }, { t: 10, s: 100 }, { t: 20, s: 0 }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [size/2, size/2, 0] }, a: { a: 0, k: [0,0,0] }, s: { a: 0, k: [100,100,100] } }, shapes: [] }
      ], markers: []
    };
    onExport?.({ lottie });
  };

  return (
    <View style={styles.wrap}>
  <ViewShot ref={shotRef} style={{ width: size, height: size }} options={{ format: 'png', quality: 1.0 }}>
        <View style={{ width: size, height: size }}>
          {layers.map((l) => (
            <Image
              key={l.id}
              source={{ uri: l.uri }}
              resizeMode="contain"
              style={[styles.layer, { zIndex: l.z, width: size, height: size }]}
            />
          ))}
          {animateBlink && <View style={[styles.blink, { width: size, height: size }]} />}
        </View>
      </ViewShot>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.btn} onPress={() => setAnimateBlink((v) => !v)}>
          <Text style={styles.btnText}>{animateBlink ? 'Blink: On' : 'Blink: Off'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={exportPng}><Text style={styles.btnText}>Export PNG</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={exportLottie}><Text style={styles.btnText}>Export Lottie</Text></TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  layer: { position: 'absolute', top: 0, left: 0, resizeMode: 'contain' },
  blink: { backgroundColor: 'rgba(0,0,0,0.05)', position: 'absolute', top: 0, left: 0 },
  toolbar: { flexDirection: 'row', marginTop: 12, justifyContent: 'center' },
  btn: { backgroundColor: '#111827', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  btnText: { color: 'white', fontWeight: '700' },
});

export default AvatarBuilder;
