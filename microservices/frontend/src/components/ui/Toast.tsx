import { useAppStore } from '@/lib/store';
import { useEffect } from 'react';

export function Toast() {
  const { toast, clearToast } = useAppStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(clearToast, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  const bgColor = toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-green-500' : 'bg-blue-500';

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg z-50`}>
      {toast.message}
    </div>
  );
}
