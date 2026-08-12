import React from 'react';
import { Store, Building2, LayoutGrid, ChevronRight } from 'lucide-react';

interface CounterSelectionModalProps {
  counters: any[];
  setSelectedCounterId: (id: string) => void;
}

export const CounterSelectionModal: React.FC<CounterSelectionModalProps> = ({ counters, setSelectedCounterId }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="bg-emerald-600 px-6 py-4 border-b border-emerald-700">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Store className="w-5 h-5" /> Chọn Quầy Bán Vé
        </h3>
        <p className="text-emerald-100 text-sm mt-1">Vui lòng chọn quầy giao dịch trước khi tạo đơn hàng</p>
      </div>
      <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
        {counters.map(counter => (
          <button
            key={counter.id}
            onClick={() => setSelectedCounterId(counter.id)}
            className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-between group"
          >
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-slate-800 group-hover:text-emerald-700 text-[15px]">{counter.name || counter.counter_name}</span>
                {counter.code && (
                  <span className="text-[10px] bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-700 text-slate-600 px-2 py-0.5 rounded-full font-mono font-semibold border border-slate-200 group-hover:border-emerald-200 transition-colors">
                    {counter.code}
                  </span>
                )}
              </div>
              {counter.location ? (
                <div className="text-xs text-slate-600 space-y-0.5">
                  <div className="flex items-center gap-1.5 font-medium text-emerald-800/80">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{counter.location.name}</span>
                  </div>
                  {counter.location.address && (
                    <div className="text-[11px] text-slate-500 pl-5 line-clamp-1 italic">
                      {counter.location.address}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5" /> Thiết bị: {counter.device_info || 'POS'}
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" />
          </button>
        ))}
      </div>
    </div>
  </div>
);
