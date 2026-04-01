import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, Plus, Building2, Trash2, ChevronRight, 
  Users, Smartphone, Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Device } from '@/types';

interface StoreData {
  id: string;
  name: string;
  deviceCount: number;
  activeCount: number;
}

export function StoreManager() {
  const { currentStoreId, setCurrentStoreId, setToast } = useAppStore();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load stores from localStorage and fetch device counts
  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    setIsLoading(true);
    try {
      // Get saved stores from localStorage
      const saved = JSON.parse(localStorage.getItem('stores') || '[]');
      
      // If no stores, add current one
      if (saved.length === 0) {
        saved.push({ id: currentStoreId, name: currentStoreId });
      }
      
      // Get device counts for each store
      const storesWithCounts = await Promise.all(
        saved.map(async (store: StoreData) => {
          try {
            const devices = await deviceApi.getByStore(store.id);
            return {
              ...store,
              deviceCount: devices.length,
              activeCount: devices.filter(d => d.isActive).length,
            };
          } catch {
            return { ...store, deviceCount: 0, activeCount: 0 };
          }
        })
      );
      
      setStores(storesWithCounts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStore = () => {
    if (!newStoreName.trim()) return;
    
    const newStore: StoreData = {
      id: newStoreName.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newStoreName.trim(),
      deviceCount: 0,
      activeCount: 0,
    };
    
    const updated = [...stores, newStore];
    setStores(updated);
    localStorage.setItem('stores', JSON.stringify(updated));
    setNewStoreName('');
    setIsAdding(false);
    setToast({ message: `Store "${newStore.name}" added`, type: 'success' });
  };

  const handleDeleteStore = (id: string) => {
    if (id === currentStoreId) {
      setToast({ message: 'Cannot delete current store', type: 'error' });
      return;
    }
    
    const updated = stores.filter(s => s.id !== id);
    setStores(updated);
    localStorage.setItem('stores', JSON.stringify(updated));
    setToast({ message: 'Store removed', type: 'info' });
  };

  const handleSwitchStore = (id: string) => {
    setCurrentStoreId(id);
    setToast({ message: `Switched to store: ${id}`, type: 'success' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Store Management</CardTitle>
            <CardDescription>Manage multiple store locations</CardDescription>
          </div>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Store
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Store Form */}
        <AnimatePresence>
          {isAdding && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <Input
                placeholder="Store name (e.g., Downtown Store)"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
              />
              <Button onClick={handleAddStore}>Add</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Store List */}
        <div className="space-y-2">
          {stores.map((store) => (
            <motion.div
              key={store.id}
              layout
              className={`
                flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer
                ${currentStoreId === store.id 
                  ? 'bg-water-50 border-water-300' 
                  : 'bg-white border-slate-200 hover:border-water-200'}
              `}
              onClick={() => handleSwitchStore(store.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center
                  ${currentStoreId === store.id ? 'bg-water-100 text-water-600' : 'bg-slate-100 text-slate-500'}
                `}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{store.name}</h4>
                    {currentStoreId === store.id && (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-4 h-4" />
                      {store.deviceCount} devices
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {store.activeCount} active
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentStoreId !== store.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStore(store.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-slate-400" />
                  </Button>
                )}
                <ChevronRight className={`
                  w-5 h-5 transition-colors
                  ${currentStoreId === store.id ? 'text-water-500' : 'text-slate-300'}
                `} />
              </div>
            </motion.div>
          ))}
          
          {stores.length === 0 && !isLoading && (
            <div className="text-center py-8 text-slate-400">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No stores configured</p>
              <p className="text-sm">Add your first store to get started</p>
            </div>
          )}
        </div>

        {/* Quick Switch Bar */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium text-slate-600 mb-3">Quick Switch</p>
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => handleSwitchStore(store.id)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${currentStoreId === store.id 
                    ? 'bg-water-100 text-water-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                `}
              >
                {store.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
