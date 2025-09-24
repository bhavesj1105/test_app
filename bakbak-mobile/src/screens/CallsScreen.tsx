import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LightGlassCard, MediumGlassCard, GlassButton } from '../components/GlassCard';
import FullScreenCall from '../components/FullScreenCall';
import { theme } from '../constants/theme';

const { width } = Dimensions.get('window');

// Mock data for call history
const mockCalls: Call[] = [
  {
    id: 1,
    name: 'Sarah ✨',
    avatar: 'https://i.pravatar.cc/150?img=1',
    type: 'incoming' as const,
    status: 'missed' as const,
    timestamp: '2m ago',
    duration: null,
  },
  {
    id: 2,
    name: 'Alex 🌟',
    avatar: 'https://i.pravatar.cc/150?img=2',
    type: 'outgoing' as const,
    status: 'completed' as const,
    timestamp: '1h ago',
    duration: '3:24',
  },
  {
    id: 3,
    name: 'Jordan 💫',
    avatar: 'https://i.pravatar.cc/150?img=3',
    type: 'incoming' as const,
    status: 'completed' as const,
    timestamp: '3h ago',
    duration: '12:45',
  },
  {
    id: 4,
    name: 'Maya 🦋',
    avatar: 'https://i.pravatar.cc/150?img=4',
    type: 'outgoing' as const,
    status: 'missed' as const,
    timestamp: '1d ago',
    duration: null,
  },
  {
    id: 5,
    name: 'Riley 🎭',
    avatar: 'https://i.pravatar.cc/150?img=5',
    type: 'incoming' as const,
    status: 'completed' as const,
    timestamp: '2d ago',
    duration: '8:12',
  },
];

interface Call {
  id: number;
  name: string;
  avatar: string;
  type: 'incoming' | 'outgoing';
  status: 'completed' | 'missed';
  timestamp: string;
  duration: string | null;
}

export const CallsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [showIncomingCall, setShowIncomingCall] = useState(false);

  const getCallIcon = (type: string, status: string) => {
    if (status === 'missed') {
      return { name: 'call' as const, color: '#FF5252' };
    }
    if (type === 'incoming') {
      return { name: 'call-outline' as const, color: '#4CAF50' };
    }
    return { name: 'call-outline' as const, color: theme.colors.text.secondary };
  };

  const renderCallItem = ({ item }: { item: Call }) => {
    const iconInfo = getCallIcon(item.type, item.status);
    
    return (
      <TouchableOpacity
        onPress={() => {
          // Handle call back
          console.log('Calling back:', item.name);
        }}
      >
        <LightGlassCard 
          style={styles.callCard} 
          elevation={3} 
          borderRadius={16}
        >
          <View style={styles.callContent}>
            {/* Avatar */}
            <Image 
              source={{ uri: item.avatar }} 
              style={styles.avatar}
            />

            {/* Call Info */}
            <View style={styles.callInfo}>
              <Text style={styles.contactName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.callDetails}>
                <Ionicons 
                  name={iconInfo.name} 
                  size={14} 
                  color={iconInfo.color}
                />
                <Text style={[styles.callStatus, { color: iconInfo.color }]}>
                  {item.status === 'missed' ? 'Missed' : item.duration || 'Connected'}
                </Text>
                <Text style={styles.timestamp}>• {item.timestamp}</Text>
              </View>
            </View>

            {/* Call Actions */}
            <View style={styles.callActions}>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => {
                  // Start video call
                  setShowIncomingCall(true);
                }}
              >
                <Ionicons name="videocam" size={20} color={theme.colors.primary.start} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.callButton}
                onPress={() => {
                  // Start voice call
                  setShowIncomingCall(true);
                }}
              >
                <Ionicons name="call" size={18} color={theme.colors.primary.start} />
              </TouchableOpacity>
            </View>
          </View>
        </LightGlassCard>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MediumGlassCard style={styles.emptyCard} elevation={4} borderRadius={20}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>📞</Text>
          <Text style={styles.emptyTitle}>No calls yet!</Text>
          <Text style={styles.emptySubtitle}>
            Ring ring! Time to connect with your squad 🌟
          </Text>
          <GlassButton
            style={styles.startCallButton}
            onPress={() => {/* Handle start call */}}
            elevation={4}
            borderRadius={12}
          >
            <View style={styles.startCallContent}>
              <Ionicons name="call" size={20} color={theme.colors.text.primary} />
              <Text style={styles.startCallText}>Make First Call</Text>
            </View>
          </GlassButton>
        </View>
      </MediumGlassCard>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.colors.primary.gradient as any}
      style={styles.container}
    >
      {/* Fun Header Messages */}
      <View style={styles.headerMessages}>
        <Text style={styles.welcomeMessage}>
          Ready to catch up with the crew? Let's vibe! 📱✨
        </Text>
      </View>

      {/* Call History List */}
      <FlatList
        data={mockCalls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.callList,
          mockCalls.length === 0 && styles.emptyList
        ]}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Incoming Call Overlay */}
      {showIncomingCall && (
        <FullScreenCall
          contactName="Sarah ✨"
          contactAvatar="https://i.pravatar.cc/150?img=1"
          onAccept={() => {
            setShowIncomingCall(false);
            (navigation.getParent() as any)?.navigate('CallInProgress', {
              contactName: 'Sarah ✨',
              contactAvatar: 'https://i.pravatar.cc/150?img=1',
              isVideo: false,
            });
          }}
          onDecline={() => setShowIncomingCall(false)}
        />
      )}
    </LinearGradient>
  );
};

// Removed local IncomingCallOverlay in favor of shared component

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerMessages: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  welcomeMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  callList: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  callCard: {
    marginHorizontal: theme.spacing.xs,
  },
  callContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: theme.spacing.md,
  },
  callInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  callActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  emptyCard: {
    marginHorizontal: theme.spacing.sm,
  },
  emptyContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  startCallButton: {
    paddingHorizontal: theme.spacing.lg,
  },
  startCallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  startCallText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  // Incoming Call Overlay Styles
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
