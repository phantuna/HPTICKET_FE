import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export interface RefreshButtonProps {
  onRefresh?: () => Promise<void> | void;
  isLoading?: boolean;
  className?: string;
  buttonText?: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isLoading: externalLoading,
  className,
  buttonText = 'Làm mới',
  title = 'Làm mới dữ liệu',
  size = 'md',
  disabled = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (loading || disabled || !onRefresh) return;

    try {
      const result = onRefresh();
      if (result instanceof Promise) {
        setInternalLoading(true);
        await result;
      }
    } catch (err) {
      console.error('Error during refresh:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-xs sm:text-sm',
    lg: 'px-4 py-2.5 text-sm',
  }[size];

  const defaultClasses = `bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold rounded-lg flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={className ? `${className} ${loading ? 'pointer-events-none' : ''}` : defaultClasses}
      title={title}
    >
      <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
      {buttonText && <span>{buttonText}</span>}
    </button>
  );
};

export default RefreshButton;
