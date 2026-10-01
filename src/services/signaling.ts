// WebSocket Signaling Client for Peer Discovery and WebRTC Negotiation

import { PeerDevice } from '../types';
import { detectDeviceOS, detectDeviceType, getDefaultDeviceName, getOrCreatePeerId } from '../utils/network';

export type PeersUpdateCallback = (peers: PeerDevice[]) => void;
export type SignalCallback = (fromPeerId: string, data: any) => void;
export type StateCallback = (connected: boolean, room: string) => void;

class SignalingService {
  private ws: WebSocket | null = null;
  private peerId: string;
  private deviceName: string;
  private room: string = 'default-lan';
  private publicKey: string | null = null;
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private onPeersUpdateCallbacks: Set<PeersUpdateCallback> = new Set();
  private onSignalCallbacks: Set<SignalCallback> = new Set();
  private onStateCallbacks: Set<StateCallback> = new Set();

  constructor() {
    this.peerId = getOrCreatePeerId();
    this.deviceName = getDefaultDeviceName();
  }

  public init(publicKey?: string) {
    if (publicKey) this.publicKey = publicKey;
    this.connect();
  }

  public setPublicKey(key: string) {
    this.publicKey = key;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.register();
    }
  }

  public getPeerId(): string {
    return this.peerId;
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public getRoom(): string {
    return this.room;
  }

  public setDeviceName(name: string) {
    this.deviceName = name;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.register();
    }
  }

  public subscribePeers(cb: PeersUpdateCallback): () => void {
    this.onPeersUpdateCallbacks.add(cb);
    return () => this.onPeersUpdateCallbacks.delete(cb);
  }

  public subscribeSignal(cb: SignalCallback): () => void {
    this.onSignalCallbacks.add(cb);
    return () => this.onSignalCallbacks.delete(cb);
  }

  public subscribeState(cb: StateCallback): () => void {
    this.onStateCallbacks.add(cb);
    return () => this.onStateCallbacks.delete(cb);
  }

  private notifyState(connected: boolean) {
    this.onStateCallbacks.forEach((cb) => cb(connected, this.room));
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) return;
    this.isConnecting = true;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnecting = false;
        this.register();
        this.notifyState(true);

        // Keepalive ping every 25 seconds
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (err) {
          console.error('Failed to parse signaling message:', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.notifyState(false);
        clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.warn('Signaling WebSocket error, will retry...', err);
        this.isConnecting = false;
      };
    } catch (err) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  private register() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        type: 'register',
        peerId: this.peerId,
        deviceName: this.deviceName,
        deviceType: detectDeviceType(),
        os: detectDeviceOS(),
        room: this.room,
        publicKey: this.publicKey,
      })
    );
  }

  public changeRoom(newRoom: string) {
    this.room = newRoom.trim() || 'default-lan';
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'change-room',
          room: this.room,
        })
      );
    }
  }

  public sendSignal(toPeerId: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'signal',
          to: toPeerId,
          data,
        })
      );
    } else {
      console.warn('Cannot send signal, WebSocket offline');
    }
  }

  private handleMessage(msg: any) {
    if (msg.type === 'peers-update' || msg.type === 'registered' || msg.type === 'room-changed') {
      const rawPeers: any[] = msg.peers || [];
      const peers: PeerDevice[] = rawPeers.map((p) => ({
        peerId: p.peerId,
        deviceName: p.deviceName,
        deviceType: p.deviceType,
        os: p.os,
        room: p.room,
        publicKey: p.publicKey,
        connectionState: 'connected',
      }));
      this.onPeersUpdateCallbacks.forEach((cb) => cb(peers));
    } else if (msg.type === 'signal') {
      this.onSignalCallbacks.forEach((cb) => cb(msg.from, msg.data));
    }
  }
}

export const signalingService = new SignalingService();
