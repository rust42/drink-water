import { useState } from 'react';
import { deviceApi, pushApi, waterApi } from '@/lib/api';
import type { Device } from '@/types';
import { 
  Bell, 
  Droplets, 
  GlassWater, 
  Target, 
  PowerOff,
  Send,
  ChevronLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface DeviceActionPanelProps {
  device: Device;
  onBack: () => void;
}

export function DeviceActionPanel({ device, onBack }: DeviceActionPanelProps) {
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  
  // Push notification form
  const [notification, setNotification] = useState({
    title: '',
    body: '',
    subtitle: '',
  });

  // Water intake form
  const [waterAmount, setWaterAmount] = useState(250);

  const showResult = (type: 'success' | 'error', message: string) => {
    setResult({ type, message });
    setTimeout(() => setResult(null), 5000);
  };

  const handleAction = async (actionName: string, action: () => Promise<any>) => {
    setLoading(actionName);
    try {
      await action();
      showResult('success', `${actionName} completed successfully!`);
    } catch (err: any) {
      showResult('error', `${actionName} failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(null);
    }
  };

  // Push Notification Actions
  const sendCustomPush = () => {
    if (!notification.title || !notification.body) {
      showResult('error', 'Please enter title and body');
      return;
    }
    handleAction('Send Push', () => 
      pushApi.sendToDevice(device.deviceIdentifier, {
        title: notification.title,
        body: notification.body,
        subtitle: notification.subtitle,
      })
    );
  };

  const sendHydrationReminder = () => {
    handleAction('Hydration Reminder', () => 
      pushApi.sendHydrationReminder(device.deviceIdentifier)
    );
  };

  // Water Intake Actions
  const recordIntake = () => {
    handleAction('Record Intake', () => 
      waterApi.recordIntake({
        deviceIdentifier: device.deviceIdentifier,
        amount: waterAmount,
      })
    );
  };

  const getTodayIntake = () => {
    handleAction('Get Today Intake', async () => {
      const data = await waterApi.getTodayIntake(device.deviceIdentifier);
      showResult('success', `Today's intake: ${data.totalIntake}ml / ${data.dailyGoal}ml (${data.progressPercentage}%)`);
    });
  };

  const getDailyGoal = () => {
    handleAction('Get Daily Goal', async () => {
      const data = await waterApi.getDailyGoal(device.deviceIdentifier);
      showResult('success', `Daily goal: ${data.dailyGoal} ${data.unit}`);
    });
  };

  const sendWaterReminder = () => {
    handleAction('Send Water Reminder', () => 
      waterApi.sendReminder(device.deviceIdentifier)
    );
  };

  // Device Actions
  const deactivateDevice = () => {
    if (!confirm('Are you sure you want to deactivate this device?')) return;
    handleAction('Deactivate Device', () => 
      deviceApi.deactivate(device.deviceIdentifier)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h3 className="text-lg font-semibold">
            {device.deviceName || device.deviceIdentifier}
          </h3>
          <p className="text-sm text-gray-500">{device.platform} • {device.storeId}</p>
        </div>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {result.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-sm">{result.message}</p>
        </div>
      )}

      {/* Push Notifications Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="text-blue-600" size={20} />
          <h4 className="font-semibold">Push Notifications</h4>
        </div>

        <div className="space-y-4 mb-4">
          <input
            type="text"
            value={notification.title}
            onChange={(e) => setNotification({ ...notification, title: e.target.value })}
            placeholder="Notification title"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={notification.subtitle}
            onChange={(e) => setNotification({ ...notification, subtitle: e.target.value })}
            placeholder="Subtitle (optional)"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <textarea
            value={notification.body}
            onChange={(e) => setNotification({ ...notification, body: e.target.value })}
            placeholder="Notification body"
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={sendCustomPush}
            disabled={loading === 'Send Push'}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {loading === 'Send Push' ? 'Sending...' : 'Send Push'}
          </button>
          <button
            onClick={sendHydrationReminder}
            disabled={loading === 'Hydration Reminder'}
            className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Droplets size={16} />
            {loading === 'Hydration Reminder' ? 'Sending...' : 'Hydration Reminder'}
          </button>
        </div>
      </div>

      {/* Water Intake Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <GlassWater className="text-cyan-600" size={20} />
          <h4 className="font-semibold">Water Intake</h4>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="text-sm text-gray-600">Amount (ml):</label>
          <input
            type="number"
            value={waterAmount}
            onChange={(e) => setWaterAmount(Number(e.target.value))}
            min={0}
            max={2000}
            className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="range"
            min={0}
            max={1000}
            step={50}
            value={waterAmount}
            onChange={(e) => setWaterAmount(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={recordIntake}
            disabled={loading === 'Record Intake'}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'Record Intake' ? 'Recording...' : 'Record Intake'}
          </button>
          <button
            onClick={getTodayIntake}
            disabled={loading === 'Get Today Intake'}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading === 'Get Today Intake' ? 'Loading...' : "Today's Intake"}
          </button>
          <button
            onClick={getDailyGoal}
            disabled={loading === 'Get Daily Goal'}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Target size={16} />
            {loading === 'Get Daily Goal' ? 'Loading...' : 'Daily Goal'}
          </button>
          <button
            onClick={sendWaterReminder}
            disabled={loading === 'Send Water Reminder'}
            className="bg-cyan-600 text-white px-4 py-2 rounded-md hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bell size={16} />
            {loading === 'Send Water Reminder' ? 'Sending...' : 'Send Reminder'}
          </button>
        </div>
      </div>

      {/* Device Management Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <PowerOff className="text-red-600" size={20} />
          <h4 className="font-semibold">Device Management</h4>
        </div>

        <button
          onClick={deactivateDevice}
          disabled={loading === 'Deactivate Device'}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <PowerOff size={16} />
          {loading === 'Deactivate Device' ? 'Deactivating...' : 'Deactivate Device'}
        </button>
      </div>
    </div>
  );
}
