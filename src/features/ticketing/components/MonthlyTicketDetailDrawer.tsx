import React, { useEffect } from 'react';
import { 
  X, User, Phone, Mail, Calendar, Clock, Copy, Check, 
  QrCode, RefreshCw, Edit2, ShieldCheck, Store, UserCheck, Ticket, Printer
} from 'lucide-react';
import { IssuedTicket } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';

interface MonthlyTicketDetailDrawerProps {
  ticket: IssuedTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onRenew: (ticket: IssuedTicket) => void;
  onViewCard: (ticket: IssuedTicket) => void;
  onEditCustomer: (ticket: IssuedTicket) => void;
  onPrint?: (ticket: IssuedTicket) => void;
}

export const MonthlyTicketDetailDrawer: React.FC<MonthlyTicketDetailDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onRenew,
  onViewCard,
  onEditCustomer,
  onPrint,
}) => {
  const [copied, setCopied] = React.useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  const now = new Date();
  const expireDate = ticket.expire_at ? new Date(ticket.expire_at) : null;
  const isExpired = expireDate ? expireDate.getTime() < now.getTime() : false;
  const daysLeft = expireDate ? Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;

  const getInitials = (name?: string) => {
    if (!name) return 'KH';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const ticketCode = ticket.qr_code_string || ticket.ticket_template_code || ticket.id;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(ticketCode);
    setCopied(true);
    toast.success('Đã sao chép mã vé vào clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* 1. Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Chi Tiết Vé Tháng & Hội Viên</h3>
                <p className="text-[11px] text-slate-500 font-medium">Hồ sơ khách hàng và thông tin vé</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 2. Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Customer Profile Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 border border-blue-100 shadow-2xs">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shrink-0">
                {getInitials(ticket.customer_name)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-slate-900 text-base truncate">
                  {ticket.customer_name || 'Khách vãng lai'}
                </h4>
                <div className="mt-1 space-y-0.5 text-xs text-slate-600">
                  {ticket.customer_phone && (
                    <a 
                      href={`tel:${ticket.customer_phone}`} 
                      className="flex items-center gap-1.5 hover:text-blue-600 transition font-medium"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{ticket.customer_phone}</span>
                    </a>
                  )}
                  {ticket.customer_email && (
                    <a 
                      href={`mailto:${ticket.customer_email}`} 
                      className="flex items-center gap-1.5 hover:text-blue-600 transition truncate max-w-[220px]"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">{ticket.customer_email}</span>
                    </a>
                  )}
                  {!ticket.customer_phone && !ticket.customer_email && (
                    <span className="text-[11px] text-slate-400 italic">Chưa có thông tin liên hệ</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ticket Code Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
                <span>Mã vé / Chuỗi QR:</span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
              <div className="font-mono font-bold text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 text-slate-800 break-all select-all">
                {ticketCode}
              </div>
            </div>

            {/* Validity & Pass Info */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thông Tin Thời Hạn & Sử Dụng</h5>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Expiry Box */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn dùng:
                  </span>
                  <div className="font-bold text-slate-900 font-mono text-sm">
                    {expireDate ? expireDate.toLocaleDateString('vi-VN') : ticket.valid_date || '—'}
                  </div>
                  {/* Status pill */}
                  <div className="pt-0.5">
                    {isExpired ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        Quá hạn {Math.abs(daysLeft || 0)} ngày
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                        Hôm nay hết hạn
                      </span>
                    ) : daysLeft !== null && daysLeft <= 7 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Còn {daysLeft} ngày
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        Còn {daysLeft} ngày
                      </span>
                    )}
                  </div>
                </div>

                {/* Passes Box */}
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> Lượt qua cổng:
                  </span>
                  <div className="font-extrabold text-blue-700 font-mono text-xl">
                    {ticket.used_passes ?? 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Tổng số lần quét thẻ</span>
                </div>
              </div>
            </div>

            {/* Additional Package & Sales Info */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chi Tiết Gói & Quầy Bán</h5>
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs">
                <div className="p-2.5 flex justify-between items-center">
                  <span className="text-slate-500">Mẫu vé tháng:</span>
                  <span className="font-bold text-slate-800 text-right">
                    {ticket.ticket_template_name || ticket.ticket_template_code || 'Vé Tháng Tham Quan'}
                  </span>
                </div>
                {ticket.unit_price !== undefined && ticket.unit_price > 0 && (
                  <div className="p-2.5 flex justify-between items-center">
                    <span className="text-slate-500">Đơn giá phát hành:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {Number(ticket.unit_price).toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
                {(ticket as any).sales_counter_name && (
                  <div className="p-2.5 flex justify-between items-center">
                    <span className="text-slate-500 flex items-center gap-1"><Store className="w-3.5 h-3.5 text-slate-400" /> Quầy bán:</span>
                    <span className="font-medium text-slate-700">{(ticket as any).sales_counter_name}</span>
                  </div>
                )}
                <div className="p-2.5 flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-slate-400" /> Nhân viên phát hành:</span>
                  <span className="font-medium text-slate-700">{ticket.updated_by || ticket.created_by || 'Admin'}</span>
                </div>
                {ticket.created_at && (
                  <div className="p-2.5 flex justify-between items-center">
                    <span className="text-slate-500">Ngày phát hành:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(ticket.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Action Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onRenew(ticket);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Gia Hạn
              </button>
              <button
                onClick={() => {
                  onClose();
                  onViewCard(ticket);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-xs"
                title="Xem thẻ vé điện tử"
              >
                <QrCode className="w-4 h-4" />
                Thẻ QR
              </button>
              {onPrint && (
                <button
                  onClick={() => {
                    onClose();
                    onPrint(ticket);
                  }}
                  className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-xl transition shadow-xs"
                  title="In lại phiếu vé nhiệt chuẩn hệ thống (đồng bộ POS & Hóa đơn)"
                >
                  <Printer className="w-4 h-4" />
                  In Lại
                </button>
              )}
            </div>
            <button
              onClick={() => {
                onClose();
                onEditCustomer(ticket);
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Sửa Thông Tin Khách Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
