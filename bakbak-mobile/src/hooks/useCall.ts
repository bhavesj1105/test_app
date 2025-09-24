import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { socketService } from '../services/socket';

type SignalType = 'offer' | 'answer' | 'candidate';

export interface UseCallOptions {
  isVideo?: boolean;
}

export interface UseCallResult {
  inCall: boolean;
  ringing: boolean;
  isVideo: boolean;
  callId?: string;
  remoteUserId?: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (calleeId: string, opts?: { isVideo?: boolean }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => boolean;
  toggleVideo: () => boolean;
  switchCamera: () => void;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useCall(options: UseCallOptions = {}): UseCallResult {
  const [inCall, setInCall] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [isVideo, setIsVideo] = useState(!!options.isVideo);
  const [callId, setCallId] = useState<string | undefined>();
  const [remoteUserId, setRemoteUserId] = useState<string | undefined>();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const offerRef = useRef<RTCSessionDescription | null>(null);
  const isCallerRef = useRef(false);

  const createPeer = useCallback(() => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
    }
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS } as any);

    (pc as any).onicecandidate = (event: any) => {
      if (event.candidate && callId && remoteUserId) {
        socketService.sendCallSignal({ calleeId: remoteUserId, callId, type: 'candidate', data: event.candidate });
      }
    };

    (pc as any).onaddstream = (event: any) => {
      setRemoteStream(event.stream);
    };

    (pc as any).onconnectionstatechange = () => {
      const state = (pc as any).connectionState;
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [callId, remoteUserId]);

  const getMedia = useCallback(async (video: boolean) => {
    const constraints: any = {
      audio: true,
      video: video ? {
        mandatory: { minWidth: 640, minHeight: 480, minFrameRate: 24 },
        facingMode: 'user',
      } : false,
    };
    const stream = await mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(async (calleeId: string, opts?: { isVideo?: boolean }) => {
    const video = opts?.isVideo ?? isVideo;
    setIsVideo(video);
    isCallerRef.current = true;
    const pc = createPeer();
    const stream = await getMedia(video);
    (pc as any).addStream(stream);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const newCallId = `call_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setCallId(newCallId);
    setRemoteUserId(calleeId);
    setRinging(true);

    socketService.sendCallInit({ calleeId, callId: newCallId, isVideo: video });
    // send offer
    socketService.sendCallSignal({ calleeId, callId: newCallId, type: 'offer', data: offer });
  }, [createPeer, getMedia, isVideo]);

  const acceptCall = useCallback(async () => {
    if (!offerRef.current || !remoteUserId || !callId) return;
    const pc = createPeer();
    const stream = await getMedia(isVideo);
    (pc as any).addStream(stream);
    await pc.setRemoteDescription(offerRef.current);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketService.sendCallSignal({ calleeId: remoteUserId, callId, type: 'answer', data: answer });
    // flush pending candidates
    for (const cand of pendingCandidatesRef.current) {
      await pc.addIceCandidate(new RTCIceCandidate(cand) as any);
    }
    pendingCandidatesRef.current = [];
    setInCall(true);
    setRinging(false);
  }, [callId, createPeer, getMedia, isVideo, remoteUserId]);

  const rejectCall = useCallback(() => {
    // optional: signal reject over socket (legacy events exist)
    endCall();
    setRinging(false);
  }, []);

  const endCall = useCallback(() => {
    try {
      localStream?.getTracks().forEach(t => t.stop());
    } catch {}
    try {
      remoteStream?.getTracks().forEach(t => t.stop());
    } catch {}
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setInCall(false);
    setRinging(false);
    setCallId(undefined);
    setRemoteUserId(undefined);
    isCallerRef.current = false;
  }, [localStream, remoteStream]);

  const toggleMute = useCallback(() => {
    const track = localStream?.getAudioTracks()?.[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return !track.enabled;
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    const track = localStream?.getVideoTracks()?.[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return !track.enabled;
  }, [localStream]);

  const switchCamera = useCallback(() => {
    const track = (localStream?.getVideoTracks?.() || [])[0] as any;
    if (track && track._switchCamera) track._switchCamera();
  }, [localStream]);

  // Socket listeners
  useEffect(() => {
    const onIncoming = (payload: { callId: string; fromUserId: string; isVideo: boolean; metadata?: any }) => {
      setRinging(true);
      setIsVideo(!!payload.isVideo);
      setCallId(payload.callId);
      setRemoteUserId(payload.fromUserId);
      isCallerRef.current = false;
    };
    const onSignal = async (payload: { fromUserId: string; callId: string; type: SignalType; data: any }) => {
      if (!pcRef.current && (payload.type === 'answer' || payload.type === 'candidate')) {
        // queue until acceptCall() sets up pc
        if (payload.type === 'candidate') pendingCandidatesRef.current.push(payload.data);
        if (payload.type === 'answer') {
          // store to apply right after pc exists
          // alternatively could ignore until after accept
        }
        return;
      }
      const pc = pcRef.current;
      if (!pc) return;
      if (payload.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.data) as any);
        setInCall(true);
        setRinging(false);
      } else if (payload.type === 'offer') {
        // store offer until user accepts
        offerRef.current = new RTCSessionDescription(payload.data) as any;
      } else if (payload.type === 'candidate') {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.data) as any);
        } catch (e) {
          // if pc not ready, queue
          pendingCandidatesRef.current.push(payload.data);
        }
      }
    };

    socketService.onIncomingCall(onIncoming);
    socketService.onCallSignal(onSignal);
    return () => {
      // No explicit off in current wrapper; in production, please expose 'off' APIs
    };
  }, []);

  return {
    inCall,
    ringing,
    isVideo,
    callId,
    remoteUserId,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  };
}

export default useCall;
