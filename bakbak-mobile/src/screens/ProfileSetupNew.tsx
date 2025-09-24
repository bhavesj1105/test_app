import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Image,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as SecureStore from 'expo-secure-store';
import { 
  GlassCard, 
  GlassButton, 
  LightGlassCard, 
  MediumGlassCard,
} from '../components/GlassCard';
import { theme } from '../constants/theme';

interface ValidationState {
  isValid: boolean;
  message: string;
}

export const ProfileSetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ isValid: false, message: '' });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const avatarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    // Animate avatar when image is selected
    if (avatarUri) {
      Animated.spring(avatarAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [avatarUri]);

  const validateName = (nameText: string): ValidationState => {
    if (!nameText.trim()) {
      return { isValid: false, message: 'Name is required bestie! ✨' };
    }
    
    if (nameText.trim().length < 2) {
      return { isValid: false, message: 'Name is too short! Give us more 💫' };
    }
    
    if (nameText.trim().length > 50) {
      return { isValid: false, message: 'That name is too long! Keep it simple 😅' };
    }
    
    // Check for valid characters
    const nameRegex = /^[a-zA-Z\s'.-]+$/;
    if (!nameRegex.test(nameText.trim())) {
      return { isValid: false, message: 'Only letters, spaces, and basic punctuation please! 📝' };
    }
    
    return { isValid: true, message: 'Perfect name! 💜' };
  };

  const handleNameChange = (text: string) => {
    setName(text);
    const validationResult = validateName(text);
    setValidation(validationResult);
  };

  const requestCameraPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions needed 📸', 
        'We need camera and photo library access to set your profile picture!'
      );
      return false;
    }
    return true;
  };

  const processImage = async (imageUri: string) => {
    try {
      // Manipulate image to 300x300 square
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          { resize: { width: 300, height: 300 } },
        ],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      
      setAvatarUri(manipulatedImage.uri);
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error 😅', 'Could not process the image. Try another one!');
    }
  };

  const showImagePicker = async () => {
    const hasPermissions = await requestCameraPermissions();
    if (!hasPermissions) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo 📸', 'Choose from Library 🖼️'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Select Photo 📷',
        'Choose how you want to add your profile picture',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo 📸', onPress: takePhoto },
          { text: 'Choose from Library 🖼️', onPress: pickImage },
        ]
      );
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error 📸', 'Could not access camera. Try again!');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error 🖼️', 'Could not access photo library. Try again!');
    }
  };

  const uploadProfile = async () => {
    const validationResult = validateName(name);
    
    if (!validationResult.isValid) {
      Alert.alert('Name Issue 🤔', validationResult.message);
      return;
    }

    setIsLoading(true);

    try {
      const authToken = await SecureStore.getItemAsync('authToken');
      if (!authToken) {
        Alert.alert('Error 😕', 'Authentication required. Please login again.');
        (navigation as any).navigate('Login');
        return;
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('name', name.trim());
      
      if (avatarUri) {
        const filename = `avatar_${Date.now()}.jpg`;
        formData.append('avatar', {
          uri: avatarUri,
          type: 'image/jpeg',
          name: filename,
        } as any);
      }

      const response = await fetch('http://localhost:3000/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Store profile data locally
        await SecureStore.setItemAsync('userName', name.trim());
        if (data.avatarUrl) {
          await SecureStore.setItemAsync('userAvatar', data.avatarUrl);
        }

        Alert.alert(
          'Profile Created! 🎉', 
          'Welcome to Bak Bak fam! Time to start chatting! 💜',
          [
            {
              text: 'Let\'s Go! 🚀',
              onPress: () => (navigation as any).navigate('MainTabs')
            }
          ]
        );
      } else {
        Alert.alert('Error 😕', data.message || 'Could not create profile. Try again!');
      }
    } catch (error) {
      console.error('Profile upload error:', error);
      Alert.alert('Network Error 📡', 'Check your connection and try again!');
    } finally {
      setIsLoading(false);
    }
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
        <Animated.View 
          style={[
            styles.content,
            { opacity: fadeAnim }
          ]}
        >
          {/* Header */}
          <MediumGlassCard style={styles.headerCard} elevation={4} borderRadius={24}>
            <View style={styles.header}>
              <View style={styles.emojiContainer}>
                <Text style={styles.headerEmoji}>✨</Text>
              </View>
              <Text style={styles.title}>Set Up Your Profile</Text>
              <Text style={styles.subtitle}>
                Let's make you look good! This is how everyone will see you 💫
              </Text>
            </View>
          </MediumGlassCard>

          {/* Profile Photo Section */}
          <MediumGlassCard style={styles.photoCard} elevation={6} borderRadius={24}>
            <Text style={styles.sectionTitle}>Your Photo 📸</Text>
            
            <Animated.View 
              style={[
                styles.avatarSection,
                {
                  transform: [{ scale: avatarAnim }]
                }
              ]}
            >
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={showImagePicker}
              >
                <LightGlassCard 
                  style={styles.avatarCard} 
                  elevation={4} 
                  borderRadius={36}
                >
                  {avatarUri ? (
                    <>
                      <Image 
                        source={{ uri: avatarUri }} 
                        style={styles.avatarImage} 
                      />
                      <View style={styles.avatarOverlay}>
                        <Ionicons name="camera" size={20} color="white" />
                      </View>
                    </>
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={theme.colors.text.secondary} />
                      <Text style={styles.avatarPlaceholderText}>
                        Tap to add photo
                      </Text>
                    </View>
                  )}
                </LightGlassCard>
              </TouchableOpacity>
            </Animated.View>
            
            <Text style={styles.photoHint}>
              {avatarUri 
                ? "Looking good! Tap to change 💅" 
                : "Show off that main character energy! ✨"
              }
            </Text>
          </MediumGlassCard>

          {/* Name Input Section */}
          <MediumGlassCard style={styles.nameCard} elevation={8} borderRadius={24}>
            <Text style={styles.sectionTitle}>What's your name? 💫</Text>
            
            <View style={styles.nameInputWrapper}>
              <TextInput
                style={[
                  styles.nameInput,
                  validation.isValid && name ? styles.nameInputValid : {},
                  !validation.isValid && name ? styles.nameInputInvalid : {}
                ]}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.text.secondary}
                value={name}
                onChangeText={handleNameChange}
                maxLength={50}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {validation.isValid && name && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#4CAF50" 
                  style={styles.validationIcon}
                />
              )}
            </View>

            {/* Validation Message */}
            {name && (
              <Text style={[
                styles.validationMessage,
                validation.isValid ? styles.validMessage : styles.errorMessage
              ]}>
                {validation.message}
              </Text>
            )}

            <Text style={styles.nameHint}>
              This is how your friends will find you! Make it memorable 🌟
            </Text>
          </MediumGlassCard>

          {/* Save Button */}
          <GlassButton
            style={(!validation.isValid || isLoading) 
              ? { ...styles.saveButton, opacity: 0.6 }
              : styles.saveButton
            }
            onPress={uploadProfile}
            disabled={!validation.isValid || isLoading}
            elevation={8}
            borderRadius={20}
            intensity={25}
          >
            <View style={styles.buttonContent}>
              {isLoading ? (
                <>
                  <Text style={styles.saveButtonText}>Creating magic... ✨</Text>
                </>
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Save & Continue</Text>
                  <Ionicons name="arrow-forward" size={24} color={theme.colors.text.primary} />
                </>
              )}
            </View>
          </GlassButton>

          {/* Fun Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You're almost ready to join the conversation! 🗣️✨
            </Text>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  headerCard: {
    marginTop: Platform.OS === 'ios' ? 60 : 40,
    marginHorizontal: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emojiContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  headerEmoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  photoCard: {
    marginHorizontal: theme.spacing.sm,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  avatarSection: {
    marginBottom: theme.spacing.md,
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarCard: {
    width: 72,
    height: 72,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  avatarPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  avatarPlaceholderText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  photoHint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  nameCard: {
    marginHorizontal: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  nameInputWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  nameInput: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nameInputValid: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  nameInputInvalid: {
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  validationIcon: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  validationMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    fontWeight: '500',
  },
  validMessage: {
    color: '#4CAF50',
  },
  errorMessage: {
    color: '#f44336',
  },
  nameHint: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  saveButton: {
    marginHorizontal: theme.spacing.sm,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  footer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
