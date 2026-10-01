// Browser Notifications, Document Title Progress & Screen WakeLock

let wakeLockSentinel: WakeLockSentinel | null = null;

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Show a system desktop/mobile push notification
 */
export function sendNotification(title: string, options?: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notif = new Notification(title, {
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      notif.close();
    };

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      try {
        notif.close();
      } catch {
        // Ignore
      }
    }, 6000);
  } catch (err) {
    console.warn('Native notification failed:', err);
  }
}

/**
 * Update document title to reflect active transfer progress
 */
export function updateTabProgress(progressPercent: number | null, speedText?: string, fileName?: string) {
  if (progressPercent === null || progressPercent < 0) {
    document.title = 'BeamDrop - Ultra-Fast Local Wi-Fi P2P File Transfer';
    return;
  }

  const speed = speedText ? ` · ${speedText}` : '';
  const file = fileName ? ` · ${fileName}` : '';
  document.title = `(${Math.round(progressPercent)}%) Transferring${speed}${file} - BeamDrop`;
}

/**
 * Acquire Screen WakeLock to prevent device from sleeping during multi-gigabyte transfers
 */
export async function acquireWakeLock(): Promise<boolean> {
  if ('wakeLock' in navigator && !wakeLockSentinel) {
    try {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch (err) {
      console.warn('Wake Lock request failed:', err);
    }
  }
  return false;
}

/**
 * Release Screen WakeLock once transfer completes or fails
 */
export async function releaseWakeLock() {
  if (wakeLockSentinel) {
    try {
      await wakeLockSentinel.release();
    } catch {
      // Ignore
    }
    wakeLockSentinel = null;
  }
}
