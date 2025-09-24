import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../constants/theme';

const NewChatScreen: React.FC = () => {
  return (
    <LinearGradient colors={theme.colors.primary.gradient as any} style={styles.container}>
      <View style={styles.center}> 
        <Text style={styles.title}>Start a new convo ✨</Text>
        <Text style={styles.subtitle}>Search contacts and slide into DMs</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  title: { color: 'white', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, textAlign: 'center' },
});

export default NewChatScreen;
