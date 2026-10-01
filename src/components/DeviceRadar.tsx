import React, { useState } from 'react';
import { Laptop, Smartphone, Tablet, Monitor, Send, ShieldCheck, Check, Edit2, Wifi, QrCode } from 'lucide-react';
import { PeerDevice } from '../types';
import { saveDeviceName } from '../utils/network';

interface DeviceRadarProps {
  selfDevice: {
    peerId: string;
    deviceName: string;
    os: string;
    deviceType: string;
  };
  peers: PeerDevice[];
  selectedPeer: PeerDevice | null;
  onSelectPeer: (peer: PeerDevice) => void;
  onUpdateSelfName: (newName: string) => void;
  onOpenConnect: () => void;
}

export const DeviceRadar: React.FC<DeviceRadarProps> = ({
  selfDevice,
  peers,
  selectedPeer,
  onSelectPeer,
  onUpdateSelfName,
  onOpenConnect,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameVal, setEditNameVal] = useState(selfDevice.deviceName);

  const handleSaveName = () => {
    if (editNameVal.trim()) {
      saveDeviceName(editNameVal.trim());
      onUpdateSelfName(editNameVal.trim());
    }
    setIsEditingName(false);
  };

  const getDeviceIcon = (type: string, os: string) => {
    if (type === 'mobile') return <Smartphone className="h-5 w-5 text-emerald-400" />;
    if (type === 'tablet') return <Tablet className="h-5 w-5 text-sky-400" />;
    if (os === 'windows') return <Monitor className="h-5 w-5 text-cyan-400" />;
    return <Laptop className="h-5 w-5 text-cyan-400" />;
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      {/* Top row: Self device status & rename */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 text-cyan-400">
            {getDeviceIcon(selfDevice.deviceType, selfDevice.os)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameVal}
                    onChange={(e) => setEditNameVal(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="h-7 rounded border border-cyan-500/50 bg-slate-950 px-2 text-xs text-white focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="flex h-7 w-7 items-center justify-center rounded bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-white">{selfDevice.deviceName}</span>
                  <button
                    onClick={() => {
                      setEditNameVal(selfDevice.deviceName);
                      setIsEditingName(true);
                    }}
                    title="Rename this device"
                    className="text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>This Device</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="capitalize">{selfDevice.os}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> E2EE Active
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenConnect}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
        >
          <QrCode className="h-3.5 w-3.5 text-cyan-400" />
          <span>QR Pair / Code</span>
        </button>
      </div>

      {/* Discovered nearby devices list */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-300">Nearby Devices on Wi-Fi</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{peers.length} active</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Wifi className="h-3 w-3 text-cyan-400 animate-pulse" />
            <span>Auto-Discovering</span>
          </div>
        </div>

        {peers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 bg-slate-950/40 p-6 text-center">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-slate-800">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-15" />
              <Wifi className="h-6 w-6 text-cyan-400" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200">Waiting for peer connection...</h4>
            <p className="mt-1 max-w-sm text-xs text-slate-400 leading-relaxed">
              Open BeamDrop on your phone or tablet on the same Wi-Fi network. Or tap below to show the pairing QR code.
            </p>
            <button
              onClick={onOpenConnect}
              className="mt-4 flex items-center gap-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-3.5 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              <QrCode className="h-3.5 w-3.5" />
              <span>Show Phone Pairing QR</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {peers.map((peer) => {
              const isSelected = selectedPeer?.peerId === peer.peerId;
              return (
                <div
                  key={peer.peerId}
                  onClick={() => onSelectPeer(peer)}
                  className={`group relative cursor-pointer rounded-lg border p-3.5 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-950/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
                        {getDeviceIcon(peer.deviceType, peer.os)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {peer.deviceName}
                        </p>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {peer.os} · Local Wi-Fi
                        </p>
                      </div>
                    </div>

                    <span className={`inline-block h-2 w-2 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      <span>AES-256 E2EE</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPeer(peer);
                      }}
                      className={`flex items-center gap-1 rounded px-2 py-0.5 font-medium transition-colors ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-semibold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSelected ? 'Selected' : 'Select'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
