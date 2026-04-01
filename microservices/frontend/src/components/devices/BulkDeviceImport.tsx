import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Download, FileSpreadsheet, Check, AlertCircle,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { deviceApi } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { DeviceRegistrationRequest } from '@/types';

interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; error: string }[];
}

export function BulkDeviceImport() {
  const { currentStoreId, setToast } = useAppStore();
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const headers = ['deviceIdentifier', 'pushToken', 'storeId', 'deviceName', 'platform', 'osVersion', 'appVersion'];
    const sampleData = [
      ['device-001', 'apns-token-001', currentStoreId, 'iPhone 15 Pro', 'ios', '17.0', '1.0.0'],
      ['device-002', 'fcm-token-002', currentStoreId, 'Pixel 8', 'android', '14.0', '1.0.0'],
    ];
    
    const csv = [headers.join(','), ...sampleData.map(row => row.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'device-import-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseCSV = (content: string): Partial<DeviceRegistrationRequest>[] => {
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        if (values[index]) {
          row[header] = values[index];
        }
      });
      
      return row as DeviceRegistrationRequest;
    });
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setToast({ message: 'Please upload a CSV file', type: 'error' });
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      const devices = parseCSV(content);
      
      const result: ImportResult = { success: 0, failed: 0, errors: [] };
      
      for (let i = 0; i < devices.length; i++) {
        const device = devices[i];
        
        try {
          // Validate required fields
          if (!device.deviceIdentifier || !device.pushToken || !device.storeId) {
            throw new Error('Missing required fields: deviceIdentifier, pushToken, or storeId');
          }
          
          await deviceApi.register(device as DeviceRegistrationRequest);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            row: i + 2, // +2 because row 1 is header, and we want 1-indexed display
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
      
      setImportResult(result);
      setToast({ 
        message: `Import complete: ${result.success} succeeded, ${result.failed} failed`, 
        type: result.failed === 0 ? 'success' : result.success > 0 ? 'info' : 'error' 
      });
    } catch (error) {
      setToast({ message: 'Failed to parse CSV file', type: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bulk Device Import</CardTitle>
            <CardDescription>Import multiple devices via CSV</CardDescription>
          </div>
          <Button variant="secondary" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <motion.div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          animate={{ 
            scale: isDragging ? 1.02 : 1,
            borderColor: isDragging ? '#3b82f6' : '#e2e8f0'
          }}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center
            transition-colors cursor-pointer
            ${isDragging ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-200'}
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileInput}
          />
          
          <div className={`
            w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
            ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400'}
          `}>
            <Upload className="w-8 h-8" />
          </div>
          
          <p className="font-medium text-slate-700">
            {isDragging ? 'Drop CSV file here' : 'Click or drag CSV file here'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Supports CSV files with device data
          </p>
        </motion.div>

        {isImporting && (
          <div className="flex items-center justify-center py-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-water-500 border-t-transparent rounded-full"
            />
            <span className="ml-3 text-sm text-slate-600">Importing devices...</span>
          </div>
        )}

        {importResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-700">Import Results</h4>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-water-600 flex items-center gap-1"
              >
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{importResult.success}</p>
                  <p className="text-sm text-emerald-600">Succeeded</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-3 p-3 rounded-xl ${importResult.failed > 0 ? 'bg-rose-50' : 'bg-slate-100'}`}>
                <div className={`p-2 rounded-lg ${importResult.failed > 0 ? 'bg-rose-100' : 'bg-slate-200'}`}>
                  <AlertCircle className={`w-5 h-5 ${importResult.failed > 0 ? 'text-rose-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${importResult.failed > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                    {importResult.failed}
                  </p>
                  <p className={`text-sm ${importResult.failed > 0 ? 'text-rose-600' : 'text-slate-500'}`}>Failed</p>
                </div>
              </div>
            </div>

            {showDetails && importResult.errors.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-rose-50 rounded-lg">
                    <Badge variant="error">Row {error.row}</Badge>
                    <span className="text-rose-700">{error.error}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <div className="text-sm text-slate-500 bg-blue-50 p-4 rounded-xl">
          <p className="font-medium text-blue-700 mb-2">CSV Format Requirements:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Required columns: <code>deviceIdentifier</code>, <code>pushToken</code>, <code>storeId</code></li>
            <li>Optional columns: <code>deviceName</code>, <code>platform</code>, <code>osVersion</code>, <code>appVersion</code></li>
            <li>First row must be headers</li>
            <li>One device per row</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
