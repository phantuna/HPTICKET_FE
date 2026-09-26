import React from 'react';
import { X, Info } from 'lucide-react';

interface DetailsField {
  label: string;
  value: React.ReactNode;
  isFullWidth?: boolean;
}

interface DetailsModalProps {
  title: string;
  fields: DetailsField[];
  onClose: () => void;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({ title, fields, onClose }) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 text-slate-900">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">Thông tin chi tiết</h2>
              <p className="text-xs text-slate-500 font-medium">{title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map((field, index) => (
              <div 
                key={index} 
                className={`bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-100 flex flex-col gap-1.5 ${
                  field.isFullWidth ? 'sm:col-span-2' : ''
                }`}
              >
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {field.label}
                </span>
                <div className="text-sm font-medium text-slate-800 break-words">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm rounded-xl transition shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
