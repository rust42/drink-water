import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Input } from '@/components/ui/Input';
import { Store, Search } from 'lucide-react';

export function Header() {
  const { currentStoreId, setCurrentStoreId } = useAppStore();

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">Manage your devices and send notifications</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-slate-200 shadow-sm">
            <Store className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-500">Store:</span>
            <input
              type="text"
              value={currentStoreId}
              onChange={(e) => setCurrentStoreId(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-32"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
