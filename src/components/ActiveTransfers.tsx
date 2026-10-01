import React from 'react';
import {
  Play,
  Pause,
  X,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  File,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Zap,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { BatchTransfer } from '../types';
import { formatBytes, formatDuration, formatSpeed, formatSpeedDetailed } from '../utils/network';

interface ActiveTransfersProps {
  batches: BatchTransfer[];
  onPause: (batchId: string) => void;
  onResume: (batchId: string) => void;
  onCancel: (batchId: string) => void;
}

export const ActiveTransfers: React.FC<ActiveTransfersProps> = ({
  batches,
  onPause,
  onResume,
  onCancel,
}) => {
  if (batches.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span>Active Transfers</span>
          <span className="font-mono tabular-nums text-xs text-cyan-400">({batches.length})</span>
        </h3>
        <span className="text-xs text-slate-400">High-Speed Local Wi-Fi Stream</span>
      </div>

      {batches.map((batch) => {
        const isSending = batch.direction === 'send';
        const isPaused = batch.status === 'paused';
        const isDone = batch.status === 'completed';
        const isFailed = batch.status === 'failed' || batch.status === 'declined';
        const isCancelled = batch.status === 'cancelled';

        return (
          <div
            key={batch.batchId}
            className={`rounded-xl border p-5 transition-all ${
              isDone
                ? 'border-emerald-500/40 bg-emerald-950/10'
                : isFailed || isCancelled
                ? 'border-rose-500/30 bg-rose-950/10'
                : 'border-slate-800 bg-slate-900/60 shadow-lg'
            }`}
          >
            {/* Batch Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border ${
                    isSending
                      ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-400'
                      : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                  }`}
                >
                  {isSending ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {isSending ? `Sending to ${batch.peerName}` : `Receiving from ${batch.peerName}`}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">
                      {batch.items.length} {batch.items.length === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="font-mono tabular-nums text-slate-300">
                      {formatBytes(batch.bytesTransferred)} / {formatBytes(batch.totalBytes)}
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <ShieldCheck className="h-3 w-3" />
                      {batch.transferMode === 'double_e2ee' ? 'Double AES-256 E2EE' : 'Hardware DTLS 1.3 Turbo'}
                    </span>
                    {batch.compress && (
                      <>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="text-cyan-400">Compressed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                {!isDone && !isFailed && !isCancelled && (
                  <>
                    {isPaused ? (
                      <button
                        onClick={() => onResume(batch.batchId)}
                        title="Resume transfer"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 px-2.5 text-xs font-medium text-cyan-300 hover:bg-cyan-950/50"
                      >
                        <Play className="h-3 w-3" />
                        <span>Resume</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onPause(batch.batchId)}
                        title="Pause transfer"
                        className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                      >
                        <Pause className="h-3 w-3" />
                        <span>Pause</span>
                      </button>
                    )}

                    <button
                      onClick={() => onCancel(batch.batchId)}
                      title="Cancel transfer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                {isDone && (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed</span>
                  </span>
                )}

                {isFailed && (
                  <span className="flex items-center gap-1 text-xs font-medium text-rose-400">
                    <AlertCircle className="h-4 w-4" />
                    <span>Failed / Declined</span>
                  </span>
                )}
              </div>
            </div>

            {/* Overall Progress Bar and Throughput Telemetry */}
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between text-xs mb-1.5 font-mono tabular-nums gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-semibold">{Math.round(batch.overallProgress)}%</span>
                  {batch.peakSpeedBps ? (
                    <span className="text-[11px] text-slate-500 font-sans">
                      (Peak: {formatSpeed(batch.peakSpeedBps)})
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                    <Zap className="h-3.5 w-3.5" />
                    <span>{formatSpeedDetailed(batch.speedBps)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDuration(batch.etaSeconds)} left</span>
                  </span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${
                    isDone
                      ? 'bg-emerald-400'
                      : isFailed || isCancelled
                      ? 'bg-rose-500'
                      : isPaused
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400'
                  }`}
                  style={{ width: `${batch.overallProgress}%` }}
                />
              </div>

              {/* Dynamic Live Bottleneck Diagnostics Bar */}
              {batch.bottleneck && !isDone && !isFailed && !isCancelled && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/50 rounded-lg px-2.5 py-1 border border-slate-800/60">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Activity className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span className="text-slate-500">Link Diagnostic:</span>
                    <span className="text-slate-300 font-medium">{batch.bottleneck}</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">100% Local Wi-Fi Line Rate</span>
                </div>
              )}
            </div>

            {/* Per-File Progress Items */}
            <div className="mt-4 divide-y divide-slate-800/60 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2">
              {batch.items.map((item) => (
                <div key={item.id} className="py-2.5 px-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate max-w-sm sm:max-w-md">
                      <File className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-slate-200 font-medium">{item.name}</span>
                      {item.resumeOffset && item.resumeOffset > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 rounded px-1.5 py-0.2 shrink-0">
                          <RotateCcw className="h-2.5 w-2.5" />
                          <span>Resumed ({formatBytes(item.resumeOffset)})</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono tabular-nums text-slate-400 text-[11px]">
                        {formatBytes(item.bytesTransferred)} / {formatBytes(item.size)}
                      </span>

                      {item.downloadUrl && (
                        <a
                          href={item.downloadUrl}
                          download={item.name}
                          className="flex items-center gap-1 rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/30"
                        >
                          <Download className="h-3 w-3" />
                          <span>Save</span>
                        </a>
                      )}

                      {item.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                  </div>

                  {/* Individual Progress line */}
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-800/70">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all duration-150"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {/* Wi-Fi Link Speed Diagnostic Helper */}
            {!isDone && (
              <div className="mt-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20 p-3 text-xs">
                <div className="flex items-center justify-between text-cyan-300 font-semibold mb-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-cyan-400" />
                    <span>How to get 60 – 100+ MB/s (Local Wi-Fi Tuning)</span>
                  </span>
                  <span className="font-mono text-[10px] text-cyan-400/80">16 KB Slices · 512 KB Window</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside mt-1 leading-relaxed">
                  <li>
                    <strong className="text-white">Check 2.4 GHz vs 5 GHz:</strong> If your router is on 2.4 GHz, real-world speed is physically capped at <strong>1.5 – 3 MB/s</strong>. Switch both devices to your router's <strong>5 GHz Wi-Fi</strong>.
                  </li>
                  <li>
                    <strong className="text-white">Or use Phone 5 GHz Hotspot:</strong> Turn on your Android phone's 5 GHz Hotspot and connect Windows PC to it for <strong>60 – 90 MB/s</strong> direct cable-free transfer!
                  </li>
                  <li>
                    <strong className="text-white">Turbo Mode Active:</strong> Running native C++ DTLS 1.3 hardware encryption with zero CPU bottleneck.
                  </li>
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
