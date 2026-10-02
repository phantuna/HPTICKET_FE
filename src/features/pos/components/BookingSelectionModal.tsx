import React from 'react';
import { CalendarClock, Calendar, User, Phone, ArrowRight, Ticket, Users } from 'lucide-react';
import { BookingPosSearchItem } from '../../../shared/types/hpticket';
import { Modal, Button } from '../../../shared/components/ui';

interface BookingSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  bookings: BookingPosSearchItem[];
  onSelectBooking: (booking: BookingPosSearchItem) => void;
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
            return (
              <div
                key={b.booking_code || idx}
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
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        b.group
                          ? 'bg-purple-50 text-purple-800 border-purple-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {b.group ? (
                        <>
                          <Users className="w-3 h-3 text-purple-600" />
                          <span>Vé đoàn</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3 h-3 text-emerald-600" />
                          <span>Vé lẻ</span>
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
                    {b.phone_masked && (
                      <span className="font-mono text-slate-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {b.phone_masked}
                      </span>
                    )}
                  </div>

                  {/* Ticket Summary formatted directly by backend */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs bg-slate-50/90 px-3 py-2 rounded-lg border border-slate-200/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-800 leading-snug">
                      {b.ticket_summary}
                    </span>
                  </div>
                </div>

                {/* Price & Action Button */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 sm:pl-4 sm:border-l border-slate-200 gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Cần thanh toán</span>
                    <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
                      {Number(b.amount_due || 0).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={!b.can_checkout}
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
