import { useEffect, useState } from 'react';
import { deviceApi, waterApi } from '@/lib/api';
import type { Device, WaterIntakeResponse } from '@/types';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Droplets, 
  Calendar,
  Activity,
  PieChart,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface AnalyticsData {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  devicesByPlatform: Record<string, number>;
  devicesByStore: Record<string, number>;
  recentRegistrations: Device[];
  waterStats: {
    totalIntakeToday: number;
    averageIntake: number;
    deviceCountWithIntake: number;
  };
}

interface TimeRange {
  label: string;
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Last 24 Hours', days: 1 },
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
];

export function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    devicesByPlatform: {},
    devicesByStore: {},
    recentRegistrations: [],
    waterStats: {
      totalIntakeToday: 0,
      averageIntake: 0,
      deviceCountWithIntake: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('default-store');
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1]);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const devices = await deviceApi.getByStore(selectedStore);
      
      const byPlatform: Record<string, number> = {};
      const byStore: Record<string, number> = {};
      let active = 0;
      let inactive = 0;
      let totalIntake = 0;
      let devicesWithIntake = 0;

      // Process devices
      devices.forEach(d => {
        const platform = d.platform || 'Unknown';
        const storeId = d.storeId || 'Unknown';
        byPlatform[platform] = (byPlatform[platform] || 0) + 1;
        byStore[storeId] = (byStore[storeId] || 0) + 1;
        if (d.isActive) active++;
        else inactive++;
      });

      // Fetch water stats for first 5 active devices
      const activeDevices = devices.filter(d => d.isActive).slice(0, 5);
      for (const device of activeDevices) {
        try {
          const intake: WaterIntakeResponse = await waterApi.getTodayIntake(device.deviceIdentifier);
          if (intake.totalIntake > 0) {
            totalIntake += intake.totalIntake;
            devicesWithIntake++;
          }
        } catch (e) {
          // Ignore errors for individual devices
        }
      }

      const recent = [...devices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);

      setData({
        totalDevices: devices.length,
        activeDevices: active,
        inactiveDevices: inactive,
        devicesByPlatform: byPlatform,
        devicesByStore: byStore,
        recentRegistrations: recent,
        waterStats: {
          totalIntakeToday: totalIntake,
          averageIntake: devicesWithIntake > 0 ? Math.round(totalIntake / devicesWithIntake) : 0,
          deviceCountWithIntake: devicesWithIntake,
        },
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [selectedStore, timeRange]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({ title, icon: Icon, section }: { title: string; icon: any; section: string }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-blue-600" />
        <span className="font-semibold">{title}</span>
      </div>
      {expandedSection === section ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <BarChart3 size={24} className="text-blue-600" />
          Analytics Dashboard
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
            <option value="all">All Stores</option>
          </select>
          <select
            value={timeRange.label}
            onChange={(e) => setTimeRange(TIME_RANGES.find(r => r.label === e.target.value) || TIME_RANGES[1])}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            {TIME_RANGES.map(r => (
              <option key={r.label} value={r.label}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Section */}
      <div className="space-y-2">
        <SectionHeader title="Overview Metrics" icon={Activity} section="overview" />
        {expandedSection === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Users size={24} />
                <span className="text-sm opacity-90">Total Devices</span>
              </div>
              <p className="text-3xl font-bold">{data.totalDevices}</p>
              <p className="text-sm mt-2 opacity-75">
                {data.activeDevices} active, {data.inactiveDevices} inactive
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={24} />
                <span className="text-sm opacity-90">Active Rate</span>
              </div>
              <p className="text-3xl font-bold">
                {data.totalDevices > 0 ? Math.round((data.activeDevices / data.totalDevices) * 100) : 0}%
              </p>
              <p className="text-sm mt-2 opacity-75">
                {data.activeDevices} of {data.totalDevices} devices
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Droplets size={24} />
                <span className="text-sm opacity-90">Today's Water Intake</span>
              </div>
              <p className="text-3xl font-bold">{data.waterStats.totalIntakeToday}ml</p>
              <p className="text-sm mt-2 opacity-75">
                Avg: {data.waterStats.averageIntake}ml per device
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center gap-3 mb-2">
                <Calendar size={24} />
                <span className="text-sm opacity-90">New Devices ({timeRange.label})</span>
              </div>
              <p className="text-3xl font-bold">{data.recentRegistrations.length}</p>
              <p className="text-sm mt-2 opacity-75">
                Latest registrations
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Platform Distribution */}
      <div className="space-y-2">
        <SectionHeader title="Platform Distribution" icon={PieChart} section="platform" />
        {expandedSection === 'platform' && (
          <div className="bg-white rounded-lg shadow p-6">
            {Object.keys(data.devicesByPlatform).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(data.devicesByPlatform).map(([platform, count]) => {
                  const percentage = data.totalDevices > 0 
                    ? Math.round((count / data.totalDevices) * 100) 
                    : 0;
                  return (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{platform}</span>
                        <span className="text-sm text-gray-500">{count} devices ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No platform data available</p>
            )}
          </div>
        )}
      </div>

      {/* Store Distribution */}
      <div className="space-y-2">
        <SectionHeader title="Store Distribution" icon={BarChart3} section="store" />
        {expandedSection === 'store' && (
          <div className="bg-white rounded-lg shadow p-6">
            {Object.keys(data.devicesByStore).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(data.devicesByStore).map(([store, count]) => (
                  <div key={store} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">{store}</p>
                    <p className="text-2xl font-bold text-blue-600">{count}</p>
                    <p className="text-xs text-gray-500">devices</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No store data available</p>
            )}
          </div>
        )}
      </div>

      {/* Recent Registrations */}
      <div className="space-y-2">
        <SectionHeader title="Recent Registrations" icon={Clock} section="recent" />
        {expandedSection === 'recent' && (
          <div className="bg-white rounded-lg shadow p-6">
            {data.recentRegistrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Device ID</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Platform</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Store</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRegistrations.map((device) => (
                      <tr key={device.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm">{device.deviceIdentifier.slice(0, 20)}...</td>
                        <td className="py-3 px-4 text-sm">{device.platform}</td>
                        <td className="py-3 px-4 text-sm">{device.storeId}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            device.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {device.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(device.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent registrations</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
