import React from 'react';
import { AlertTriangle, Trash2, Info } from 'lucide-react';

export type ConfirmModalType = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: ConfirmModalType;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'danger',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  // Cấu hình UI theo từng loại type
  const config = {
    danger: {
      icon: <Trash2 className="w-6 h-6 text-red-600" />,
      bgIcon: 'bg-red-100',
      btnConfirm: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
      bgIcon: 'bg-amber-100',
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    info: {
      icon: <Info className="w-6 h-6 text-blue-600" />,
      bgIcon: 'bg-blue-100',
      btnConfirm: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const currentConfig = config[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${currentConfig.bgIcon}`}>
            {currentConfig.icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{message}</p>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${currentConfig.btnConfirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
