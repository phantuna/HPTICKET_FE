import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, X } from 'lucide-react';
import { salesService, IssuedTicket } from '../../../api/salesService';
import ExpiringTicketsTable from '../components/ExpiringTicketsTable';

const ExpiringTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [editingTicket, setEditingTicket] = useState<IssuedTicket | null>(null);
  const [renewingTicket, setRenewingTicket] = useState<IssuedTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewAmount, setRenewAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

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
    t.ticket_template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customer_phone?.includes(searchTerm)
  );

  const handleEditCustomer = (ticket: IssuedTicket) => {
    setCustomerForm({
      name: ticket.customer_name || '',
      phone: ticket.customer_phone || '',
      email: ticket.customer_email || ''
    });
    setEditingTicket(ticket);
  };

  const handleRenewTicket = (ticket: IssuedTicket) => {
    setRenewMonths(1);
    setRenewAmount(Number(ticket.unit_price || 0));
    setPaymentMethod('CASH');
    setRenewingTicket(ticket);
  };

  useEffect(() => {
    if (renewingTicket) {
      setRenewAmount(Number(renewingTicket.unit_price || 0) * renewMonths);
    }
  }, [renewMonths, renewingTicket]);

  const submitCustomerUpdate = async () => {
    if (!editingTicket) return;
    try {
      setIsSubmitting(true);
      await salesService.updateCustomerInfo(
        editingTicket.id, 
        customerForm.name, 
        customerForm.phone, 
        customerForm.email
      );
      setEditingTicket(null);
      fetchTickets(daysAhead); // Refresh
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRenew = async () => {
    if (!renewingTicket) return;
    try {
      setIsSubmitting(true);
      await salesService.renewTicket(renewingTicket.id, renewMonths, renewAmount, paymentMethod);
      setRenewingTicket(null);
      fetchTickets(daysAhead); // Refresh
      alert('Gia hạn vé thành công!');
    } catch (error) {
      console.error('Error renewing ticket:', error);
      alert('Có lỗi xảy ra khi gia hạn vé!');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              placeholder="Tìm mã QR, tên KH, SĐT..." 
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
          onEditCustomer={handleEditCustomer}
          onRenewTicket={handleRenewTicket}
        />
      </div>

      {/* Edit Customer Modal */}
      {editingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Cập nhật thông tin khách hàng</h3>
              <button onClick={() => setEditingTicket(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã vé (QR)</label>
                <input type="text" disabled value={editingTicket.qr_code_string} className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên khách hàng</label>
                <input 
                  type="text" 
                  value={customerForm.name} 
                  onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="Nhập họ tên" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input 
                  type="text" 
                  value={customerForm.phone} 
                  onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="Nhập số điện thoại" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={customerForm.email} 
                  onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="Nhập email (không bắt buộc)" 
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button onClick={() => setEditingTicket(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                Hủy
              </button>
              <button 
                onClick={submitCustomerUpdate} 
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Ticket Modal */}
      {renewingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Gia hạn vé tháng</h3>
              <button onClick={() => setRenewingTicket(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100">
                Bạn đang gia hạn cho vé: <strong>{renewingTicket.qr_code_string}</strong><br/>
                Khách hàng: <strong>{renewingTicket.customer_name || 'Khách vãng lai'}</strong><br/>
                Hạn cũ: <strong>{renewingTicket.expire_at ? new Date(renewingTicket.expire_at).toLocaleDateString('vi-VN') : renewingTicket.valid_date}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn số tháng gia hạn</label>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 3, 6, 12].map(m => (
                    <button
                      key={m}
                      onClick={() => setRenewMonths(m)}
                      className={`py-2 px-3 text-sm font-medium rounded-lg border transition-colors ${renewMonths === m ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      +{m} tháng
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền thu (VND)</label>
                <input 
                  type="number" 
                  value={renewAmount} 
                  onChange={e => setRenewAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                  placeholder="Nhập số tiền" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                <select 
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                  <option value="MOMO">Ví MoMo</option>
                  <option value="VNPAY">VNPAY</option>
                  <option value="CREDIT_CARD">Thẻ tín dụng / Ghi nợ</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="text-sm font-medium text-gray-800">
                Tổng thu: <span className="text-blue-600">{renewAmount.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setRenewingTicket(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                  Hủy
                </button>
                <button 
                  onClick={submitRenew} 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Thu tiền'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiringTicketsPage;

