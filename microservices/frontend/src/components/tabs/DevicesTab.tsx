import { useState } from 'react';
import { deviceApi } from '@/lib/api';
import type { Device } from '@/types';
import { DeviceSelector } from '@/components/devices/DeviceSelector';
import { DeviceActionPanel } from '@/components/devices/DeviceActionPanel';
import { Plus, ArrowLeft } from 'lucide-react';

export function DevicesTab() {
  const [view, setView] = useState<'list' | 'register' | 'actions'>('list');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // Registration form state
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [pushToken, setPushToken] = useState('');
  const [storeId, setStoreId] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    setView('actions');
  };

  const handleBack = () => {
    setSelectedDevice(null);
    setView('list');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedDeviceId = deviceIdentifier.trim();
    const trimmedStoreId = storeId.trim();
    
    if (!deviceName.trim()) {
      setResult('Error: Device Name is required');
      return;
    }
    if (!trimmedDeviceId) {
      setResult('Error: Device ID is required');
      return;
    }
    if (trimmedDeviceId.length > 100) {
      setResult(`Error: Device ID must be less than 100 characters (current: ${trimmedDeviceId.length})`);
      return;
    }
    if (!trimmedStoreId) {
      setResult('Error: Store ID is required');
      return;
    }
    if (!pushToken.trim()) {
      setResult('Error: Push Token is required');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await deviceApi.register({
        deviceIdentifier: trimmedDeviceId,
        deviceName: deviceName.trim() || undefined,
        pushToken: pushToken.trim(),
        storeId: trimmedStoreId,
      });
      setResult(`✅ Registered: ${response.deviceName || response.deviceIdentifier}`);
      setDeviceIdentifier('');
      setDeviceName('');
      setPushToken('');
      setStoreId('');
      setTimeout(() => setView('list'), 1500);
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
      setResult(`❌ Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Render different views
  if (view === 'actions' && selectedDevice) {
    return (
      <div className="max-w-2xl mx-auto">
        <DeviceActionPanel device={selectedDevice} onBack={handleBack} />
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setView('list')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h3 className="text-xl font-semibold">Register New Device</h3>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device Name
              </label>
              <input
                type="text"
                value={deviceName}
                maxLength={100}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter device name (e.g., John's iPhone)"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Friendly name for the device (optional)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Device ID *
              </label>
              <input
                type="text"
                value={deviceIdentifier}
                maxLength={100}
                onChange={(e) => setDeviceIdentifier(e.target.value)}
                placeholder="Enter unique device identifier"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {deviceIdentifier.length}/100 characters (unique identifier)
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store ID *
              </label>
              <input
                type="text"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                placeholder="Enter store ID"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Push Token *
              </label>
              <input
                type="text"
                value={pushToken}
                onChange={(e) => setPushToken(e.target.value)}
                placeholder="Enter APNS/FCM push token"
                className="w-full rounded-md border border-gray-300 px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Required for sending push notifications
              </p>
            </div>

            {result && (
              <div className={`p-3 rounded-md text-sm ${
                result.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {result}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView('list')}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Register Device'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Devices</h3>
        <button
          onClick={() => setView('register')}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={18} />
          Register Device
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <DeviceSelector 
          onSelectDevice={handleSelectDevice}
          selectedDevice={selectedDevice}
        />
      </div>
    </div>
  );
}
