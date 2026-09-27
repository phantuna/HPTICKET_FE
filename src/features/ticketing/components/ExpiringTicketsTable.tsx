import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar, Clock, Mail, Phone, QrCode, RefreshCw,
  Edit2, MoreVertical, Copy, Printer, Eye, CheckCircle2,
  AlertTriangle, CalendarX, Check, RotateCw
} from 'lucide-react';
import { IssuedTicket } from '../../../api/salesService';
import { toast } from '../../../shared/utils/toast';

interface ExpiringTicketsTableProps {
  tickets: IssuedTicket[];
  loading: boolean;
  daysAhead: number | null;
  onEditCustomer: (ticket: IssuedTicket) => void;
  onRenewTicket: (ticket: IssuedTicket) => void;
  onViewCard: (ticket: IssuedTicket) => void;
  onSelectTicket: (ticket: IssuedTicket) => void;
  onResetFilters?: () => void;
  canEdit?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

export const ExpiringTicketsTable: React.FC<ExpiringTicketsTableProps> = ({
  tickets,
  loading,
  daysAhead,
  onEditCustomer,
  onRenewTicket,
  onViewCard,
  onSelectTicket,
  onResetFilters,
  canEdit = true,
  selectedIds: propSelectedIds,
  onToggleSelect,
  onSelectAll
}) => {
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const selectedIds = propSelectedIds ?? internalSelectedIds;

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(id);
    } else {
      setInternalSelectedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    }
  };

  const handleSelectAllRows = () => {
    if (onSelectAll) {
      onSelectAll();
    } else {
      if (internalSelectedIds.length === tickets.length) {
        setInternalSelectedIds([]);
      } else {
        setInternalSelectedIds(tickets.map(t => t.id));
      }
    }
  };

  const isAllSelected = tickets.length > 0 && selectedIds.length === tickets.length;

  const handleCopyCode = (e: React.MouseEvent, code: string, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Đã sao chép mã vé!');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const now = new Date();

  return (
    <div className="w-full overflow-hidden">
      <table className="w-full table-fixed text-left text-xs sm:text-sm border-collapse">
        <colgroup>
          {/* Checkbox */}
          <col className="w-[44px]" />

          {/* STT */}
          <col className="w-[52px]" />

          {/* Khách hàng */}
          <col className="w-[18%]" />

          {/* Mã vé / QR */}
          <col className="w-[17%]" />

          {/* Hạn dùng & trạng thái */}
          <col className="w-[19%]" />

          {/* Lượt qua */}
          <col className="w-[72px]" />

          {/* Người bán */}
          <col className="w-[12%]" />

          {/* Thao tác */}
          <col className="w-[190px]" />
        </colgroup>
        <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
          <tr>
            <th className="p-3 text-center ">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAllRows}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </th>
            <th className="p-3 text-center  font-mono">STT</th>
            <th className="p-3 ">Khách Hàng</th>
            <th className="p-3 ">Mã Vé / QR</th>
            <th className="p-3 ">Hạn Dùng & Trạng Thái</th>
            <th className="p-3 text-center ">Lượt Qua</th>
            <th className="p-3 ">Người Bán</th>
            <th className="p-3 text-center ">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {/* Skeleton Loading State */}
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="animate-pulse">
                <td className="p-3 text-center">
                  <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                </td>
                <td className="p-3 text-center">
                  <div className="h-4 bg-slate-200 rounded w-6 mx-auto" />
                </td>
                <td className="p-3">
                  <div className="space-y-1.5">
                    <div className="h-3.5 bg-slate-200 rounded w-28" />
                    <div className="h-2.5 bg-slate-100 rounded w-20" />
                  </div>
                </td>
                <td className="p-3">
                  <div className="h-3 bg-slate-200 rounded w-24" />
                </td>
                <td className="p-3">
                  <div className="space-y-1.5">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                    <div className="h-2.5 bg-slate-100 rounded w-16" />
                  </div>
                </td>
                <td className="p-3 text-center">
                  <div className="h-4 bg-slate-200 rounded w-10 mx-auto" />
                </td>
                <td className="p-3">
                  <div className="h-4 bg-slate-200 rounded w-16" />
                </td>
                <td className="p-3 text-center">
                  <div className="h-7 bg-slate-200 rounded-lg w-24 mx-auto" />
                </td>
              </tr>
            ))
          ) : tickets.length === 0 ? (
            /* Empty State */
            <tr>
              <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="font-semibold text-slate-700 text-sm">Không tìm thấy vé tháng phù hợp</div>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {daysAhead === null
                    ? 'Chưa có dữ liệu vé tháng nào khớp với điều kiện lọc.'
                    : `Không có vé tháng nào sắp hết hạn trong ${daysAhead} ngày tới.`}
                </p>
                {onResetFilters && (
                  <button
                    onClick={onResetFilters}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Đặt lại bộ lọc
                  </button>
                )}
              </td>
            </tr>
          ) : (
            tickets.map((ticket, index) => {
              const expireDate = ticket.expire_at ? new Date(ticket.expire_at) : null;
              const isExpired = expireDate ? expireDate.getTime() < now.getTime() : false;
              const daysLeft = expireDate ? Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;
              const ticketCode = ticket.qr_code_string || ticket.ticket_template_code || ticket.id;
              const isMenuOpen = activeMenuId === ticket.id;
              const isSelected = selectedIds.includes(ticket.id);

              return (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-50/40' : ''}`}
                  title="Click để xem chi tiết vé & hội viên"
                >
                  {/* 1. Checkbox */}
                  <td className="p-3 text-center" onClick={(e) => handleSelectRow(ticket.id, e)}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>

                  {/* 2. STT */}
                  <td className="p-3 text-center font-mono text-slate-600 font-medium">
                    {index + 1}
                  </td>

                  {/* 3. Khách Hàng (Tên đậm + SĐT/Email) */}
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                      {ticket.customer_name || 'Khách vãng lai'}
                    </div>
                    <div className="font-mono text-slate-500 text-xs mt-0.5">
                      {ticket.customer_phone || ticket.customer_email || '—'}
                    </div>
                  </td>

                  {/* 4. Mã Vé / QR (Mono text + Quick Copy + QR Icon) */}
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 truncate" title={ticketCode}>
                        {ticketCode}
                      </span>
                      <button
                        onClick={(e) => handleCopyCode(e, ticketCode, ticket.id)}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded transition shrink-0"
                        title="Sao chép mã vé"
                      >
                        {copiedId === ticket.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewCard(ticket);
                        }}
                        className="p-1 text-slate-400 hover:text-emerald-700 rounded transition shrink-0"
                        title="Xem thẻ QR"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* 5. Hạn Dùng & Trạng Thái */}
                  <td className="p-3">
                    <div className="space-y-1">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                          <span>Quá hạn {Math.abs(daysLeft || 0)} ngày</span>
                        </span>
                      ) : daysLeft === 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Hôm nay hết hạn</span>
                        </span>
                      ) : daysLeft !== null && daysLeft <= 7 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span>Sắp hết ({daysLeft} ngày)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span>Còn {daysLeft} ngày</span>
                        </span>
                      )}

                      <div className="text-[11px] text-slate-400 font-mono">
                        HSD: {expireDate ? expireDate.toLocaleDateString('vi-VN') : ticket.valid_date || '—'}
                      </div>
                    </div>
                  </td>

                  {/* 6. Lượt Qua Cổng */}
                  <td className="p-3 text-center">
                    <div className="font-bold text-slate-800 font-mono text-xs sm:text-sm">
                      {ticket.used_passes ?? 0}
                    </div>
                  </td>

                  {/* 7. Người Bán */}
                  <td className="p-3">
                    <div className="font-semibold text-slate-800 text-xs">
                      {ticket.created_by || '—'}
                    </div>
                    {(ticket as any).sales_counter_name && (
                      <div className="text-[11px] text-slate-400 font-medium">
                        {(ticket as any).sales_counter_name}
                      </div>
                    )}
                  </td>

                  {/* 8. Thao Tác (Gia hạn + Chi tiết + Dropdown) */}
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 relative">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRenewTicket(ticket);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap shadow-2xs"
                          title="Gia hạn thời gian sử dụng vé"
                        >
                          <RotateCw className="w-3 h-3" />
                          Gia hạn
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicket(ticket);
                        }}
                        className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition flex items-center gap-1 whitespace-nowrap shadow-2xs"
                        title="Xem chi tiết vé"
                      >
                        <Eye className="w-3 h-3 text-slate-500" />
                        Chi tiết
                      </button>

                      {/* Dropdown Menu Trigger */}
                      <div className="relative" ref={isMenuOpen ? menuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(isMenuOpen ? null : ticket.id);
                          }}
                          className={`p-1 rounded-lg transition ${isMenuOpen
                            ? 'bg-slate-200 text-slate-800'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                          title="Tùy chọn khác"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Menu Popover */}
                        {isMenuOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100"
                          >
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewCard(ticket);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              Xem thẻ hội viên
                            </button>

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewCard(ticket);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <QrCode className="w-3.5 h-3.5 text-slate-500" />
                              Xem & Tải QR
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditCustomer(ticket);
                                }}
                                className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                Sửa thông tin
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                setActiveMenuId(null);
                                handleCopyCode(e, ticketCode, ticket.id);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              Sao chép mã vé
                            </button>

                            <div className="border-t border-slate-100 my-1" />

                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewCard(ticket);
                              }}
                              className="w-full px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition"
                            >
                              <Printer className="w-3.5 h-3.5 text-slate-500" />
                              In thẻ
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ExpiringTicketsTable;
