import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from 'react-native-webrtc';
import { CallSession, RTCConfiguration } from '../types';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  async initializePeerConnection(): Promise<RTCPeerConnection> {
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    this.peerConnection = new RTCPeerConnection(this.configuration);

    // Handle ICE candidates
    (this.peerConnection as any).onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('ICE candidate:', event.candidate);
        // Send ICE candidate to remote peer via Socket.IO
      }
    };

    // Handle remote stream
    (this.peerConnection as any).onaddstream = (event: any) => {
      console.log('Remote stream added');
      this.remoteStream = event.stream;
    };

    // Handle connection state changes
    (this.peerConnection as any).onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
    };

    return this.peerConnection;
  }

  async getUserMedia(isVideo: boolean = true): Promise<MediaStream> {
    try {
      const constraints = {
        audio: true,
        video: isVideo ? {
          mandatory: {
            minWidth: 640,
            minHeight: 480,
            minFrameRate: 30,
          },
          facingMode: 'user',
        } : false,
      };

      const stream = await mediaDevices.getUserMedia(constraints as any);
      this.localStream = stream;
      return stream;
    } catch (error) {
      console.error('Error getting local stream:', error);
      throw error;
    }
  }

  async createOffer(): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    if (this.localStream) {
      (this.peerConnection as any).addStream(this.localStream);
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  async createAnswer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(offer);

    if (this.localStream) {
      (this.peerConnection as any).addStream(this.localStream);
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  async handleAnswer(answer: RTCSessionDescription): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(answer);
  }

  async handleIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(candidate);
  }

  switchCamera(): void {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack && (videoTrack as any)._switchCamera) {
        (videoTrack as any)._switchCamera();
      }
    }
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return !videoTrack.enabled;
      }
    }
    return false;
  }

  endCall(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
      });
      this.localStream = null;
    }

    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  getLocalStreamData(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStreamData(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnectionData(): RTCPeerConnection | null {
    return this.peerConnection;
  }
}

export const webRTCService = new WebRTCService();
