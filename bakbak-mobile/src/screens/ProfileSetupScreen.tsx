import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../constants/theme';
import PosterBuilder from '../components/PosterBuilder';

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phone, countryCode } = route.params as any;
  
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPoster, setShowPoster] = useState(false);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter your name');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call for user registration
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to main app
      (navigation as any).reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    }, 1500);
  };

  return (
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Tell us a bit about yourself
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity style={styles.avatarButton}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {name.charAt(0).toUpperCase() || '👤'}
                  </Text>
                </View>
                <Text style={styles.avatarLabel}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.avatarButton, { marginTop: 12 }]} onPress={() => setShowPoster(true)}>
                <Text style={styles.avatarLabel}>Create Poster</Text>
              </TouchableOpacity>
              {posterPreview && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ color: theme.colors.text.primary, marginBottom: 6 }}>Poster Preview</Text>
                  <Image source={{ uri: posterPreview }} style={{ width: 320, height: 180, borderRadius: 12 }} />
                </View>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.text.secondary}
                value={name}
                onChangeText={setName}
                maxLength={50}
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                placeholder="Tell us something about yourself..."
                placeholderTextColor={theme.colors.text.secondary}
                value={bio}
                onChangeText={setBio}
                maxLength={150}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {bio.length}/150
              </Text>
            </View>

            <View style={styles.phoneDisplay}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <Text style={styles.phoneNumber}>
                {countryCode} {phone}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.completeButton,
                (!name.trim() || isLoading) && styles.disabledButton
              ]}
              onPress={handleComplete}
              disabled={!name.trim() || isLoading}
            >
              <Text style={styles.completeButtonText}>
                {isLoading ? 'Creating Profile...' : 'Complete Setup'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                setName('User');
                setTimeout(() => handleComplete(), 100);
              }}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </KeyboardAvoidingView>
      {/* Poster modal */}
      {showPoster && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.md }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, padding: theme.spacing.md }}>
            <PosterBuilder
              name={name || 'You'}
              onExport={(uri) => { setPosterPreview(uri); setShowPoster(false); }}
            />
            <TouchableOpacity style={{ marginTop: 12, alignSelf: 'flex-end' }} onPress={() => setShowPoster(false)}>
              <Text style={{ color: theme.colors.primary.start, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: theme.spacing.sm,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarButton: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 3,
    borderColor: theme.colors.primary.start,
  },
  avatarText: {
    fontSize: 36,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
  },
  avatarLabel: {
    fontSize: 14,
    color: theme.colors.primary.start,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  bioInput: {
    height: 80,
    paddingTop: theme.spacing.md,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'right',
    marginTop: theme.spacing.xs,
  },
  phoneDisplay: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
  },
  phoneLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  phoneNumber: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  completeButton: {
    backgroundColor: theme.colors.primary.start,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});
