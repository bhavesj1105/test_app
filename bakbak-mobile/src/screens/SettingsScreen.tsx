import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { 
  LightGlassCard, 
  MediumGlassCard 
} from '../components/GlassCard';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
}

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();

  const settingsItems: SettingsItem[] = [
    {
      id: 'profile',
      title: 'Edit Profile',
      subtitle: 'Update your vibe and info ✨',
      icon: 'person-circle-outline',
      color: theme.colors.primary.start,
      onPress: () => (navigation as any).navigate('ProfileSetup'),
    },
    {
      id: 'recently-deleted',
      title: 'Recently Deleted',
      subtitle: 'Recover or purge messages ♻️',
      icon: 'trash-outline',
      color: '#9E9E9E',
      onPress: () => (navigation as any).navigate('RecentlyDeleted'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Control your buzz 🔔',
      icon: 'notifications-outline',
      color: '#FF9800',
      onPress: () => console.log('Notifications settings'),
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Keep your space safe 🔒',
      icon: 'shield-checkmark-outline',
      color: '#4CAF50',
      onPress: () => console.log('Privacy settings'),
    },
    {
      id: 'appearance',
      title: 'Appearance',
      subtitle: 'Customize your aesthetic 🎨',
      icon: 'color-palette-outline',
      color: '#E91E63',
      onPress: () => console.log('Appearance settings'),
    },
    {
      id: 'storage',
      title: 'Storage & Data',
      subtitle: 'Manage your digital footprint 💾',
      icon: 'cloud-outline',
      color: '#2196F3',
      onPress: () => console.log('Storage settings'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'We got your back! 💪',
      icon: 'help-circle-outline',
      color: '#9C27B0',
      onPress: () => console.log('Help & Support'),
    },
    {
      id: 'about',
      title: 'About Bak Bak',
      subtitle: 'Version 1.0.0 • Made with 💝',
      icon: 'information-circle-outline',
      color: theme.colors.text.secondary,
      onPress: () => console.log('About'),
    },
    {
      id: 'logout',
      title: 'Sign Out',
      subtitle: 'See you later, bestie! 👋',
      icon: 'log-out-outline',
      color: '#FF5252',
      onPress: () => {
        // Handle logout
        console.log('Signing out...');
        // navigation.navigate('Login');
      },
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => (
    <TouchableOpacity key={item.id} onPress={item.onPress}>
      <LightGlassCard 
        style={styles.settingsCard} 
        elevation={3} 
        borderRadius={16}
      >
        <View style={styles.settingsContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <Ionicons 
              name={item.icon} 
              size={24} 
              color={item.color || theme.colors.text.primary} 
            />
          </View>
          
          <View style={styles.settingsInfo}>
            <Text style={styles.settingsTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.text.secondary} 
          />
        </View>
      </LightGlassCard>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={styles.container}
    >
      {/* Profile Header */}
      <MediumGlassCard style={styles.profileHeader} elevation={4} borderRadius={20}>
        <View style={styles.profileContent}>
          <Image 
            source={{ uri: 'https://i.pravatar.cc/150?img=9' }} 
            style={styles.profileAvatar}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>You ✨</Text>
            <Text style={styles.profileSubtitle}>Living your best digital life</Text>
          </View>
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={() => (navigation as any).navigate('ProfileSetup')}
          >
            <Ionicons name="pencil" size={18} color={theme.colors.primary.start} />
          </TouchableOpacity>
        </View>
      </MediumGlassCard>

      {/* Fun Header Message */}
      <View style={styles.headerMessages}>
        <Text style={styles.welcomeMessage}>
          Time to tweak your vibe! What's the move? 🎯
        </Text>
      </View>

      {/* Settings List */}
      <View style={styles.settingsList}>
        {settingsItems.map(renderSettingsItem)}
      </View>

      {/* Fun Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Made with 💜 for the digital generation
        </Text>
        <Text style={styles.footerSubtext}>
          Bak Bak • Stay connected, stay authentic
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  profileSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerMessages: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  welcomeMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsList: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  settingsCard: {
    marginHorizontal: theme.spacing.xs,
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 16,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
