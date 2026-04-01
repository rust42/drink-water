import { motion } from 'framer-motion';
import { Heart, Activity, Terminal } from 'lucide-react';
import { APNSHealthCheck } from '@/components/monitoring/APNSHealthCheck';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function MonitoringTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-slate-800">System Monitoring</h2>
        <p className="text-slate-500">Real-time health checks and system status</p>
      </motion.div>

      {/* Health Check Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <APNSHealthCheck />
      </motion.div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Real-time Updates</CardTitle>
                  <CardDescription>Live data synchronization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                  <span className="font-medium text-slate-700">Polling Interval</span>
                  <span className="text-emerald-600 font-semibold">5 seconds</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                  <span className="font-medium text-slate-700">Auto-refresh</span>
                  <span className="text-blue-600 font-semibold">Enabled</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                  <span className="font-medium text-slate-700">Connection</span>
                  <span className="text-amber-600 font-semibold">WebSocket Fallback</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>API Status</CardTitle>
                  <CardDescription>Backend service endpoints</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Device Service</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">8081</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Push Service</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">8082</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-medium text-slate-700">Water Service</span>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">8083</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
