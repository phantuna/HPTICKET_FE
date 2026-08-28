import React from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';

interface POSActionBarProps {
  handleResetForm: () => void;
  handleCheckout: (extraDiscount: number) => void;
  effectiveExtraDiscount: number;
  lineItemsCount: number;
  isProcessing: boolean;
}

export const POSActionBar: React.FC<POSActionBarProps> = ({
  handleResetForm, handleCheckout, effectiveExtraDiscount, lineItemsCount, isProcessing
}) => (
  <div className="sticky bottom-0 z-50 bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-end gap-3 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]">
    <button onClick={handleResetForm} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 border border-slate-200 transition">
      <RefreshCw className="w-4 h-4" /> Làm mới
    </button>
    <button 
      onMouseDown={(e) => {
        e.preventDefault(); // Prevents input blur and keyboard closing momentarily, ensuring click registers
        if (lineItemsCount > 0 && !isProcessing) {
          handleCheckout(effectiveExtraDiscount);
        }
      }}
      onClick={() => {
        // Fallback for keyboard enter
        if (lineItemsCount > 0 && !isProcessing) {
          handleCheckout(effectiveExtraDiscount);
        }
      }}
      disabled={lineItemsCount === 0 || isProcessing} 
      className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-xs ${lineItemsCount > 0 && !isProcessing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}>
      {isProcessing ? (
        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Đang xử lý xuất đơn vé...</span></>
      ) : (
        <><CheckCircle2 className="w-4 h-4" /><span>Thanh toán & In vé</span></>
      )}
    </button>
  </div>
);
