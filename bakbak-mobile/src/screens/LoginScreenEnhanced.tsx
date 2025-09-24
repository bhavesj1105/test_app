import React, { useState } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { 
  GlassCard, 
  GlassButton, 
  LightGlassCard, 
  MediumGlassCard,
  GlassCardProps 
} from '../components/GlassCard';
import { countries } from '../constants/countries';
import { theme } from '../constants/theme';
import { Country } from '../types';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      alert('Please enter your phone number');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      (navigation as any).navigate('OTPVerification', {
        phone: phoneNumber,
        countryCode: selectedCountry.dialCode,
      });
    }, 1000);
  };

  const renderCountryItem = ({ item }: { item: Country }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryPicker(false);
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.dialCode}</Text>
    </TouchableOpacity>
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
        <View style={styles.content}>
          {/* Header with light glass effect */}
          <LightGlassCard style={styles.headerCard} elevation={2} borderRadius={20}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>💬</Text>
              </View>
              <Text style={styles.title}>Welcome to Bak Bak</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to get started
              </Text>
            </View>
          </LightGlassCard>

          {/* Main form with medium glass effect */}
          <MediumGlassCard style={styles.formCard} elevation={8} borderRadius={24}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            
            <View style={styles.phoneInputContainer}>
              {/* Country selector with glass button */}
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
                  <Text style={styles.dropdownArrow}>▼</Text>
                </View>
              </GlassButton>

              <TextInput
                style={styles.phoneInput}
                placeholder="Enter phone number"
                placeholderTextColor={theme.colors.text.secondary}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>

            {/* Continue button with glass effect */}
            <GlassButton
              style={(!phoneNumber.trim() || isLoading) 
                ? { ...styles.continueButton, opacity: 0.6 }
                : styles.continueButton
              }
              onPress={handleContinue}
              disabled={!phoneNumber.trim() || isLoading}
              elevation={6}
              borderRadius={16}
              intensity={20}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.continueButtonText}>
                  {isLoading ? 'Please wait...' : 'Continue'}
                </Text>
              </View>
            </GlassButton>

            {/* Terms text with subtle glass background */}
            <LightGlassCard style={styles.termsCard} elevation={1} borderRadius={12}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{' '}
                <Text style={styles.linkText}>Terms of Service</Text> and{' '}
                <Text style={styles.linkText}>Privacy Policy</Text>
              </Text>
            </LightGlassCard>
          </MediumGlassCard>
        </View>

        {/* Country picker modal with glass effects */}
        <Modal
          visible={showCountryPicker}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            {/* Modal header with glass card */}
            <GlassCard style={styles.modalHeader} elevation={4} borderRadius={0}>
              <View style={styles.modalHeaderContent}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCountryPicker(false)}
                >
                  <Text style={styles.modalCloseText}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Select Country</Text>
                <View style={styles.modalSpacer} />
              </View>
            </GlassCard>

            <FlatList
              data={countries}
              renderItem={({ item }) => (
                <GlassButton
                  style={styles.countryItemButton}
                  onPress={() => {
                    setSelectedCountry(item);
                    setShowCountryPicker(false);
                  }}
                  elevation={1}
                  borderRadius={8}
                  intensity={10}
                >
                  <View style={styles.countryItemContent}>
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={styles.countryName}>{item.name}</Text>
                    <Text style={styles.countryCode}>{item.dialCode}</Text>
                  </View>
                </GlassButton>
              )}
              keyExtractor={(item) => item.code}
              style={styles.countryList}
              contentContainerStyle={styles.countryListContent}
            />
          </View>
        </Modal>
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
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.xl,
  },
  headerCard: {
    marginHorizontal: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoEmoji: {
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
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
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
    gap: theme.spacing.sm,
  },
  countrySelector: {
    minWidth: 100,
  },
  countrySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
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
  phoneInput: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.md,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButton: {
    marginBottom: theme.spacing.lg,
  },
  buttonContent: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  termsCard: {
    marginTop: theme.spacing.sm,
  },
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
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
  countryListContent: {
    padding: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  countryItemButton: {
    marginHorizontal: theme.spacing.xs,
  },
  countryItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
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
