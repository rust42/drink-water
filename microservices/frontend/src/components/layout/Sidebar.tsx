import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: 'devices', label: 'Devices', icon: '💻' },
  { id: 'notifications', label: 'Notifications', icon: '🔔' },
  { id: 'push-config', label: 'Push Config', icon: '🔐' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'monitoring', label: 'Monitoring', icon: '🔍' },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50',
        isOpen ? 'w-[260px]' : 'w-[80px]'
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <h1 className={cn('font-bold text-xl text-blue-600', !isOpen && 'hidden')}>💧 DrinkWater</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      <nav className="mt-8 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors',
              activeTab === item.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <span className="text-xl">{item.icon}</span>
            {isOpen && <span className="font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
}
