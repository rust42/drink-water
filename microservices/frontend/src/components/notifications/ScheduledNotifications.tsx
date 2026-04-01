import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, Calendar, Send, Trash2, Edit2, Bell,
  Repeat, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { PushNotificationRequest } from '@/types';

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  deviceIdentifier: string;
  scheduledTime: Date;
  recurring: 'none' | 'daily' | 'weekly';
  status: 'pending' | 'sent' | 'cancelled';
  createdAt: Date;
}

export function ScheduledNotifications() {
  const { setToast } = useAppStore();
  const [scheduled, setScheduled] = useState<ScheduledNotification[]>([]);
  const [activeTab, setActiveTab] = useState('create');
  
  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [recurring, setRecurring] = useState<'none' | 'daily' | 'weekly'>('none');

  // Load scheduled notifications from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('scheduled_notifications');
    if (stored) {
      const parsed = JSON.parse(stored).map((n: ScheduledNotification) => ({
        ...n,
        scheduledTime: new Date(n.scheduledTime),
        createdAt: new Date(n.createdAt),
      }));
      setScheduled(parsed);
    }
  }, []);

  // Check for due notifications every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendDueNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, [scheduled]);

  const checkAndSendDueNotifications = async () => {
    const now = new Date();
    const pending = scheduled.filter(n => n.status === 'pending' && new Date(n.scheduledTime) <= now);
    
    for (const notification of pending) {
      try {
        await pushApi.sendToDevice(notification.deviceIdentifier, {
          title: notification.title,
          body: notification.body,
        });
        
        // Mark as sent
        const updated = scheduled.map(n => 
          n.id === notification.id ? { ...n, status: 'sent' as const } : n
        );
        setScheduled(updated);
        localStorage.setItem('scheduled_notifications', JSON.stringify(updated));
        
        // If recurring, schedule next
        if (notification.recurring !== 'none') {
          const nextTime = new Date(notification.scheduledTime);
          if (notification.recurring === 'daily') {
            nextTime.setDate(nextTime.getDate() + 1);
          } else if (notification.recurring === 'weekly') {
            nextTime.setDate(nextTime.getDate() + 7);
          }
          
          const nextNotification: ScheduledNotification = {
            ...notification,
            id: `${Date.now()}-recurring`,
            scheduledTime: nextTime,
            status: 'pending',
          };
          
          const withNext = [...updated, nextNotification];
          setScheduled(withNext);
          localStorage.setItem('scheduled_notifications', JSON.stringify(withNext));
        }
        
        setToast({ message: `Scheduled notification sent to ${notification.deviceIdentifier}`, type: 'success' });
      } catch (error) {
        setToast({ message: `Failed to send scheduled notification`, type: 'error' });
      }
    }
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !body || !deviceIdentifier || !scheduledDate || !scheduledTime) {
      setToast({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    
    const scheduledTimeDate = new Date(`${scheduledDate}T${scheduledTime}`);
    
    if (scheduledTimeDate <= new Date()) {
      setToast({ message: 'Scheduled time must be in the future', type: 'error' });
      return;
    }
    
    const newNotification: ScheduledNotification = {
      id: `${Date.now()}`,
      title,
      body,
      deviceIdentifier,
      scheduledTime: scheduledTimeDate,
      recurring,
      status: 'pending',
      createdAt: new Date(),
    };
    
    const updated = [...scheduled, newNotification];
    setScheduled(updated);
    localStorage.setItem('scheduled_notifications', JSON.stringify(updated));
    
    // Reset form
    setTitle('');
    setBody('');
    setDeviceIdentifier('');
    setScheduledDate('');
    setScheduledTime('');
    setRecurring('none');
    
    setActiveTab('list');
    setToast({ message: 'Notification scheduled successfully', type: 'success' });
  };

  const handleCancel = (id: string) => {
    const updated = scheduled.map(n => 
      n.id === id ? { ...n, status: 'cancelled' as const } : n
    );
    setScheduled(updated);
    localStorage.setItem('scheduled_notifications', JSON.stringify(updated));
    setToast({ message: 'Notification cancelled', type: 'info' });
  };

  const handleDelete = (id: string) => {
    const updated = scheduled.filter(n => n.id !== id);
    setScheduled(updated);
    localStorage.setItem('scheduled_notifications', JSON.stringify(updated));
  };

  const recurringOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
  ];

  const pendingNotifications = scheduled.filter(n => n.status === 'pending');
  const sentNotifications = scheduled.filter(n => n.status === 'sent');

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Scheduled Notifications</CardTitle>
            <CardDescription>Schedule future push notifications</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="create" currentValue={activeTab} onValueChange={setActiveTab}>
              <Send className="w-4 h-4 mr-2" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="list" currentValue={activeTab} onValueChange={setActiveTab}>
              <Clock className="w-4 h-4 mr-2" />
              Pending ({pendingNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="history" currentValue={activeTab} onValueChange={setActiveTab}>
              <Bell className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" currentValue={activeTab}>
            <form onSubmit={handleSchedule} className="space-y-4 pt-4">
              <Input
                label="Title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <Textarea
                label="Body"
                placeholder="Notification message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />

              <Input
                label="Device Identifier"
                placeholder="e.g., device-12345"
                value={deviceIdentifier}
                onChange={(e) => setDeviceIdentifier(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
                <Input
                  label="Time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  required
                />
              </div>

              <Select
                label="Recurring"
                options={recurringOptions}
                value={recurring}
                onChange={(e) => setRecurring(e.target.value as 'none' | 'daily' | 'weekly')}
              />

              <Button type="submit" className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Notification
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="list" currentValue={activeTab}>
            <div className="space-y-2 pt-4">
              <AnimatePresence>
                {pendingNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    className="p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                          {notification.recurring !== 'none' && (
                            <Badge variant="info">
                              <Repeat className="w-3 h-3 mr-1" />
                              {notification.recurring}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{notification.body}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            {notification.deviceIdentifier}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {notification.scheduledTime.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(notification.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {pendingNotifications.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending notifications</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history" currentValue={activeTab}>
            <div className="space-y-2 pt-4">
              {sentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 bg-slate-50 rounded-xl opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800">{notification.title}</h4>
                        <Badge variant="success">Sent</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{notification.body}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Sent to {notification.deviceIdentifier} on {notification.scheduledTime.toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              ))}

              {sentNotifications.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sent notifications</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
