import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState, forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border bg-white/80 backdrop-blur-sm',
              'text-slate-900 placeholder:text-slate-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-water-500/50 focus:border-water-500',
              'hover:border-water-300',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/50'
                : 'border-slate-200',
              isPassword && 'pr-10',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-slate-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
