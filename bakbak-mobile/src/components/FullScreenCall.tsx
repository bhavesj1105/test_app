import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MediumGlassCard } from './GlassCard';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

interface IncomingCallOverlayProps {
  contactName: string;
  contactAvatar: string;
  onAccept: () => void;
  onDecline: () => void;
}

export const FullScreenCall: React.FC<IncomingCallOverlayProps> = ({
  contactName,
  contactAvatar,
  onAccept,
  onDecline,
}) => {
  return (
    <View style={styles.incomingCallOverlay}>
      <LinearGradient
        colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.9)"]}
        style={styles.incomingCallGradient}
      >
        <MediumGlassCard style={styles.incomingCallCard} elevation={8} borderRadius={24}>
          <View style={styles.incomingCallContent}>
            <Text style={styles.incomingCallLabel}>Incoming call</Text>

            <Image source={{ uri: contactAvatar }} style={styles.incomingAvatar} />

            <Text style={styles.incomingCallerName}>{contactName}</Text>
            <Text style={styles.incomingCallSubtitle}>is calling you... 📞</Text>

            <View style={styles.callActionButtons}>
              <TouchableOpacity style={[styles.actionButton, styles.declineButton]} onPress={onDecline}>
                <Ionicons name="call" size={28} color="white" style={styles.declineIcon} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={onAccept}>
                <Ionicons name="call" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </MediumGlassCard>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  incomingCallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  incomingCallGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCallCard: {
    marginHorizontal: theme.spacing.lg,
    minWidth: width - theme.spacing.lg * 2,
  },
  incomingCallContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  incomingCallLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  incomingAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.lg,
  },
  incomingCallerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  incomingCallSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  callActionButtons: {
    flexDirection: 'row',
    gap: 60,
    marginTop: theme.spacing.lg,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  declineButton: {
    backgroundColor: '#FF5252',
  },
  declineIcon: {
    transform: [{ rotate: '135deg' }],
  },
});

export default FullScreenCall;