import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { GlassCard } from '../components/GlassCard';
import { theme } from '../constants/theme';

export const OTPVerificationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { phone, countryCode } = route.params as any;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Handle paste case
      const pastedOtp = value.slice(0, 6).split('');
      const newOtp = [...otp];
      pastedOtp.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus on last filled input or next empty
      const lastFilledIndex = Math.min(pastedOtp.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      alert('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      (navigation as any).navigate('ProfileSetup', {
        phone,
        countryCode,
      });
    }, 1000);
  };

  const handleResend = () => {
    if (!canResend) return;
    
    setCanResend(false);
    setResendTimer(60);
    setOtp(['', '', '', '', '', '']);
    
    // Restart timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Simulate resend API call
    alert('OTP sent successfully!');
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
            <Text style={styles.title}>Verify Your Phone</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to {countryCode} {phone}
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.inputLabel}>Enter OTP</Text>
            
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  keyboardType="number-pad"
                  maxLength={6}
                  textContentType="oneTimeCode"
                  selectTextOnFocus
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                (otp.join('').length !== 6 || isLoading) && styles.disabledButton
              ]}
              onPress={handleVerify}
              disabled={otp.join('').length !== 6 || isLoading}
            >
              <Text style={styles.verifyButtonText}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                Didn't receive the code?{' '}
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendButton}>Resend</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend in {resendTimer}s
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Change phone number</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
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
    lineHeight: 22,
  },
  card: {
    marginHorizontal: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary.start,
    backgroundColor: theme.colors.background.secondary,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary.start,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.inverse,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  resendText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  resendButton: {
    fontSize: 14,
    color: theme.colors.primary.start,
    fontWeight: '600',
  },
  timerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.primary.start,
    fontWeight: '500',
  },
});
