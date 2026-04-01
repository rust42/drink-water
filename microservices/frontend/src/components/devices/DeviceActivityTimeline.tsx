import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, Bell, Smartphone, TrendingUp,
  Calendar, Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { waterApi, pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { WaterIntakeResponse, Device } from '@/types';

interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'intake' | 'reminder' | 'device_registered' | 'notification_sent';
  title: string;
  description: string;
  deviceIdentifier: string;
  amount?: number;
  data?: unknown;
}

export function DeviceActivityTimeline({ device }: { device?: Device }) {
  const { selectedDevice, setToast } = useAppStore();
  const targetDevice = device || selectedDevice;
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waterData, setWaterData] = useState<WaterIntakeResponse | null>(null);

  useEffect(() => {
    if (targetDevice) {
      loadActivity();
    }
  }, [targetDevice?.deviceIdentifier]);

  const loadActivity = async () => {
    if (!targetDevice) return;
    
    setIsLoading(true);
    try {
      // Load water intake data
      const water = await waterApi.getTodayIntake(targetDevice.deviceIdentifier);
      setWaterData(water);

      // Build timeline from various sources
      const timelineEvents: TimelineEvent[] = [];
      
      // Device registration
      timelineEvents.push({
        id: `reg-${targetDevice.id}`,
        timestamp: new Date(targetDevice.createdAt),
        type: 'device_registered',
        title: 'Device Registered',
        description: `Device ${targetDevice.deviceName || targetDevice.deviceIdentifier} was registered`,
        deviceIdentifier: targetDevice.deviceIdentifier,
      });

      // Sort by timestamp (newest first)
      timelineEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setEvents(timelineEvents);
    } catch (error) {
      // No water data yet is OK
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!targetDevice) return;
    
    try {
      await pushApi.sendHydrationReminder(targetDevice.deviceIdentifier);
      setToast({ message: 'Hydration reminder sent!', type: 'success' });
      loadActivity();
    } catch (error) {
      setToast({ message: 'Failed to send reminder', type: 'error' });
    }
  };

  const handleRecordIntake = async () => {
    if (!targetDevice) return;
    
    try {
      await waterApi.recordIntake({
        deviceIdentifier: targetDevice.deviceIdentifier,
        amount: 250,
      });
      setToast({ message: 'Water intake recorded!', type: 'success' });
      loadActivity();
    } catch (error) {
      setToast({ message: 'Failed to record intake', type: 'error' });
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'intake': return Droplets;
      case 'reminder': return Bell;
      case 'device_registered': return Smartphone;
      case 'notification_sent': return Bell;
      default: return Clock;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'intake': return 'bg-blue-100 text-blue-600';
      case 'reminder': return 'bg-amber-100 text-amber-600';
      case 'device_registered': return 'bg-emerald-100 text-emerald-600';
      case 'notification_sent': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (!targetDevice) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-400">
          <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select a device to view activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Water Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Hydration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-xl">
              <Droplets className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-slate-800">
                {waterData?.totalIntake || 0}ml
              </p>
              <p className="text-sm text-slate-500">Total Intake</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-2xl font-bold text-slate-800">
                {waterData?.dailyGoal || 2000}ml
              </p>
              <p className="text-sm text-slate-500">Daily Goal</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold text-slate-800">
                {waterData ? Math.round((waterData.totalIntake / waterData.dailyGoal) * 100) : 0}%
              </p>
              <p className="text-sm text-slate-500">Progress</p>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button onClick={handleRecordIntake} className="flex-1">
              <Droplets className="w-4 h-4 mr-2" />
              Record 250ml
            </Button>
            <Button variant="secondary" onClick={handleSendReminder}>
              <Bell className="w-4 h-4 mr-2" />
              Send Reminder
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent events for this device</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />
            
            <div className="space-y-6">
              {events.map((event, index) => {
                const Icon = getEventIcon(event.type);
                const color = getEventColor(event.type);
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex gap-4"
                  >
                    <div className={`
                      relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                      ${color}
                    `}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-slate-800">{event.title}</h4>
                        <span className="text-xs text-slate-400">
                          {event.timestamp.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{event.description}</p>
                    </div>
                  </motion.div>
                );
              })}
              
              {events.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity recorded yet</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
