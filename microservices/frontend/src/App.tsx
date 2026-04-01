import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { DevicesTab } from '@/components/tabs/DevicesTab';
import { NotificationsTab } from '@/components/tabs/NotificationsTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { MonitoringTab } from '@/components/tabs/MonitoringTab';
import { Toast } from '@/components/ui/Toast';
import { useAppStore } from '@/lib/store';
import { useRealtimeDevices, useConnectionStatus } from '@/hooks/useRealtime';
import { cn } from '@/lib/utils';

export function App() {
  const [activeTab, setActiveTab] = useState('devices');
  const { isSidebarOpen } = useAppStore();

  // Enable real-time updates
  useRealtimeDevices(5000); // Poll every 5 seconds
  useConnectionStatus(); // Monitor connection status

  return (
    <div className="min-h-screen bg-gradient-to-br from-water-50 via-white to-primary-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main
        className={cn(
          'transition-all duration-300 min-h-screen',
          isSidebarOpen ? 'ml-[260px]' : 'ml-[80px]'
        )}
      >
        <Header />
        
        <div className="p-6 max-w-7xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'devices' && <DevicesTab />}
              {activeTab === 'notifications' && <NotificationsTab />}
              {activeTab === 'analytics' && <AnalyticsTab />}
              {activeTab === 'monitoring' && <MonitoringTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Toast />
    </div>
  );
}
