import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { DeviceRegistrationForm } from '@/components/devices/DeviceRegistrationForm';
import { DeviceList } from '@/components/devices/DeviceList';
import { DeviceDetails } from '@/components/devices/DeviceDetails';
import { BulkDeviceImport } from '@/components/devices/BulkDeviceImport';
import { DeviceGroups } from '@/components/devices/DeviceGroups';
import { DeviceActivityTimeline } from '@/components/devices/DeviceActivityTimeline';
import { useAppStore } from '@/lib/store';
import { Plus, List, Upload, Users, Activity } from 'lucide-react';

export function DevicesTab() {
  const { selectedDevice } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Registration Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Register New Device</CardTitle>
                <CardDescription>Add a new device to your store</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DeviceRegistrationForm />
          </CardContent>
        </Card>
      </motion.div>

      {/* Bulk Import */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <CardTitle>Bulk Import</CardTitle>
                <CardDescription>Import multiple devices from CSV</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BulkDeviceImport />
          </CardContent>
        </Card>
      </motion.div>

      {/* Device Groups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <DeviceGroups />
      </motion.div>

      {/* Device List & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-water-100 text-water-600">
                  <List className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle>Your Devices</CardTitle>
                  <CardDescription>Manage registered devices</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DeviceList />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <DeviceActivityTimeline />
        </motion.div>
      </div>
    </div>
  );
}
