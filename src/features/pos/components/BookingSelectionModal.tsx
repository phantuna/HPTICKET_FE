import React from 'react';
import { CalendarClock, Calendar, User, Phone, ArrowRight, Building2, Ticket, Users } from 'lucide-react';
import { Booking } from '../../../shared/types/hpticket';
import { Modal, Button } from '../../../shared/components/ui';

interface BookingSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  bookings: Booking[];
  onSelectBooking: (booking: Booking) => void;
}

export const BookingSelectionModal: React.FC<BookingSelectionModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  bookings,
  onSelectBooking,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chọn Đơn Đặt Chỗ (Booking)"
      icon={<CalendarClock className="w-5 h-5 text-emerald-600" />}
      subtitle={`Tìm thấy ${bookings.length} đơn đặt chỗ chưa thanh toán khớp với: "${searchQuery}"`}
      maxWidth="3xl"
      showFooter={false}
    >
      <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
        <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <span>💡</span>
          <p className="font-medium">
            Số điện thoại này có nhiều đơn đặt trước trong hệ thống. Vui lòng hỏi khách để chọn chính xác đơn cần xuất vé:
          </p>
        </div>

        <div className="space-y-3">
          {bookings.map((b, idx) => {
            const totalPasses = b.items?.reduce((acc, it) => {
              const passes = Number(it.allowed_passes) || 1;
              const qty = Number(it.quantity) || 1;
              const isGroup = Boolean(it.is_group_ticket || passes > 1);
              return acc + (isGroup ? passes : (qty * passes));
            }, 0) || 0;
            const isGroup = b.items?.some(it => Boolean(it.is_group_ticket || (Number(it.allowed_passes) || 1) > 1));
            const total = Number(b.total_amount || 0);
            const remaining = Number(b.remaining_amount !== undefined ? b.remaining_amount : total);
            const deposit = Number(b.deposit_amount || 0);

            return (
              <div
                key={b.id || idx}
                className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-3.5 sm:p-4 transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg shadow-2xs">
                      {b.booking_code}
                    </span>
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Ngày đến: <b className="text-slate-800 font-semibold">{b.visit_date}</b>
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isGroup 
                        ? 'bg-purple-50 text-purple-800 border-purple-200' 
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {isGroup ? (
                        <>
                          <Users className="w-3 h-3 text-purple-600" />
                          <span>Vé đoàn ({totalPasses} lượt)</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3 h-3 text-emerald-600" />
                          <span>{totalPasses} vé lẻ</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="text-xs text-slate-700 flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {b.customer_name || 'Khách vãng lai'}
                    </span>
                    {b.customer_phone && (
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {b.customer_phone}
                      </span>
                    )}
                    {b.company_name && (
                      <span className="text-slate-600 flex items-center gap-1 truncate max-w-[200px]" title={b.company_name}>
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        {b.company_name}
                      </span>
                    )}
                  </div>

                  {/* Item breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {b.items?.map((it, itemIdx) => {
                      const ticketTitle = it.ticket_name || (it as any).ticket_name_snapshot || (it as any).template_name || it.ticket_type_code || 'Vé tham quan';
                      const isGroupItem = Boolean(it.is_group_ticket || (it.allowed_passes && it.allowed_passes > 1));
                      const unitPrice = Number(it.unit_price || 0);

                      return (
                        <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs bg-slate-50/90 px-3 py-2 rounded-lg border border-slate-200/80">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-bold text-slate-900 leading-snug">
                              {ticketTitle}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto pl-4 sm:pl-0">
                            {unitPrice > 0 && (
                              <span className="text-slate-500 font-mono text-[11px]">
                                {unitPrice.toLocaleString('vi-VN')} đ/vé
                              </span>
                            )}
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] whitespace-nowrap">
                              {isGroupItem ? `1 vé (${it.allowed_passes} lượt)` : `x${it.quantity} vé`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Note if present */}
                  {b.note && (
                    <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/80 px-2 py-0.5 rounded italic">
                      Ghi chú: {b.note}
                    </p>
                  )}
                </div>

                {/* Price & Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 sm:border-l border-slate-200 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Cần thanh toán</span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                      {remaining.toLocaleString('vi-VN')} đ
                    </span>
                    {deposit > 0 && (
                      <span className="text-[10px] text-slate-500 block">
                        (Đã cọc: {deposit.toLocaleString('vi-VN')} đ)
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => onSelectBooking(b)}
                    className="shadow-md shadow-emerald-600/20"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Chọn Đơn Này
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal footer close button */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
