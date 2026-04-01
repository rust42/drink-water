import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Tag, Plus, X, Users, Smartphone, Edit2, Trash2,
  Send, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { deviceApi, pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Device, PushNotificationRequest } from '@/types';

interface DeviceGroup {
  id: string;
  name: string;
  color: string;
  deviceIds: string[];
}

const groupColors = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-700 border-blue-200' },
  { name: 'Green', value: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-700 border-purple-200' },
  { name: 'Amber', value: 'bg-amber-100 text-amber-700 border-amber-200' },
  { name: 'Rose', value: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export function DeviceGroups() {
  const { currentStoreId, setToast } = useAppStore();
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState(groupColors[0].value);
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [bulkNotification, setBulkNotification] = useState({ title: '', body: '' });

  useEffect(() => {
    loadGroups();
    loadDevices();
  }, [currentStoreId]);

  const loadGroups = () => {
    const stored = localStorage.getItem('device_groups');
    if (stored) {
      setGroups(JSON.parse(stored));
    }
  };

  const loadDevices = async () => {
    try {
      const data = await deviceApi.getByStore(currentStoreId);
      setDevices(data);
    } catch {
      setToast({ message: 'Failed to load devices', type: 'error' });
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedDevices.length === 0) {
      setToast({ message: 'Please provide a name and select devices', type: 'error' });
      return;
    }

    const newGroup: DeviceGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName.trim(),
      color: selectedColor,
      deviceIds: selectedDevices,
    };

    const updated = [...groups, newGroup];
    setGroups(updated);
    localStorage.setItem('device_groups', JSON.stringify(updated));
    
    setNewGroupName('');
    setSelectedDevices([]);
    setIsCreating(false);
    setToast({ message: `Group "${newGroup.name}" created`, type: 'success' });
  };

  const handleDeleteGroup = (id: string) => {
    const updated = groups.filter(g => g.id !== id);
    setGroups(updated);
    localStorage.setItem('device_groups', JSON.stringify(updated));
    setToast({ message: 'Group deleted', type: 'info' });
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSendToGroup = async (group: DeviceGroup) => {
    if (!bulkNotification.title || !bulkNotification.body) {
      setToast({ message: 'Please enter notification content', type: 'error' });
      return;
    }

    setIsSending(true);
    try {
      const targets = group.deviceIds.map(id => ({ deviceIdentifier: id }));
      const results = await pushApi.sendBulk({
        targets,
        notification: bulkNotification,
      });

      const successCount = results.filter(r => r.success).length;
      setToast({ 
        message: `Sent to ${successCount}/${results.length} devices in ${group.name}`, 
        type: successCount > 0 ? 'success' : 'error' 
      });
      
      setBulkNotification({ title: '', body: '' });
    } catch (error) {
      setToast({ message: 'Failed to send to group', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const getDevicesInGroup = (group: DeviceGroup) => {
    return devices.filter(d => group.deviceIds.includes(d.deviceIdentifier));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <CardTitle>Device Groups</CardTitle>
              <CardDescription>Organize devices into groups for bulk operations</CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsCreating(!isCreating)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Create Group Form */}
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-50 rounded-xl p-4 space-y-4"
          >
            <Input
              label="Group Name"
              placeholder="e.g., VIP Customers"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
              <div className="flex gap-2">
                {groupColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    className={`
                      w-8 h-8 rounded-full border-2 transition-all
                      ${selectedColor === color.value ? 'ring-2 ring-offset-2 ring-slate-400' : ''}
                      ${color.value.split(' ')[0]}
                    `}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Devices ({selectedDevices.length} selected)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-white rounded-lg border">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => toggleDeviceSelection(device.deviceIdentifier)}
                    className={`
                      flex items-center gap-2 p-2 rounded-lg text-left transition-colors
                      ${selectedDevices.includes(device.deviceIdentifier) 
                        ? 'bg-water-50 border-water-200 border' 
                        : 'hover:bg-slate-50'}
                    `}
                  >
                    <div className={`
                      w-4 h-4 rounded border flex items-center justify-center
                      ${selectedDevices.includes(device.deviceIdentifier) 
                        ? 'bg-water-500 border-water-500' 
                        : 'border-slate-300'}
                    `}>
                      {selectedDevices.includes(device.deviceIdentifier) && (
                        <Plus className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className="text-sm truncate">{device.deviceName || device.deviceIdentifier}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>
                Create Group
              </Button>
            </div>
          </motion.div>
        )}

        {/* Bulk Notification */}
        {groups.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h4 className="font-medium text-blue-800">Quick Bulk Notification</h4>
            <Input
              placeholder="Notification title"
              value={bulkNotification.title}
              onChange={(e) => setBulkNotification({ ...bulkNotification, title: e.target.value })}
            />
            <Input
              placeholder="Notification body"
              value={bulkNotification.body}
              onChange={(e) => setBulkNotification({ ...bulkNotification, body: e.target.value })}
            />
          </div>
        )}

        {/* Groups List */}
        <div className="space-y-3">
          {groups.map((group) => {
            const groupDevices = getDevicesInGroup(group);
            const isExpanded = expandedGroup === group.id;

            return (
              <motion.div
                key={group.id}
                layout
                className={`rounded-xl border-2 overflow-hidden ${group.color.split(' ')[2]}`}
              >
                <div 
                  className={`p-4 ${group.color.split(' ')[0]} cursor-pointer`}
                  onClick={() => setIsExpanded(isExpanded ? null : group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-white/50`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{group.name}</h4>
                        <p className="text-sm opacity-75">{groupDevices.length} devices</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendToGroup(group);
                        }}
                        isLoading={isSending}
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className={`
                        w-5 h-5 transition-transform
                        ${isExpanded ? 'rotate-90' : ''}
                      `} />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-white space-y-2">
                    {groupDevices.map((device) => (
                      <div 
                        key={device.id}
                        className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg"
                      >
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm">{device.deviceName || device.deviceIdentifier}</span>
                        <Badge variant={device.isActive ? 'success' : 'error'} className="ml-auto">
                          {device.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    ))}
                    {groupDevices.length === 0 && (
                      <p className="text-center text-slate-400 py-4">No devices found in this group</p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}

          {groups.length === 0 && !isCreating && (
            <div className="text-center py-8 text-slate-400">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No groups created yet</p>
              <p className="text-sm">Create a group to organize devices</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
