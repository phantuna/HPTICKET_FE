import React from 'react';
import { Calendar, Clock, Mail } from 'lucide-react';
import { IssuedTicket } from '../../../api/salesService';

interface ExpiringTicketsTableProps {
  tickets: IssuedTicket[];
  loading: boolean;
  daysAhead: number;
  onEditCustomer: (ticket: IssuedTicket) => void;
  onRenewTicket: (ticket: IssuedTicket) => void;
}

const ExpiringTicketsTable: React.FC<ExpiringTicketsTableProps> = ({ tickets, loading, daysAhead, onEditCustomer, onRenewTicket }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
          <tr>
            <th className="px-4 py-3">Mã Vé (QR)</th>
            <th className="px-4 py-3">Khách Hàng</th>
            <th className="px-4 py-3">Loại Vé</th>
            <th className="px-4 py-3">Ngày Hết Hạn</th>
            <th className="px-4 py-3">Trạng Thái</th>
            <th className="px-4 py-3">Người Tạo</th>
            <th className="px-4 py-3 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : tickets.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-8 w-8 text-gray-300" />
                </div>
                Không có vé nào sắp hết hạn trong {daysAhead} ngày tới.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-4 py-3 font-mono text-gray-800 whitespace-nowrap">{ticket.qr_code_string}</td>
                <td className="px-4 py-3 text-sm">
                  {ticket.customer_name ? (
                    <>
                      <div className="font-semibold text-gray-800">{ticket.customer_name}</div>
                      {ticket.customer_phone && <div className="text-gray-500 text-xs">{ticket.customer_phone}</div>}
                      {ticket.customer_email && <div className="text-gray-500 text-xs">{ticket.customer_email}</div>}
                    </>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded w-max">
                        Khách vãng lai
                      </span>
                      {ticket.order_code && (
                        <div className="text-xs text-blue-600 font-mono">#{ticket.order_code}</div>
                      )}
                      {(ticket as any).sales_counter_name && (
                        <div className="text-xs text-gray-400">Quầy: {(ticket as any).sales_counter_name}</div>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-gray-700 whitespace-nowrap">{ticket.ticket_template_code || ticket.ticket_template_name}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded w-max ${
                      ticket.ticket_type === 'UNLIMITED' ? 'bg-amber-100 text-amber-700' : 
                      ticket.ticket_type === 'SINGLE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {ticket.ticket_type === 'UNLIMITED' ? 'Vé Tháng/Năm' : ticket.ticket_type === 'SINGLE' ? 'Vé Lượt' : (ticket.ticket_type || 'Khác')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1 w-max">
                    <div className="flex items-center gap-2 text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-full">
                      <Clock className="h-4 w-4" />
                      {ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date}
                    </div>
                    {ticket.expire_at && (
                      <span className="text-[11px] font-medium text-amber-700">
                        (Còn {Math.ceil((new Date(ticket.expire_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} ngày)
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 whitespace-nowrap">
                    {ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-700 whitespace-nowrap">{ticket.created_by || '—'}</div>
                  {(ticket as any).sales_counter_name && !ticket.customer_name && (
                    <div className="text-xs text-gray-400 mt-0.5 whitespace-nowrap">{(ticket as any).sales_counter_name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onEditCustomer(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Sửa TT
                    </button>
                    <button 
                      onClick={() => onRenewTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    >
                      Gia hạn
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpiringTicketsTable;
