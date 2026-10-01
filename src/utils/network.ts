// Device detection, formatting, and identity utilities

import { DeviceOS, DeviceType } from '../types';

export function detectDeviceOS(): DeviceOS {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('windows') || ua.includes('win32') || ua.includes('win64')) return 'windows';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) return 'ios';
  if (ua.includes('macintosh') || ua.includes('mac os x')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}

export function detectDeviceType(): DeviceType {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
    return 'tablet';
  }
  if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
    return 'mobile';
  }
  return 'desktop';
}

export function getDefaultDeviceName(): string {
  const os = detectDeviceOS();
  const type = detectDeviceType();

  try {
    const saved = localStorage.getItem('beamdrop_device_name');
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // Ignore
  }

  const randomSuffix = Math.floor(100 + Math.random() * 900);
  if (os === 'windows') return `Windows PC #${randomSuffix}`;
  if (os === 'android') return `Android Phone #${randomSuffix}`;
  if (os === 'ios') return type === 'tablet' ? `iPad #${randomSuffix}` : `iPhone #${randomSuffix}`;
  if (os === 'macos') return `MacBook #${randomSuffix}`;
  if (os === 'linux') return `Linux Station #${randomSuffix}`;
  return `Device #${randomSuffix}`;
}

export function saveDeviceName(name: string) {
  try {
    localStorage.setItem('beamdrop_device_name', name);
  } catch {
    // Ignore
  }
}

export function getOrCreatePeerId(): string {
  try {
    let peerId = sessionStorage.getItem('beamdrop_peer_id');
    if (!peerId) {
      peerId = 'peer_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('beamdrop_peer_id', peerId);
    }
    return peerId;
  } catch {
    return 'peer_' + Math.random().toString(36).substring(2, 9);
  }
}

export function generatePinCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '0.0 MB/s';
  const mBps = bytesPerSecond / (1024 * 1024);
  if (mBps < 0.1) {
    const kBps = bytesPerSecond / 1024;
    return `${kBps.toFixed(0)} KB/s`;
  }
  return `${mBps.toFixed(1)} MB/s`;
}

export function formatSpeedDetailed(bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return '0.0 MB/s (0 Mbps)';
  const mBps = bytesPerSecond / (1024 * 1024);
  const mbps = (bytesPerSecond * 8) / 1_000_000;
  if (mBps < 0.1) {
    const kBps = bytesPerSecond / 1024;
    return `${kBps.toFixed(0)} KB/s (${mbps.toFixed(1)} Mbps)`;
  }
  return `${mBps.toFixed(1)} MB/s (${mbps.toFixed(0)} Mbps)`;
}

/**
 * Validates if an IP address belongs strictly to local private LAN / link-local subnets
 * Prevents WebRTC from routing over mobile cellular data or public internet
 */
export function isPrivateLanIp(candidateStr?: string): boolean {
  if (!candidateStr) return true;
  // Match IPv4 addresses in candidate string
  const ipv4Match = candidateStr.match(/\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/);
  if (ipv4Match) {
    const ip = ipv4Match[1];
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    // 127.0.0.0/8 (loopback)
    if (parts[0] === 127) return true;
    // 10.0.0.0/8 (private)
    if (parts[0] === 10) return true;
    // 172.16.0.0/12 (private)
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    // 192.168.0.0/16 (private / Wi-Fi Direct)
    if (parts[0] === 192 && parts[1] === 168) return true;
    // 169.254.0.0/16 (link-local / ad-hoc Wi-Fi)
    if (parts[0] === 169 && parts[1] === 254) return true;
    // Not private IPv4! Reject to avoid cellular / public internet leak
    return false;
  }

  // IPv6 link-local (fe80::) or loopback (::1) or mDNS (.local)
  if (candidateStr.includes('.local') || candidateStr.includes('fe80:') || candidateStr.includes('::1')) {
    return true;
  }

  return false;
}

export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--';
  const sec = Math.round(seconds);
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (mins < 60) return `${mins}m ${remSec}s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}h ${remMins}m`;
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${timeStr}`;
  return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
}
