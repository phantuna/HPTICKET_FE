import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarClock, Search, Filter, X, RefreshCw,
  Download, Ticket, CheckCircle2, AlertTriangle, CalendarX, Activity,
  User, Phone, Mail, Plus, ChevronDown, RotateCw
} from 'lucide-react';
import { salesService, IssuedTicket } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { Promotion, Order } from '../../../shared/types/hpticket';
import { ExpiringTicketsTable } from '../components/ExpiringTicketsTable';
import { MonthlyTicketCardModal } from '../components/MonthlyTicketCardModal';
import { MonthlyTicketDetailDrawer } from '../components/MonthlyTicketDetailDrawer';
import { ReceiptPrintModal } from '../../pos/components/ReceiptPrintModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { iamService } from '../../../api/iamService';
import { toast } from '../../../shared/utils/toast';
import { RefreshButton } from '../../../shared/components/RefreshButton';

export const ExpiringTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters: daysAhead === null means "Tất cả"
  const [daysAhead, setDaysAhead] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [employeeSearch, setEmployeeSearch] = useState<string>('all');
  const [users, setUsers] = useState<any[]>([]);

  // Search input state with debounce and instant Enter support
  const [searchInput, setSearchInput] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const debounceTimerRef = useRef<any>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showFilterPopover, setShowFilterPopover] = useState<boolean>(false);
  const filterPopoverRef = useRef<HTMLDivElement | null>(null);

  const { role, can } = usePermission();
  const isAdminOrManager = role.toLowerCase().includes('admin') || role.toLowerCase().includes('accountant');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals & Drawer
  const [selectedDrawerTicket, setSelectedDrawerTicket] = useState<IssuedTicket | null>(null);
  const [editingTicket, setEditingTicket] = useState<IssuedTicket | null>(null);
  const [renewingTicket, setRenewingTicket] = useState<IssuedTicket | null>(null);
  const [selectedCardTicket, setSelectedCardTicket] = useState<IssuedTicket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Renewal print data (reuse ReceiptPrintModal after successful renewal)
  const [renewalPrintData, setRenewalPrintData] = useState<{ order: Order; ticket: IssuedTicket } | null>(null);

  // Form states
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewAmount, setRenewAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [selectedPromotion, setSelectedPromotion] = useState<string>('');

  // Close filter popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setShowFilterPopover(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Fetch Tickets API
  const fetchTickets = async (
    days: number | null = daysAhead,
    search: string = searchTerm,
    emp: string = employeeSearch,
    status: string = statusFilter,
    page: number = currentPage,
    size: number = pageSize
  ) => {
    try {
      setLoading(true);
      const empFilter = emp === 'all' ? undefined : emp;
      const stFilter = status === 'all' ? undefined : status;
      const response = await salesService.fetchExpiringTickets(days, search, page, size, empFilter, stFilter);

      if (response && response.data) {
        if (response.data.content) {
          setTickets(response.data.content as any);
          setTotalElements(response.data.total_elements || 0);
          setTotalPages(response.data.total_pages || 1);
        } else if (Array.isArray(response.data)) {
          setTickets(response.data as any);
          setTotalElements(response.data.length);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('Error fetching expiring tickets:', error);
      toast.error('Không thể tải danh sách vé tháng!');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, page, pageSize);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, 0, size);
  };

  // Initial load
  useEffect(() => {
    marketingService.fetchPromotions().then(res => {
      if (res?.data) setPromotions(res.data);
    });
    if (isAdminOrManager) {
      iamService.fetchUsers().then(res => {
        if (res?.data) setUsers(res.data);
      });
    }
  }, [isAdminOrManager]);

  // Debounce manual typing (350ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  // Refetch when filters or search change
  useEffect(() => {
    setCurrentPage(0);
    fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, 0, pageSize);
  }, [daysAhead, searchTerm, employeeSearch, statusFilter]);

  // KPI Statistics Calculation
  const stats = useMemo(() => {
    const now = new Date();
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let totalPasses = 0;

    tickets.forEach(t => {
      const expire = t.expire_at ? new Date(t.expire_at) : null;
      if (t.used_passes) totalPasses += t.used_passes;
      if (!expire) {
        active++;
      } else {
        const days = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (days < 0) {
          expired++;
        } else {
          active++;
          if (days <= 7) expiringSoon++;
        }
      }
    });

    return {
      total: totalElements || tickets.length,
      active,
      expiringSoon,
      expired,
      totalPasses
    };
  }, [tickets, totalElements]);

  // Export Excel Report via Backend (Matching all filtered records)
  const handleExportExcel = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      toast.info('Đang tạo báo cáo Excel từ hệ thống...');
      await salesService.exportMonthlyTicketsReport(daysAhead, searchTerm, employeeSearch, statusFilter);
      toast.success('Xuất báo cáo Excel thành công!');
    } catch (error: any) {
      console.error('Lỗi khi xuất báo cáo:', error);
      toast.error(error?.message || 'Có lỗi xảy ra khi xuất báo cáo!');
    } finally {
      setIsExporting(false);
    }
  };

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
    setPaymentMethod('TIEN_MAT');
    setRenewingTicket(ticket);
  };

  // Tính tiền & ngày gia hạn mới
  const calculatedNewExpire = useMemo(() => {
    if (!renewingTicket) return null;
    const oldExpire = renewingTicket.expire_at ? new Date(renewingTicket.expire_at) : null;
    const now = new Date();
    const baseDate = oldExpire && oldExpire.getTime() > now.getTime() ? oldExpire : now;
    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + renewMonths);
    return newDate;
  }, [renewingTicket, renewMonths]);

  useEffect(() => {
    if (renewingTicket) {
      const basePrice = Number(renewingTicket.unit_price || 0) * renewMonths;
      let finalPrice = basePrice;
      const promo = promotions.find(p => p.id === selectedPromotion);
      if (promo) {
        const pct = (promo as any).discount_percent;
        const val = promo.discount_value;
        if (pct && pct > 0) {
          finalPrice -= (basePrice * pct / 100);
        } else if (val && val > 0) {
          finalPrice -= Number(val);
        }
      }
      setRenewAmount(finalPrice > 0 ? Math.round(finalPrice) : 0);
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
      // Preserve current filter & search
      fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, currentPage, pageSize);
      toast.success('Cập nhật thông tin khách hàng thành công!');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin khách hàng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitRenew = async () => {
    if (!renewingTicket) return;
    const ticketSnapshot = renewingTicket; // capture before clearing state
    try {
      setIsSubmitting(true);
      const res = await salesService.renewTicket(ticketSnapshot.id, renewMonths, renewAmount, paymentMethod, selectedPromotion);
      const renewedTicket: IssuedTicket = res?.data ?? ticketSnapshot;

      // Build synthetic Order for ReceiptPrintModal (same component used in POS)
      const promo = promotions.find(p => p.id === selectedPromotion);
      const basePrice = Number(ticketSnapshot.unit_price || 0) * renewMonths;
      const now = new Date().toISOString();
      const syntheticOrder: Order = {
        id: `renew-${ticketSnapshot.id}`,
        order_code: `GH-${ticketSnapshot.qr_code_string?.slice(-8) ?? ticketSnapshot.id.slice(-8)}`,
        sales_counter_id: '',
        total_amount: basePrice,
        discount_amount: basePrice - renewAmount,
        final_amount: renewAmount,
        payment_method: paymentMethod as any,
        status: 'COMPLETED' as any,
        invoice_status: 'NOT_ISSUED' as any,
        invoice_lookup_code: ticketSnapshot.qr_code_string,
        created_at: now,
        updated_at: now,
        created_by: localStorage.getItem('hpticket_username') || '',
        updated_by: '',
        details: [
          {
            id: `d-${ticketSnapshot.id}`,
            order_id: `renew-${ticketSnapshot.id}`,
            item_type: 'TICKET' as any,
            item_id: ticketSnapshot.ticket_template_id,
            item_name: `Gia hạn ${renewMonths} tháng – ${ticketSnapshot.ticket_template_name || 'Vé Tháng'}`,
            quantity: renewMonths,
            unit_price: Number(ticketSnapshot.unit_price || 0),
            total_price: renewAmount,
            created_at: now,
            updated_at: now,
            created_by: localStorage.getItem('hpticket_username') || '',
            updated_by: '',
          }
        ],
      };

      setRenewingTicket(null);
      setRenewalPrintData({ order: syntheticOrder, ticket: renewedTicket });
      fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, currentPage, pageSize);
      toast.success('Gia hạn vé tháng thành công!');
    } catch (error: any) {
      console.error('Error renewing ticket:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gia hạn vé!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut: Enter để xác nhận gia hạn, Escape để đóng modal
  useEffect(() => {
    if (!renewingTicket) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target?.tagName === 'BUTTON' && target.innerText.trim() === 'Hủy') return;
        e.preventDefault();
        if (!isSubmitting) {
          submitRenew();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setRenewingTicket(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [renewingTicket, isSubmitting, renewMonths, renewAmount, paymentMethod, selectedPromotion]);

  // Keyboard shortcut: Escape để đóng modal sửa thông tin khách hàng
  useEffect(() => {
    if (!editingTicket) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setEditingTicket(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingTicket]);

  const handleResetFilters = () => {
    setDaysAhead(null);
    setStatusFilter('all');
    setEmployeeSearch('all');
    setSearchInput('');
    setSearchTerm('');
  };

  const activeFiltersCount = (daysAhead !== null ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (employeeSearch !== 'all' ? 1 : 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md border border-slate-200 space-y-5 my-2">
        {/* Title */}
        <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-800">
          QUẢN LÝ VÉ THÁNG
        </h2>

        {/* Action Buttons Toolbar + Filter / Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Action Buttons (Left) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { window.location.hash = '#/pos'; }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
              title="Chuyển sang màn hình POS bán vé"
            >
              <Plus className="w-4 h-4" /> Bán vé mới
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm disabled:opacity-60"
              title="Xuất báo cáo Excel"
            >
              <Download className="w-4 h-4 text-slate-600" />
              {isExporting ? 'Đang xuất...' : 'Xuất báo cáo'}
            </button>

            <RefreshButton
              onRefresh={() => fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, currentPage, pageSize)}
              isLoading={loading}
            />
          </div>

          {/* Hero Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Quét QR / nhập SĐT / tên khách..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-shadow placeholder:text-slate-400"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                  setSearchTerm(searchInput);
                  setCurrentPage(0);
                } else if (e.key === 'Escape') {
                  setSearchInput('');
                  setSearchTerm('');
                  setCurrentPage(0);
                }
              }}
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                  setCurrentPage(0);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Xóa tìm kiếm (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filters Bar (Compact Pills / Badges) */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setDaysAhead(null); setStatusFilter('all'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${daysAhead === null && statusFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <span>Tất cả</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-black/20">
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => { setDaysAhead(null); setStatusFilter('ACTIVE'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
            >
              <span>Đang hoạt động</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-700/20">
                {stats.active}
              </span>
            </button>

            <button
              onClick={() => { setDaysAhead(7); setStatusFilter('all'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${daysAhead === 7
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
            >
              <span>Sắp hết (≤ 7 ngày)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-700/20">
                {stats.expiringSoon}
              </span>
            </button>

            <button
              onClick={() => { setDaysAhead(null); setStatusFilter('EXPIRED'); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${statusFilter === 'EXPIRED'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                }`}
            >
              <span>Đã hết hạn</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-700/20">
                {stats.expired}
              </span>
            </button>

            {/* Days ahead quick filters */}
            <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-md border border-slate-200 ml-1">
              {[
                { label: '≤3 ngày', value: 3 },
                { label: '≤15 ngày', value: 15 },
                { label: '≤30 ngày', value: 30 },
              ].map((pill) => (
                <button
                  key={pill.label}
                  onClick={() => {
                    setDaysAhead(pill.value);
                    if (pill.value !== null) setStatusFilter('all');
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded transition ${daysAhead === pill.value
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Advanced Filter Popover */}
            <div className="relative" ref={filterPopoverRef}>
              <button
                onClick={() => setShowFilterPopover(!showFilterPopover)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition shadow-2xs ${activeFiltersCount > 0 || showFilterPopover
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Bộ lọc</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                    {activeFiltersCount}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Popover Card */}
              {showFilterPopover && (
                <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-xs text-slate-800">Bộ Lọc Nâng Cao</span>
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Đặt lại
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Trạng thái vé:</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-md p-2 text-slate-800 outline-none font-medium focus:border-emerald-500"
                    >
                      <option value="all">Tất cả trạng thái</option>
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="EXPIRING">Sắp hết hạn (≤ 7 ngày)</option>
                      <option value="EXPIRED">Đã hết hạn</option>
                    </select>
                  </div>

                  {isAdminOrManager && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Người bán:</label>
                      <select
                        value={employeeSearch}
                        onChange={(e) => setEmployeeSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-md p-2 text-slate-800 outline-none font-medium focus:border-emerald-500"
                      >
                        <option value="all">Tất cả nhân viên</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.username}>{u.fullname || u.username}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => setShowFilterPopover(false)}
                      className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-md text-xs font-bold shadow-xs hover:bg-emerald-700"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Area (Clean ERP style with border, matching AdminConfigCard) */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm">
          <ExpiringTicketsTable
            tickets={tickets}
            loading={loading}
            daysAhead={daysAhead}
            onEditCustomer={handleEditCustomer}
            onRenewTicket={handleRenewTicket}
            onViewCard={(ticket) => setSelectedCardTicket(ticket)}
            onSelectTicket={(ticket) => setSelectedDrawerTicket(ticket)}
            onResetFilters={handleResetFilters}
            canEdit={can('UPDATE_ISSUED_TICKET')}
          />
        </div>

        {/* 5. Pagination */}
        {totalElements > 0 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => changePageSize(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium"
              >
                {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <span>vé/trang · Tổng cộng: <strong className="text-slate-800">{totalElements.toLocaleString('vi-VN')}</strong> vé</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => goToPage(0)}
                disabled={currentPage === 0}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono"
              >
                «
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                return start + i;
              }).map(p => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`w-7 h-7 text-xs rounded-lg border transition font-bold ${p === currentPage
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  {p + 1}
                </button>
              ))}
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono"
              >
                ›
              </button>
              <button
                onClick={() => goToPage(totalPages - 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition font-mono"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Customer Detail Drawer (Slide-in Panel from Right) */}
      <MonthlyTicketDetailDrawer
        ticket={selectedDrawerTicket}
        isOpen={Boolean(selectedDrawerTicket)}
        onClose={() => setSelectedDrawerTicket(null)}
        onRenew={(t) => {
          setSelectedDrawerTicket(null);
          handleRenewTicket(t);
        }}
        onViewCard={(t) => {
          setSelectedDrawerTicket(null);
          setSelectedCardTicket(t);
        }}
        onEditCustomer={(t) => {
          setSelectedDrawerTicket(null);
          handleEditCustomer(t);
        }}
      />

      {/* 7. Digital Membership Card Modal */}
      {selectedCardTicket && (
        <MonthlyTicketCardModal
          ticket={selectedCardTicket}
          onClose={() => setSelectedCardTicket(null)}
          onRenew={(ticket) => handleRenewTicket(ticket)}
        />
      )}

      {/* 8. Edit Customer Modal */}
      {editingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setEditingTicket(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => { e.preventDefault(); submitCustomerUpdate(); }}>
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Cập Nhật Thông Tin Khách Hàng</h3>
                </div>
                <button type="button" onClick={() => setEditingTicket(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã Vé (QR)</label>
                  <input
                    type="text"
                    disabled
                    value={editingTicket.qr_code_string}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ Tên Khách Hàng <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={customerForm.name}
                    onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                    placeholder="Nhập họ và tên khách hàng"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={customerForm.phone}
                      onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                      placeholder="e.g. 0912 345 678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Thông Báo Gia Hạn</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={customerForm.email}
                      onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-medium"
                      placeholder="e.g. khachhang@gmail.com"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setEditingTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition disabled:opacity-50 shadow-xs"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Mini-Checkout Renewal Modal */}
      {renewingTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setRenewingTicket(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={(e) => { e.preventDefault(); submitRenew(); }}>
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <RotateCw className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">Gia Hạn Vé Tháng & Hội Viên</h3>
                    <p className="text-[11px] text-slate-400">Cộng dồn ngày sử dụng và cập nhật hạn mới</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRenewingTicket(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                {/* Customer Summary Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Khách hàng:</span>
                    <span className="font-bold text-slate-900 text-sm">{renewingTicket.customer_name || 'Khách vãng lai'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Mã vé (QR):</span>
                    <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {renewingTicket.qr_code_string}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500 font-medium">Hạn sử dụng hiện tại:</span>
                    <span className="font-bold text-slate-800">
                      {renewingTicket.expire_at ? new Date(renewingTicket.expire_at).toLocaleDateString('vi-VN') : renewingTicket.valid_date || '—'}
                    </span>
                  </div>
                </div>

                {/* Preset Chips for Months */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Chọn Thời Gian Gia Hạn:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '+1 Tháng', months: 1 },
                      { label: '+3 Tháng', months: 3 },
                      { label: '+6 Tháng', months: 6 },
                      { label: '+12 Tháng', months: 12 },
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.months}
                        onClick={() => setRenewMonths(preset.months)}
                        className={`py-2 px-1 text-center font-bold rounded-xl transition border text-xs ${renewMonths === preset.months
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400/30'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Visual Date Transition Banner */}
                {calculatedNewExpire && (
                  <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-blue-900">Hạn dùng mới sau khi gia hạn:</span>
                    </div>
                    <span className="font-black text-blue-800 font-mono text-sm bg-white px-3 py-1 rounded-lg border border-blue-300 shadow-2xs">
                      {calculatedNewExpire.toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}

                {/* Promotion / Voucher */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chương Trình Khuyến Mãi / Voucher:</label>
                  <select
                    value={selectedPromotion}
                    onChange={e => setSelectedPromotion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-slate-50"
                  >
                    <option value="">Không áp dụng khuyến mãi</option>
                    {promotions
                      .filter(p => {
                        // Only show active promotions that still have remaining quota
                        const isActive = p.is_active === true;
                        const hasQuota = p.quantity == null || p.used_count == null || p.used_count < p.quantity;
                        return isActive && hasQuota;
                      })
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}{(p as any).discount_percent ? ` (-${(p as any).discount_percent}%)` : p.discount_value ? ` (-${Number(p.discount_value).toLocaleString('vi-VN')}đ)` : ''}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Hình Thức Thanh Toán:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Tiền mặt', value: 'TIEN_MAT' },
                      { label: 'Chuyển khoản', value: 'CHUYEN_KHOAN' },
                      { label: 'Thẻ POS', value: 'THE_TIN_DUNG' },
                    ].map(pm => (
                      <button
                        type="button"
                        key={pm.value}
                        onClick={() => setPaymentMethod(pm.value)}
                        className={`py-2 px-2 text-center font-bold rounded-xl transition border text-xs ${paymentMethod === pm.value
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Financial Checkout Summary (Big & Highlighted) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2 shadow-inner">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Đơn giá gói ({renewMonths} tháng):</span>
                    <span className="font-mono">{((renewingTicket.unit_price || 0) * renewMonths).toLocaleString('vi-VN')} đ</span>
                  </div>
                  <div className="border-t border-slate-700/60 pt-2 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-300 block">Khách phải trả:</span>
                      <span className="text-[10px] text-blue-300">Tổng thanh toán sau chiết khấu</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {renewAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setRenewingTicket(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Xác Nhận & Gia Hạn'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Renewal Receipt Print Modal (reuses same ReceiptPrintModal as POS for UI consistency) */}
      {renewalPrintData && (
        <ReceiptPrintModal
          order={renewalPrintData.order}
          tickets={[renewalPrintData.ticket]}
          customerName={renewalPrintData.ticket.customer_name || 'Khách hội viên'}
          phoneNumber={renewalPrintData.ticket.customer_phone || ''}
          paymentMethod={renewalPrintData.order.payment_method as string}
          onClose={() => setRenewalPrintData(null)}
          onNewOrder={() => setRenewalPrintData(null)}
        />
      )}
    </div>
  );
};

export default ExpiringTicketsPage;
