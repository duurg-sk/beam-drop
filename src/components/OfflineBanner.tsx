import React, { useState, useEffect } from 'react';
import { Download, Bell, WifiOff, X } from 'lucide-react';
import { requestNotificationPermission } from '../utils/notifications';

interface OfflineBannerProps {
  isOnline: boolean;
  onOpenShare?: () => void;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, onOpenShare }) => {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission>('default');
  const [dismissedNotifBanner, setDismissedNotifBanner] = useState(false);

  useEffect(() => {
    // Check notification permission
    if ('Notification' in window) {
      setNotificationPerm(Notification.permission);
    }

    // Capture PWA install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotificationPerm(res);
  };

  return (
    <div className="space-y-2">
      {/* Offline Status Notice */}
      {!isOnline && (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/20 px-4 py-2 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <WifiOff className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              Offline Mode active · Local Wi-Fi and direct hotspot transfers remain fully functional without internet.
            </span>
          </div>
        </div>
      )}

      {/* Notification Permission Request banner */}
      {notificationPerm === 'default' && !dismissedNotifBanner && (
        <div className="flex items-center justify-between rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-4 py-2.5 text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 shrink-0 text-cyan-400" />
            <span>Enable background notifications to be alerted when huge file transfers finish.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="rounded bg-cyan-500 px-2.5 py-1 text-[11px] font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Enable Alerts
            </button>
            <button
              onClick={() => setDismissedNotifBanner(true)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Install as Desktop or Mobile PWA */}
      {installPrompt && (
        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>Install BeamDrop as a native app on Windows or Android/iOS for 1-click launch.</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="rounded bg-slate-800 border border-slate-700 px-3 py-1 text-[11px] font-medium text-white hover:bg-slate-700"
          >
            Install App
          </button>
        </div>
      )}
    </div>
  );
};
