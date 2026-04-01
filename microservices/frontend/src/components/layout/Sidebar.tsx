import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeft, Droplets, Bell, Smartphone, BarChart3, Activity, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';
import { DeviceIcon } from '@/components/ui/DeviceIcon';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'devices', label: 'Devices', icon: Smartphone },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { isSidebarOpen, toggleSidebar, recentDevices } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 260 : 80 }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-white/80 backdrop-blur-xl border-r border-white/50 z-40',
        'flex flex-col shadow-xl shadow-slate-200/20'
      )}
    >
      {/* Logo */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-water-400 to-water-600 flex items-center justify-center shadow-lg shadow-water-500/30">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-bold text-slate-800 text-lg">Drink Water</h1>
                <p className="text-xs text-slate-500">Device Management</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-white rounded-full shadow-md border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
      >
        <ChevronLeft
          className={cn(
            'w-4 h-4 text-slate-500 transition-transform duration-300',
            !isSidebarOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'bg-water-50 text-water-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-water-600')} />
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && isSidebarOpen && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-water-500"
                />
              )}
            </button>
          );
        })}

        {/* Recent Devices */}
        {recentDevices.length > 0 && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 pt-6 border-t border-slate-100"
          >
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Recent Devices
            </p>
            <div className="space-y-1">
              {recentDevices.map((device) => (
                <button
                  key={device.id}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left"
                >
                  <DeviceIcon platform={device.platform} className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600 truncate">
                    {device.deviceName || device.deviceIdentifier}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className={cn('flex items-center gap-3', !isSidebarOpen && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">DW</span>
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-slate-500"
              >
                <p className="font-medium text-slate-700">v1.0.0</p>
                <p>All systems operational</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
