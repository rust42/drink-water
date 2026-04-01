import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, CheckCircle, XCircle, Clock, RefreshCw, 
  ChevronLeft, ChevronRight, Filter, Search, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { pushApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { PushNotificationRequest, PushNotificationResult } from '@/types';

interface NotificationLog {
  id: string;
  timestamp: Date;
  deviceIdentifier: string;
  notification: PushNotificationRequest;
  result: PushNotificationResult;
  target: 'device' | 'store' | 'bulk';
}

export function NotificationHistory() {
  const { setToast } = useAppStore();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<NotificationLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const logsPerPage = 10;

  // Load logs from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('notification_logs');
    if (stored) {
      const parsed = JSON.parse(stored).map((log: NotificationLog) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
      setLogs(parsed);
    }
  }, []);

  // Filter logs
  useEffect(() => {
    let filtered = logs;
    
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.deviceIdentifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.notification.body.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(log => 
        statusFilter === 'success' ? log.result.success : !log.result.success
      );
    }
    
    setFilteredLogs(filtered);
    setCurrentPage(1);
  }, [logs, searchQuery, statusFilter]);

  const handleRetry = async (log: NotificationLog) => {
    setRetryingId(log.id);
    
    try {
      const result = await pushApi.sendToDevice(log.deviceIdentifier, log.notification);
      
      // Update log
      const updatedLogs = logs.map(l => 
        l.id === log.id 
          ? { ...l, result, timestamp: new Date() }
          : l
      );
      setLogs(updatedLogs);
      localStorage.setItem('notification_logs', JSON.stringify(updatedLogs));
      
      setToast({ 
        message: result.success ? 'Notification resent successfully' : 'Failed to resend', 
        type: result.success ? 'success' : 'error' 
      });
    } catch (error) {
      setToast({ message: 'Retry failed', type: 'error' });
    } finally {
      setRetryingId(null);
    }
  };

  const handleClear = () => {
    if (confirm('Clear all notification history?')) {
      setLogs([]);
      localStorage.removeItem('notification_logs');
      setToast({ message: 'History cleared', type: 'info' });
    }
  };

  const handleDelete = (id: string) => {
    const updated = logs.filter(l => l.id !== id);
    setLogs(updated);
    localStorage.setItem('notification_logs', JSON.stringify(updated));
  };

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'success', label: 'Success' },
    { value: 'failed', label: 'Failed' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Notification History</CardTitle>
            <CardDescription>Track all sent push notifications</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info">{logs.length} total</Badge>
            {logs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'success' | 'failed')}
            className="w-40"
          />
        </div>

        {/* Logs List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          <AnimatePresence>
            {paginatedLogs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg
                      ${log.result.success ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}
                    `}>
                      {log.result.success ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-slate-800 truncate">{log.notification.title}</h4>
                        <Badge variant={log.result.success ? 'success' : 'error'}>
                          {log.result.success ? 'Delivered' : 'Failed'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 truncate">{log.notification.body}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          {log.deviceIdentifier}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {log.timestamp.toLocaleString()}
                        </span>
                      </div>
                      {log.result.message && !log.result.success && (
                        <p className="text-xs text-rose-600 mt-2">{log.result.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!log.result.success && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRetry(log)}
                        isLoading={retryingId === log.id}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Send className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No notifications sent yet</p>
              <p className="text-sm">Send your first notification to see it here</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-slate-500">
              Showing {(currentPage - 1) * logsPerPage + 1} - {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to add logs from PushNotificationPanel
export function addNotificationLog(log: NotificationLog) {
  const existing = JSON.parse(localStorage.getItem('notification_logs') || '[]');
  existing.unshift(log);
  // Keep only last 100 logs
  localStorage.setItem('notification_logs', JSON.stringify(existing.slice(0, 100)));
}
