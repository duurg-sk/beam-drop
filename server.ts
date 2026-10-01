import express from 'express';
import http from 'http';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '50mb' }));

// Global CORS headers for PWA verification, PWABuilder, and WebRTC candidate exchange
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Serve public directory statically with CORS for manifest and icon packaging
app.use(
  express.static(path.resolve(__dirname, 'public'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
    },
  })
);

// Digital Asset Links for Google Play Store / Trusted Web Activity (TWA) verification
app.get('/.well-known/assetlinks.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.beamdrop.app',
        sha256_cert_fingerprints: [
          '14:6D:E9:7C:02:CD:EA:AC:71:16:40:1E:EB:CC:C9:E9:E2:6E:84:F1:62:95:07:3E:5D:84:7B:A5:A3:C4:4F:2E',
        ],
      },
    },
  ]);
});

// Helper to get local network IP addresses
function getLocalNetworkAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// REST endpoints for local peer network info
app.get('/api/network-info', (_req, res) => {
  const localIps = getLocalNetworkAddresses();
  const appUrl = process.env.APP_URL || `http://${localIps[0] || 'localhost'}:${port}`;
  res.json({
    status: 'online',
    port,
    localIps,
    appUrl,
    timestamp: Date.now(),
  });
});

// PWA manifest route fallback if not found in public
app.get('/manifest.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.json({
    id: '/',
    start_url: '/',
    scope: '/',
    name: 'BeamDrop - Ultra-Fast Local Wi-Fi P2P File Transfer',
    short_name: 'BeamDrop',
    description: 'High-speed encrypted peer-to-peer file transfer between Windows PC and Phone over local Wi-Fi.',
    display: 'standalone',
    theme_color: '#090d16',
    background_color: '#090d16',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icon-192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon-512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  });
});

// WebSocket Signaling Server
interface PeerInfo {
  peerId: string;
  ws: WebSocket;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  room: string;
  publicKey?: string;
  lastSeen: number;
}

const peers = new Map<string, PeerInfo>();

const wss = new WebSocketServer({ server, path: '/ws' });

function getRoomPeers(room: string, excludePeerId?: string) {
  const list: Array<{
    peerId: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    os: string;
    room: string;
    publicKey?: string;
  }> = [];

  for (const peer of peers.values()) {
    if (peer.room === room && peer.peerId !== excludePeerId) {
      list.push({
        peerId: peer.peerId,
        deviceName: peer.deviceName,
        deviceType: peer.deviceType,
        os: peer.os,
        room: peer.room,
        publicKey: peer.publicKey,
      });
    }
  }
  return list;
}

function broadcastRoomUpdate(room: string) {
  for (const peer of peers.values()) {
    if (peer.room === room && peer.ws.readyState === WebSocket.OPEN) {
      peer.ws.send(
        JSON.stringify({
          type: 'peers-update',
          peers: getRoomPeers(room, peer.peerId),
        })
      );
    }
  }
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  let currentPeerId: string | null = null;
  // Automatically hash the client's public network IP to isolate local Wi-Fi networks
  const forwarded = req.headers['x-forwarded-for'];
  const rawIp = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');
  const autoLanRoom = 'lan_' + crypto.createHash('sha256').update(rawIp).digest('hex').substring(0, 8);
  let currentRoom: string = autoLanRoom;

  ws.on('message', (rawMessage: string | Buffer) => {
    try {
      const msg = JSON.parse(rawMessage.toString());

      if (msg.type === 'register' && msg.peerId) {
        const registeredPeerId: string = msg.peerId;
        currentPeerId = registeredPeerId;
        // If client requested a custom room or PIN, use it; otherwise use the private autoLanRoom
        currentRoom = (msg.room && msg.room !== 'default-lan') ? msg.room : autoLanRoom;

        peers.set(registeredPeerId, {
          peerId: registeredPeerId,
          ws,
          deviceName: msg.deviceName || 'Unknown Device',
          deviceType: msg.deviceType || 'desktop',
          os: msg.os || 'Windows',
          room: currentRoom,
          publicKey: msg.publicKey,
          lastSeen: Date.now(),
        });

        // Send registration confirmation with existing peers
        ws.send(
          JSON.stringify({
            type: 'registered',
            peerId: registeredPeerId,
            room: currentRoom,
            peers: getRoomPeers(currentRoom, registeredPeerId),
          })
        );

        // Notify others in room
        broadcastRoomUpdate(currentRoom);
      } else if (msg.type === 'change-room') {
        const oldRoom = currentRoom;
        currentRoom = msg.room || 'default-lan';
        if (currentPeerId && peers.has(currentPeerId)) {
          const peer = peers.get(currentPeerId)!;
          peer.room = currentRoom;
          broadcastRoomUpdate(oldRoom);
          broadcastRoomUpdate(currentRoom);
          ws.send(
            JSON.stringify({
              type: 'room-changed',
              room: currentRoom,
              peers: getRoomPeers(currentRoom, currentPeerId),
            })
          );
        }
      } else if (msg.type === 'signal') {
        // Forward WebRTC SDP offer, answer, or ICE candidate to destination peer
        const targetPeer = peers.get(msg.to);
        if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
          targetPeer.ws.send(
            JSON.stringify({
              type: 'signal',
              from: currentPeerId,
              data: msg.data,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: 'signal-error',
              to: msg.to,
              error: 'Target peer offline or disconnected',
            })
          );
        }
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (currentPeerId && peers.has(currentPeerId)) {
      const room = peers.get(currentPeerId)!.room;
      peers.delete(currentPeerId);
      broadcastRoomUpdate(room);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`BeamDrop server running on http://0.0.0.0:${port}`);
  });
}

startServer();
