import React from 'react';
import { QrCode, Volume2, VolumeX, Shield, Sun, Moon, Laptop, Smartphone, Share2 } from 'lucide-react';
import { isSoundEnabled, setSoundEnabled } from '../utils/audio';

interface HeaderProps {
  activeTab: 'transfer' | 'history' | 'security';
  setActiveTab: (tab: 'transfer' | 'history' | 'security') => void;
  onOpenConnect: () => void;
  onOpenShare?: () => void;
  peerCount: number;
  currentRoom: string;
  isOnline: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeTransferCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenConnect,
  onOpenShare,
  peerCount,
  currentRoom,
  isOnline,
  theme,
  toggleTheme,
  activeTransferCount,
}) => {
  const [soundOn, setSoundOn] = React.useState<boolean>(isSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('transfer');
            }}
            className="text-lg font-bold tracking-tight text-white transition-opacity hover:opacity-90 flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <span>BeamDrop</span>
          </a>

          {/* Quiet status line (no pills, typographic separator) */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 ml-2">
            <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`} />
            <span>{isOnline ? 'Local Wi-Fi Ready' : 'Offline Mode'}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{peerCount} {peerCount === 1 ? 'peer' : 'peers'} nearby</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-cyan-400 flex items-center gap-1 font-mono text-[11px]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Turbo 8MB Stream
            </span>
          </div>
        </div>

        {/* Zone 2: 3-4 clean text navigation links */}
        <nav className="flex items-center gap-1 sm:gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('transfer')}
            className={`relative py-1 transition-colors whitespace-nowrap ${
              activeTab === 'transfer'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Send & Receive
            {activeTransferCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-xs rounded font-mono tabular-nums">
                {activeTransferCount}
              </span>
            )}
            {activeTab === 'transfer' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`relative py-1 transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Transfer History
            {activeTab === 'history' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`relative py-1 transition-colors whitespace-nowrap ${
              activeTab === 'security'
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            E2EE & Specs
            {activeTab === 'security' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              title="Install app or share with friends"
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 sm:px-3 py-2 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-colors whitespace-nowrap shadow-sm"
            >
              <Share2 className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden md:inline">Share / Install</span>
            </button>
          )}

          <button
            onClick={handleToggleSound}
            title={soundOn ? 'Mute audio cues' : 'Enable audio cues'}
            aria-label="Toggle audio cues"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            onClick={onOpenConnect}
            className="flex items-center gap-2 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm whitespace-nowrap"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Connect Device</span>
            <span className="sm:hidden">Pair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
