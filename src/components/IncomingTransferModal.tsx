import React from 'react';
import { Download, X, ShieldCheck, File, ArrowDownLeft } from 'lucide-react';
import { IncomingTransferRequest } from '../types';
import { formatBytes } from '../utils/network';

interface IncomingTransferModalProps {
  request: IncomingTransferRequest | null;
  onAccept: (req: IncomingTransferRequest) => void;
  onDecline: (req: IncomingTransferRequest) => void;
}

export const IncomingTransferModal: React.FC<IncomingTransferModalProps> = ({
  request,
  onAccept,
  onDecline,
}) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-cyan-500/40 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Incoming File Transfer</h3>
            <p className="text-xs text-slate-400">
              <span className="font-semibold text-cyan-300">{request.fromPeerName}</span> wants to share files with you
            </p>
          </div>
        </div>

        {/* Security and batch summary */}
        <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
            <span>256-Bit E2EE Encrypted</span>
          </div>
          <div className="font-mono tabular-nums text-slate-300 font-semibold">
            {formatBytes(request.totalBytes)} total
          </div>
        </div>

        {/* Files preview list */}
        <div className="mt-3 max-h-48 overflow-y-auto divide-y divide-slate-800/60 rounded-lg border border-slate-800 bg-slate-950/40 p-2 pr-1">
          {request.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 px-1 text-xs">
              <div className="flex items-center gap-2 truncate max-w-[240px]">
                <File className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate text-slate-200 font-medium">{item.name}</span>
              </div>
              <span className="font-mono tabular-nums text-slate-400 shrink-0 text-[11px]">
                {formatBytes(item.size)}
              </span>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            onClick={() => onDecline(request)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            <span>Decline</span>
          </button>

          <button
            onClick={() => onAccept(request)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors shadow-md"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Accept & Receive</span>
          </button>
        </div>
      </div>
    </div>
  );
};
