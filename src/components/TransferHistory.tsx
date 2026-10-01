import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Trash2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Share2,
  HardDrive,
  Zap,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { HistoryRecord } from '../types';
import { getAllHistory, deleteHistoryRecord, clearAllHistory, getFileBlob } from '../utils/db';
import { formatBytes, formatDuration, formatSpeed, formatTimestamp } from '../utils/network';

export const TransferHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filterType, setFilterType] = useState<'all' | 'send' | 'receive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    const records = await getAllHistory();
    setHistory(records);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteHistoryRecord(id);
    setHistory((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear your entire file transfer history?')) {
      await clearAllHistory();
      setHistory([]);
    }
  };

  const handleDownloadBlob = async (record: HistoryRecord) => {
    if (!record.blobKey) return;
    const blob = await getFileBlob(record.blobKey);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = record.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } else {
      alert('File data is no longer stored in cache.');
    }
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ['File Name', 'Size (Bytes)', 'Direction', 'Peer Name', 'Speed (Bps)', 'Status', 'Date'];
    const rows = history.map((r) => [
      `"${r.fileName.replace(/"/g, '""')}"`,
      r.fileSize,
      r.direction,
      `"${r.peerName.replace(/"/g, '""')}"`,
      r.avgSpeedBps,
      r.status,
      `"${new Date(r.timestamp).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `beamdrop_transfer_history_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered list
  const filtered = history.filter((item) => {
    if (filterType !== 'all' && item.direction !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.fileName.toLowerCase().includes(q) ||
        item.peerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Analytics stats
  const totalBytesTransferred = history.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  const completedTransfers = history.filter((r) => r.status === 'completed');
  const avgSpeed = completedTransfers.length > 0
    ? completedTransfers.reduce((acc, r) => acc + (r.avgSpeedBps || 0), 0) / completedTransfers.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Stats Overview (Tabular figures, anti-slop zero pills) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Transferred</span>
            <HardDrive className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {formatBytes(totalBytesTransferred)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {history.length} transfer operations
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average LAN Speed</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {formatSpeed(avgSpeed)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Local Wi-Fi P2P line rate
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Transfers</span>
            <CheckCircle2 className="h-4 w-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono tabular-nums">
            {completedTransfers.length} / {history.length}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {history.length > 0 ? `${Math.round((completedTransfers.length / history.length) * 100)}% success rate` : 'No transfers yet'}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Controls (functional button tabs with click handlers) */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Transfers
            </button>
            <button
              onClick={() => setFilterType('send')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'send'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sent
            </button>
            <button
              onClick={() => setFilterType('receive')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                filterType === 'receive'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Received
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by file name or device..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Export & Clear Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-600 hover:text-white disabled:opacity-40 transition-colors"
            >
              <Share2 className="h-3 w-3" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={history.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* History Table */}
        <div className="mt-4 overflow-x-auto">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-cyan-400" />
              Loading transfer log...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-300">No transfers found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {searchQuery ? 'Try matching another search term' : 'Files sent or received will be logged here automatically'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-medium">File Name</th>
                  <th className="py-2.5 px-3 font-medium">Direction</th>
                  <th className="py-2.5 px-3 font-medium">Size</th>
                  <th className="py-2.5 px-3 font-medium">Peer Device</th>
                  <th className="py-2.5 px-3 font-medium">Avg Speed</th>
                  <th className="py-2.5 px-3 font-medium">Date & Time</th>
                  <th className="py-2.5 px-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums">
                {filtered.map((record) => {
                  const isSend = record.direction === 'send';
                  return (
                    <tr key={record.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3 font-sans font-medium text-slate-200 truncate max-w-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate" title={record.fileName}>{record.fileName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-sans">
                          {isSend ? (
                            <>
                              <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
                              <span className="text-cyan-300">Sent</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Received</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        {formatBytes(record.fileSize)}
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-300 truncate max-w-[140px]">
                        {record.peerName}
                      </td>

                      <td className="py-3 px-3 text-slate-400">
                        {formatSpeed(record.avgSpeedBps)}
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                        {formatTimestamp(record.timestamp)}
                      </td>

                      <td className="py-3 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          {record.hasBlob && (
                            <button
                              onClick={() => handleDownloadBlob(record)}
                              title="Re-download saved file"
                              className="flex items-center gap-1 rounded bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"
                            >
                              <Download className="h-3 w-3" />
                              <span>Save</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(record.id)}
                            title="Delete entry"
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
