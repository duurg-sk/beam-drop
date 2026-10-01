import React, { useRef, useState } from 'react';
import { UploadCloud, Folder, File, X, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { PeerDevice } from '../types';
import { formatBytes } from '../utils/network';

interface FileDropZoneProps {
  selectedPeer: PeerDevice | null;
  peers: PeerDevice[];
  onSelectPeer: (peer: PeerDevice) => void;
  onSendBatch: (
    peerId: string,
    peerName: string,
    files: File[],
    options?: { mode?: 'turbo' | 'double_e2ee'; compress?: boolean }
  ) => void;
  onOpenConnect: () => void;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  selectedPeer,
  peers,
  onSelectPeer,
  onSendBatch,
  onOpenConnect,
}) => {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [transferMode, setTransferMode] = useState<'turbo' | 'double_e2ee'>('turbo');
  const [enableCompress, setEnableCompress] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setStagedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setStagedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearStagedFiles = () => {
    setStagedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const totalSize = stagedFiles.reduce((acc, f) => acc + f.size, 0);

  const handleSend = () => {
    if (!selectedPeer) return;
    if (stagedFiles.length === 0) return;
    onSendBatch(selectedPeer.peerId, selectedPeer.deviceName, stagedFiles, {
      mode: transferMode,
      compress: enableCompress,
    });
    setStagedFiles([]);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Batch File Transfer</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Share gigabytes of photos, 4K videos, zip files, or documents directly via local Wi-Fi
          </p>
        </div>

        {/* Selected peer indicator or selector */}
        {peers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Target Device:</span>
            <select
              value={selectedPeer?.peerId || ''}
              onChange={(e) => {
                const p = peers.find((x) => x.peerId === e.target.value);
                if (p) onSelectPeer(p);
              }}
              className="h-8 rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs font-medium text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {peers.map((p) => (
                <option key={p.peerId} value={p.peerId}>
                  {p.deviceName} ({p.os})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error directory attribute
        webkitdirectory=""
        directory=""
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/60'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-cyan-400 shadow-inner">
          <UploadCloud className="h-6 w-6" />
        </div>

        <h4 className="mt-3 text-sm font-semibold text-slate-200">
          Drag & drop files or folders here
        </h4>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          Supports any file format, multi-GB movies, RAW photos, archives. Encrypted end-to-end.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-colors"
          >
            <File className="h-3.5 w-3.5 text-cyan-400" />
            <span>Select Files</span>
          </button>

          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-600 hover:text-white transition-colors"
          >
            <Folder className="h-3.5 w-3.5 text-amber-400" />
            <span>Select Folder</span>
          </button>
        </div>
      </div>

      {/* Staged files queue preview */}
      {stagedFiles.length > 0 && (
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="font-semibold">{stagedFiles.length} {stagedFiles.length === 1 ? 'file' : 'files'} staged</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono tabular-nums text-cyan-400">{formatBytes(totalSize)} total</span>
            </div>
            <button
              onClick={clearStagedFiles}
              className="text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-800/60 pr-1">
            {stagedFiles.map((file, idx) => (
              <div key={`${file.name}_${idx}`} className="flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2.5 truncate max-w-md">
                  <File className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate text-slate-200 font-medium">{file.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-slate-400">{formatBytes(file.size)}</span>
                  <button
                    onClick={() => removeStagedFile(idx)}
                    className="text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* High-Performance Transfer Engine Configuration */}
          <div className="mt-4 rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 text-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
              <span className="font-semibold text-slate-300">Throughput Optimization Engine</span>
              <span className="font-mono text-[11px] text-cyan-400">4 MB Disk Buffer · 64 KB SCTP Slices · Pure Local LAN</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Transfer Mode Selector */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Encryption & Acceleration:</label>
                <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTransferMode('turbo')}
                    className={`flex-1 rounded-md py-1.5 px-2 text-[11px] font-medium transition-all ${
                      transferMode === 'turbo'
                        ? 'bg-cyan-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ⚡ Turbo Direct (DTLS 1.3 HW)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferMode('double_e2ee')}
                    className={`flex-1 rounded-md py-1.5 px-2 text-[11px] font-medium transition-all ${
                      transferMode === 'double_e2ee'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔒 Double AES-256 E2EE
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  {transferMode === 'turbo'
                    ? 'Recommended: Uses native C++ hardware crypto without CPU bottlenecks.'
                    : 'Adds second-layer WebCrypto AES-GCM (higher CPU usage on mobile).'}
                </span>
              </div>

              {/* Optional Compression Toggle */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1 font-medium">Compression Control:</label>
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-800 bg-slate-950/80 p-2 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={enableCompress}
                    onChange={(e) => setEnableCompress(e.target.checked)}
                    className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300 text-[11px] font-medium">Enable Gzip Stream Compression</span>
                </label>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Keep OFF for videos (MP4/MKV), ZIPs, and APKs to avoid slowing down transfers.
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct P2P LAN Transfer · End-to-End Encrypted</span>
            </div>

            {selectedPeer ? (
              <button
                onClick={handleSend}
                className="flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-sm"
              >
                <span>Send to {selectedPeer.deviceName}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Select a peer above or
                </span>
                <button
                  onClick={onOpenConnect}
                  className="rounded-lg bg-cyan-500/20 border border-cyan-500/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30"
                >
                  Pair Device
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
