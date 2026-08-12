import React from 'react';
import { Calendar, Layers, ChevronRight } from 'lucide-react';
import { IssuedTicket, TicketStatus } from '../../../shared/types/hpticket';

interface TicketsGridProps {
  tickets: IssuedTicket[];
  setSelectedTicket: (ticket: IssuedTicket | null) => void;
}

export const TicketsGrid: React.FC<TicketsGridProps> = ({ tickets, setSelectedTicket }) => {
  if (tickets.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
        Không tìm thấy vé mã QR nào
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tickets.map((tkt, idx) => {
        let statusBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        let statusLabel = 'Chưa Sử Dụng';

        if (tkt.status === TicketStatus.PARTIAL_USED) {
          statusBg = 'bg-amber-50 text-amber-700 border-amber-200';
          statusLabel = `Đã Quét (${tkt.used_passes}/${tkt.allowed_passes} Lượt)`;
        } else if (tkt.status === TicketStatus.USED) {
          statusBg = 'bg-rose-50 text-rose-700 border-rose-200';
          statusLabel = 'Đã Hết Lượt';
        }

        return (
          <div
            key={`${tkt.id}-${idx}`}
            onClick={() => setSelectedTicket(tkt)}
            className="bg-white border border-slate-200 hover:border-emerald-500 rounded-2xl p-4 cursor-pointer transition shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBg}`}>
                  {statusLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Hạn: {tkt.valid_date}
                </span>
              </div>

              <h3 className="text-xs font-bold text-slate-900">{tkt.ticket_template_name}</h3>
              <p className="text-[11px] font-mono text-emerald-700 mt-1 truncate">{tkt.qr_code_string}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-600" /> Tổng lượt: <strong className="text-slate-900">{tkt.allowed_passes === 999999 || tkt.ticket_type === 'UNLIMITED' ? 'Vô Hạn (30 Ngày)' : tkt.allowed_passes}</strong>
              </span>
              <span className="text-emerald-600 font-semibold hover:underline flex items-center gap-1">
                Xem Mã QR <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
