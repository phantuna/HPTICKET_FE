import React, { useState, useEffect, useMemo } from 'react';
import { CalendarClock, RotateCw, RefreshCw } from 'lucide-react';
import { IssuedTicket, salesService } from '../../../api/salesService';
import { Promotion, Order } from '../../../shared/types/hpticket';
import { Modal, Button } from '../../../shared/components/ui';
import { toast } from '../../../shared/utils/toast';

interface ExpiringTicketRenewModalProps {
  ticket: IssuedTicket | null;
  promotions: Promotion[];
  onClose: () => void;
  onSuccess: (syntheticOrder: Order, renewedTicket: IssuedTicket) => void;
}

export const ExpiringTicketRenewModal: React.FC<ExpiringTicketRenewModalProps> = ({
  ticket,
  promotions,
  onClose,
  onSuccess,
}) => {
  const [renewMonths, setRenewMonths] = useState(1);
  const [renewAmount, setRenewAmount] = useState(0);
  const [selectedPromotion, setSelectedPromotion] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('TIEN_MAT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset values when ticket changes
  useEffect(() => {
    if (ticket) {
      setRenewMonths(1);
      setSelectedPromotion('');
      setPaymentMethod('TIEN_MAT');
    }
  }, [ticket]);

  // Calculate new expiration date
  const calculatedNewExpire = useMemo(() => {
    if (!ticket) return null;
    const oldExpire = ticket.expire_at ? new Date(ticket.expire_at) : null;
    const now = new Date();
    const baseDate = oldExpire && oldExpire.getTime() > now.getTime() ? oldExpire : now;
    const newDate = new Date(baseDate);
    newDate.setMonth(newDate.getMonth() + renewMonths);
    return newDate;
  }, [ticket, renewMonths]);

  // Recalculate amount with discounts
  useEffect(() => {
    if (ticket) {
      const basePrice = Number(ticket.unit_price || 0) * renewMonths;
      let finalPrice = basePrice;
      const promo = promotions.find((p) => p.id === selectedPromotion);
      if (promo) {
        const pct = (promo as any).discount_percent;
        const val = promo.discount_value;
        if (pct && pct > 0) {
          finalPrice -= (basePrice * pct) / 100;
        } else if (val && val > 0) {
          finalPrice -= Number(val);
        }
      }
      setRenewAmount(finalPrice > 0 ? Math.round(finalPrice) : 0);
    }
  }, [renewMonths, ticket, selectedPromotion, promotions]);

  if (!ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    const ticketSnapshot = ticket;

    try {
      setIsSubmitting(true);
      const res = await salesService.renewTicket(
        ticketSnapshot.id,
        renewMonths,
        renewAmount,
        paymentMethod,
        selectedPromotion
      );
      const renewedTicket: IssuedTicket = res?.data ?? ticketSnapshot;

      // Build synthetic Order for ReceiptPrintModal
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
            item_name: `Gia hạn ${renewMonths} tháng – ${
              ticketSnapshot.ticket_template_name || 'Vé Tháng'
            }`,
            quantity: renewMonths,
            unit_price: Number(ticketSnapshot.unit_price || 0),
            total_price: renewAmount,
            created_at: now,
            updated_at: now,
            created_by: localStorage.getItem('hpticket_username') || '',
            updated_by: '',
          },
        ],
      };

      toast.success('Gia hạn vé tháng thành công!');
      onClose();
      onSuccess(syntheticOrder, renewedTicket);
    } catch (error: any) {
      console.error('Error renewing ticket:', error);
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi gia hạn vé!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(ticket)}
      onClose={onClose}
      title="Gia Hạn Vé Tháng & Hội Viên"
      subtitle="Cộng dồn ngày sử dụng và cập nhật hạn mới"
      icon={<RotateCw className="w-5 h-5 text-emerald-600" />}
      onSubmit={handleSubmit}
      maxWidth="lg"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            loadingText="Đang xử lý..."
            icon={!isSubmitting ? <RotateCw className="w-4 h-4" /> : undefined}
          >
            Xác Nhận & Gia Hạn
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Customer Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Khách hàng:</span>
            <span className="font-bold text-slate-900 text-sm">
              {ticket.customer_name || 'Khách vãng lai'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Mã vé (QR):</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {ticket.qr_code_string}
            </span>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
            <span className="text-slate-500 font-medium">Hạn sử dụng hiện tại:</span>
            <span className="font-bold text-slate-800">
              {ticket.expire_at
                ? new Date(ticket.expire_at).toLocaleDateString('vi-VN')
                : ticket.valid_date || '—'}
            </span>
          </div>
        </div>

        {/* Preset Chips for Months */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Chọn Thời Gian Gia Hạn:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '+1 Tháng', months: 1 },
              { label: '+3 Tháng', months: 3 },
              { label: '+6 Tháng', months: 6 },
              { label: '+12 Tháng', months: 12 },
            ].map((preset) => (
              <button
                type="button"
                key={preset.months}
                onClick={() => setRenewMonths(preset.months)}
                className={`py-2 px-1 text-center font-bold rounded-xl transition border text-xs ${
                  renewMonths === preset.months
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/30'
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
          <div className="flex items-center justify-between p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-emerald-900">Hạn dùng mới sau khi gia hạn:</span>
            </div>
            <span className="font-black text-emerald-800 font-mono text-sm bg-white px-3 py-1 rounded-lg border border-emerald-300 shadow-xs">
              {calculatedNewExpire.toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}

        {/* Promotion / Voucher */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Chương Trình Khuyến Mãi / Voucher:
          </label>
          <select
            value={selectedPromotion}
            onChange={(e) => setSelectedPromotion(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-slate-50"
          >
            <option value="">Không áp dụng khuyến mãi</option>
            {promotions
              .filter((p) => {
                const isActive = p.is_active === true;
                const hasQuota =
                  p.quantity == null || p.used_count == null || p.used_count < p.quantity;
                return isActive && hasQuota;
              })
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {(p as any).discount_percent
                    ? ` (-${(p as any).discount_percent}%)`
                    : p.discount_value
                    ? ` (-${Number(p.discount_value).toLocaleString('vi-VN')}đ)`
                    : ''}
                </option>
              ))}
          </select>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">
            Hình Thức Thanh Toán:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Tiền mặt', value: 'TIEN_MAT' },
              { label: 'Chuyển khoản', value: 'CHUYEN_KHOAN' },
              { label: 'Thẻ POS', value: 'THE_TIN_DUNG' },
            ].map((pm) => (
              <button
                type="button"
                key={pm.value}
                onClick={() => setPaymentMethod(pm.value)}
                className={`py-2 px-2 text-center font-bold rounded-xl transition border text-xs ${
                  paymentMethod === pm.value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Checkout Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-2 shadow-inner">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Đơn giá gói ({renewMonths} tháng):</span>
            <span className="font-mono">
              {((ticket.unit_price || 0) * renewMonths).toLocaleString('vi-VN')} đ
            </span>
          </div>
          <div className="border-t border-slate-700/60 pt-2 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300 block">Khách phải trả:</span>
              <span className="text-[10px] text-emerald-300">Tổng thanh toán sau chiết khấu</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black font-mono text-amber-400">
                {renewAmount.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
