// Shared typescript definitions for Tarot Platform

export enum UserRole {
  CLIENT = 'CLIENT',
  TAROT_READER = 'TAROT_READER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum CallType {
  VOICE = 'VOICE',
  VIDEO = 'VIDEO',
  CHAT = 'CHAT',
}

export enum CallStatus {
  INITIATED = 'INITIATED',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  FAILED = 'FAILED',
  COMPLETED = 'COMPLETED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  CONSUMPTION = 'CONSUMPTION',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ReaderAvailability {
  ONLINE = 'ONLINE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
}

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface WalletDTO {
  id: string;
  userId: string;
  balance: number;
  updatedAt: string;
}

export interface TarotReaderDTO {
  id: string;
  userId: string;
  bio: string;
  displayName: string;
  profileImageUrl?: string;
  ratePerMinute: number;
  availability: ReaderAvailability;
}

// WebSocket Event Names
export const SocketEvents = {
  // Call signaling & Lifecycle
  CALL_REQUEST: 'call:request',
  CALL_RESPONSE: 'call:response', // accept/decline
  CALL_START: 'call:start',
  CALL_END: 'call:end',
  CALL_ERROR: 'call:error',
  
  // WebRTC Signaling
  WEBRTC_OFFER: 'webrtc:offer',
  WEBRTC_ANSWER: 'webrtc:answer',
  WEBRTC_ICE_CANDIDATE: 'webrtc:ice-candidate',

  // Wallet and Consumption
  WALLET_TICK: 'wallet:tick', // emitted every minute with current balance
  TOKEN_DEPLETED: 'wallet:depleted', // emitted when balance reaches 0, forcing call drop
  
  // Real-time Chat
  CHAT_MESSAGE: 'chat:message',
};

// WebRTC Signaling Payloads
export interface WebrtcOfferPayload {
  callId: string;
  sdp: string;
}

export interface WebrtcAnswerPayload {
  callId: string;
  sdp: string;
}

export interface WebrtcIceCandidatePayload {
  callId: string;
  candidate: any;
}
