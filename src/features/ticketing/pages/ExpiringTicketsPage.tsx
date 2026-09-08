import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter } from 'lucide-react';
import { salesService, IssuedTicket } from '../../../api/salesService';
import ExpiringTicketsTable from '../components/ExpiringTicketsTable';

const ExpiringTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchTickets = async (days: number) => {
    try {
      setLoading(true);
      const response = await salesService.fetchExpiringTickets(days);
      if (response && response.data) {
        setTickets(response.data as any);
      }
    } catch (error) {
      console.error('Error fetching expiring tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(daysAhead);
  }, [daysAhead]);

  const filteredTickets = tickets.filter(t => 
    t.qr_code_string?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.ticket_template_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-amber-500 h-6 w-6" />
            Cảnh Báo Vé Tháng Sắp Hết Hạn
          </h1>
          <p className="text-gray-500 mt-1">Quản lý và theo dõi các vé tháng/vé năm chuẩn bị hết hạn sử dụng</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
            <Filter className="h-4 w-4 text-gray-500" />
            <select 
              className="bg-transparent border-none outline-none text-sm font-medium text-gray-700"
              value={daysAhead}
              onChange={(e) => setDaysAhead(Number(e.target.value))}
            >
              <option value={3}>Trong 3 ngày tới</option>
              <option value={7}>Trong 7 ngày tới</option>
              <option value={15}>Trong 15 ngày tới</option>
              <option value={30}>Trong 30 ngày tới</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm mã QR, tên vé..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Hiển thị <span className="text-gray-900">{filteredTickets.length}</span> vé
          </div>
        </div>

        <ExpiringTicketsTable 
          tickets={filteredTickets} 
          loading={loading} 
          daysAhead={daysAhead} 
        />
      </div>
    </div>
  );
};

export default ExpiringTicketsPage;
