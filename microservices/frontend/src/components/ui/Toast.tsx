import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  error: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export function Toast() {
  const { toast, setToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  if (!toast) return null;

  const Icon = icons[toast.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm',
            styles[toast.type]
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
