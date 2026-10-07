import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CalendarClock, Search, Filter, X, RefreshCw,
  Download, Ticket, CheckCircle2, AlertTriangle, CalendarX, Activity,
  User, Phone, Mail, Plus, ChevronDown, RotateCw
} from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { Promotion, Order, IssuedTicket } from '../../../shared/types/hpticket';
import { ExpiringTicketsTable } from '../components/ExpiringTicketsTable';
import { MonthlyTicketCardModal } from '../components/MonthlyTicketCardModal';
import { MonthlyTicketDetailDrawer } from '../components/MonthlyTicketDetailDrawer';
import { ExpiringTicketEditModal } from '../components/ExpiringTicketEditModal';
import { ExpiringTicketRenewModal } from '../components/ExpiringTicketRenewModal';
import { ReceiptPrintModal } from '../../pos/components/ReceiptPrintModal';
import { usePermission } from '../../../shared/hooks/usePermission';
import { iamService } from '../../../api/iamService';
import { toast } from '../../../shared/utils/toast';
import { RefreshButton } from '../../../shared/components/RefreshButton';
import { Pagination } from '../../../shared/components/ui';

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

  // Print data for ReceiptPrintModal (Renewal & Monthly Ticket Reprint)
  const [printTicketData, setPrintTicketData] = useState<{
    order: Order;
    tickets: IssuedTicket[];
    customerName?: string;
    phoneNumber?: string;
  } | null>(null);
  const [reprintingTicketId, setReprintingTicketId] = useState<string | null>(null);

  const [promotions, setPromotions] = useState<Promotion[]>([]);

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
    setEditingTicket(ticket);
  };

  const handleRenewTicket = (ticket: IssuedTicket) => {
    setRenewingTicket(ticket);
  };

  const handlePrintTicket = async (ticket: IssuedTicket) => {
    setReprintingTicketId(ticket.id);
    try {
      let orderData: Order | null = null;
      let ticketsList: IssuedTicket[] = [ticket];

      if (ticket.order_id) {
        try {
          const [orderRes, ticketsRes] = await Promise.allSettled([
            salesService.fetchOrderDetail(ticket.order_id),
            salesService.fetchIssuedTicketsByOrder(ticket.order_id),
          ]);

          if (orderRes.status === 'fulfilled' && orderRes.value) {
            const res = orderRes.value;
            orderData = (res && (res.data || (typeof res === 'object' && !res.code ? res : null))) || null;
          }

          if (ticketsRes.status === 'fulfilled' && ticketsRes.value) {
            const tRes = ticketsRes.value;
            let fetchedList: any[] = [];
            if (Array.isArray(tRes)) {
              fetchedList = tRes;
            } else if (tRes && Array.isArray(tRes.data)) {
              fetchedList = tRes.data;
            } else if (tRes && typeof tRes === 'object' && !tRes.data && !tRes.code) {
              fetchedList = [tRes];
            } else if (tRes && tRes.data && typeof tRes.data === 'object') {
              fetchedList = [tRes.data];
            }
            if (fetchedList.length > 0) {
              const matchedTicket = fetchedList.find((t: any) => t.id === ticket.id || t.qr_code_string === ticket.qr_code_string);
              ticketsList = matchedTicket ? [matchedTicket] : fetchedList;
            }
          }
        } catch (e) {
          console.warn('Could not fetch original order or tickets for reprint:', e);
        }
      }

      if (ticketsList.length === 0 || !ticketsList[0]) {
        ticketsList = [ticket];
      } else {
        ticketsList = ticketsList.map((t) => ({
          ...ticket,
          ...t,
          customer_name: t.customer_name || ticket.customer_name,
          customer_phone: t.customer_phone || ticket.customer_phone,
        }));
      }

      if (!orderData) {
        const now = ticket.created_at || new Date().toISOString();
        const basePrice = Number(ticket.unit_price || 0);
        orderData = {
          id: ticket.order_id || `ord-${ticket.id}`,
          order_code: (ticket as any).order_code || `VT-${ticket.qr_code_string?.slice(-8) || ticket.id.slice(-8)}`,
          sales_counter_id: '',
          total_amount: basePrice,
          discount_amount: 0,
          final_amount: basePrice,
          payment_method: ((ticket as any).payment_method as any) || 'TIEN_MAT',
          status: 'COMPLETED' as any,
          invoice_status: 'NOT_ISSUED' as any,
          invoice_lookup_code: ticket.qr_code_string,
          created_at: now,
          updated_at: now,
          created_by: ticket.created_by || localStorage.getItem('hpticket_username') || 'Admin',
          updated_by: '',
          details: [
            {
              id: `d-${ticket.id}`,
              order_id: ticket.order_id || `ord-${ticket.id}`,
              item_type: 'TICKET' as any,
              item_id: ticket.ticket_template_id,
              item_name: ticket.ticket_template_name || ticket.ticket_template_code || 'VÉ THÁNG THAM QUAN',
              quantity: 1,
              unit_price: basePrice,
              total_price: basePrice,
              created_at: now,
              updated_at: now,
              created_by: ticket.created_by || '',
              updated_by: '',
            }
          ]
        };
      }

      setPrintTicketData({
        order: orderData,
        tickets: ticketsList,
        customerName: ticket.customer_name || (orderData as any).booker_name || (orderData as any).customer_name || '',
        phoneNumber: ticket.customer_phone || (orderData as any).customer_phone || '',
      });
    } catch (err) {
      console.error('Lỗi khi tải thông tin in vé tháng:', err);
      toast.error('Đã xảy ra lỗi khi chuẩn bị in vé!');
    } finally {
      setReprintingTicketId(null);
    }
  };

  const handleResetFilters = () => {
    setDaysAhead(null);
    setStatusFilter('all');
    setEmployeeSearch('all');
    setSearchInput('');
    setSearchTerm('');
  };

  const activeFiltersCount = (daysAhead !== null ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (employeeSearch !== 'all' ? 1 : 0);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 relative print:p-0 print:m-0 print:space-y-0 print:max-w-none">
      <div className="no-print print:hidden space-y-6">
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
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-40 space-y-3.5 animate-in fade-in zoom-in-95 duration-100">
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
            onPrintTicket={handlePrintTicket}
            reprintingTicketId={reprintingTicketId}
            onSelectTicket={(ticket) => setSelectedDrawerTicket(ticket)}
            onResetFilters={handleResetFilters}
            canEdit={can('UPDATE_ISSUED_TICKET')}
          />
        </div>

        {/* 5. Pagination */}
        {totalElements > 0 && (
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalElements={totalElements}
            totalPages={totalPages}
            onPageChange={goToPage}
            onPageSizeChange={changePageSize}
          />
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
        onPrint={(t) => {
          setSelectedDrawerTicket(null);
          handlePrintTicket(t);
        }}
      />

      {/* 7. Digital Membership Card Modal */}
      {selectedCardTicket && (
        <MonthlyTicketCardModal
          ticket={selectedCardTicket}
          onClose={() => setSelectedCardTicket(null)}
          onRenew={(ticket) => handleRenewTicket(ticket)}
          onPrint={(ticket) => {
            setSelectedCardTicket(null);
            handlePrintTicket(ticket);
          }}
        />
      )}

      {/* 8. Edit Customer Modal */}
      <ExpiringTicketEditModal
        ticket={editingTicket}
        onClose={() => setEditingTicket(null)}
        onSuccess={() => fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, currentPage, pageSize)}
      />

      {/* 9. Mini-Checkout Renewal Modal */}
      <ExpiringTicketRenewModal
        ticket={renewingTicket}
        promotions={promotions}
        onClose={() => setRenewingTicket(null)}
        onSuccess={(syntheticOrder, renewedTicket) => {
          setPrintTicketData({
            order: syntheticOrder,
            tickets: [renewedTicket],
            customerName: renewedTicket.customer_name || 'Khách hội viên',
            phoneNumber: renewedTicket.customer_phone || '',
          });
          fetchTickets(daysAhead, searchTerm, employeeSearch, statusFilter, currentPage, pageSize);
        }}
      />
      </div>

      {/* 10. Standardized Receipt & Ticket Print Modal (reuses ReceiptPrintModal for POS, Renewal, and Ticket Reprint) */}
      {printTicketData && (
        <ReceiptPrintModal
          order={printTicketData.order}
          tickets={printTicketData.tickets}
          customerName={printTicketData.customerName}
          phoneNumber={printTicketData.phoneNumber}
          paymentMethod={printTicketData.order.payment_method as string}
          printTicketsOnly={true}
          onClose={() => setPrintTicketData(null)}
          onNewOrder={() => setPrintTicketData(null)}
        />
      )}
    </div>
  );
};

export default ExpiringTicketsPage;
