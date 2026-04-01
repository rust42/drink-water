import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: 'bg-water-600 text-white hover:bg-water-700 shadow-lg shadow-water-600/25',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm',
  outline: 'bg-transparent text-water-600 hover:bg-water-50 border-2 border-water-600',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/25',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-water-500/50 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {children}
    </motion.button>
  );
}
