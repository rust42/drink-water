import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Device } from '@/types';

interface AppState {
  // Selected device context
  selectedDevice: Device | null;
  setSelectedDevice: (device: Device | null) => void;
  
  // Current store filter
  currentStoreId: string;
  setCurrentStoreId: (storeId: string) => void;
  
  // UI State
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  
  // Notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setToast: (toast: { message: string; type: 'success' | 'error' | 'info' } | null) => void;
  
  // Recently viewed devices
  recentDevices: Device[];
  addRecentDevice: (device: Device) => void;
  clearRecentDevices: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedDevice: null,
      setSelectedDevice: (device) => set({ selectedDevice: device }),
      
      currentStoreId: 'default-store',
      setCurrentStoreId: (storeId) => set({ currentStoreId: storeId }),
      
      isSidebarOpen: true,
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
      
      toast: null,
      setToast: (toast) => set({ toast }),
      
      recentDevices: [],
      addRecentDevice: (device) => {
        const { recentDevices } = get();
        const filtered = recentDevices.filter((d) => d.id !== device.id);
        set({ recentDevices: [device, ...filtered].slice(0, 5) });
      },
      clearRecentDevices: () => set({ recentDevices: [] }),
    }),
    {
      name: 'drink-water-storage',
      partialize: (state) => ({
        currentStoreId: state.currentStoreId,
        recentDevices: state.recentDevices,
      }),
    }
  )
);
