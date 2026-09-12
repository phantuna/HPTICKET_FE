import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, X, CheckCircle, AlertCircle } from 'lucide-react';
import { salesService, IssuedTicket } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { Promotion } from '../../../shared/types/hpticket';
import ExpiringTicketsTable from '../components/ExpiringTicketsTable';

const ExpiringTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysAhead, setDaysAhead] = useState(30);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [editingTicket, setEditingTicket] = useState<IssuedTicket | null>(null);
  const [renewingTicket, setRenewingTicket] = useState<IssuedTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewAmount, setRenewAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');

  const fetchTickets = async (days: number, search: string = searchTerm, page: number = currentPage, size: number = pageSize) => {
    try {
      setLoading(true);
      const response = await salesService.fetchExpiringTickets(days, search, page, size);
      if (response && response.data) {
        if (response.data.content) {
          setTickets(response.data.content as any);
          setTotalElements(response.data.total_elements || 0);
          setTotalPages(response.data.total_pages || 1);
        } else if (Array.isArray(response.data)) {
          // Fallback to array for mock DB or old API
          setTickets(response.data as any);
          setTotalElements(response.data.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching expiring tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchTickets(daysAhead, searchTerm, page, pageSize);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchTickets(daysAhead, searchTerm, 0, size);
  };

  useEffect(() => {
    marketingService.fetchPromotions().then(res => {
      if (res?.data) setPromotions(res.data);
    });
  }, []);

  useEffect(() => {
    setCurrentPage(0);
    fetchTickets(daysAhead, searchTerm, 0, pageSize);
  }, [daysAhead]);

  const filteredTickets = tickets;

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
    setSelectedPromotion('');
    setPaymentMethod('CASH');
    setRenewingTicket(ticket);
  };

  useEffect(() => {
    if (renewingTicket) {
      const basePrice = Number(renewingTicket.unit_price || 0) * renewMonths;
      let finalPrice = basePrice;
      const promo = promotions.find(p => p.id === selectedPromotion);
      if (promo) {
        // Backend: discount_percent (%) ýưu tiên, sau đó discount_value (số tiền cố định)
        const pct = (promo as any).discount_percent;
        const val = promo.discount_value;
        if (pct && pct > 0) {
          finalPrice -= (basePrice * pct / 100);
        } else if (val && val > 0) {
          finalPrice -= Number(val);
        }
      }
      setRenewAmount(finalPrice > 0 ? finalPrice : 0);
    }
  }, [renewMonths, renewingTicket, selectedPromotion, promotions]);

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
      showToast('Cập nhật thông tin thành công!', 'success');
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast('Có lỗi xảy ra khi cập nhật thông tin!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRenew = async () => {
    if (!renewingTicket) return;
    try {
      setIsSubmitting(true);
      await salesService.renewTicket(renewingTicket.id, renewMonths, renewAmount, paymentMethod, selectedPromotion);
      setRenewingTicket(null);
      fetchTickets(daysAhead); // Refresh
      showToast('Gia hạn vé thành công!', 'success');
    } catch (error: any) {
      console.error('Error renewing ticket:', error);
      showToast(error?.response?.data?.message || 'Có lỗi xảy ra khi gia hạn vé!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Quản Lý Vé Tháng
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
              <option value={99}>Tất cả vé tháng/năm</option>
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
              placeholder="Tìm theo tên khách, SĐT, email..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setCurrentPage(0);
                  fetchTickets(daysAhead, searchTerm, 0, pageSize);
                }
              }}
            />
          </div>
          <div className="text-sm text-gray-500 font-medium">
            Hiển thị <span className="text-gray-900">{filteredTickets.length}</span> vé
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mb-4"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <ExpiringTicketsTable
              tickets={filteredTickets}
              daysAhead={daysAhead}
              onEditCustomer={handleEditCustomer}
              onRenewTicket={handleRenewTicket}
            />

            {/* Phân trang */}
            {totalElements > 0 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-xl">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Hiển thị</span>
                  <select
                    value={pageSize}
                    onChange={(e) => changePageSize(Number(e.target.value))}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <span>/ trang · Tổng: <strong className="text-slate-800">{totalElements.toLocaleString('vi-VN')}</strong> vé</span>
                </div>

                <div className="flex items-center gap-1">
                  <button onClick={() => goToPage(0)} disabled={currentPage === 0}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono">
                    «
                  </button>
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                    return start + i;
                  }).map(p => (
                    <button key={p} onClick={() => goToPage(p)}
                      className={`w-7 h-7 text-xs rounded-lg border transition font-semibold ${p === currentPage
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                        }`}>
                      {p + 1}
                    </button>
                  ))}
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                    ›
                  </button>
                  <button onClick={() => goToPage(totalPages - 1)} disabled={currentPage >= totalPages - 1}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono">
                    »
                  </button>
                </div>

                <span className="text-xs text-slate-400">Trang {currentPage + 1} / {totalPages.toLocaleString('vi-VN')}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Customer Modal */}
      {editingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setEditingTicket(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => { e.preventDefault(); submitCustomerUpdate(); }}>
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Cập nhật thông tin khách hàng</h3>
                <button type="button" onClick={() => setEditingTicket(null)} className="text-gray-400 hover:text-gray-600">
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
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Nhập họ tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    placeholder="Nhập email (không bắt buộc)"
                  />
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                <button type="button" onClick={() => setEditingTicket(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Renew Ticket Modal */}
      {renewingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setRenewingTicket(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => { e.preventDefault(); submitRenew(); }}>
              <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Gia hạn vé tháng</h3>
                <button type="button" onClick={() => setRenewingTicket(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm border border-blue-100">
                  Bạn đang gia hạn cho vé: <strong>{renewingTicket.qr_code_string}</strong><br />
                  Khách hàng: <strong>{renewingTicket.customer_name || 'Khách vãng lai'}</strong><br />
                  Hạn cũ: <strong>{renewingTicket.expire_at ? new Date(renewingTicket.expire_at).toLocaleDateString('vi-VN') : renewingTicket.valid_date}</strong>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số tháng gia hạn</label>
                    <input
                      type="number"
                      min="1"
                      value={renewMonths === 0 ? '' : renewMonths}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') setRenewMonths(0);
                        else setRenewMonths(parseInt(val, 10));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chương trình KM</label>
                    <select
                      value={selectedPromotion}
                      onChange={e => setSelectedPromotion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                      <option value="">Không áp dụng</option>
                      {promotions.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}{(p as any).discount_percent ? ` (-${(p as any).discount_percent}%)` : p.discount_value ? ` (-${Number(p.discount_value).toLocaleString('vi-VN')}đ)` : ''}
                        </option>
                      ))}
                    </select>
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
                    <option value="TIEN_MAT">Tiền mặt</option>
                    <option value="CHUYEN_KHOAN">Chuyển khoản ngân hàng</option>
                    <option value="THE_TIN_DUNG">Thẻ tín dụng / Ghi nợ</option>
                  </select>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="text-sm font-medium text-gray-800">
                  Tổng thu: <span className="text-blue-600">{renewAmount.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRenewingTicket(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors">
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Xác nhận & Thu tiền'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ExpiringTicketsPage;

