export interface User {
  id: string;
  phone: string;
  countryCode: string;
  name?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: Date;
  type: 'direct' | 'group';
  groupName?: string;
  groupAvatar?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  replyTo?: string;
  cardPayload?: { title: string; url: string; image?: string; action?: string } | null;
}

export interface Call {
  id: string;
  participants: User[];
  type: 'voice' | 'video';
  status: 'incoming' | 'outgoing' | 'missed' | 'ended';
  duration?: number;
  timestamp: Date;
}

export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  OTPVerification: { phone: string; countryCode: string };
  ProfileSetup: { phone: string; countryCode: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calls: undefined;
  Settings: undefined;
};

// WebRTC Types
export interface RTCConfiguration {
  iceServers: RTCIceServer[];
}

export interface CallSession {
  id: string;
  localStream: any;
  remoteStream: any;
  peerConnection: any;
  isVideo: boolean;
  participants: User[];
}
