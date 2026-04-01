import { motion } from 'framer-motion';
import { Store, Building2 } from 'lucide-react';
import { DeviceAnalytics } from '@/components/analytics/DeviceAnalytics';
import { WaterIntakeDashboard } from '@/components/analytics/WaterIntakeDashboard';
import { StoreManager } from '@/components/stores/StoreManager';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export function AnalyticsTab() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-slate-800">Analytics & Insights</h2>
        <p className="text-slate-500">Track device metrics and water intake statistics</p>
      </motion.div>

      {/* Device Analytics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DeviceAnalytics />
      </motion.div>

      {/* Water Intake Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WaterIntakeDashboard />
      </motion.div>

      {/* Store Management */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Multi-Store Management</CardTitle>
                <CardDescription>Manage multiple store locations</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StoreManager />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
