export interface ClientToServerEvents {
  'message:send': MessageSendPayload;
  'call:init': CallInitPayload;
  'call:signal': CallSignalPayload;
}

export interface ServerToClientEvents {
  'message:receive': MessageReceivePayload;
  'incoming:call': IncomingCallPayload;
}

export interface MessageSendPayload {
  toUserId: string;
  chatId: string;
  content: string;
  type: 'text' | 'image' | 'voice';
}

export interface MessageReceivePayload {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'voice';
  createdAt: string; // ISO
}

export interface CallInitPayload {
  toUserId: string;
  chatId?: string;
  isVideo: boolean;
  metadata?: Record<string, any>;
}

export interface IncomingCallPayload {
  callId: string;
  fromUserId: string;
  isVideo: boolean;
  metadata?: Record<string, any>;
}

export type SignalType = 'offer' | 'answer' | 'candidate';

export interface CallSignalPayload {
  toUserId: string;
  callId: string;
  type: SignalType;
  data: any; // SDP or ICE
}

/*
Example payloads

// message:send
{
  "toUserId": "uuid-user-2",
  "chatId": "uuid-chat-1",
  "content": "hey!",
  "type": "text"
}

// message:receive
{
  "id": "uuid-msg-1",
  "chatId": "uuid-chat-1",
  "senderId": "uuid-user-1",
  "content": "hey!",
  "type": "text",
  "createdAt": "2025-09-24T10:00:00.000Z"
}

// call:init
{
  "toUserId": "uuid-user-2",
  "chatId": "uuid-chat-1",
  "isVideo": true,
  "metadata": { "displayName": "User 1" }
}

// incoming:call
{
  "callId": "call_abcd1234",
  "fromUserId": "uuid-user-1",
  "isVideo": true,
  "metadata": { "displayName": "User 1" }
}

// call:signal (offer)
{
  "toUserId": "uuid-user-2",
  "callId": "call_abcd1234",
  "type": "offer",
  "data": { "sdp": "<RTC_SDP_OFFER>" }
}
*/