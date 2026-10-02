import React, { useEffect, useState, useRef } from 'react';
import { X, Copy, Check, Printer, ShoppingCart, Calendar, Phone, Mail, Building2, User } from 'lucide-react';
import { Booking } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';

interface BookingTicketPassModalProps {
  booking: Booking | null;
  onClose: () => void;
  onOpenInPOS?: (bookingCode: string) => void;
}

export const BookingTicketPassModal: React.FC<BookingTicketPassModalProps> = ({
  booking,
  onClose,
  onOpenInPOS
}) => {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!booking) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.booking_code);
    setCopied(true);
    toast.success(`Đã sao chép mã đặt chỗ: ${booking.booking_code}`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const remaining = Number(booking.remaining_amount || 0);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">Phiếu Xác Nhận Đặt Chỗ</span>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Pass Body */}
        <div ref={printRef} className="p-6 text-slate-800 space-y-5 overflow-y-auto flex-1">
          <div className="text-center border-b border-dashed border-slate-200 pb-4">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest block mb-1">
              HPTICKET • KHU DU LỊCH QUY NHƠN
            </span>
            <h2 className="text-lg font-black text-slate-900">PHIẾU ĐẶT VÉ TRƯỚC (BOOKING)</h2>
            <p className="text-xs text-slate-500 mt-1">Xuất trình mã này tại quầy vé POS để nhận vé vào cổng</p>
          </div>

          {/* Booking Code Presentation Box (Không dùng mã QR để tránh khách tưởng nhầm quét vào cổng) */}
          <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-emerald-50 to-slate-50 rounded-2xl border-2 border-emerald-200 p-4">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
              MÃ TRA CỨU TẠI QUẦY THU NGÂN
            </span>
            <div className="my-1.5 flex items-center gap-2 bg-white px-5 py-2.5 rounded-xl border border-emerald-300 shadow-xs">
              <span className="font-mono text-2xl font-black text-emerald-800 tracking-wider">
                {booking.booking_code}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-emerald-700 hover:text-emerald-900 p-1.5 hover:bg-emerald-100 rounded-lg transition no-print"
                title="Sao chép mã đặt"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">Trạng thái: <b className="text-emerald-700 uppercase font-semibold">{booking.status}</b></span>
            <div className="mt-3 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[10px] text-center leading-relaxed">
              ⚠️ Đây là mã đặt trước (Booking), quý khách xuất trình mã tại quầy POS để nhận vé vào cổng.
            </div>
          </div>

          {/* Booking Info */}
          <div className="space-y-2 text-xs border-y border-slate-100 py-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Khách hàng:</span>
              <span className="font-bold text-slate-900">{booking.customer_name}</span>
            </div>
            {booking.company_name && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Công ty / Tour:</span>
                <span className="font-semibold text-slate-900">{booking.company_name}</span>
              </div>
            )}
            {booking.customer_phone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="font-mono text-slate-700">{booking.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ngày tham quan:</span>
              <span className="font-semibold text-emerald-800">{booking.visit_date}</span>
            </div>
          </div>

          {/* Items Summary */}
          {booking.items && booking.items.length > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-700 block">Chi tiết vé:</span>
              <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-200">
                {booking.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-slate-700">
                      {it.ticket_name}{' '}
                      <b className="text-emerald-700">
                        {it.is_group_ticket || (it.allowed_passes && it.allowed_passes > 1)
                          ? `(1 vé • ${it.allowed_passes} lượt)`
                          : `x${it.quantity}`}
                      </b>
                    </span>
                    <span className="font-mono text-slate-800 font-semibold">{Number(it.subtotal || 0).toLocaleString('vi-VN')} đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial summary */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs border border-slate-200">
            <div className="flex justify-between items-center text-slate-600">
              <span>Tổng tiền dự kiến:</span>
              <span className="font-mono font-bold text-slate-900">{Number(booking.total_amount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            {Number(booking.discount_amount || 0) > 0 && (
              <div className="flex justify-between items-center text-amber-700 font-medium">
                <span>Chiết khấu / Giảm giá{booking.discount_percent ? ` (${booking.discount_percent}%)` : ''}:</span>
                <span className="font-mono font-bold">-{Number(booking.discount_amount).toLocaleString('vi-VN')} đ</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-600">
              <span>Đã đặt cọc:</span>
              <span className="font-mono font-semibold text-emerald-700">{Number(booking.deposit_amount || 0).toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center text-rose-600 pt-1 border-t border-slate-200 font-bold">
              <span>Còn phải thu tại POS:</span>
              <span className="font-mono text-sm">{remaining.toLocaleString('vi-VN')} đ</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0 no-print">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4 text-slate-500" /> In phiếu
          </button>
          {onOpenInPOS && (
            <button
              type="button"
              onClick={() => {
                onOpenInPOS(booking.booking_code);
                onClose();
              }}
              className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs"
            >
              <ShoppingCart className="w-4 h-4" /> Mở bán tại POS
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
