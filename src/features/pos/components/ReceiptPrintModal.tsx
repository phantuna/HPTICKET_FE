import React from 'react';
import {
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Order, IssuedTicket, PaymentMethod } from '../../../shared/types/hpticket';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';

interface ReceiptPrintModalProps {
  order: Order;
  tickets: IssuedTicket[];
  customerName?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  customerSourceName?: string;
  groupDiscountNote?: string;
  groupDiscountAmount?: number;
  promoDiscountNote?: string;
  promoDiscountAmount?: number;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  order,
  tickets,
  customerName = 'Khách mua tại quầy POS',
  phoneNumber = '0988123456',
  customerSourceName = 'Khách vãng lai',
  groupDiscountNote = '',
  groupDiscountAmount = 0,
  promoDiscountNote = '',
  promoDiscountAmount = 0,
  onClose,
  onNewOrder,
}) => {
  const dateObj = new Date();
  const totalDiscount = (order.total_amount || 0) - (order.final_amount || 0);
  const defaultQrValue =
    tickets[0]?.qr_code_string ||
    order.invoice_lookup_code;

  const displayTickets = tickets || [];

  const totalQuantity =
    order.details?.reduce((acc, d) => acc + (d.quantity || 0), 0) ||
    tickets.length ||
    1;

  React.useEffect(() => {
    const handleAfterPrint = () => {
      onNewOrder();
    };

    const timer = setTimeout(() => {
      window.print();
    }, 100);

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onNewOrder]);

  return (
    <div className="fixed -left-[9999px] top-0 print:static print:left-auto">
      {/* Print-specific style override */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          .no-print, header, aside, nav {
            display: none !important;
          }
          html, body, #root, main {
            background: white !important;
            height: auto !important;
            width: 100% !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            position: static !important;
          }
          .fixed, .absolute, .sticky, [class*="max-h-"], [class*="overflow-"] {
            position: static !important;
            overflow: visible !important;
            max-height: none !important;
            max-width: none !important;
            height: auto !important;
            width: 100% !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #receipt-print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: white !important;
            visibility: visible !important;
          }
        }
      `}</style>

      {/* Printable Area Container - Thermal POS K80 / 80mm */}
      <div id="receipt-print-area" className="w-full">
          {displayTickets.map((tkt, idx) => {
            const isUnlimited = tkt.allowed_passes === 999999 || tkt.allowed_passes === -1 ||
              (tkt as any).ticket_type === 'UNLIMITED' ||
              tkt.ticket_template_name?.toLowerCase().includes('tháng') ||
              tkt.ticket_template_name?.toLowerCase().includes('gia đình');

            let ticketQty = 1;
            if (tkt.allowed_passes && tkt.allowed_passes > 1 && !isUnlimited) {
              ticketQty = tkt.allowed_passes;
            }

            // Find unit price from order details if available
            const orderDetail = order.details?.find(d => d.item_id === tkt.ticket_template_id);
            const basePrice = orderDetail ? orderDetail.unit_price : 0;
            const effectivePrice = orderDetail && orderDetail.pre_tax_price 
              ? Math.round(Number(orderDetail.pre_tax_price) + Number(orderDetail.tax_amount || 0)) 
              : basePrice;
            const qrCode = tkt.qr_code_string || defaultQrValue;

            return (
              <div 
                key={tkt.id || idx} 
                className="bg-white mx-auto text-black font-sans w-full max-w-[300px] sm:max-w-[320px] pb-6 mb-6 border-b-2 border-dashed border-slate-300 print:border-none print:mb-0 print:pb-0"
                style={{ pageBreakAfter: 'always' }}
              >
                {/* Header */}
                <div className="text-center space-y-0 mb-1.5 pt-1 print:pt-1">
                  <div className="font-bold text-[16px] uppercase tracking-wide">KHU DU LỊCH EO GIÓ</div>
                  <div className="text-[12px]">Mã số thuế: 0100109106-501</div>
                  <div className="text-[12px]">Eo Gió, Quy Nhơn</div>
                </div>

                <div className="text-center font-bold text-xl uppercase mb-2 tracking-wider">
                  VÉ VÀO CỬA
                </div>

                {/* Details */}
                <div className="text-center text-[13px] leading-tight px-1 mb-2 space-y-1">
                  <div>Loại vé: <span className="font-bold text-[14px]">{(tkt.ticket_template_code || tkt.ticket_template_name || 'VÉ VUI CHƠI').replace(/\s*\(.*?\)/g, '').trim()}</span></div>
                  <div>Mã vé: <span className="italic text-[12px]">{qrCode}</span></div>
                  <div>Số HĐ: <span className="italic text-[12px]">{order.invoice_code || order.order_code}</span></div>
                  <div>Ngày tạo: <span className="italic text-[12px]">{new Date(tkt.created_at || order.created_at || new Date().toISOString()).toLocaleString('vi-VN')}</span></div>
                  <div>Ngày hiệu lực: {dateObj.toLocaleDateString('vi-VN')}</div>
                  <div>Số lượt quét: <span className="font-bold text-[14px]">{isUnlimited ? 'VÔ HẠN' : ticketQty}</span></div>
                </div>

                {/* QR Code */}
                <div className="flex justify-center mb-1.5">
                  <div className="p-0">
                     <QRCodeDisplay value={tkt.qr_display || qrCode} size={125} />
                  </div>
                </div>

                <div className="text-center text-[12px] font-medium mb-1 px-2">
                  Vé chỉ có hiệu lực trong ngày in trên vé
                </div>

                <div className="flex justify-between items-center px-1 font-bold text-[14px] mb-2">
                  <span>Thành tiền</span>
                  <span>{effectivePrice.toLocaleString('vi-VN')}</span>
                </div>

                {/* Footer Info - Always show for e-ticket */}
                <div className="text-center text-[13px] space-y-0.5 px-1 mt-2">
                  <div>Tra cứu hóa đơn: https://vinvoice.viettel.vn/utilities/invoice-search</div>
                  <div>Mã tra cứu: {order.invoice_lookup_code && <span className="font-bold">{order.invoice_lookup_code}</span>}</div>
                </div>

                <div className="text-center text-[13px] mt-2 space-y-0.5 px-2 pb-1 leading-tight">
                  <div>Chỉ có giá trị xuất hoá đơn trong ngày</div>
                  <div className="font-sans italic text-[11px] mb-1">Valid for invoice issuance on the same day only</div>
                  <div className="font-bold text-[14px]">Vé đã xuất không được hoàn trả.</div>
                  <div className="font-sans italic text-[11px]">Issued tickets are non-refundable.</div>
                </div>
              </div>
            );
          })}

          {/* HÓA ĐƠN THANH TOÁN (Itemized Receipt) */}
          <div className="bg-white mx-auto text-black font-sans w-full max-w-[300px] sm:max-w-[320px] pb-6 pt-6 print:mb-0 print:pb-0 print:pt-8">
             <div className="text-center font-bold text-[17px] uppercase mb-1">KHU DU LỊCH EO GIÓ</div>
             <div className="text-center text-[15px] font-bold mb-4">HÓA ĐƠN THANH TOÁN</div>
             
             <div className="text-[13px] mb-3 space-y-1">
               <div>Mã HĐ: <span className="font-bold">{order.order_code}</span></div>
               <div>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</div>
               <div>Khách hàng: {customerName}</div>
               <div>Thu ngân: {order.created_by || 'Admin'}</div>
             </div>

             <div className="border-t border-b border-dashed border-slate-400 py-2 mb-3">
               <table className="w-full text-[13px]">
                  <thead>
                    <tr className="font-bold border-b border-dashed border-slate-300">
                      <th className="text-left pb-1">Tên món</th>
                      <th className="text-center pb-1">SL</th>
                      <th className="text-right pb-1">Đơn giá</th>
                      <th className="text-right pb-1">T.Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.details?.map((d, i) => (
                      <tr key={i}>
                        <td className="py-1 pr-1 truncate max-w-[120px]">{d.item_name}</td>
                        <td className="text-center py-1">{d.quantity}</td>
                        <td className="text-right py-1">{d.unit_price.toLocaleString('vi-VN')}</td>
                        <td className="text-right py-1 font-bold">{d.total_price.toLocaleString('vi-VN')}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>

             <div className="text-[13px] space-y-1 mb-3">
               <div className="flex justify-between">
                 <span>Cộng tiền hàng:</span>
                 <span>{Math.round(order.total_amount).toLocaleString('vi-VN')}</span>
               </div>
               {(order.discount_amount || (order.total_amount - order.final_amount)) > 0 && (
                 <div className="flex justify-between text-rose-600 font-medium">
                   <span>Chiết khấu:</span>
                   <span>-{Math.round(order.discount_amount || (order.total_amount - order.final_amount)).toLocaleString('vi-VN')}</span>
                 </div>
               )}
               <div className="flex justify-between">
                 <span>Trị giá trước thuế:</span>
                 <span>{order.total_pre_tax_amount ? Math.round(order.total_pre_tax_amount).toLocaleString('vi-VN') : Math.round(order.final_amount / 1.08).toLocaleString('vi-VN')}</span>
               </div>
               <div className="flex justify-between">
                 <span>Tiền thuế VAT:</span>
                 <span>{order.total_tax_amount ? Math.round(order.total_tax_amount).toLocaleString('vi-VN') : Math.round(order.final_amount - (order.final_amount / 1.08)).toLocaleString('vi-VN')}</span>
               </div>
             </div>

             <div className="border-t border-slate-800 pt-2 mb-4">
               <div className="flex justify-between font-bold text-[16px]">
                 <span>Tổng thanh toán:</span>
                 <span>{Math.round(order.final_amount).toLocaleString('vi-VN')} đ</span>
               </div>
             </div>

             <div className="text-center text-[12px] italic space-y-0.5 mt-4">
               <div>Cảm ơn quý khách và hẹn gặp lại!</div>
               <div>Hotline: 1900 6868</div>
             </div>
          </div>

        </div>
    </div>
  );
};
