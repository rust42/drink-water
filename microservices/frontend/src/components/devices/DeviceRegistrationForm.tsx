import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { generateId } from '@/lib/utils';
import type { DeviceRegistrationRequest } from '@/types';

const platforms = [
  { value: '', label: 'Select Platform' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'watch', label: 'Watch' },
  { value: 'desktop', label: 'Desktop' },
];

interface DeviceRegistrationFormProps {
  onSuccess?: () => void;
}

export function DeviceRegistrationForm({ onSuccess }: DeviceRegistrationFormProps) {
  const { currentStoreId, setToast } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<DeviceRegistrationRequest>({
    deviceIdentifier: '',
    pushToken: '',
    storeId: currentStoreId,
    deviceName: '',
    platform: '',
    osVersion: '',
    appVersion: '',
  });

  const generateSampleData = () => {
    const id = generateId().slice(0, 8);
    setFormData({
      deviceIdentifier: `device-${id}`,
      pushToken: `token-${generateId()}`,
      storeId: currentStoreId,
      deviceName: `Test Device ${id}`,
      platform: 'ios',
      osVersion: '17.0',
      appVersion: '1.0.0',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await deviceApi.register(formData);
      setToast({ message: 'Device registered successfully!', type: 'success' });
      setFormData({
        deviceIdentifier: '',
        pushToken: '',
        storeId: currentStoreId,
        deviceName: '',
        platform: '',
        osVersion: '',
        appVersion: '',
      });
      onSuccess?.();
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to register device',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={generateSampleData}>
          Fill Sample Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Device Identifier *"
          placeholder="e.g., device-12345"
          value={formData.deviceIdentifier}
          onChange={(e) => setFormData({ ...formData, deviceIdentifier: e.target.value })}
          required
        />

        <Input
          label="Push Token *"
          placeholder="APNs or FCM token"
          value={formData.pushToken}
          onChange={(e) => setFormData({ ...formData, pushToken: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Store ID *"
          placeholder="Store identifier"
          value={formData.storeId}
          onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
          required
        />

        <Input
          label="Device Name"
          placeholder="Friendly name for the device"
          value={formData.deviceName || ''}
          onChange={(e) => setFormData({ ...formData, deviceName: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Platform"
          options={platforms}
          value={formData.platform || ''}
          onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
        />

        <Input
          label="OS Version"
          placeholder="e.g., 17.0"
          value={formData.osVersion || ''}
          onChange={(e) => setFormData({ ...formData, osVersion: e.target.value })}
        />

        <Input
          label="App Version"
          placeholder="e.g., 1.0.0"
          value={formData.appVersion || ''}
          onChange={(e) => setFormData({ ...formData, appVersion: e.target.value })}
        />
      </div>

      <div className="pt-4">
        <Button type="submit" isLoading={isLoading} className="w-full">
          Register Device
        </Button>
      </div>
    </form>
  );
}
