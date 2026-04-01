import { motion } from 'framer-motion';
import { PushNotificationPanel } from '@/components/notifications/PushNotificationPanel';
import { NotificationHistory } from '@/components/notifications/NotificationHistory';
import { ScheduledNotifications } from '@/components/notifications/ScheduledNotifications';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Zap, Info, History, Clock } from 'lucide-react';

export function NotificationsTab() {
  return (
    <div className="space-y-6">
      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="bg-gradient-to-r from-water-50 to-emerald-50 border-water-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-water-100 text-water-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Quick Tips</h3>
                <ul className="mt-2 text-sm text-slate-600 space-y-1">
                  <li>• Use <strong>Basic mode</strong> for quick notifications with preset templates</li>
                  <li>• Use <strong>Advanced mode</strong> for custom sounds, categories, and thread IDs</li>
                  <li>• Send to a <strong>single device</strong>, <strong>all devices in a store</strong>, or <strong>multiple devices</strong> at once</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Push Notification Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <PushNotificationPanel />
        </motion.div>

        {/* Scheduled Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ScheduledNotifications />
        </motion.div>
      </div>

      {/* Notification History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <NotificationHistory />
      </motion.div>
    </div>
  );
}
