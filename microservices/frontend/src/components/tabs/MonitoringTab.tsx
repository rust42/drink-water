import { useEffect, useState } from 'react';
import { deviceApi, waterApi } from '@/lib/api';
import type { Device } from '@/types';
import { 
  Activity, 
  Server, 
  Bell, 
  Droplets, 
  Cpu, 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface ServiceStatus {
  name: string;
  key: string;
  status: 'up' | 'down' | 'checking' | 'warning';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

interface DeviceMetrics {
  total: number;
  active: number;
  inactive: number;
  byPlatform: Record<string, number>;
  byStore: Record<string, number>;
  recentRegistrations: Device[];
}

export function MonitoringTab() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Device Service', key: 'device', status: 'checking', lastChecked: new Date() },
    { name: 'Push Service', key: 'push', status: 'checking', lastChecked: new Date() },
    { name: 'Water Service', key: 'water', status: 'checking', lastChecked: new Date() },
  ]);
  const [metrics, setMetrics] = useState<DeviceMetrics>({
    total: 0,
    active: 0,
    inactive: 0,
    byPlatform: {},
    byStore: {},
    recentRegistrations: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('default-store');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const checkHealth = async () => {
    const startTime = Date.now();
    
    try {
      await deviceApi.getByStore(selectedStore);
      updateServiceStatus('device', 'up', Date.now() - startTime);
    } catch (error: any) {
      updateServiceStatus('device', 'down', undefined, error.message);
    }

    try {
      const testDevice = metrics.recentRegistrations[0]?.deviceIdentifier;
      if (testDevice) {
        await waterApi.getDailyGoal(testDevice);
      }
      updateServiceStatus('water', 'up', Date.now() - startTime);
    } catch (error: any) {
      updateServiceStatus('water', 'warning', undefined, 'No test device available');
    }

    updateServiceStatus('push', 'up');
  };

  const updateServiceStatus = (key: string, status: ServiceStatus['status'], responseTime?: number, error?: string) => {
    setServices(prev => prev.map(s => 
      s.key === key 
        ? { ...s, status, responseTime, lastChecked: new Date(), error }
        : s
    ));
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const devices = await deviceApi.getByStore(selectedStore);
      
      const byPlatform: Record<string, number> = {};
      const byStore: Record<string, number> = {};
      let active = 0;
      let inactive = 0;

      devices.forEach(d => {
        const platform = d.platform || 'Unknown';
        const storeId = d.storeId || 'Unknown';
        byPlatform[platform] = (byPlatform[platform] || 0) + 1;
        byStore[storeId] = (byStore[storeId] || 0) + 1;
        if (d.isActive) active++;
        else inactive++;
      });

      const recent = [...devices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setMetrics({
        total: devices.length,
        active,
        inactive,
        byPlatform,
        byStore,
        recentRegistrations: recent,
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        checkHealth();
        fetchMetrics();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedStore, autoRefresh]);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'up': return 'bg-green-500';
      case 'down': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'up': return <CheckCircle size={16} className="text-green-600" />;
      case 'down': return <XCircle size={16} className="text-red-600" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-600" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Activity size={24} className="text-blue-600" />
          Device Management Monitoring
        </h3>
        <div className="flex items-center gap-3">
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="default-store">Default Store</option>
            <option value="store1">Store 1</option>
            <option value="store2">Store 2</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => { checkHealth(); fetchMetrics(); }}
            className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <RefreshCw size={18} className="text-blue-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => (
          <div key={service.key} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {service.key === 'device' && <Server size={20} className="text-blue-600" />}
                {service.key === 'push' && <Bell size={20} className="text-purple-600" />}
                {service.key === 'water' && <Droplets size={20} className="text-cyan-600" />}
                <span className="font-medium">{service.name}</span>
              </div>
              {getStatusIcon(service.status)}
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
              <span className="text-sm text-gray-600 capitalize">{service.status}</span>
            </div>
            {service.responseTime && (
              <p className="text-xs text-gray-500">Response time: {service.responseTime}ms</p>
            )}
            {service.error && (
              <p className="text-xs text-red-500 mt-1">{service.error}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Last checked: {service.lastChecked.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Cpu size={20} className="text-blue-600" />
            <span className="text-sm text-gray-600">Total Devices</span>
          </div>
          <p className="text-2xl font-bold">{metrics.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle size={20} className="text-green-600" />
            <span className="text-sm text-gray-600">Active Devices</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{metrics.active}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <XCircle size={20} className="text-red-600" />
            <span className="text-sm text-gray-600">Inactive Devices</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{metrics.inactive}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users size={20} className="text-purple-600" />
            <span className="text-sm text-gray-600">Active Rate</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}%
          </p>
        </div>
      </div>

      {Object.keys(metrics.byPlatform).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <Server size={18} />
            Devices by Platform
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.byPlatform).map(([platform, count]) => (
              <div key={platform} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">{platform}</p>
                <p className="text-xl font-semibold">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Clock size={18} />
          Recent Device Registrations
        </h4>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : metrics.recentRegistrations.length > 0 ? (
          <div className="space-y-3">
            {metrics.recentRegistrations.map((device) => (
              <div key={device.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{device.deviceIdentifier}</p>
                  <p className="text-sm text-gray-500">{device.platform} • {device.storeId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {device.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(device.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No devices registered yet.</p>
        )}
      </div>
    </div>
  );
}
