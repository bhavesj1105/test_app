import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MediumGlassCard } from '../components/GlassCard';
import { theme } from '../constants/theme';
import PosterCover from '../components/PosterCover';

const CallInProgress: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { contactName, contactAvatar, isVideo } = (route.params || {}) as any;
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <LinearGradient colors={theme.colors.primary.gradient as any} style={styles.container}>
  <PosterCover height={160} style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
  <MediumGlassCard style={styles.header} elevation={6} borderRadius={0}>
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>{isVideo ? 'Video Call' : 'Voice Call'}</Text>
        <View style={{ width: 24 }} />
      </MediumGlassCard>

      <View style={styles.body}>
        <Image source={{ uri: contactAvatar }} style={styles.avatar} />
        <Text style={styles.name}>{contactName || 'Contact'}</Text>
        <Text style={styles.timer}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrlBtn, muted && styles.ctrlActive]} onPress={() => setMuted((m) => !m)}>
          <Ionicons name={muted ? 'mic-off' : 'mic'} size={22} color={muted ? 'white' : theme.colors.text.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.endBtn]} onPress={() => (navigation as any).goBack()}>
          <Ionicons name="call" size={26} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrlBtn, speaker && styles.ctrlActive]} onPress={() => setSpeaker((s) => !s)}>
          <Ionicons name={speaker ? 'volume-high' : 'volume-medium'} size={22} color={speaker ? 'white' : theme.colors.text.primary} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 44, paddingBottom: theme.spacing.sm, alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md },
  back: { padding: 4 },
  title: { color: 'white', fontWeight: '700', fontSize: 16 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 160, height: 160, borderRadius: 80, marginBottom: theme.spacing.lg },
  name: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  timer: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  controls: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: theme.spacing.lg, paddingBottom: 40, alignItems: 'center' },
  ctrlBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  ctrlActive: { backgroundColor: theme.colors.primary.start, borderColor: 'transparent' },
  endBtn: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#FF5252', justifyContent: 'center', alignItems: 'center' },
});

export default CallInProgress;
