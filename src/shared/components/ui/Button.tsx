'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'border-transparent bg-primary text-background-dark hover:brightness-110 focus:ring-primary shadow-sm',
  secondary:
    'border-slate-300 bg-white text-slate-700 hover:border-primary hover:text-primary dark:border-slate-600 dark:bg-transparent dark:text-slate-300 dark:hover:border-primary dark:hover:text-primary',
  ghost:
    'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  danger:
    'border-transparent bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-3 text-sm',
  lg: 'px-6 py-4 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, fullWidth = false, children, className = '', disabled, ...props },
    ref
  ) => {
    const base =
      'inline-flex items-center justify-center rounded-lg border font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
