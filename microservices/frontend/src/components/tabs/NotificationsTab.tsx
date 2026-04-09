import { useState } from 'react';
import { pushApi } from '@/lib/api';

export function NotificationsTab() {
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [title, setTitle] = useState('Drink Water Reminder');
  const [body, setBody] = useState('Time to drink water!');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await pushApi.sendToDevice(deviceIdentifier, {
        title,
        body,
      });
      setResult(`Sent: ${response.success ? 'Success' : 'Failed'} - ${response.message}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Send Push Notification</h3>
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Device Identifier</label>
            <input
              type="text"
              value={deviceIdentifier}
              onChange={(e) => setDeviceIdentifier(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Enter device identifier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              rows={3}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md text-sm">{result}</div>
        )}
      </div>
    </div>
  );
}
