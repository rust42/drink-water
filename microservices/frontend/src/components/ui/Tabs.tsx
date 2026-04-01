import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Tabs({ value, onValueChange, children }: TabsProps) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex p-1 bg-slate-100/80 rounded-xl', className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  currentValue: string;
  onValueChange: (value: string) => void;
}

export function TabsTrigger({ value, children, currentValue, onValueChange }: TabsTriggerProps) {
  const isActive = value === currentValue;
  
  return (
    <button
      onClick={() => onValueChange(value)}
      className={cn(
        'relative flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-colors',
        isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-lg shadow-sm"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

interface TabsContentProps {
  value: string;
  currentValue: string;
  children: React.ReactNode;
}

export function TabsContent({ value, currentValue, children }: TabsContentProps) {
  if (value !== currentValue) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
