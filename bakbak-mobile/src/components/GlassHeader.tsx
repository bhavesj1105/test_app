import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface Props {
  title?: string;
  onSettingsPress?: () => void;
}

export const GlassHeader: React.FC<Props> = ({ title = 'BAK BAK', onSettingsPress }) => {
  return (
    <View style={{ height: 100, paddingTop: 44 }}>
      <LinearGradient colors={theme.colors.primary.gradient as any} style={{ flex: 1 }}>
        <BlurView intensity={20} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.sm }}>
          <TouchableOpacity
            onPress={onSettingsPress}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255, 255, 255, 0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="settings-outline" size={20} color="white" />
          </TouchableOpacity>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.25)' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center', letterSpacing: 1 }}>{title}</Text>
          </View>
          <View style={{ width: 44 }} />
        </BlurView>
      </LinearGradient>
    </View>
  );
};

export default GlassHeader;
