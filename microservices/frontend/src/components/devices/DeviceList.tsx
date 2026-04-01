import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DeviceCard } from '@/components/ui/DeviceIcon';
import { deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Device } from '@/types';

export function DeviceList() {
  const { currentStoreId, setSelectedDevice, selectedDevice, addRecentDevice, setToast } = useAppStore();
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const data = await deviceApi.getByStore(currentStoreId);
      setDevices(data);
      setFilteredDevices(data);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to fetch devices',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [currentStoreId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = devices.filter(
        (d) =>
          d.deviceIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.deviceName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.platform?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDevices(filtered);
    } else {
      setFilteredDevices(devices);
    }
  }, [searchQuery, devices]);

  const handleDeviceClick = (device: Device) => {
    setSelectedDevice(device);
    addRecentDevice(device);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button
          variant="secondary"
          size="md"
          onClick={fetchDevices}
          isLoading={isLoading}
        >
          <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
        </Button>
      </div>

      <div className="text-sm text-slate-500">
        {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {filteredDevices.map((device) => (
            <motion.div
              key={device.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <DeviceCard
                device={device}
                isSelected={selectedDevice?.id === device.id}
                onClick={() => handleDeviceClick(device)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredDevices.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">No devices found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try adjusting your search or register a new device
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
