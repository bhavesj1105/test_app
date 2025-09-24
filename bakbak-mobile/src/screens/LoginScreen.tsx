import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { 
  GlassCard, 
  GlassButton, 
  LightGlassCard, 
  MediumGlassCard,
} from '../components/GlassCard';
import { countries } from '../constants/countries';
import { theme } from '../constants/theme';
import { Country } from '../types';

const { width, height } = Dimensions.get('window');

interface ValidationState {
  isValid: boolean;
  message: string;
}

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validation, setValidation] = useState<ValidationState>({ isValid: false, message: '' });
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate screen entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validatePhoneNumber = (phone: string): ValidationState => {
    if (!phone.trim()) {
      return { isValid: false, message: 'Phone number is required bestie! 📱' };
    }
    
    if (phone.length < 6) {
      return { isValid: false, message: 'Too short! Need more digits fam 💀' };
    }
    
    if (phone.length > 15) {
      return { isValid: false, message: 'Woah, that is too long! Keep it simple ✋' };
    }
    
    const phoneRegex = /^[\+]?[0-9\-\(\)\s]*$/;
    if (!phoneRegex.test(phone)) {
      return { isValid: false, message: 'Only numbers please! No weird characters 🤪' };
    }
    
    return { isValid: true, message: 'Looking good! ✨' };
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(text);
    const validationResult = validatePhoneNumber(text);
    setValidation(validationResult);
  };

  const handleContinue = async () => {
    const validationResult = validatePhoneNumber(phoneNumber);
    
    if (!validationResult.isValid) {
      Alert.alert('Oops! 🙈', validationResult.message);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call the backend API
      const response = await fetch('http://localhost:3000/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
          countryCode: selectedCountry.code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Navigate to OTP screen
        (navigation as any).navigate('OTPVerification', {
          phoneNumber: `${selectedCountry.dialCode}${phoneNumber}`,
          countryCode: selectedCountry.code,
          otpId: data.otpId,
        });
      } else {
        Alert.alert('Error 😕', data.message || 'Something went wrong. Try again!');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Network Error 📡', 'Check your connection and try again bestie!');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <LightGlassCard style={styles.countryItemCard} elevation={2} borderRadius={12}>
      <TouchableOpacity
        style={styles.countryItemButton}
        onPress={() => {
          setSelectedCountry(item);
          setShowCountryPicker(false);
        }}
      >
        <Text style={styles.countryFlag}>{item.flag}</Text>
        <Text style={styles.countryName}>{item.name}</Text>
        <Text style={styles.countryCode}>{item.dialCode}</Text>
      </TouchableOpacity>
    </LightGlassCard>
  );

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
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Settings Icon */}
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => (navigation as any).navigate('Settings')}
          >
            <LightGlassCard style={styles.iconCard} elevation={2} borderRadius={12}>
              <Ionicons name="settings-outline" size={24} color={theme.colors.text.primary} />
            </LightGlassCard>
          </TouchableOpacity>

          {/* Header with Logo */}
          <MediumGlassCard style={styles.headerCard} elevation={4} borderRadius={24}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoWrapper}>
                  <Text style={styles.logoEmoji}>💬</Text>
                  <View style={styles.logoGlow} />
                </View>
              </View>
              <Text style={styles.title}>BAK BAK</Text>
              <Text style={styles.tagline}>
                Where conversations get real ✨
              </Text>
              <Text style={styles.subtitle}>
                Let's get you connected, bestie! 🫶
              </Text>
            </View>
          </MediumGlassCard>

          {/* Phone Input Form */}
          <MediumGlassCard style={styles.formCard} elevation={8} borderRadius={24}>
            <Text style={styles.inputSectionTitle}>
              Drop your digits 📞
            </Text>
            
            <View style={styles.phoneInputContainer}>
              {/* Country Selector */}
              <GlassButton
                style={styles.countrySelector}
                onPress={() => setShowCountryPicker(true)}
                elevation={3}
                borderRadius={12}
                intensity={15}
              >
                <View style={styles.countrySelectorContent}>
                  <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </View>
              </GlassButton>

              {/* Phone Input */}
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={[
                    styles.phoneInput,
                    validation.isValid && phoneNumber ? styles.phoneInputValid : {},
                    !validation.isValid && phoneNumber ? styles.phoneInputInvalid : {}
                  ]}
                  placeholder="Your phone number"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={15}
                />
                {validation.isValid && phoneNumber && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#4CAF50" 
                    style={styles.validationIcon}
                  />
                )}
              </View>
            </View>

            {/* Validation Message */}
            {phoneNumber && (
              <Text style={[
                styles.validationMessage,
                validation.isValid ? styles.validMessage : styles.errorMessage
              ]}>
                {validation.message}
              </Text>
            )}

            {/* Continue Button */}
            <GlassButton
              style={(!validation.isValid || isLoading) 
                ? { ...styles.continueButton, opacity: 0.6 }
                : styles.continueButton
              }
              onPress={handleContinue}
              disabled={!validation.isValid || isLoading}
              elevation={6}
              borderRadius={16}
              intensity={20}
            >
              <View style={styles.buttonContent}>
                {isLoading ? (
                  <>
                    <Text style={styles.continueButtonText}>Sending magic... ✨</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.continueButtonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color={theme.colors.text.primary} />
                  </>
                )}
              </View>
            </GlassButton>

            {/* Terms */}
            <LightGlassCard style={styles.termsCard} elevation={1} borderRadius={12}>
              <Text style={styles.termsText}>
                By tapping Continue, you're agreeing to our{' '}
                <Text style={styles.linkText}>Terms</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text> 💜
              </Text>
            </LightGlassCard>
          </MediumGlassCard>

          {/* Fun Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Made with 💜 for the main characters
            </Text>
          </View>
        </Animated.View>

        {/* Country Picker Modal */}
        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <LinearGradient
            colors={theme.colors.primary.gradient as any}
            style={styles.modalContainer}
          >
            {/* Modal Header */}
            <MediumGlassCard style={styles.modalHeader} elevation={4} borderRadius={0}>
              <View style={styles.modalHeaderContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCountryPicker(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Pick your country 🌍</Text>
                <View style={styles.modalSpacer} />
              </View>
            </MediumGlassCard>

            <FlatList
              data={countries}
              renderItem={renderCountryItem}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              contentContainerStyle={styles.countryListContent}
            />
          </LinearGradient>
        </Modal>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 2,
  },
  iconCard: { padding: 8 },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  headerCard: { marginBottom: theme.spacing.xl },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: { alignItems: 'center', marginBottom: theme.spacing.sm },
  logoWrapper: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  logoEmoji: { fontSize: 28 },
  logoGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)' },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  tagline: { fontSize: 12, color: theme.colors.text.inverse, opacity: 0.9, marginTop: 2 },
  formCard: { marginBottom: theme.spacing.lg, padding: theme.spacing.lg },
  inputSectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.text.primary, marginBottom: theme.spacing.sm },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  countryItemCard: { marginHorizontal: theme.spacing.md, marginVertical: 4 },
  countryItemButton: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.md },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: theme.borderRadius.md,
    borderBottomLeftRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    borderRightWidth: 0,
    minWidth: 100,
  },
  countrySelectorContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  countryFlag: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  dialCode: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginRight: theme.spacing.xs,
  },
  dropdownArrow: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  phoneInputWrapper: { position: 'relative', flex: 1 },
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderTopRightRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  phoneInputValid: { borderColor: '#4CAF50' },
  phoneInputInvalid: { borderColor: '#E53935' },
  validationIcon: { position: 'absolute', right: 10, top: '50%', marginTop: -10 },
  validationMessage: { fontSize: 12, marginTop: -8, marginBottom: theme.spacing.md },
  validMessage: { color: '#4CAF50' },
  errorMessage: { color: '#E53935' },
  continueButton: {
    backgroundColor: theme.colors.primary.start,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, justifyContent: 'center' },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  termsCard: { padding: theme.spacing.sm },
  termsText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    color: theme.colors.primary.start,
    fontWeight: '500',
  },
  footer: { alignItems: 'center', marginTop: theme.spacing.lg },
  footerText: { color: theme.colors.text.inverse, opacity: 0.8, fontSize: 12 },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  modalHeaderContent: { flexDirection: 'row', alignItems: 'center' },
  modalCloseButton: {
    paddingVertical: theme.spacing.sm,
  },
  modalCloseText: {
    fontSize: 16,
    color: theme.colors.primary.start,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  modalSpacer: {
    width: 60,
  },
  countryList: {
    flex: 1,
  },
  countryListContent: { paddingBottom: theme.spacing.lg },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  countryName: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  countryCode: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});
