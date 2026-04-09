import { useState, useRef } from 'react';
import { pushApi } from '@/lib/api';
import { Upload, Send, FileKey, Smartphone, Bell, AlertCircle, CheckCircle } from 'lucide-react';

export function PushConfigTab() {
  // P8 File upload state
  const [p8File, setP8File] = useState<File | null>(null);
  const [keyId, setKeyId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [bundleId, setBundleId] = useState('');
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Push notification state
  const [deviceTokens, setDeviceTokens] = useState('');
  const [title, setTitle] = useState('Test Notification');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('This is a test push notification!');
  const [sound, setSound] = useState('default');
  const [category, setCategory] = useState('');
  const [customData, setCustomData] = useState('');
  const [isProduction, setIsProduction] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.p8')) {
      setP8File(file);
      setUploadResult(null);
    } else if (file) {
      setUploadResult({ success: false, message: 'Please select a valid .p8 file' });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!p8File) {
      setUploadResult({ success: false, message: 'Please select a .p8 file' });
      return;
    }
    if (!keyId.trim() || !teamId.trim() || !bundleId.trim()) {
      setUploadResult({ success: false, message: 'Key ID, Team ID, and Bundle ID are required' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await pushApi.uploadP8File(p8File, keyId.trim(), teamId.trim(), bundleId.trim());
      setUploadResult({
        success: response.success,
        message: response.message,
      });
      if (response.success) {
        setP8File(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error: any) {
      setUploadResult({
        success: false,
        message: error.message || 'Failed to upload p8 file',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!keyId.trim() || !teamId.trim() || !bundleId.trim()) {
      setSendResult({ success: false, message: 'Key ID, Team ID, and Bundle ID are required' });
      return;
    }
    if (!deviceTokens.trim()) {
      setSendResult({ success: false, message: 'At least one device token is required' });
      return;
    }
    if (!title.trim() || !body.trim()) {
      setSendResult({ success: false, message: 'Title and body are required' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      // Parse device tokens (comma or newline separated)
      const tokens = deviceTokens
        .split(/[\n,]+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Parse custom data if provided
      let customDataObj: Record<string, unknown> | undefined;
      if (customData.trim()) {
        try {
          customDataObj = JSON.parse(customData);
        } catch {
          setSendResult({ success: false, message: 'Invalid custom data JSON' });
          setSending(false);
          return;
        }
      }

      const response = await pushApi.sendDynamicPush({
        p8KeyId: keyId.trim(),
        teamId: teamId.trim(),
        bundleId: bundleId.trim(),
        deviceTokens: tokens,
        notification: {
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          body: body.trim(),
          sound: sound.trim() || undefined,
          category: category.trim() || undefined,
          customData: customDataObj,
        },
        isProduction,
      });

      setSendResult({
        success: response.success,
        message: response.message,
      });
    } catch (error: any) {
      setSendResult({
        success: false,
        message: error.message || 'Failed to send push notification',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* P8 File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileKey className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">APNS Credentials</h3>
            <p className="text-sm text-gray-500">Upload your .p8 authentication key and configure your app details</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key ID *
              </label>
              <input
                type="text"
                value={keyId}
                onChange={(e) => setKeyId(e.target.value)}
                placeholder="e.g., ABC123DEF4"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your APNS Key ID from Apple Developer</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team ID *
              </label>
              <input
                type="text"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="e.g., A1B2C3D4E5"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your Apple Developer Team ID</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bundle ID *
              </label>
              <input
                type="text"
                value={bundleId}
                onChange={(e) => setBundleId(e.target.value)}
                placeholder="e.g., com.example.myapp"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Your app&apos;s bundle identifier</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              P8 Authentication Key *
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".p8"
                onChange={handleFileSelect}
                className="flex-1 text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
              />
              {p8File && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  {p8File.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Upload your AuthKey_xxx.p8 file downloaded from Apple Developer
            </p>
          </div>

          {uploadResult && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
              uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {uploadResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {uploadResult.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || !p8File}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload P8 Key'}
            </button>
          </div>
        </form>
      </div>

      {/* Push Notification Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <Bell className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Send Push Notification</h3>
            <p className="text-sm text-gray-500">Configure and send push notifications to your devices</p>
          </div>
        </div>

        <form onSubmit={handleSendPush} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Tokens *
            </label>
            <textarea
              value={deviceTokens}
              onChange={(e) => setDeviceTokens(e.target.value)}
              placeholder="Enter device tokens (one per line or comma-separated)"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              APNS device tokens for the target devices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Notification subtitle (optional)"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Body *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Notification message body"
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sound
              </label>
              <input
                type="text"
                value={sound}
                onChange={(e) => setSound(e.target.value)}
                placeholder="default"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., GENERAL"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProduction}
                  onChange={(e) => setIsProduction(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Production Environment</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Data (JSON)
            </label>
            <textarea
              value={customData}
              onChange={(e) => setCustomData(e.target.value)}
              placeholder='{"key": "value", "foo": "bar"}'
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional custom payload data as JSON object
            </p>
          </div>

          {sendResult && (
            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
              sendResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {sendResult.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {sendResult.message}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              {sending ? 'Sending...' : 'Send Push Notification'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">How to use this feature</h4>
            <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
              <li>Download your AuthKey .p8 file from Apple Developer Portal</li>
              <li>Enter your Key ID, Team ID, and Bundle ID</li>
              <li>Upload the .p8 file (it will be stored temporarily for the push request)</li>
              <li>Enter the device tokens you want to send the notification to</li>
              <li>Configure your notification content and click Send</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
