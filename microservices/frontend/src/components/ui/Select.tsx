import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white/80 backdrop-blur-sm',
            'text-slate-900',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-water-500/50 focus:border-water-500',
            'hover:border-water-300',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50'
              : 'border-slate-200',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
