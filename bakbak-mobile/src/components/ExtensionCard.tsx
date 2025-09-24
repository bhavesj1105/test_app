import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LightGlassCard } from './GlassCard';
import { theme } from '../constants/theme';

export const ExtensionCard: React.FC<{ title: string; url: string; image?: string; action?: string }> = ({ title, url, image, action }) => {
  const open = () => {
    Linking.openURL(action || url).catch(() => {});
  };
  return (
    <LightGlassCard style={styles.card} elevation={3} borderRadius={14}>
      {image ? <Image source={{ uri: image }} style={styles.image} /> : null}
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={open} style={styles.btn}>
        <Text style={styles.btnText}>Open</Text>
      </TouchableOpacity>
    </LightGlassCard>
  );
};

const styles = StyleSheet.create({
  card: { padding: 10, maxWidth: 280 },
  image: { width: '100%', height: 140, borderRadius: 10, marginBottom: 8 },
  title: { color: theme.colors.text.primary, fontWeight: '700', marginBottom: 8 },
  btn: { backgroundColor: theme.colors.primary.start, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: '700' },
});

export default ExtensionCard;
