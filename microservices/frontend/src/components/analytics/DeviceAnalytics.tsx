import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, Tablet, Watch, Laptop, Cpu, 
  TrendingUp, Users, Activity, Zap,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Device } from '@/types';

interface AnalyticsData {
  totalDevices: number;
  activeDevices: number;
  inactiveDevices: number;
  byPlatform: Record<string, number>;
  byStore: Record<string, number>;
  recentDevices: Device[];
}

const platformIcons: Record<string, React.ElementType> = {
  ios: Smartphone,
  android: Smartphone,
  ipad: Tablet,
  tablet: Tablet,
  watch: Watch,
  wearos: Watch,
  watchos: Watch,
  desktop: Laptop,
  macos: Laptop,
  windows: Laptop,
};

const platformColors: Record<string, string> = {
  ios: 'bg-blue-100 text-blue-700',
  android: 'bg-emerald-100 text-emerald-700',
  watch: 'bg-purple-100 text-purple-700',
  desktop: 'bg-slate-100 text-slate-700',
};

export function DeviceAnalytics() {
  const { currentStoreId, setToast } = useAppStore();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalDevices: 0,
    activeDevices: 0,
    inactiveDevices: 0,
    byPlatform: {},
    byStore: {},
    recentDevices: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [currentStoreId]);

  const fetchAnalytics = async () => {
    try {
      // In a real app, this would be a dedicated analytics endpoint
      // For now, we'll aggregate from the device list
      const devices = await deviceApi.getByStore(currentStoreId);
      
      const byPlatform: Record<string, number> = {};
      const byStore: Record<string, number> = {};
      
      devices.forEach(device => {
        const platform = device.platform || 'unknown';
        byPlatform[platform] = (byPlatform[platform] || 0) + 1;
        
        byStore[device.storeId] = (byStore[device.storeId] || 0) + 1;
      });

      setAnalytics({
        totalDevices: devices.length,
        activeDevices: devices.filter(d => d.isActive).length,
        inactiveDevices: devices.filter(d => !d.isActive).length,
        byPlatform,
        byStore,
        recentDevices: devices.slice(0, 5),
      });
    } catch (error) {
      setToast({ message: 'Failed to load analytics', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const activityRate = useMemo(() => {
    if (analytics.totalDevices === 0) return 0;
    return Math.round((analytics.activeDevices / analytics.totalDevices) * 100);
  }, [analytics]);

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    value: number; 
    subtitle: string; 
    icon: React.ElementType;
    color: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
    >
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{value.toLocaleString()}</p>
              <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Devices"
          value={analytics.totalDevices}
          subtitle="Across all stores"
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="Active Devices"
          value={analytics.activeDevices}
          subtitle={`${activityRate}% activity rate`}
          icon={Activity}
          color="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          title="Inactive"
          value={analytics.inactiveDevices}
          subtitle="Need attention"
          icon={Zap}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Stores"
          value={Object.keys(analytics.byStore).length}
          subtitle="Active locations"
          icon={TrendingUp}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution</CardTitle>
              <CardDescription>Devices by operating system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.byPlatform)
                  .sort(([,a], [,b]) => b - a)
                  .map(([platform, count]) => {
                    const Icon = platformIcons[platform.toLowerCase()] || Cpu;
                    const color = platformColors[platform.toLowerCase()] || 'bg-slate-100 text-slate-600';
                    const percentage = Math.round((count / analytics.totalDevices) * 100);
                    
                    return (
                      <div key={platform} className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-700 capitalize">{platform}</span>
                            <span className="text-sm text-slate-500">{count} ({percentage}%)</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-water-500 rounded-full"
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                
                {Object.keys(analytics.byPlatform).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Cpu className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No device data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Store Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Store Distribution</CardTitle>
              <CardDescription>Devices per store location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.byStore)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 10)
                  .map(([storeId, count]) => {
                    const percentage = Math.round((count / analytics.totalDevices) * 100);
                    
                    return (
                      <div key={storeId} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-water-100 text-water-600 flex items-center justify-center font-bold text-sm">
                            {storeId.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-700">{storeId}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="info">{count} devices</Badge>
                          <span className="text-sm text-slate-500 w-12 text-right">{percentage}%</span>
                        </div>
                      </div>
                    );
                  })}
                
                {Object.keys(analytics.byStore).length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No store data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Recently Added Devices</CardTitle>
            <CardDescription>Latest device registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.recentDevices.map((device, index) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${device.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <span className="font-medium text-slate-700">{device.deviceName || device.deviceIdentifier}</span>
                    <Badge variant={device.isActive ? 'success' : 'error'}>
                      {device.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>{device.platform || 'Unknown'}</span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
              
              {analytics.recentDevices.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p>No recent devices</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
