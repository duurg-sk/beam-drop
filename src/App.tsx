/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DeviceRadar } from './components/DeviceRadar';
import { FileDropZone } from './components/FileDropZone';
import { ActiveTransfers } from './components/ActiveTransfers';
import { TransferHistory } from './components/TransferHistory';
import { SecuritySpecs } from './components/SecuritySpecs';
import { ConnectModal } from './components/ConnectModal';
import { IncomingTransferModal } from './components/IncomingTransferModal';
import { OfflineBanner } from './components/OfflineBanner';
import { ShareAppModal } from './components/ShareAppModal';
import { signalingService } from './services/signaling';
import { webrtcService } from './services/webrtc';
import { BatchTransfer, IncomingTransferRequest, PeerDevice } from './types';
import { detectDeviceOS, detectDeviceType, getDefaultDeviceName } from './utils/network';

export default function App() {
  const [activeTab, setActiveTab] = useState<'transfer' | 'history' | 'security'>('transfer');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingTransferRequest | null>(null);

  // Self identity
  const [selfDevice, setSelfDevice] = useState({
    peerId: signalingService.getPeerId(),
    deviceName: signalingService.getDeviceName(),
    os: detectDeviceOS(),
    deviceType: detectDeviceType(),
  });

  // Room state (query param ?room=... or default)
  const [currentRoom, setCurrentRoom] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r && r.trim()) return r.trim();
    } catch {
      // Ignore
    }
    return 'default-lan';
  });

  // Nearby peers
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [selectedPeer, setSelectedPeer] = useState<PeerDevice | null>(null);

  // Active batches
  const [activeBatches, setActiveBatches] = useState<BatchTransfer[]>([]);

  // Setup Service Worker and Network listeners
  useEffect(() => {
    // Register PWA Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('BeamDrop Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Initialize signaling & WebRTC services
  useEffect(() => {
    signalingService.init();

    // If initial room differs from default, join it
    if (currentRoom && currentRoom !== 'default-lan') {
      signalingService.changeRoom(currentRoom);
    }

    // Subscribe to discovered peers
    const unsubPeers = signalingService.subscribePeers((peerList) => {
      setPeers(peerList);
      // Auto select first peer if none selected or if previously selected peer left
      setSelectedPeer((prev) => {
        if (!prev) return peerList[0] || null;
        const exists = peerList.find((p) => p.peerId === prev.peerId);
        return exists || peerList[0] || null;
      });
    });

    // Setup WebRTC transfer callbacks
    webrtcService.setCallbacks({
      onIncomingRequest: (request) => {
        setIncomingRequest(request);
      },
      onBatchProgress: (batch) => {
        setActiveBatches((prev) => {
          const index = prev.findIndex((b) => b.batchId === batch.batchId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = batch;
            return next;
          }
          return [batch, ...prev];
        });
      },
      onBatchCompleted: (batch) => {
        setActiveBatches((prev) => {
          const index = prev.findIndex((b) => b.batchId === batch.batchId);
          if (index >= 0) {
            const next = [...prev];
            next[index] = batch;
            return next;
          }
          return [batch, ...prev];
        });
      },
      onBatchFailed: (batchId, error) => {
        console.error('Batch transfer failed:', batchId, error);
      },
    });

    return () => {
      unsubPeers();
    };
  }, []);

  const handleChangeRoom = (newRoom: string) => {
    setCurrentRoom(newRoom);
    signalingService.changeRoom(newRoom);

    // Update URL query parameter without reloading
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', newRoom);
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore
    }
  };

  const handleUpdateSelfName = (newName: string) => {
    signalingService.setDeviceName(newName);
    setSelfDevice((prev) => ({ ...prev, deviceName: newName }));
  };

  const handleSendBatch = async (
    peerId: string,
    peerName: string,
    files: File[],
    options?: { mode?: 'turbo' | 'double_e2ee'; compress?: boolean }
  ) => {
    try {
      await webrtcService.sendBatch(peerId, peerName, files, options);
    } catch (err: any) {
      alert(`Could not initiate transfer: ${err.message || 'Connection failed'}`);
    }
  };

  const handleAcceptIncoming = (req: IncomingTransferRequest) => {
    webrtcService.acceptTransfer(req);
    setIncomingRequest(null);
  };

  const handleDeclineIncoming = (req: IncomingTransferRequest) => {
    webrtcService.declineTransfer(req);
    setIncomingRequest(null);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const activeTransferCount = activeBatches.filter(
    (b) => b.status === 'transferring' || b.status === 'requesting'
  ).length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* 3-Zone Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenConnect={() => setIsConnectModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        peerCount={peers.length}
        currentRoom={currentRoom}
        isOnline={isOnline}
        theme={theme}
        toggleTheme={toggleTheme}
        activeTransferCount={activeTransferCount}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Offline & PWA & Notifications Banner */}
        <OfflineBanner
          isOnline={isOnline}
          onOpenShare={() => setIsShareModalOpen(true)}
        />

        {activeTab === 'transfer' && (
          <div className="space-y-6">
            {/* Device Radar and Discovery */}
            <DeviceRadar
              selfDevice={selfDevice}
              peers={peers}
              selectedPeer={selectedPeer}
              onSelectPeer={setSelectedPeer}
              onUpdateSelfName={handleUpdateSelfName}
              onOpenConnect={() => setIsConnectModalOpen(true)}
            />

            {/* Batch File Dropzone & Queue */}
            <FileDropZone
              selectedPeer={selectedPeer}
              peers={peers}
              onSelectPeer={setSelectedPeer}
              onSendBatch={handleSendBatch}
              onOpenConnect={() => setIsConnectModalOpen(true)}
            />

            {/* Active Live Transfers with Progress and Speedometer */}
            <ActiveTransfers
              batches={activeBatches}
              onPause={(id) => webrtcService.pauseTransfer(id)}
              onResume={(id) => webrtcService.resumeTransfer(id)}
              onCancel={(id) => webrtcService.cancelTransfer(id)}
            />
          </div>
        )}

        {activeTab === 'history' && <TransferHistory />}

        {activeTab === 'security' && (
          <SecuritySpecs
            currentRoom={currentRoom}
            selfDeviceName={selfDevice.deviceName}
          />
        )}
      </main>

      {/* Quiet, Single-Line Footer adhering to anti-slop rules */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">BeamDrop</span>
            <span aria-hidden="true">·</span>
            <span>Encrypted Peer-to-Peer Wi-Fi Transfer</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-slate-400">AES-GCM-256</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Room: <strong className="font-mono text-cyan-400">{currentRoom}</strong></span>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
            >
              Get / Publish App
            </button>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Pairing QR
            </button>
          </div>
        </div>
      </footer>

      {/* Share, Install & Publish Modal */}
      <ShareAppModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />

      {/* Instant Device Pairing Modal (QR Code & Live Camera Scanner & PIN) */}
      <ConnectModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        currentRoom={currentRoom}
        onChangeRoom={handleChangeRoom}
        selfDeviceName={selfDevice.deviceName}
      />

      {/* Incoming Transfer Request Confirmation Dialog */}
      <IncomingTransferModal
        request={incomingRequest}
        onAccept={handleAcceptIncoming}
        onDecline={handleDeclineIncoming}
      />
    </div>
  );
}
