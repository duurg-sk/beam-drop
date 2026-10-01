import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  QrCode,
  Camera,
  KeyRound,
  Copy,
  Check,
  WifiOff,
  Smartphone,
  Laptop,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { generatePinCode } from '../utils/network';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  onChangeRoom: (newRoom: string) => void;
  selfDeviceName: string;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  onChangeRoom,
  selfDeviceName,
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'scanner' | 'pin' | 'offline'>('qr');
  const [pinInput, setPinInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Camera scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scanAnimFrameRef = useRef<number | null>(null);

  // Compute pairing URL
  useEffect(() => {
    if (!isOpen) return;

    const base = window.location.origin;
    const url = `${base}?room=${encodeURIComponent(currentRoom)}`;
    setQrUrl(url);

    if (qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        url,
        {
          width: 220,
          margin: 1.5,
          color: {
            dark: '#090d16',
            light: '#38bdf8',
          },
        },
        (err) => {
          if (err) console.error('QR code generation error:', err);
        }
      );
    }
  }, [isOpen, currentRoom, activeTab]);

  // Handle Camera QR Scanner
  useEffect(() => {
    if (activeTab !== 'scanner' || !isOpen) {
      stopCamera();
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [activeTab, isOpen]);

  const startCamera = async () => {
    setScannerError(null);
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        requestAnimationFrame(tickScanner);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setScannerError('Camera access unavailable. Please grant camera permission or use the 6-digit PIN code.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (scanAnimFrameRef.current) {
      cancelAnimationFrame(scanAnimFrameRef.current);
      scanAnimFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const tickScanner = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      const canvas = scannerCanvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleScannedUrl(code.data);
            return;
          }
        }
      }
    }
    scanAnimFrameRef.current = requestAnimationFrame(tickScanner);
  };

  const handleScannedUrl = (scannedText: string) => {
    try {
      let targetRoom = scannedText;
      if (scannedText.includes('room=')) {
        const url = new URL(scannedText);
        const r = url.searchParams.get('room');
        if (r) targetRoom = r;
      }
      stopCamera();
      onChangeRoom(targetRoom);
      onClose();
    } catch {
      stopCamera();
      onChangeRoom(scannedText);
      onClose();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoinPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim()) {
      onChangeRoom(pinInput.trim());
      setPinInput('');
      onClose();
    }
  };

  const handleGenerateNewPin = () => {
    const newPin = generatePinCode();
    onChangeRoom(newPin);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <QrCode className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Instant Device Pairing</h3>
              <p className="text-[11px] text-slate-400">Connect Windows PC with Phone over Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="mt-4 flex rounded-lg border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'qr' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            QR Code
          </button>
          <button
            onClick={() => setActiveTab('scanner')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'scanner' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Scan with Camera
          </button>
          <button
            onClick={() => setActiveTab('pin')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'pin' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Enter PIN
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              activeTab === 'offline' ? 'bg-slate-800 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline LAN
          </button>
        </div>

        {/* Tab Content 1: QR Code */}
        {activeTab === 'qr' && (
          <div className="mt-5 flex flex-col items-center text-center">
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 shadow-inner">
              <canvas ref={qrCanvasRef} className="rounded-lg" />
            </div>

            <p className="mt-3 text-xs text-slate-300 font-medium">
              Point your phone camera at this QR code to join
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Both devices connect instantly via WebRTC peer-to-peer
            </p>

            {/* Room PIN Code display */}
            <div className="mt-4 flex items-center justify-between w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2">
              <div className="text-left">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider">Pairing Room PIN</span>
                <span className="font-mono text-base font-bold tracking-widest text-cyan-400 tabular-nums">
                  {currentRoom}
                </span>
              </div>
              <button
                onClick={handleGenerateNewPin}
                title="Generate new isolated private PIN"
                className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-[11px] text-slate-300 hover:border-slate-600 hover:text-white"
              >
                <RefreshCw className="h-3 w-3" />
                <span>New PIN</span>
              </button>
            </div>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copied to Clipboard</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-400" />
                  <span>Copy Direct Join Link</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab Content 2: Live Camera QR Scanner */}
        {activeTab === 'scanner' && (
          <div className="mt-5 flex flex-col items-center">
            {scannerError ? (
              <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 p-4 text-center text-xs text-rose-300">
                <p>{scannerError}</p>
                <button
                  onClick={startCamera}
                  className="mt-3 rounded bg-rose-900/40 px-3 py-1 text-xs text-white hover:bg-rose-900/60"
                >
                  Retry Camera
                </button>
              </div>
            ) : (
              <div className="relative w-full overflow-hidden rounded-xl border border-cyan-500/40 bg-black aspect-square flex items-center justify-center">
                <video ref={videoRef} className="h-full w-full object-cover" />
                <canvas ref={scannerCanvasRef} className="hidden" />

                {/* Viewfinder target */}
                <div className="pointer-events-none absolute inset-8 rounded-lg border-2 border-dashed border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-pulse" />

                <div className="pointer-events-none absolute bottom-3 rounded-md bg-slate-950/80 px-3 py-1 text-[11px] text-cyan-300">
                  Align device QR code inside the frame
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content 3: PIN Code Entry */}
        {activeTab === 'pin' && (
          <form onSubmit={handleJoinPin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Enter 6-Digit Pairing PIN or Room Name
              </label>
              <input
                type="text"
                placeholder="e.g. 582914 or livingroom"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 font-mono text-sm tracking-wider text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                autoFocus
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter the PIN code displayed on the other device's screen.
              </p>
            </div>

            <button
              type="submit"
              disabled={!pinInput.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40 transition-colors"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Connect to Room</span>
            </button>
          </form>
        )}

        {/* Tab Content 4: Offline LAN Info */}
        {activeTab === 'offline' && (
          <div className="mt-5 space-y-3 text-xs text-slate-300">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <WifiOff className="h-4 w-4 text-cyan-400" />
                <span>Zero-Internet LAN Operation</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                BeamDrop uses pure local Wi-Fi peer-to-peer data channels. You can use it even when your Wi-Fi router has no internet connection or while connected to a mobile hotspot!
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-1.5">
              <span className="font-semibold text-white block">Offline Steps:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Connect Windows PC and Phone to the same Wi-Fi or Hotspot.</li>
                <li>Open this app on both devices (the PWA works offline).</li>
                <li>Both devices will discover each other and stream directly at full Wi-Fi line rate.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
