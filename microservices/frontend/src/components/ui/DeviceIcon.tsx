import { Cpu, Smartphone, Tablet, Watch, Laptop } from 'lucide-react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { motion } from 'framer-motion';

interface DeviceIconProps {
  platform?: string;
  className?: string;
}

export function DeviceIcon({ platform, className = 'w-5 h-5' }: DeviceIconProps) {
  const iconProps = { className };
  
  switch (platform?.toLowerCase()) {
    case 'ios':
    case 'android':
      return <Smartphone {...iconProps} />;
    case 'ipad':
    case 'tablet':
      return <Tablet {...iconProps} />;
    case 'watch':
    case 'wearos':
    case 'watchos':
      return <Watch {...iconProps} />;
    case 'desktop':
    case 'macos':
    case 'windows':
      return <Laptop {...iconProps} />;
    default:
      return <Cpu {...iconProps} />;
  }
}

interface DeviceCardProps {
  device: {
    id: number;
    deviceIdentifier: string;
    deviceName?: string;
    platform?: string;
    isActive: boolean;
    storeId: string;
    createdAt: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export function DeviceCard({ device, isSelected, onClick }: DeviceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        hover
        onClick={onClick}
        className={cn(
          'transition-all duration-200',
          isSelected && 'ring-2 ring-water-500 ring-offset-2'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              'p-3 rounded-xl',
              device.isActive ? 'bg-water-100 text-water-600' : 'bg-slate-100 text-slate-400'
            )}>
              <DeviceIcon platform={device.platform} className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-slate-900 truncate">
                  {device.deviceName || device.deviceIdentifier}
                </h4>
                <Badge variant={device.isActive ? 'success' : 'error'}>
                  {device.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1 truncate">{device.deviceIdentifier}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>{device.platform || 'Unknown'}</span>
                <span>•</span>
                <span>{new Date(device.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
