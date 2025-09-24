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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import LottieView from '../components/Lottie';
import { 
  GlassCard, 
  GlassButton, 
  LightGlassCard, 
  MediumGlassCard,
} from '../components/GlassCard';
import { theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface RouteParams {
  phoneNumber: string;
  countryCode: string;
  otpId: string;
}

export const OtpScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phoneNumber, countryCode, otpId } = route.params as RouteParams;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [countdown, setCountdown] = useState(30);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Refs for OTP inputs
  const otpRefs = useRef<TextInput[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    // Animate screen entrance
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsResendDisabled(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-submit when OTP is complete
    if (otp.every(digit => digit !== '')) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    // Handle backspace
    if (key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      Alert.alert('Incomplete OTP 🤔', 'Please enter all 6 digits bestie!');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3000/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          otpId,
          otpCode,
          phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT token
        await SecureStore.setItemAsync('authToken', data.token);
        await SecureStore.setItemAsync('userId', data.user.id.toString());
        
        // Show success animation
        setShowSuccess(true);
        
  Animated.sequence([
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(successAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Navigate based on user profile status
          if (data.user.isProfileComplete) {
            (navigation as any).reset({ index: 0, routes: [{ name: 'Main' }] });
          } else {
            (navigation as any).navigate('ProfileSetup', { phone: phoneNumber, countryCode });
          }
        });
      } else {
        Alert.alert('Invalid OTP 😅', data.message || 'That code is not right. Try again!');
        // Clear OTP on error
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert('Network Error 📡', 'Check your connection and try again!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (isResendDisabled) return;

    setIsLoading(true);
    setIsResendDisabled(true);
    setCountdown(30);

    try {
      const response = await fetch('http://localhost:3000/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          countryCode,
        }),
      });

      if (response.ok) {
        Alert.alert('OTP Sent! 📱', 'Check your messages for the new code!');
        
        // Restart countdown
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              setIsResendDisabled(false);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        Alert.alert('Error 😕', 'Could not send OTP. Try again!');
        setIsResendDisabled(false);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Network Error 📡', 'Check your connection and try again!');
      setIsResendDisabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const maskedPhoneNumber = phoneNumber.replace(/(\+\d{1,3})(\d{3})(\d*)(\d{4})/, '$1 $2***$4');

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
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <LightGlassCard style={styles.iconCard} elevation={2} borderRadius={12}>
              <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
            </LightGlassCard>
          </TouchableOpacity>

          {/* Header */}
          <MediumGlassCard style={styles.headerCard} elevation={4} borderRadius={24}>
            <View style={styles.header}>
              <View style={styles.emojiContainer}>
                <Text style={styles.headerEmoji}>📱</Text>
              </View>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                We've sent a 6-digit code to
              </Text>
              <Text style={styles.phoneText}>
                {maskedPhoneNumber}
              </Text>
              <Text style={styles.hintText}>
                📩 Check your messages! It might take a sec...
              </Text>
            </View>
          </MediumGlassCard>

          {/* OTP Input */}
          <MediumGlassCard style={styles.otpCard} elevation={8} borderRadius={24}>
            <Text style={styles.otpTitle}>Drop that code! 🔢</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <LightGlassCard 
                  key={index}
                  style={digit 
                    ? { ...styles.otpInputCard, ...styles.otpInputFilled }
                    : styles.otpInputCard
                  } 
                  elevation={3} 
                  borderRadius={12}
                >
                  <TextInput
                    ref={(ref) => { if (ref) otpRefs.current[index] = ref; }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                </LightGlassCard>
              ))}
            </View>

            {/* Resend Timer */}
            <View style={styles.resendSection}>
              {isResendDisabled ? (
                <Text style={styles.timerText}>
                  Resend in {formatCountdown(countdown)} ⏱️
                </Text>
              ) : (
                <GlassButton
                  style={styles.resendButton}
                  onPress={handleResendOTP}
                  disabled={isLoading}
                  elevation={4}
                  borderRadius={12}
                  intensity={15}
                >
                  <Text style={styles.resendButtonText}>
                    Resend Code 🚀
                  </Text>
                </GlassButton>
              )}
            </View>

            {/* Manual Verify Button (for incomplete OTP) */}
            {!otp.every(digit => digit !== '') && (
              <GlassButton
                style={otp.join('').length < 6 
                  ? { ...styles.verifyButton, opacity: 0.6 }
                  : styles.verifyButton
                }
                onPress={handleVerifyOTP}
                disabled={otp.join('').length < 6 || isLoading}
                elevation={6}
                borderRadius={16}
                intensity={20}
              >
                <View style={styles.buttonContent}>
                  <Text style={styles.verifyButtonText}>
                    {isLoading ? 'Verifying... ⚡' : 'Verify Code'}
                  </Text>
                  {!isLoading && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.text.primary} />
                  )}
                </View>
              </GlassButton>
            )}

            {/* Auto-verify indicator */}
            {otp.every(digit => digit !== '') && (
              <View style={styles.autoVerifyIndicator}>
                <Text style={styles.autoVerifyText}>
                  Auto-verifying... ⚡
                </Text>
              </View>
            )}
          </MediumGlassCard>

          {/* Fun Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Having trouble? Check your signal! 📶
            </Text>
          </View>
        </Animated.View>

        {/* Success Animation Overlay */}
        {showSuccess && (
          <Animated.View 
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
                transform: [{
                  scale: successAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1]
                  })
                }]
              }
            ]}
          >
            <MediumGlassCard style={styles.successCard} elevation={12} borderRadius={24}>
              <View style={styles.successContent}>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                </View>
                <Text style={styles.successTitle}>Verified! ✨</Text>
                <Text style={styles.successSubtitle}>
                  Welcome to the fam! 🫶
                </Text>
              </View>
            </MediumGlassCard>
          </Animated.View>
        )}
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
    gap: theme.spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: theme.spacing.lg,
    zIndex: 10,
  },
  iconCard: {
    padding: theme.spacing.sm,
  },
  headerCard: {
    marginTop: Platform.OS === 'ios' ? 100 : 80,
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
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  phoneText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary.start,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  hintText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  otpCard: {
    marginHorizontal: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  otpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  otpInputCard: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 50,
  },
  otpInputFilled: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  otpInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  resendSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  timerText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  resendButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
  },
  verifyButton: {
    marginBottom: theme.spacing.md,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  autoVerifyIndicator: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  autoVerifyText: {
    fontSize: 14,
    color: theme.colors.primary.start,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successCard: {
    width: '100%',
    maxWidth: 300,
  },
  successContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  successIconContainer: {
    marginBottom: theme.spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});
