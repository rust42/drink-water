import { useState, useEffect, useMemo } from 'react';
import { deviceApi } from '@/lib/api';
import type { Device } from '@/types';
import { 
  Cpu, 
  RefreshCw, 
  ChevronRight, 
  Search, 
  Filter,
  Store,
  Smartphone,
  CheckCircle,
  XCircle,
  Globe
} from 'lucide-react';

interface DeviceSelectorProps {
  onSelectDevice: (device: Device) => void;
  selectedDevice?: Device | null;
}

type FilterType = 'all' | 'active' | 'inactive';

export function DeviceSelector({ onSelectDevice, selectedDevice }: DeviceSelectorProps) {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Get unique stores and platforms from all devices
  const availableStores = useMemo(() => {
    const stores = new Set(allDevices.map(d => d.storeId));
    return Array.from(stores).sort();
  }, [allDevices]);

  const availablePlatforms = useMemo(() => {
    const platforms = new Set(allDevices.map(d => d.platform));
    return Array.from(platforms).sort();
  }, [allDevices]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return allDevices.filter(device => {
      // Store filter
      if (selectedStore !== 'all' && device.storeId !== selectedStore) return false;
      
      // Platform filter
      if (selectedPlatform !== 'all' && device.platform !== selectedPlatform) return false;
      
      // Status filter
      if (statusFilter === 'active' && !device.isActive) return false;
      if (statusFilter === 'inactive' && device.isActive) return false;
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesIdentifier = device.deviceIdentifier.toLowerCase().includes(query);
        const matchesName = device.deviceName?.toLowerCase().includes(query);
        const matchesStore = device.storeId.toLowerCase().includes(query);
        if (!matchesIdentifier && !matchesName && !matchesStore) return false;
      }
      
      return true;
    });
  }, [allDevices, selectedStore, selectedPlatform, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredDevices.length;
    const active = filteredDevices.filter(d => d.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [filteredDevices]);

  const loadAllDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceApi.getAll();
      setAllDevices(data);
      if (data.length === 0) {
        setError('No devices found. Register a device first.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllDevices();
  }, []);

  const clearFilters = () => {
    setSelectedStore('all');
    setSelectedPlatform('all');
    setStatusFilter('all');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedStore !== 'all' || selectedPlatform !== 'all' || 
                          statusFilter !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-4">
      {/* Header with Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices by ID, name, or store..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                !
              </span>
            )}
          </button>
          <button
            onClick={loadAllDevices}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-700 flex items-center gap-2">
              <Filter size={18} />
              Filter Devices
            </h4>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Store Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <Store size={16} />
                Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Stores</option>
                {availableStores.map(store => (
                  <option key={store} value={store}>{store}</option>
                ))}
              </select>
            </div>

            {/* Platform Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <Smartphone size={16} />
                Platform
              </label>
              <select
                value={selectedPlatform}
                onChange={(e) => setSelectedPlatform(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Platforms</option>
                {availablePlatforms.map(platform => (
                  <option key={platform} value={platform}>{platform}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                <CheckCircle size={16} />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-blue-600" />
          <span className="font-medium">{stats.total}</span>
          <span className="text-gray-500">total</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="font-medium text-green-600">{stats.active}</span>
          <span className="text-gray-500">active</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle size={16} className="text-red-600" />
          <span className="font-medium text-red-600">{stats.inactive}</span>
          <span className="text-gray-500">inactive</span>
        </div>
        {hasActiveFilters && (
          <span className="text-gray-400">
            (filtered from {allDevices.length} devices)
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {/* Devices List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredDevices.map((device) => (
          <div
            key={device.id}
            onClick={() => onSelectDevice(device)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              selectedDevice?.id === device.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  device.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <Cpu size={20} className={device.isActive ? 'text-green-600' : 'text-gray-600'} />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {device.deviceName || device.deviceIdentifier}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Smartphone size={14} />
                      {device.platform}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Store size={14} />
                      {device.storeId}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-1">
                    {device.deviceIdentifier}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    device.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {device.isActive ? 'Active' : 'Inactive'}
                </span>
                <ChevronRight size={16} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty States */}
      {filteredDevices.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          {allDevices.length === 0 ? (
            <div className="space-y-2">
              <Cpu size={48} className="mx-auto text-gray-300" />
              <p className="text-gray-500">No devices found.</p>
              <p className="text-sm text-gray-400">Register a device to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Filter size={48} className="mx-auto text-gray-300" />
              <p className="text-gray-500">No devices match your filters.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Clear filters to see all devices
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
