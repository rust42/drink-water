import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, TrendingUp, Calendar, Target, Award,
  BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { waterApi, deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface WaterStats {
  totalIntake: number;
  dailyGoal: number;
  progress: number;
  streak: number;
  avgPerDay: number;
  daysTracked: number;
}

// Simple SVG bar chart component
function BarChart({ data, max }: { data: number[]; max: number }) {
  return (
    <div className="flex items-end gap-2 h-32 px-4">
      {data.map((value, index) => {
        const height = max > 0 ? (value / max) * 100 : 0;
        return (
          <motion.div
            key={index}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="flex-1 bg-water-400 rounded-t-lg relative group"
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
              {value}ml
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Circular progress component
function CircularProgress({ 
  percentage, 
  size = 120, 
  strokeWidth = 10,
  children 
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function WaterIntakeDashboard() {
  const { currentStoreId, setToast } = useAppStore();
  const [stats, setStats] = useState<WaterStats>({
    totalIntake: 0,
    dailyGoal: 2000,
    progress: 0,
    streak: 0,
    avgPerDay: 0,
    daysTracked: 0,
  });
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWaterStats();
  }, [currentStoreId]);

  const loadWaterStats = async () => {
    setIsLoading(true);
    try {
      // Get all devices for this store
      const devices = await deviceApi.getByStore(currentStoreId);
      
      // Load water data for each device and aggregate
      let totalIntake = 0;
      let totalGoal = 0;
      const weekData = [1200, 1800, 2000, 1500, 2200, 800, 0]; // Simulated historical data
      
      for (const device of devices.slice(0, 5)) { // Limit to avoid too many requests
        try {
          const data = await waterApi.getTodayIntake(device.deviceIdentifier);
          totalIntake += data.totalIntake || 0;
          totalGoal += data.dailyGoal || 2000;
        } catch {
          // Ignore errors for individual devices
        }
      }
      
      const avgGoal = devices.length > 0 ? totalGoal / devices.length : 2000;
      const progress = avgGoal > 0 ? Math.min(100, Math.round((totalIntake / avgGoal) * 100)) : 0;
      
      setStats({
        totalIntake,
        dailyGoal: Math.round(avgGoal),
        progress,
        streak: 5, // Simulated streak
        avgPerDay: Math.round(totalIntake / 7),
        daysTracked: 7,
      });
      
      setWeeklyData(weekData);
    } catch (error) {
      setToast({ message: 'Failed to load water stats', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadWaterStats();
    setToast({ message: 'Stats refreshed', type: 'success' });
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Circle */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              <CircularProgress percentage={stats.progress} size={160} strokeWidth={12}>
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">{stats.progress}%</p>
                  <p className="text-sm text-slate-500">of daily goal</p>
                </div>
              </CircularProgress>
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-slate-700">
                  {stats.totalIntake}ml / {stats.dailyGoal}ml
                </p>
                <p className="text-sm text-slate-500">Total water intake today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Current Streak</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{stats.streak} days</p>
                  </div>
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 mt-4">Keep it up! You're doing great.</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Daily Average</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{stats.avgPerDay}ml</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  <ArrowUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-emerald-600 font-medium">12%</span>
                  <span className="text-sm text-slate-400">vs last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-2"
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Weekly Overview</CardTitle>
                    <CardDescription>Last 7 days of water intake</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRefresh}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <BarChart data={weeklyData} max={2500} />
                <div className="flex justify-between text-xs text-slate-400 mt-2 px-4">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Device Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Device Hydration</CardTitle>
          <CardDescription>Water intake by device today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Simulated device breakdown */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Droplets className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">iPhone 15 Pro</p>
                  <p className="text-sm text-slate-500">device-001</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-800">1,250ml</p>
                <p className="text-sm text-slate-500">62% of goal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
