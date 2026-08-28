import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

export type PromptModalType = 'danger' | 'warning' | 'info';

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  type?: PromptModalType;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = 'Nhập nội dung...',
  type = 'warning',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  required = true,
}: PromptModalProps) {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const config = {
    danger: {
      icon: <XCircle className="w-6 h-6 text-red-600" />,
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

  const handleConfirm = () => {
    if (required && !inputValue.trim()) return;
    onConfirm(inputValue.trim());
    setInputValue('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 space-y-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto ${currentConfig.bgIcon}`}>
            {currentConfig.icon}
          </div>
          <div className="text-center">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-2 whitespace-pre-wrap">{message}</p>
          </div>
          <div className="mt-4">
            <textarea
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              rows={3}
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => { setInputValue(''); onClose(); }}
              className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={required && !inputValue.trim()}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentConfig.btnConfirm}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
