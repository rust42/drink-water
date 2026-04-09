import { useState, useEffect } from 'react';
import { deviceApi } from '@/lib/api';
import type { Device } from '@/types';
import { Cpu, RefreshCw, ChevronRight } from 'lucide-react';

interface DeviceSelectorProps {
  onSelectDevice: (device: Device) => void;
  selectedDevice?: Device | null;
}

export function DeviceSelector({ onSelectDevice, selectedDevice }: DeviceSelectorProps) {
  const [storeId, setStoreId] = useState('default-store');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = async () => {
    if (!storeId.trim()) {
      setError('Please enter a store ID');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getByStore(storeId.trim());
      setDevices(data);
      if (data.length === 0) {
        setError('No devices found for this store');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          placeholder="Enter store ID"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          onClick={loadDevices}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Load
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {devices.map((device) => (
          <div
            key={device.id}
            onClick={() => onSelectDevice(device)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedDevice?.id === device.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Cpu size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {device.deviceName || device.deviceIdentifier}
                  </p>
                  <p className="text-sm text-gray-500">
                    {device.platform} • {device.storeId}
                  </p>
                  <p className="text-xs text-gray-400">
                    ID: {device.deviceIdentifier.slice(0, 20)}...
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    device.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {device.isActive ? 'Active' : 'Inactive'}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {devices.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          No devices found. Register a device first.
        </div>
      )}
    </div>
  );
}
