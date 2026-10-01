export type DeviceType = 'desktop' | 'mobile' | 'tablet';
export type DeviceOS = 'windows' | 'android' | 'ios' | 'macos' | 'linux' | 'unknown';

export interface PeerDevice {
  peerId: string;
  deviceName: string;
  deviceType: DeviceType;
  os: DeviceOS;
  room: string;
  publicKey?: string;
  isSelf?: boolean;
  connectionState?: 'connected' | 'connecting' | 'disconnected';
  lastSeen?: number;
}

export type TransferStatus = 'queued' | 'requesting' | 'transferring' | 'paused' | 'completed' | 'failed' | 'declined' | 'cancelled';
export type TransferDirection = 'send' | 'receive';

export interface TransferFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  bytesTransferred: number;
  progress: number; // 0 to 100
  status: TransferStatus;
  speedBps: number; // Bytes per second
  etaSeconds: number;
  error?: string;
  file?: File; // For sender
  receivedChunks?: ArrayBuffer[]; // For receiver
  downloadUrl?: string; // For receiver once done
  hash?: string; // SHA-256 integrity hash
  encrypted?: boolean;
  resumeOffset?: number; // Starting byte offset if transfer was resumed
}

export interface BatchTransfer {
  batchId: string;
  peerId: string;
  peerName: string;
  direction: TransferDirection;
  items: TransferFileItem[];
  totalBytes: number;
  bytesTransferred: number;
  overallProgress: number; // 0 to 100
  status: TransferStatus;
  startTime: number;
  endTime?: number;
  speedBps: number;
  peakSpeedBps?: number;
  etaSeconds: number;
  encrypted: boolean;
  encryptionKey?: CryptoKey;
  transferMode?: 'turbo' | 'double_e2ee';
  compress?: boolean;
  bottleneck?: string;
}

export interface HistoryRecord {
  id: string;
  batchId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  direction: TransferDirection;
  peerName: string;
  peerDeviceType: DeviceType;
  peerOs: DeviceOS;
  status: 'completed' | 'failed' | 'cancelled';
  avgSpeedBps: number;
  durationMs: number;
  timestamp: number;
  encrypted: boolean;
  hashVerified?: boolean;
  blobKey?: string; // Key in IndexedDB blob store if retained
  hasBlob?: boolean;
}

export interface IncomingTransferRequest {
  batchId: string;
  fromPeerId: string;
  fromPeerName: string;
  fromDeviceType: DeviceType;
  fromOs: DeviceOS;
  items: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
  totalBytes: number;
  encrypted: boolean;
  transferKey?: string;
  transferMode?: 'turbo' | 'double_e2ee';
  compress?: boolean;
  timestamp: number;
}
