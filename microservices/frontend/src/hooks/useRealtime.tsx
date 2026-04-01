import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { deviceApi } from '@/lib/api';

// Hook for real-time device updates
export function useRealtimeDevices(interval = 5000) {
  const { currentStoreId, selectedDevice, setSelectedDevice, setToast } = useAppStore();

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await deviceApi.getByStore(currentStoreId);
      
      // If a device is selected, refresh its data
      if (selectedDevice) {
        const updated = devices.find(d => d.id === selectedDevice.id);
        if (updated) {
          // Only update if something changed
          if (JSON.stringify(updated) !== JSON.stringify(selectedDevice)) {
            setSelectedDevice(updated);
          }
        }
      }
    } catch (error) {
      // Silently fail - don't spam errors during polling
    }
  }, [currentStoreId, selectedDevice, setSelectedDevice]);

  useEffect(() => {
    const timer = setInterval(refreshDevices, interval);
    return () => clearInterval(timer);
  }, [refreshDevices, interval]);

  return { refreshDevices };
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const { setToast } = useAppStore();

  useEffect(() => {
    const handleOnline = () => {
      setToast({ message: 'Connection restored', type: 'success' });
    };

    const handleOffline = () => {
      setToast({ message: 'Connection lost', type: 'error' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setToast]);
}

// Component: Live indicator badge
export function LiveIndicator() {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-medium text-emerald-700">Live</span>
    </div>
  );
}

// Hook for visibility change (pause polling when tab hidden)
export function useVisibilityPause(callback: () => void, interval: number) {
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const startPolling = () => {
      timer = setInterval(callback, interval);
    };

    const stopPolling = () => {
      clearInterval(timer);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        callback(); // Immediate check on visibility
        startPolling();
      }
    };

    // Start polling
    startPolling();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [callback, interval]);
}
