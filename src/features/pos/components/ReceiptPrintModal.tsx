import React from 'react';
import {
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { Order, IssuedTicket, PaymentMethod } from '../../../shared/types/hpticket';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { dbStore } from '../../../shared/data/mockDatabase';
import { API_BASE_URL } from '../../../api/apiConfig';

interface ReceiptPrintModalProps {
  order: Order;
  tickets: IssuedTicket[];
  customerName?: string;
  phoneNumber?: string;
  paymentMethod?: string;
  customerSourceName?: string;
  customerGroupName?: string;
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
  customerGroupName,
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
    (order.details || (order as any).items)?.reduce((acc: any, d: any) => acc + (d.quantity || 0), 0) ||
    tickets.length ||
    1;

  const PRINT_AGENT_URL = 'http://127.0.0.1:7788';

  const requestIdRef = React.useRef<string>(
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'REQ_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)
  );

  const [isPrinting, setIsPrinting] = React.useState<boolean>(false);
  const [printError, setPrintError] = React.useState<{ message: string; errorCode?: string } | null>(null);

  // In qua C# Print Agent (không dialog, chống in trùng).
  const printViaAgent = async (jobType: 'NORMAL' | 'REPRINT' = 'NORMAL', overrideRequestId?: string) => {
    setIsPrinting(true);
    setPrintError(null);

    const activeRequestId = overrideRequestId || (jobType === 'REPRINT'
      ? (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'REQ_REP_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8))
      : requestIdRef.current);

    const printPayload = {
      request_id: activeRequestId,
      order_code: order.order_code,
      job_type: jobType,
      parent_request_id: jobType === 'REPRINT' ? requestIdRef.current : undefined,
      print_data: {
        order_code: order.order_code,
        created_at: order.created_at ? new Date(order.created_at).toLocaleString('vi-VN') : '',
        customer_name: customerName,
        customer_type: (order as any).customer_group_name || customerGroupName || '',
        customer_phone: phoneNumber,
        cashier: localStorage.getItem('hpticket_fullname') || '',
        total_amount: order.total_amount,
        applied_discount_amount: order.discount_amount ?? (order.total_amount - order.final_amount),
        final_amount: order.final_amount,
        payment_method: order.payment_method ?? '',
        invoice_lookup_code: order.invoice_lookup_code ?? '',
        issued_qr_codes: tickets.map(t => t.qr_code_string).filter(Boolean),
        items: (order.details || (order as any).items || []).map((d: any) => ({
          item_name: d.item_name,
          quantity: d.quantity,
          unit_price: d.unit_price,
          total_price: d.total_price,
        })),
      }
    };

    try {
      const res = await fetch(`${PRINT_AGENT_URL}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printPayload),
        signal: AbortSignal.timeout(12000),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        setIsPrinting(false);
        // In thành công (hoặc trùng lặp đã in trước đó) -> hoàn tất và mở đơn mới
        onNewOrder();
        return;
      }

      // Xử lý lỗi từ PrintAgent (HTTP 503, 409...)
      const errMsg = data?.error || data?.message || `Máy in phản hồi lỗi (Mã HTTP: ${res.status})`;
      setPrintError({
        message: errMsg,
        errorCode: data?.errorCode || `HTTP_${res.status}`,
      });
    } catch (err: any) {
      setPrintError({
        message: 'Không kết nối được tới Print Agent (127.0.0.1:7788). Vui lòng kiểm tra HPTicket Windows Service đã chạy trên máy chưa.',
        errorCode: 'AGENT_OFFLINE',
      });
    } finally {
      setIsPrinting(false);
    }
  };

  React.useEffect(() => {
    const timer = setTimeout(() => {
      printViaAgent('NORMAL');
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Cảnh báo lỗi máy in & Tùy chọn hành động thủ công cho Thu ngân */}
      {printError && (
        <div className="no-print print:hidden fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center font-bold text-lg">⚠️</div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Không thể in vé tự động</h3>
                <p className="text-xs text-rose-600 font-semibold">{printError.errorCode || 'LỖI PHẦN CỨNG'}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-rose-50 border border-rose-100 rounded-xl p-3 leading-relaxed">
              {printError.message}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={isPrinting}
                onClick={() => printViaAgent('NORMAL', requestIdRef.current)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPrinting ? 'Đang gửi lại lệnh...' : '🔄 Thử lại lệnh in (cùng Request ID)'}
              </button>

              <button
                type="button"
                disabled={isPrinting}
                onClick={() => printViaAgent('REPRINT')}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                🎫 In lại vé mới (Kẹt giấy / Xin in lại)
              </button>

              <button
                type="button"
                onClick={() => {
                  setPrintError(null); // Đóng ngay popup cảnh báo để không lọt vào trang in
                  setTimeout(() => {
                    window.print();
                    onNewOrder();
                  }, 100);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                🖨️ In dự phòng bằng trình duyệt (Dialog)
              </button>

              <button
                type="button"
                onClick={() => onNewOrder()}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-medium text-center"
              >
                Bỏ qua và tiếp tục đơn mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vùng HTML in sẵn sàng cho @media print (chỉ dùng khi thu ngân chủ động in dự phòng) */}
      <div className="hidden print:block w-full">
        {/* Print-specific style override */}
        <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          /* Ẩn hoàn toàn tất cả modal, popup cảnh báo, header, navbar */
          .no-print, [class*="print:hidden"], header, aside, nav, [role="dialog"], .fixed {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
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
            const detailsList = order.details || (order as any).items || [];
            const orderDetail = detailsList.find((d: any) => d.item_id === tkt.ticket_template_id);
            const basePrice = orderDetail ? orderDetail.unit_price : 0;
            // Dùng giá trị xuất hóa đơn (Giá sau chiết khấu + Thuế) để in lên mặt vé
            const effectivePrice = orderDetail
              ? Math.round(Number(orderDetail.total_price) / (orderDetail.quantity || 1))
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
                  <img src={(() => {
                    const url = dbStore.companies?.[0]?.invoice_logo_url;
                    if (!url || url === '/logo.png') return "/hoang-phat-logo.jpg";
                    if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
                    return API_BASE_URL + url;
                  })()} alt="Logo" className="w-[200px] h-auto mx-auto object-contain mb-2 grayscale contrast-150 brightness-90" style={{ mixBlendMode: 'multiply' }} />
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

                {/* Footer Info */}
                <div className="text-center text-[13px] space-y-0.5 px-1 mt-2">
                  <div>Tra cứu hóa đơn điện tử: https://vinvoice.viettel.vn/utilities/invoice-search</div>
                  <div>Mã tra cứu: <span className="font-bold">{order.invoice_lookup_code || ''}</span></div>
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
            <div className="text-center space-y-0 mb-1.5 pt-1 print:pt-1">
              <img src={(() => {
                const url = dbStore.companies?.[0]?.invoice_logo_url;
                if (!url || url === '/logo.png') return "/hoang-phat-logo.jpg";
                if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
                return API_BASE_URL + url;
              })()} alt="Logo" className="w-[200px] h-auto mx-auto object-contain mb-2 grayscale contrast-150 brightness-90" style={{ mixBlendMode: 'multiply' }} />
              <div className="font-bold text-[17px] uppercase tracking-wide mb-1">KHU DU LỊCH EO GIÓ</div>
            </div>
            <div className="text-center text-[15px] font-bold mb-4">HÓA ĐƠN THANH TOÁN</div>

            <div className="text-[13px] mb-3 space-y-1">
              <div>Mã HĐ: <span className="font-bold">{order.order_code}</span></div>
              <div>Ngày: {new Date(order.created_at).toLocaleString('vi-VN')}</div>
              <div>Khách hàng: {customerName}</div>
              {((order as any).customer_group_name || customerGroupName) && (
                <div>Nhóm khách: <span className="font-bold uppercase">{(order as any).customer_group_name || customerGroupName}</span></div>
              )}
              <div>Thu ngân: {localStorage.getItem('hpticket_fullname') || order.created_by || 'Admin'}</div>
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
                  {(order.details || (order as any).items || []).map((d: any, i: any) => (
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

            <div className="text-center text-[13px] space-y-0.5 mt-3 pt-3 border-t border-dashed border-slate-300">
              <div>Tra cứu hóa đơn điện tử tại:</div>
              <div className="font-sans text-[11px] break-words">https://vinvoice.viettel.vn/utilities/invoice-search</div>
              <div>Mã tra cứu: <span className="font-bold">{order.invoice_lookup_code || ''}</span></div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
