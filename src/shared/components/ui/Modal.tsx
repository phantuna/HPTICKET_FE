import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button, ButtonVariant } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  icon?: React.ReactNode;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  onSubmit?: (e: React.FormEvent) => void;
  children: React.ReactNode;
  showFooter?: boolean;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: ButtonVariant;
  isSubmitting?: boolean;
  isConfirmDisabled?: boolean;
  onConfirm?: () => void;
  footer?: React.ReactNode;
  closeOnBackdropClick?: boolean;
}

const maxWidthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  subtitle,
  maxWidth = 'md',
  onSubmit,
  children,
  showFooter = true,
  cancelText = 'Hủy',
  confirmText = 'Lưu Khai Báo',
  confirmVariant = 'primary',
  isSubmitting = false,
  isConfirmDisabled = false,
  onConfirm,
  footer,
  closeOnBackdropClick = true,
}) => {
  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-emerald-600 shrink-0">{icon}</div>}
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-snug">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition"
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="py-2 space-y-4">{children}</div>

      {/* Footer */}
      {showFooter && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {footer ? (
            footer
          ) : (
            <>
              <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={isSubmitting}>
                {cancelText}
              </Button>
              <Button
                type={onSubmit ? 'submit' : 'button'}
                variant={confirmVariant}
                size="md"
                isLoading={isSubmitting}
                disabled={isConfirmDisabled}
                onClick={!onSubmit ? onConfirm : undefined}
              >
                {confirmText}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (closeOnBackdropClick && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {onSubmit ? (
        <form
          onSubmit={onSubmit}
          className={`bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full ${maxWidthMap[maxWidth]} space-y-2 animate-in zoom-in-95 duration-150`}
        >
          {content}
        </form>
      ) : (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full ${maxWidthMap[maxWidth]} space-y-2 animate-in zoom-in-95 duration-150`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
