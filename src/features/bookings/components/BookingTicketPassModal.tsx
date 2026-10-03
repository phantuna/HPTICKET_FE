import React, { useState, useRef } from 'react';
import { Copy, Check, Printer, ShoppingCart, Calendar, Phone, Mail, Building2, User, Ticket } from 'lucide-react';
import { Booking } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';
import { Modal, Button } from '../../../shared/components/ui';

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
  const formattedDate = booking.visit_date ? booking.visit_date.split('-').reverse().join('/') : '--';

  const footer = (
    <div className="flex items-center justify-between w-full no-print">
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={handlePrint}
        className="flex items-center gap-1.5"
      >
        <Printer className="w-4 h-4 text-slate-500" /> In phiếu
      </Button>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
        >
          Đóng
        </Button>
        {onOpenInPOS && booking.status !== 'FULFILLED' && booking.status !== 'CANCELLED' && (
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onOpenInPOS(booking.booking_code);
              onClose();
            }}
            className="flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" /> Mở bán tại POS
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title="Phiếu Xác Nhận Đặt Chỗ (Booking Pass)"
      subtitle={`Mã đặt chỗ: #${booking.booking_code}`}
      icon={<Ticket className="w-5 h-5 text-emerald-600" />}
      maxWidth="md"
      showFooter={true}
      footer={footer}
      closeOnBackdropClick={true}
    >
      <div ref={printRef} className="space-y-4 text-slate-800 text-xs">
        {/* Box Mã đặt chỗ */}
        <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50/80 to-slate-50 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
            Mã Tra Cứu Tại Quầy Thu Ngân
          </span>
          <div className="my-1.5 flex items-center gap-2.5 bg-white px-5 py-2.5 rounded-xl border border-emerald-300 shadow-xs">
            <span className="font-mono text-2xl font-black text-emerald-800 tracking-wider">
              {booking.booking_code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="text-emerald-700 hover:text-emerald-900 p-1.5 hover:bg-emerald-100 rounded-lg transition no-print cursor-pointer"
              title="Sao chép mã đặt"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-slate-500 mt-1">
            Trạng thái: <b className="text-emerald-700 uppercase font-semibold">{booking.status}</b>
          </span>
          <div className="mt-2.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-900 text-[11px] text-center leading-relaxed">
            ⚠️ Xuất trình mã này tại quầy thu ngân POS để in vé vào cổng.
          </div>
        </div>

        {/* Thông tin đặt chỗ */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Khách hàng:
            </span>
            <span className="font-bold text-slate-900">{booking.customer_name}</span>
          </div>

          {booking.company_name && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Đơn vị / Tour:
              </span>
              <span className="font-semibold text-slate-900">{booking.company_name}</span>
            </div>
          )}

          {booking.customer_phone && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> Điện thoại:
              </span>
              <span className="font-mono font-semibold text-slate-800">{booking.customer_phone}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày tham quan:
            </span>
            <span className="font-bold text-emerald-800">{formattedDate}</span>
          </div>
        </div>

        {/* Chi tiết loại vé */}
        {booking.items && booking.items.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 block">Danh sách vé đặt:</span>
            <div className="bg-slate-50 rounded-xl p-3 space-y-2 border border-slate-200/80">
              {booking.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-slate-700 font-medium">
                    {it.ticket_name}{' '}
                    <b className="text-emerald-700">
                      {it.is_group_ticket || (it.allowed_passes && it.allowed_passes > 1)
                        ? `(1 vé • ${it.allowed_passes} lượt)`
                        : `x${it.quantity}`}
                    </b>
                  </span>
                  <span className="font-mono text-slate-900 font-semibold">
                    {Number(it.subtotal || 0).toLocaleString('vi-VN')} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bảng kê tài chính */}
        <div className="bg-slate-50 rounded-xl p-3.5 space-y-1.5 border border-slate-200/80">
          <div className="flex justify-between items-center text-slate-600">
            <span>Tổng tiền dự kiến:</span>
            <span className="font-mono font-bold text-slate-900">
              {Number(booking.total_amount || 0).toLocaleString('vi-VN')} đ
            </span>
          </div>
          {Number(booking.discount_amount || 0) > 0 && (
            <div className="flex justify-between items-center text-amber-700 font-medium">
              <span>Chiết khấu / Giảm giá{booking.discount_percent ? ` (${booking.discount_percent}%)` : ''}:</span>
              <span className="font-mono font-bold">
                -{Number(booking.discount_amount).toLocaleString('vi-VN')} đ
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-slate-600">
            <span>Đã đặt cọc trước:</span>
            <span className="font-mono font-semibold text-emerald-700">
              {Number(booking.deposit_amount || 0).toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="flex justify-between items-center text-rose-600 pt-1.5 border-t border-slate-200 font-bold text-sm">
            <span>Còn phải thu tại quầy:</span>
            <span className="font-mono">{remaining.toLocaleString('vi-VN')} đ</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
