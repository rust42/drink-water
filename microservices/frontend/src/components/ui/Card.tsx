import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' } : undefined}
      className={cn(
        'bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-slate-200/50',
        hover && 'cursor-pointer transition-shadow',
        className
      )}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-slate-800', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-slate-500 mt-1', className)}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 flex items-center gap-3', className)}>
      {children}
    </div>
  );
}
