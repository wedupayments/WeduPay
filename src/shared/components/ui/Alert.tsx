import { ReactNode } from 'react';

type AlertVariant = 'error' | 'success' | 'warning' | 'info';

const styles: Record<AlertVariant, { wrapper: string; text: string; icon: string }> = {
  error: {
    wrapper: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
    text: 'text-red-800 dark:text-red-200',
    icon: 'error',
  },
  success: {
    wrapper: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    text: 'text-green-800 dark:text-green-200',
    icon: 'check_circle',
  },
  warning: {
    wrapper: 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'warning',
  },
  info: {
    wrapper: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'info',
  },
};

interface AlertProps {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}

export function Alert({ variant = 'info', children, className = '' }: AlertProps) {
  const s = styles[variant];

  return (
    <div className={`rounded-lg border p-4 ${s.wrapper} ${className}`} role="alert">
      <div className="flex items-start gap-2">
        <span className={`material-symbols-outlined text-xl leading-tight ${s.text}`} aria-hidden="true">
          {s.icon}
        </span>
        <div className={`text-sm ${s.text}`}>{children}</div>
      </div>
    </div>
  );
}
