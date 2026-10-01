import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Smartphone,
  Laptop,
  Globe,
  ExternalLink,
  Layers,
  ShieldCheck,
  Terminal,
  Play,
  Lock,
  HelpCircle,
  Monitor,
  Apple,
  FolderArchive,
} from 'lucide-react';
import QRCode from 'qrcode';

interface ShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
}

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'install' | 'desktop' | 'share' | 'publish' | 'selfhost'>('install');
  const [copied, setCopied] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine current live URL or Shared App URL
  const appUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://ais-pre-pgrvqcwqivufzdgnc4zzi2-420343572753.asia-southeast1.run.app';

  useEffect(() => {
    if (isOpen && activeTab === 'share' && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        appUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#080d1a',
            light: '#38bdf8',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, activeTab, appUrl]);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BeamDrop - Ultra-Fast Local Wi-Fi File Transfer',
          text: 'Share huge files between Windows PC and Android/iOS cable-free with end-to-end encryption.',
          url: appUrl,
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        onClose();
      }
    } else {
      alert(
        'To install manually:\n• On Windows: Click the "Install" icon in Edge/Chrome address bar or browser menu → Apps → Install BeamDrop.\n• On Android: Tap Chrome menu (⋮) → "Install app" or "Add to Home screen".'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header with App Icon */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <img
              src="/icon-192.png"
              alt="BeamDrop App Icon"
              className="h-10 w-10 rounded-xl border border-cyan-500/30 object-cover shadow-sm bg-slate-950"
              onError={(e) => {
                // Fallback to SVG if PNG loading
                (e.currentTarget as HTMLImageElement).src = '/icon-192.svg';
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">BeamDrop App & Downloads</h3>
                <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300 font-mono">
                  v1.2 Desktop
                </span>
              </div>
              <p className="text-xs text-slate-400">Install as standalone desktop app (.exe / .app) or share on local Wi-Fi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security & Privacy Banner */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Privacy Guaranteed:</strong> Transfers are 100% peer-to-peer. Zero files touch any server.
            </span>
          </div>
          <button
            onClick={() => setShowFaq(!showFaq)}
            className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px] underline flex items-center gap-1 shrink-0 ml-2"
          >
            <HelpCircle className="h-3 w-3" />
            <span>{showFaq ? 'Hide FAQ' : 'Is it safe?'}</span>
          </button>
        </div>

        {/* Collapsible FAQ Callout */}
        {showFaq && (
          <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 text-[11px] text-slate-300 space-y-2">
            <div>
              <strong className="text-white">Q: If I share this link, can anyone see my private files?</strong>
              <p className="text-slate-400 mt-0.5">
                <strong>No, absolutely not.</strong> Files are never uploaded to any server. File transfers occur directly between your two devices over local Wi-Fi with AES-GCM 256-bit encryption. A transfer cannot start unless the receiving device clicks "Accept".
              </p>
            </div>
            <div>
              <strong className="text-white">Q: Can strangers on the internet see my device on their radar?</strong>
              <p className="text-slate-400 mt-0.5">
                <strong>No.</strong> BeamDrop isolates local network discovery by your Wi-Fi router's public IP subnet. Strangers on other Wi-Fi networks will never see your phone or laptop on their radar.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-6 gap-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'install'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="h-3.5 w-3.5" />
            <span>1-Click Install</span>
          </button>

          <button
            onClick={() => setActiveTab('desktop')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'desktop'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="h-3.5 w-3.5 text-cyan-400" />
            <span>Desktop (.exe & .app)</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'share'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Share Link & QR</span>
          </button>

          <button
            onClick={() => setActiveTab('publish')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'publish'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="h-3.5 w-3.5" />
            <span>Android APK</span>
          </button>

          <button
            onClick={() => setActiveTab('selfhost')}
            className={`py-3 px-3 transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'selfhost'
                ? 'border-cyan-400 text-cyan-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Self-Host Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-slate-300 text-xs">
          {/* TAB 1: 1-CLICK INSTALL AS STANDALONE APP */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/icon-192.png"
                      alt="Icon"
                      className="h-12 w-12 rounded-xl border border-cyan-500/40 object-cover shadow"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/icon-192.svg';
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        1-Click Standalone Install
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Installs BeamDrop directly into Windows Start Menu, Taskbar, or Android Home Screen with zero browser frames.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleTriggerInstall}
                    className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Install Now</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Windows 10/11 Guide */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Laptop className="h-4 w-4 text-cyan-400" />
                    <span>Windows 10 / 11 Desktop</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                    <li>Open this URL in <strong>Microsoft Edge</strong> or <strong>Google Chrome</strong>.</li>
                    <li>Look at the address bar on the right for the <strong>Install Icon (⊕ or 💻)</strong>.</li>
                    <li>Click <strong>Install</strong> to add BeamDrop to your Start Menu, Taskbar, and desktop!</li>
                    <li>Runs in its own borderless window with full file drag & drop support.</li>
                  </ol>
                </div>

                {/* Android Phone Guide */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>Android Phone & Tablet</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
                    <li>Open this link in <strong>Chrome on Android</strong>.</li>
                    <li>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner.</li>
                    <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                    <li>Installs with native app icon, offline caching, and Screen WakeLock!</li>
                  </ol>
                </div>
              </div>

              {/* iOS / Mac Guide */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>On iPhone/iPad (Safari): Tap the <strong>Share</strong> button (box with arrow) → <strong>Add to Home Screen</strong>.</span>
                </span>
                <span className="font-mono text-emerald-400 text-[10px]">PWA Ready</span>
              </div>
            </div>
          )}

          {/* TAB 2: DESKTOP APPS (.EXE & .APP) */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3.5 text-[11px] text-slate-200 space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-cyan-300 text-xs">
                  <Monitor className="h-4 w-4" />
                  <span>Native Desktop Executables (.exe for Windows & .app for Mac)</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  BeamDrop includes full <strong>Electron</strong> and <strong>PWA</strong> desktop wrappers. You can run BeamDrop as a native desktop application in two ways:
                </p>
              </div>

              {/* Windows .exe Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-cyan-400" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">Windows Executable (.exe)</h4>
                      <span className="text-[10px] text-slate-500 font-mono">BeamDrop-Setup.exe / BeamDrop-Portable.exe</span>
                    </div>
                  </div>
                  <span className="rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-400">
                    Windows 10 / 11
                  </span>
                </div>

                <div className="space-y-2 text-slate-300 text-[11px]">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-cyan-300 block">Option A: Instant .exe without compiling (Fastest)</strong>
                    <p className="text-slate-400">
                      When you click <strong>"Install"</strong> in Edge or Chrome, Windows automatically generates a native application executable (<code>msedge_proxy.exe / chrome_proxy.exe</code>) mapped to BeamDrop in your Start Menu and Desktop. It opens in a borderless window with zero browser bars.
                    </p>
                    <button
                      onClick={handleTriggerInstall}
                      className="mt-1 flex items-center gap-1.5 rounded bg-cyan-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
                    >
                      <Download className="h-3 w-3" />
                      <span>Install Windows App Now</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-cyan-300 block">Option B: Compile Standalone .exe (Electron / Installer)</strong>
                    <p className="text-slate-400">
                      The repository includes complete Electron configuration (`electron/main.cjs`) and build scripts. Run on your Windows terminal:
                    </p>
                    <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 select-all space-y-1">
                      <div className="text-slate-500"># Compiles BeamDrop-Setup.exe & BeamDrop-Portable.exe:</div>
                      <div>npm run build:exe</div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Output location: <code>release/BeamDrop-Setup.exe</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mac .app Card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Apple className="h-5 w-5 text-slate-200" />
                    <div>
                      <h4 className="text-sm font-semibold text-white">macOS Application (.app & .dmg)</h4>
                      <span className="text-[10px] text-slate-500 font-mono">BeamDrop.app / BeamDrop.dmg</span>
                    </div>
                  </div>
                  <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-300">
                    macOS Apple Silicon & Intel
                  </span>
                </div>

                <div className="space-y-2 text-slate-300 text-[11px]">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-slate-200 block">Option A: Add to macOS Dock / Applications</strong>
                    <p className="text-slate-400">
                      In Safari (macOS Sonoma+): Click <strong>File → Add to Dock</strong>. Or in Chrome on Mac, click the <strong>Install</strong> icon in the address bar. It creates <code>BeamDrop.app</code> in your Mac Applications folder.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                    <strong className="text-slate-200 block">Option B: Compile Standalone .app and .dmg</strong>
                    <p className="text-slate-400">
                      Run on macOS terminal to produce native Apple disk image and .app bundle:
                    </p>
                    <div className="font-mono text-[11px] bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 select-all space-y-1">
                      <div className="text-slate-500"># Compiles BeamDrop.app & BeamDrop.dmg:</div>
                      <div>npm run build:app</div>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Output location: <code>release/BeamDrop.dmg</code> and <code>release/mac/BeamDrop.app</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* GitHub Actions Automated Releases */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <FolderArchive className="h-4 w-4 text-emerald-400" />
                  <span>Automated CI/CD Workflow Included</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  We have added <code>.github/workflows/build-desktop.yml</code> to this codebase. When pushed to GitHub, GitHub automatically spins up native Windows and macOS virtual machines, compiles both <strong>BeamDrop.exe</strong> and <strong>BeamDrop.app</strong>, and attaches them directly as downloadable artifacts in your GitHub Releases tab.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: SHARE LINK & QR CODE */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                {/* QR Code Canvas */}
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                  <canvas ref={canvasRef} className="rounded-lg" />
                  <span className="text-[10px] text-slate-500 font-mono mt-1">Scan with Phone Camera</span>
                </div>

                {/* Shareable Link details */}
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">Share BeamDrop with Anyone</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Send this link to anyone on the same Wi-Fi network or hotspot to connect instantly without cables.
                    </p>
                  </div>

                  {/* Copy Link input row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={appUrl}
                      className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Native Web Share button */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-colors"
                    >
                      <Share2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Share via WhatsApp, Telegram, or Email</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400 flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Zero registration required. Anyone who opens the URL can immediately send and receive files.</span>
              </div>
            </div>
          )}

          {/* TAB 4: PUBLISH TO GOOGLE PLAY & WINDOWS STORES (DEVELOPER) */}
          {activeTab === 'publish' && (
            <div className="space-y-4">
              {/* Notice regarding AI Studio URLs & PWABuilder */}
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-[11px] text-amber-200 space-y-1">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <span>⚠️ Seeing "googleplay... not valid JSON" on PWABuilder?</span>
                </div>
                <p className="text-amber-200/90 leading-relaxed">
                  AI Studio preview links (<code>*.run.app</code>) are protected by a Google authentication proxy that blocks automated external cloud crawlers. <strong>You don't need PWABuilder or Google Play to use BeamDrop as an app!</strong> See the two best solutions below:
                </p>
              </div>

              {/* Solution 1: Direct Install (Zero App Store Required) */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-emerald-400" />
                    <span>Best & Fastest: Install Directly as a Real App</span>
                  </h4>
                  <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 rounded">
                    100% Free · No Console Account
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  You can install BeamDrop directly to your phone or PC right now:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  <li><strong>On Android:</strong> Open this link in Chrome → Tap three dots (⋮) → Tap <strong>"Install app"</strong>.</li>
                  <li><strong>On Windows:</strong> Open in Edge/Chrome → Click the <strong>Install</strong> icon in the address bar.</li>
                  <li>It runs in its own window with the app icon, offline support, and desktop/home screen shortcuts.</li>
                </ul>
              </div>

              {/* Solution 2: For Google Play Store Packaging */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Play className="h-4 w-4 text-cyan-400" />
                    <span>Publishing to Google Play Store / Building an APK</span>
                  </h4>
                  <span className="font-mono text-[10px] text-cyan-400 border border-cyan-500/30 bg-cyan-950/30 px-2 py-0.5 rounded">
                    Production Guide
                  </span>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  To publish to Google Play, deploy your project to a custom domain (Vercel, Netlify, Render, or your own server) where external crawlers are not blocked:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-slate-300 text-[11px]">
                  <li>
                    Deploy the code to a free host like <strong>Vercel</strong> or <strong>Netlify</strong> (e.g. <code>beamdrop.vercel.app</code>).
                  </li>
                  <li>
                    Visit <strong><a href="https://www.pwabuilder.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">PWABuilder.com <ExternalLink className="h-3 w-3" /></a></strong> and enter your public domain.
                  </li>
                  <li>
                    Click <strong>"Package for Android"</strong> to download the signed <code>.aab</code> package.
                  </li>
                  <li>
                    Or build locally on your PC with Google's official CLI tool without using any cloud service:
                    <div className="mt-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800 text-slate-200 select-all">
                      npx @bubblewrap/cli build
                    </div>
                  </li>
                </ol>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-cyan-400" />
                    <span>Windows Store (.msix / .exe)</span>
                  </h4>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  For desktop users, clicking <strong>"Install"</strong> in Chrome or Edge installs the official Windows PWA app directly into the Start Menu and Taskbar without any setup.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: SELF-HOSTING & SOURCE CODE (DEVELOPER) */}
          {activeTab === 'selfhost' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-cyan-400" />
                  <span>Run on Your Own Server or VPS (Docker / Node.js)</span>
                </h4>
                <p className="text-slate-400 text-xs">
                  BeamDrop is a self-contained full-stack TypeScript application with Express and Vite. You can host it on your own VPS, Raspberry Pi, home server, or Cloud Run:
                </p>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="rounded bg-slate-950 p-3 border border-slate-800 text-slate-300">
                    <div className="text-slate-500"># 1. Install dependencies & build production assets</div>
                    <div>npm install</div>
                    <div>npm run build</div>
                    <div className="mt-2 text-slate-500"># 2. Start high-speed local signaling server (port 3000)</div>
                    <div>npm start</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-800/80 bg-slate-900/80 p-3 text-[11px] text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Local Home Server / Offline Router Deployment:</span>
                  </div>
                  <p>
                    Run <code>npm start</code> on your home PC or Raspberry Pi. Anyone connected to your home Wi-Fi can open <code>http://&lt;your-local-ip&gt;:3000</code> in their browser and start transferring files at Gigabit speed with zero internet required!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <img
              src="/icon-192.png"
              alt="Icon"
              className="h-4 w-4 rounded-sm"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/icon-192.svg';
              }}
            />
            <span className="font-mono text-[11px] text-slate-400">BeamDrop Desktop v1.2</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
