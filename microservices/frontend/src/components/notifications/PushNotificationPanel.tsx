import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Settings, Sparkles, Users, Store, Smartphone, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { PushNotificationRequest, NotificationMode, NotificationTarget } from '@/types';

const targetOptions = [
  { value: 'device', label: 'Single Device' },
  { value: 'store', label: 'All Store Devices' },
  { value: 'bulk', label: 'Bulk (Multiple Devices)' },
];

const soundOptions = [
  { value: 'default', label: 'Default' },
  { value: 'alert', label: 'Alert' },
  { value: 'chime', label: 'Chime' },
  { value: 'none', label: 'None' },
];

const categoryOptions = [
  { value: '', label: 'None' },
  { value: 'DAILY_SUMMARY', label: 'Daily Summary' },
  { value: 'HYDRATION_ALERT', label: 'Hydration Alert' },
  { value: 'ACHIEVEMENT', label: 'Achievement' },
  { value: 'REMINDER', label: 'Reminder' },
];

const defaultNotification: PushNotificationRequest = {
  title: 'Drink Water Reminder',
  body: 'Time to hydrate! Take a sip of water now.',
  sound: 'default',
};

const quickTemplates = [
  { title: 'Hydration Alert', body: 'Stay hydrated! Drink a glass of water now.' },
  { title: 'Daily Goal', body: 'Great job! You\'re making progress on your daily water goal.' },
  { title: 'Achievement', body: 'Congratulations! You\'ve reached a new milestone.' },
  { title: 'Morning Reminder', body: 'Start your day right with a glass of water!' },
];

export function PushNotificationPanel() {
  const { selectedDevice, currentStoreId, setToast } = useAppStore();
  const [mode, setMode] = useState<NotificationMode>('basic');
  const [target, setTarget] = useState<NotificationTarget>('device');
  const [notification, setNotification] = useState<PushNotificationRequest>(defaultNotification);
  const [deviceIdentifier, setDeviceIdentifier] = useState(selectedDevice?.deviceIdentifier || '');
  const [storeId, setStoreId] = useState(currentStoreId);
  const [bulkTargets, setBulkTargets] = useState<string[]>(['']);
  const [isSending, setIsSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const handleApplyTemplate = (template: { title: string; body: string }) => {
    setNotification({ ...notification, title: template.title, body: template.body });
    setShowTemplates(false);
  };

  const addBulkTarget = () => {
    setBulkTargets([...bulkTargets, '']);
  };

  const removeBulkTarget = (index: number) => {
    setBulkTargets(bulkTargets.filter((_, i) => i !== index));
  };

  const updateBulkTarget = (index: number, value: string) => {
    const updated = [...bulkTargets];
    updated[index] = value;
    setBulkTargets(updated);
  };

  const handleSend = async () => {
    if (!notification.title || !notification.body) {
      setToast({ message: 'Title and body are required', type: 'error' });
      return;
    }

    setIsSending(true);
    try {
      let result;

      switch (target) {
        case 'device':
          if (!deviceIdentifier) {
            setToast({ message: 'Device identifier is required', type: 'error' });
            return;
          }
          result = await pushApi.sendToDevice(deviceIdentifier, notification);
          setToast({
            message: result.success ? 'Notification sent successfully!' : `Failed: ${result.message}`,
            type: result.success ? 'success' : 'error',
          });
          break;

        case 'store':
          if (!storeId) {
            setToast({ message: 'Store ID is required', type: 'error' });
            return;
          }
          result = await pushApi.sendToStore(storeId, notification);
          const successCount = result.filter((r) => r.success).length;
          setToast({
            message: `Sent to ${successCount}/${result.length} devices`,
            type: successCount > 0 ? 'success' : 'error',
          });
          break;

        case 'bulk':
          const validTargets = bulkTargets.filter((t) => t.trim());
          if (validTargets.length === 0) {
            setToast({ message: 'At least one device identifier is required', type: 'error' });
            return;
          }
          result = await pushApi.sendBulk({
            targets: validTargets.map((t) => ({ deviceIdentifier: t })),
            notification,
          });
          const bulkSuccessCount = result.filter((r) => r.success).length;
          setToast({
            message: `Sent to ${bulkSuccessCount}/${result.length} devices`,
            type: bulkSuccessCount > 0 ? 'success' : 'error',
          });
          break;
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'Failed to send notification',
        type: 'error',
      });
    } finally {
      setIsSending(false);
    }
  };

  const TargetIcon = target === 'device' ? Smartphone : target === 'store' ? Store : Users;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-water-100 text-water-600">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>Send notifications to devices</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Target Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700">Target</label>
          <Select
            options={targetOptions}
            value={target}
            onChange={(e) => setTarget(e.target.value as NotificationTarget)}
          />

          <AnimatePresence mode="wait">
            {target === 'device' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  label="Device Identifier"
                  placeholder="e.g., device-12345"
                  value={deviceIdentifier}
                  onChange={(e) => setDeviceIdentifier(e.target.value)}
                />
              </motion.div>
            )}

            {target === 'store' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Input
                  label="Store ID"
                  placeholder="e.g., store-001"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                />
              </motion.div>
            )}

            {target === 'bulk' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label className="text-sm font-medium text-slate-700">Device Identifiers</label>
                {bulkTargets.map((target, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Device ${index + 1}`}
                      value={target}
                      onChange={(e) => updateBulkTarget(index, e.target.value)}
                      className="flex-1"
                    />
                    {bulkTargets.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBulkTarget(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addBulkTarget}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Device
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as NotificationMode)}>
          <TabsList className="w-full">
            <TabsTrigger value="basic" currentValue={mode} onValueChange={(v) => setMode(v as NotificationMode)}>
              <Sparkles className="w-4 h-4 mr-2" />
              Basic
            </TabsTrigger>
            <TabsTrigger value="advanced" currentValue={mode} onValueChange={(v) => setMode(v as NotificationMode)}>
              <Settings className="w-4 h-4 mr-2" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" currentValue={mode}>
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Quick Templates</label>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(!showTemplates)}>
                  {showTemplates ? 'Hide' : 'Show'} Templates
                </Button>
              </div>

              <AnimatePresence>
                {showTemplates && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {quickTemplates.map((template) => (
                      <button
                        key={template.title}
                        onClick={() => handleApplyTemplate(template)}
                        className="p-3 text-left rounded-xl bg-slate-50 hover:bg-water-50 border border-slate-200 hover:border-water-200 transition-all"
                      >
                        <p className="font-medium text-sm text-slate-700">{template.title}</p>
                        <p className="text-xs text-slate-500 mt-1 truncate">{template.body}</p>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Input
                label="Title"
                placeholder="Notification title"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                maxLength={100}
              />

              <Textarea
                label="Body"
                placeholder="Notification message"
                value={notification.body}
                onChange={(e) => setNotification({ ...notification, body: e.target.value })}
                maxLength={500}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" currentValue={mode}>
            <div className="space-y-4 pt-4">
              <Input
                label="Title *"
                placeholder="Notification title"
                value={notification.title}
                onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                maxLength={100}
              />

              <Input
                label="Subtitle"
                placeholder="Optional subtitle"
                value={notification.subtitle || ''}
                onChange={(e) => setNotification({ ...notification, subtitle: e.target.value })}
                maxLength={200}
              />

              <Textarea
                label="Body *"
                placeholder="Notification message"
                value={notification.body}
                onChange={(e) => setNotification({ ...notification, body: e.target.value })}
                maxLength={500}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Sound"
                  options={soundOptions}
                  value={notification.sound || 'default'}
                  onChange={(e) => setNotification({ ...notification, sound: e.target.value })}
                />

                <Select
                  label="Category"
                  options={categoryOptions}
                  value={notification.category || ''}
                  onChange={(e) => setNotification({ ...notification, category: e.target.value })}
                />
              </div>

              <Input
                label="Thread ID"
                placeholder="For grouping notifications"
                value={notification.threadId || ''}
                onChange={(e) => setNotification({ ...notification, threadId: e.target.value })}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Preview</p>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-water-500 flex items-center justify-center flex-shrink-0">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900">{notification.title || 'Title'}</p>
                {notification.subtitle && (
                  <p className="text-sm text-slate-500">{notification.subtitle}</p>
                )}
                <p className="text-sm text-slate-700 mt-1">{notification.body || 'Body message...'}</p>
              </div>
              <span className="text-xs text-slate-400">Now</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSend}
          isLoading={isSending}
          className="w-full"
          size="lg"
        >
          <Send className="w-4 h-4" />
          Send Notification
        </Button>
      </CardContent>
    </Card>
  );
}
