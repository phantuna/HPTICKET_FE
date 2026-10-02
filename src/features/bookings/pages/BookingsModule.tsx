import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock, Plus, Search, Filter, RefreshCw, QrCode, ShoppingCart,
  Printer, CheckCircle2, AlertCircle, Clock, Check, Copy, ExternalLink,
  Users, Building2, Ticket, ChevronRight, Calendar
} from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { Booking, BookingStatus } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { CreateBookingModal } from '../components/CreateBookingModal';
import { BookingTicketPassModal } from '../components/BookingTicketPassModal';

interface BookingsModuleProps {
  onOpenPOSWithBooking?: (bookingCode: string) => void;
}

export const BookingsModule: React.FC<BookingsModuleProps> = ({ onOpenPOSWithBooking }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number | boolean> = {};
      if (search.trim()) params.search = search.trim();
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedDate) params.visitDate = selectedDate;

      const res = await salesService.getBookings(params);
      const list = res.data?.content || res.data || [];
      setBookings(list);
    } catch (err: any) {
      console.error('Lỗi lấy danh sách đặt chỗ từ hệ thống:', err);
      setBookings([]);
      toast.error('Không thể tải danh sách đặt chỗ: ' + (err.message || 'Lỗi kết nối máy chủ'));
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedStatus, selectedDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle direct sell in POS
  const handleSellInPOS = (bookingCode: string) => {
    if (onOpenPOSWithBooking) {
      onOpenPOSWithBooking(bookingCode);
    } else {
      // Set hash route to POS with search code
      localStorage.setItem('hpticket_pending_pos_booking', bookingCode);
      window.location.hash = '/pos';
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    const target = cancelTarget;
    setCancelTarget(null);
    try {
      await salesService.cancelBooking(target.id, 'Hủy bởi người quản trị');
      toast.success(`Đã hủy đơn đặt chỗ [${target.booking_code}] thành công`);
      fetchBookings();
    } catch (err: any) {
      toast.error('Hủy đặt chỗ thất bại: ' + (err.message || 'Lỗi kết nối'));
    }
  };

  // Status Badge Colors
  const getStatusBadge = (status: BookingStatus | string) => {
    switch (status) {
      case BookingStatus.CONFIRMED:
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case BookingStatus.PARTIALLY_PAID:
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">Đã cọc một phần</span>;
      case BookingStatus.RESERVED:
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">Chờ thanh toán</span>;
      case BookingStatus.FULFILLED:
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold">Đã xuất vé cổng</span>;
      case BookingStatus.CANCELLED:
        return <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold">Đã hủy</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  const totalBookings = bookings.length;
  const totalAmountSum = bookings.reduce((acc, b) => acc + (Number(b.total_amount) || 0), 0);
  const totalDepositSum = bookings.reduce((acc, b) => acc + (Number(b.deposit_amount) || 0), 0);
  const totalRemainingSum = bookings.reduce((acc, b) => acc + (Number(b.remaining_amount) || 0), 0);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <CalendarClock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Quản Lý Đặt Vé Trước (Pre-sale / Booking)</h1>
              <p className="text-xs text-slate-500 mt-0.5">Tiếp nhận đặt chỗ khách đoàn, Tour Agency, xuất vé trực tiếp tại POS</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => window.location.hash = '/dat-ve'}
            className="px-4 py-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <ExternalLink className="w-4 h-4" /> Mở Trang Đặt Vé Online
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 transition shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" /> Tạo Đặt Chỗ Mới
          </button>
        </div>
      </div>

      {/* KPI Stats summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng đơn đặt chỗ</span>
          <span className="text-2xl font-black text-slate-900">{totalBookings} đơn</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Doanh số đặt trước</span>
          <span className="text-2xl font-black font-mono text-emerald-700">{totalAmountSum.toLocaleString('vi-VN')} đ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Đã thu cọc trước</span>
          <span className="text-2xl font-black font-mono text-teal-700">{totalDepositSum.toLocaleString('vi-VN')} đ</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Còn phải thu tại cổng/POS</span>
          <span className="text-2xl font-black font-mono text-rose-600">{totalRemainingSum.toLocaleString('vi-VN')} đ</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo mã đặt (BK-...), tên khách, SĐT, công ty..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={fetchBookings}
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Ngày đến:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="RESERVED">Chờ thanh toán (RESERVED)</option>
              <option value="PARTIALLY_PAID">Đã cọc một phần</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="FULFILLED">Đã xuất vé (FULFILLED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5 whitespace-nowrap w-[150px]">Mã & Ngày đến</th>
                <th className="py-3 px-3.5 min-w-[180px]">Khách hàng / Tour Agency</th>
                <th className="py-3 px-3 text-center whitespace-nowrap w-[110px]">Số lượng</th>
                <th className="py-3 px-3.5 text-right whitespace-nowrap w-[160px]">Tài chính</th>
                <th className="py-3 px-3 text-center whitespace-nowrap w-[130px]">Trạng thái</th>
                <th className="py-3 px-3 text-center whitespace-nowrap w-[160px] sticky right-0 bg-slate-50 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CalendarClock className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có đơn đặt chỗ nào</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm "Tạo Đặt Chỗ Mới" để tạo booking cho đoàn</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const totalPasses = b.items?.reduce((acc, it) => {
                    const passes = Number(it.allowed_passes) || 1;
                    const qty = Number(it.quantity) || 1;
                    const isGroup = Boolean(it.is_group_ticket || passes > 1);
                    return acc + (isGroup ? passes : (qty * passes));
                  }, 0) || 0;
                  const isGroupBooking = b.items?.some(it => Boolean(it.is_group_ticket || (Number(it.allowed_passes) || 1) > 1));
                  const isFulfilled = b.status === BookingStatus.FULFILLED;
                  const isCancelled = b.status === BookingStatus.CANCELLED;
                  const remaining = Number(b.remaining_amount || 0);
                  const deposit = Number(b.deposit_amount || 0);
                  const formattedDate = b.visit_date ? b.visit_date.split('-').reverse().join('/') : '--';

                  return (
                    <tr key={b.id} className="group hover:bg-slate-50/90 transition">
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {b.booking_code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(b.booking_code);
                              toast.success('Đã copy mã: ' + b.booking_code);
                            }}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Sao chép mã"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <div>
                          <p className="font-bold text-slate-900 leading-tight">{b.customer_name}</p>
                          {b.customer_phone && (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{b.customer_phone}</p>
                          )}
                          {b.company_name && (
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5 truncate max-w-[200px]" title={b.company_name}>
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" /> {b.company_name}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div>
                          <span className="font-bold text-slate-800 text-xs">{totalPasses} lượt</span>
                          {isGroupBooking ? (
                            <span className="block text-[10px] text-purple-700 bg-purple-50 border border-purple-200 rounded font-bold px-1.5 py-0.5 mt-0.5 mx-auto max-w-fit">
                              Vé đoàn (1 vé)
                            </span>
                          ) : (
                            <span className="block text-[10px] text-slate-600 bg-slate-100 rounded font-medium px-1.5 py-0.5 mt-0.5 mx-auto max-w-fit">
                              Vé lẻ
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3.5 text-right whitespace-nowrap font-mono">
                        <div className="font-bold text-slate-900 text-xs">
                          {Number(b.total_amount || 0).toLocaleString('vi-VN')} đ
                        </div>
                        {Number(b.discount_amount || 0) > 0 && (
                          <div className="text-[10px] text-amber-600 font-semibold">
                            (Giảm: -{Number(b.discount_amount).toLocaleString('vi-VN')} đ{b.discount_percent ? ` • ${b.discount_percent}%` : ''})
                          </div>
                        )}
                        {remaining === 0 ? (
                          <div className="text-[11px] text-emerald-600 font-bold mt-0.5">
                            ✓ Đã thu đủ
                          </div>
                        ) : (
                          <div className="text-[11px] text-rose-600 font-bold mt-0.5">
                            Còn: {remaining.toLocaleString('vi-VN')} đ
                          </div>
                        )}
                        {deposit > 0 && (
                          <div className="text-[10px] text-slate-400">
                            (Cọc: {deposit.toLocaleString('vi-VN')} đ)
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {getStatusBadge(b.status)}
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setViewingBooking(b)}
                            className="px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg border border-slate-200 transition font-medium text-[11px] flex items-center gap-1"
                            title="Xem phiếu & QR"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Phiếu
                          </button>

                          {!isFulfilled && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => handleSellInPOS(b.booking_code)}
                              className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition font-bold text-[11px] flex items-center gap-1 shadow-xs"
                              title="Nạp vào quầy POS để xuất vé"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" /> Xuất POS
                            </button>
                          )}

                          {!isFulfilled && !isCancelled && (
                            <button
                              type="button"
                              onClick={() => setCancelTarget(b)}
                              className="px-2 py-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-slate-200 transition text-[11px]"
                              title="Hủy đặt chỗ"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tạo đặt chỗ */}
      <CreateBookingModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          fetchBookings();
          setViewingBooking(created);
        }}
      />

      {/* Modal: Xem phiếu xác nhận đặt chỗ & In */}
      <BookingTicketPassModal
        booking={viewingBooking}
        onClose={() => setViewingBooking(null)}
        onOpenInPOS={handleSellInPOS}
      />

      {/* Modal: Xác nhận hủy đặt chỗ (Đồng bộ UI hệ thống) */}
      <ConfirmModal
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleConfirmCancel}
        title="Xác nhận hủy đặt chỗ"
        message={`Bạn có chắc chắn muốn hủy đơn đặt chỗ [${cancelTarget?.booking_code || ''}] của khách hàng "${cancelTarget?.customer_name || ''}" không?\n\nSau khi hủy, mã này sẽ không thể xuất vé tại POS.`}
        type="danger"
        confirmText="Đồng ý hủy"
        cancelText="Đóng"
      />
    </div>
  );
};
