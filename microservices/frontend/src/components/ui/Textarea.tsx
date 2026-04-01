import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white/80 backdrop-blur-sm',
            'text-slate-900 placeholder:text-slate-400',
            'transition-all duration-200 resize-y min-h-[100px]',
            'focus:outline-none focus:ring-2 focus:ring-water-500/50 focus:border-water-500',
            'hover:border-water-300',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50'
              : 'border-slate-200',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
