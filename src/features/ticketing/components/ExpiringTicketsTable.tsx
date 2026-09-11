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
            <th className="px-6 py-4">Mã Vé (QR)</th>
            <th className="px-6 py-4">Khách Hàng</th>
            <th className="px-6 py-4">Loại Vé</th>
            <th className="px-6 py-4">Ngày Hết Hạn</th>
            <th className="px-6 py-4">Trạng Thái</th>
            <th className="px-6 py-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Đang tải dữ liệu...
              </td>
            </tr>
          ) : tickets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-8 w-8 text-gray-300" />
                </div>
                Không có vé nào sắp hết hạn trong {daysAhead} ngày tới.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4 font-mono text-gray-800">{ticket.qr_code_string}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="font-semibold text-gray-800">{ticket.customer_name || 'Khách vãng lai'}</div>
                  <div className="text-gray-500">{ticket.customer_phone}</div>
                  <div className="text-gray-500">{ticket.customer_email}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 font-medium">{ticket.ticket_template_name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full w-max">
                    <Clock className="h-4 w-4" />
                    {ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                    {ticket.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => onEditCustomer(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      Sửa TT
                    </button>
                    <button 
                      onClick={() => onRenewTicket(ticket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
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
