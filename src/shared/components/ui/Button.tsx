import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md shadow-emerald-100 disabled:opacity-50 disabled:active:scale-100',
  secondary:
    'bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 disabled:opacity-50 disabled:active:scale-100',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-md shadow-rose-100 disabled:opacity-50 disabled:active:scale-100',
  outline:
    'border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-50 disabled:active:scale-100',
  ghost:
    'hover:bg-slate-100 active:scale-95 text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:active:scale-100',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm font-bold rounded-xl gap-2.5',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{loadingText || children || 'Đang xử lý...'}</span>
        </>
      ) : (
        <>
          {icon && <span className="inline-flex shrink-0">{icon}</span>}
          {children && <span>{children}</span>}
        </>
      )}
    </button>
  );
};
