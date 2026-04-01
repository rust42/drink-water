import { useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Droplets, Bell, Clock, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DeviceIcon } from '@/components/ui/DeviceIcon';
import { deviceApi, pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

export function DeviceDetails() {
  const { selectedDevice, setSelectedDevice, setToast } = useAppStore();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!selectedDevice) {
    return (
      <Card className="h-full flex items-center justify-center min-h-[300px]">
        <CardContent className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <DeviceIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-500">Select a device to view details</p>
        </CardContent>
      </Card>
    );
  }

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDeactivate = async () => {
    setIsDeactivating(true);
    try {
      await deviceApi.deactivate(selectedDevice.deviceIdentifier);
      setToast({ message: 'Device deactivated successfully', type: 'success' });
      setSelectedDevice({ ...selectedDevice, isActive: false });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to deactivate device',
        type: 'error',
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleSendHydrationReminder = async () => {
    setIsSendingReminder(true);
    try {
      await pushApi.sendHydrationReminder(selectedDevice.deviceIdentifier);
      setToast({ message: 'Hydration reminder sent!', type: 'success' });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to send reminder',
        type: 'error',
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const copyableField = (label: string, value: string, field: string) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <button
        onClick={() => handleCopy(value, field)}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-water-600 transition-colors"
      >
        <span className="truncate max-w-[150px]">{value}</span>
        {copiedField === field ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Copy className="w-4 h-4 text-slate-400" />
        )}
      </button>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'p-3 rounded-xl',
                selectedDevice.isActive ? 'bg-water-100 text-water-600' : 'bg-slate-100 text-slate-400'
              )}>
                <DeviceIcon platform={selectedDevice.platform} className="w-8 h-8" />
              </div>
              <div>
                <CardTitle>{selectedDevice.deviceName || selectedDevice.deviceIdentifier}</CardTitle>
                <CardDescription>{selectedDevice.platform || 'Unknown Platform'}</CardDescription>
              </div>
            </div>
            <Badge variant={selectedDevice.isActive ? 'success' : 'error'}>
              {selectedDevice.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-50/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Device Information</h4>
            <div className="space-y-1">
              {copyableField('ID', selectedDevice.deviceIdentifier, 'id')}
              {copyableField('Store ID', selectedDevice.storeId, 'store')}
              {copyableField('Platform', selectedDevice.platform || 'N/A', 'platform')}
              {copyableField('OS Version', selectedDevice.osVersion || 'N/A', 'os')}
              {copyableField('App Version', selectedDevice.appVersion || 'N/A', 'app')}
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Timestamps</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Created: {formatDate(selectedDevice.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Updated: {formatDate(selectedDevice.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleSendHydrationReminder}
              isLoading={isSendingReminder}
              className="flex-1"
            >
              <Droplets className="w-4 h-4" />
              Send Hydration Reminder
            </Button>

            {selectedDevice.isActive && (
              <Button
                variant="danger"
                onClick={handleDeactivate}
                isLoading={isDeactivating}
              >
                <Power className="w-4 h-4" />
                Deactivate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
