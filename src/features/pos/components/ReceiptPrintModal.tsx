import React from 'react';
import { createPortal } from 'react-dom';
import {
  Printer,
  CheckCircle2,
  X,
} from 'lucide-react';
import { Order, IssuedTicket, Company } from '../../../shared/types/hpticket';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { dbStore } from '../../../shared/data/mockDatabase';
import { API_BASE_URL } from '../../../api/apiConfig';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';
import html2canvas from 'html2canvas';

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
  printTicketsOnly?: boolean;
  invoiceRequested?: boolean;
  onClose: () => void;
  onNewOrder: () => void;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  order,
  tickets,
  customerName: propCustomerName,
  phoneNumber: propPhoneNumber,
  customerSourceName: propCustomerSourceName,
  customerGroupName: propCustomerGroupName,
  groupDiscountNote = '',
  groupDiscountAmount = 0,
  promoDiscountNote = '',
  promoDiscountAmount = 0,
  printTicketsOnly = false,
  invoiceRequested = false,
  onClose,
  onNewOrder,
}) => {
  const dateObj = new Date();

  // Trích xuất thông tin khách hàng, số điện thoại, nhóm khách, nguồn khách từ DB hoặc props (không hardcode fallback)
  const effectiveCustomerName = propCustomerName || (order as any).booker_name || (order as any).customer_name || tickets?.[0]?.customer_name || '';
  const effectivePhoneNumber = propPhoneNumber || (order as any).customer_phone || tickets?.[0]?.customer_phone || '';
  const effectiveCustomerGroupName = propCustomerGroupName || (order as any).customer_group_name || tickets?.[0]?.customer_group_name || '';
  const effectiveCustomerSourceName = propCustomerSourceName || (order as any).customer_source_name || '';
  const cashierName = (order as any).created_by || localStorage.getItem('hpticket_fullname') || 'admin';
  const defaultQrValue =
    tickets?.[0]?.qr_code_string ||
    (tickets?.[0] as any)?.qr_display ||
    order.invoice_lookup_code ||
    order.order_code;

  // 1. Phân loại loại sản phẩm trong đơn hàng
  const orderDetails = order.details || (order as any).items || [];

  // Đơn hàng có vé tham quan không:
  const hasTickets = (order as any).has_tickets ?? (
    (tickets && tickets.length > 0) ||
    orderDetails.some((d: any) => d.item_type === 'TICKET' || d.ticket_template_id || (!d.item_type && !d.product_id))
  );

  // Đơn hàng có đồ uống / món ăn / hàng hóa F&B không:
  const hasProducts = (order as any).has_products ?? (
    orderDetails.some((d: any) => d.item_type === 'PRODUCT' || Boolean(d.product_id))
  );

  // Người dùng hoặc thu ngân có chọn "Xuất hóa đơn điện tử" không, hoặc đơn hàng đã được xuất hóa đơn:
  const isInvoiceRequested = Boolean(
    invoiceRequested ||
    order.invoice_status === 'IMMEDIATE' ||
    order.invoice_status === 'ISSUED' ||
    order.invoice_status === 'ISSUED_BULK' ||
    (order as any).invoiceStatus === 'IMMEDIATE' ||
    (order as any).invoiceStatus === 'ISSUED' ||
    (order as any).invoiceStatus === 'ISSUED_BULK' ||
    Boolean(order.invoice_number) ||
    Boolean((order as any).invoiceNumber) ||
    Boolean(order.invoice_lookup_code) ||
    Boolean((order as any).invoiceLookupCode) ||
    Boolean((order as any).company_tax_code) ||
    Boolean((order as any).companyTaxCode) ||
    Boolean((order as any).company_name) ||
    Boolean((order as any).companyName)
  );

  // QUY TẮC NGHIỆP VỤ IN ẤN:
  // 1. Khách mua đồ uống / hàng hóa -> BẮT BUỘC in Hóa đơn thanh toán (bill tính tiền đồ uống)
  // 2. Khách mua vé tham quan:
  //    - Có chọn "Xuất hóa đơn điện tử" hoặc vé ĐÃ XUẤT HÓA ĐƠN -> In cả Thẻ vé có QR VÀ Hóa đơn thanh toán
  //    - Không chọn "Xuất hóa đơn điện tử" -> CHỈ in Thẻ vé có QR (tiết kiệm giấy nhiệt, quét vào cổng ngay)
  // 3. Khách mua kết hợp (cả vé và đồ uống) -> In Thẻ vé QR (cho vé) VÀ in Hóa đơn thanh toán (cho đồ uống & tổng đơn)
  // 4. Nếu đơn hàng không có vé nào (chỉ mua đồ uống) -> Chắc chắn chỉ in Hóa đơn thanh toán
  const shouldPrintInvoice = !printTicketsOnly && (hasProducts || isInvoiceRequested || !hasTickets);

  const displayTickets = React.useMemo(() => {
    // Nếu đơn hàng chỉ mua đồ uống/sản phẩm (không có vé), không sinh vé QR thừa
    if (!hasTickets) return [];
    if (tickets && tickets.length > 0) return tickets;
    // Dự phòng an toàn: nếu tickets rỗng nhưng có item vé, trích xuất từ order.details
    const details = order.details || (order as any).items || [];
    const fallbackList: IssuedTicket[] = [];
    details.forEach((d: any, idx: number) => {
      // Chỉ tạo vé cho mặt hàng loại VÉ (TICKET)
      if (d.item_type === 'PRODUCT' || d.product_id) return;
      const qty = d.quantity || 1;
      for (let i = 0; i < qty; i++) {
        fallbackList.push({
          id: `tkt-${order.order_code}-${idx}-${i}`,
          order_id: order.id || '',
          ticket_template_id: d.item_id || '',
          ticket_template_name: d.item_name || 'VÉ VÀO CỬA',
          ticket_template_code: d.item_code || '',
          qr_code_string: order.invoice_lookup_code || `${order.order_code}-${idx + 1}-${i + 1}`,
          qr_display: order.invoice_lookup_code || `${order.order_code}-${idx + 1}-${i + 1}`,
          allowed_passes: 1,
          used_passes: 0,
          status: 'VALID',
          created_at: order.created_at || new Date().toISOString(),
          unit_price: d.unit_price || 0,
          customer_name: effectiveCustomerName,
          customer_phone: effectivePhoneNumber,
          customer_group_name: effectiveCustomerGroupName,
        } as any);
      }
    });
    return fallbackList;
  }, [hasTickets, tickets, order, effectiveCustomerName, effectivePhoneNumber, effectiveCustomerGroupName]);

  const shouldPrintTickets = hasTickets && displayTickets.length > 0;

  const [company, setCompany] = React.useState<Company | null>(() => dbStore.companies?.[0] || null);

  // 1. Tải thông tin công ty từ API CSDL
  React.useEffect(() => {
    marketingService.fetchCompanies().then((res) => {
      if (res.data && res.data.length > 0) {
        setCompany(res.data[0]);
      }
    }).catch((err) => {
      console.warn('[ReceiptPrintModal] Fetch companies failed:', err);
    });
  }, []);

  // 2. Kích hoạt in ảnh DOM trực tiếp qua Local C# Print Agent (127.0.0.1:7788)
  const [isPrinting, setIsPrinting] = React.useState(false);
  const [printStatusText, setPrintStatusText] = React.useState('Đang chuẩn bị in...');

  // Ref khóa chống gửi trùng lặp & ổn định request_id cho SQLite idempotency
  const printRunIdRef = React.useRef<string>(`PRINT_${order.order_code}_${Date.now()}`);
  const hasTriggeredRef = React.useRef<boolean>(false);
  const onNewOrderRef = React.useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  // Chờ tất cả ảnh (như logo) bên trong container tải xong để html2canvas không bị thiếu hình
  const waitForImages = async (container: HTMLElement) => {
    const imgs = Array.from(container.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );
  };

  // Chụp từng thẻ vé / hóa đơn thành mảng ảnh Base64 PNG chuẩn K80
  const captureCardsAsImages = async (): Promise<string[]> => {
    const portal = document.getElementById('receipt-print-portal');
    if (!portal) return [];

    await waitForImages(portal);

    const cards = portal.querySelectorAll<HTMLElement>('.receipt-ticket-card');
    if (!cards || cards.length === 0) return [];

    const images: string[] = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      try {
        const canvas = await html2canvas(card, {
          scale: 2, // Độ phân giải x2 giúp nét chữ và mã QR sắc nét vượt trội
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: (clonedDoc) => {
            // 1. Chèn thẻ <style> cưỡng chế màu HEX chuẩn cho toàn bộ thẻ in trong DOM nhân bản
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              #receipt-print-portal, #receipt-print-portal *, .receipt-ticket-card, .receipt-ticket-card * {
                border-color: #000000 !important;
                color: #000000 !important;
                outline-color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }
              .receipt-ticket-card {
                background-color: #ffffff !important;
              }
            `;
            (clonedDoc.head || clonedDoc.body).appendChild(style);

            // 2. Làm sạch bất kỳ style inline nào có thể chứa hàm oklch
            const allElements = clonedDoc.querySelectorAll('#receipt-print-portal *');
            allElements.forEach((node) => {
              const el = node as HTMLElement;
              if (el && el.style) {
                if (el.style.color && el.style.color.includes('oklch')) {
                  el.style.color = '#000000';
                }
                if (el.style.borderColor && el.style.borderColor.includes('oklch')) {
                  el.style.borderColor = '#000000';
                }
                if (el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) {
                  el.style.backgroundColor = '#ffffff';
                }
              }
            });
          },
        });
        const dataUrl = canvas.toDataURL('image/png');
        images.push(dataUrl);
      } catch (err) {
        console.error(`[ReceiptPrintModal] Lỗi chụp thẻ in ${i}:`, err);
      }
    }
    return images;
  };

  const printDirectlyViaAgent = async (): Promise<boolean> => {
    try {
      setPrintStatusText('Đang chụp giao diện vé...');
      const capturedImages = await captureCardsAsImages();
      if (!capturedImages || capturedImages.length === 0) {
        console.warn('[ReceiptPrintModal] Không chụp được ảnh thẻ nào.');
        return false;
      }

      setPrintStatusText('Đang gửi lệnh in tới máy in nhiệt C#...');
      const isTicketMode = shouldPrintTickets && displayTickets.length > 0;
      const firstTkt = displayTickets[0];
      const expiryDateStr = firstTkt?.expire_at
        ? new Date(firstTkt.expire_at).toLocaleDateString('vi-VN')
        : (firstTkt?.valid_date ? new Date(firstTkt.valid_date).toLocaleDateString('vi-VN') : dateObj.toLocaleDateString('vi-VN'));

      const qrCodeVal = firstTkt ? (
        firstTkt.qr_display ||
        firstTkt.qr_code_string ||
        (firstTkt as any)?.qrCode ||
        (firstTkt as any)?.ticket_code ||
        defaultQrValue ||
        order.invoice_lookup_code ||
        order.order_code
      ) : (order.invoice_lookup_code || order.order_code);

      const payload = {
        order_code: order.order_code,
        request_id: printRunIdRef.current,
        job_type: 'IMAGE',
        images: capturedImages, // Mảng ảnh Base64 của từng thẻ vé & hóa đơn
        company_name: companyDisplayName || 'BAN QUAN LY VIETTELPOST',
        company_tax_code: company?.tax_code || '',
        company_address: company?.address || '',
        customer_name: effectiveCustomerName || 'KHACH LE',
        customer_phone: effectivePhoneNumber || '',
        final_amount: order.final_amount,
        total_amount: order.total_amount,
        cashier: cashierName,
        is_ticket: isTicketMode ? 'true' : 'false',
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s cho truyền và in ảnh raster

      const res = await fetch('http://127.0.0.1:7788/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData?.errorCode === 'LICENSE_INVALID') {
          toast.error(errData.error || 'Máy in bị khóa do bản quyền không hợp lệ!');
        }
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[ReceiptPrintModal] Kết nối C# Print Agent thất bại, fallback in trình duyệt:', err);
      return false;
    }
  };

  // 3. Kích hoạt in: Ưu tiên in trực tiếp qua Local Print Agent C#, fallback qua window.print()
  const triggerPrint = async (force: boolean = false) => {
    if (isPrinting) return;
    if (!force && hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    if (force) {
      printRunIdRef.current = `PRINT_${order.order_code}_${Date.now()}`;
    }

    setIsPrinting(true);
    try {
      const directSuccess = await printDirectlyViaAgent();
      if (directSuccess) {
        toast.success('Đã in thành công tới máy in nhiệt!');
        setIsPrinting(false);
        onNewOrderRef.current();
        return;
      }
      // Fallback: Mở hộp thoại in trình duyệt nếu chưa bật C# Print Agent
      setPrintStatusText('Đang mở hộp thoại in trình duyệt...');
      window.print();
    } catch {
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  React.useEffect(() => {
    let isCancelled = false;

    const handleAfterPrint = () => {
      onNewOrderRef.current();
    };

    window.addEventListener('afterprint', handleAfterPrint);

    // Chờ 350ms cho DOM và mã QR canvas render hoàn chỉnh trước khi chụp ảnh
    const timer = setTimeout(async () => {
      if (isCancelled || hasTriggeredRef.current) return;
      await triggerPrint();
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Hàm chuẩn hóa URL logo từ CSDL
  const resolveLogoUrl = (rawUrl?: string): string | null => {
    if (!rawUrl || rawUrl === '/logo.png') return null;
    if (rawUrl.startsWith('http') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
    return API_BASE_URL + rawUrl;
  };

  const invoiceLogo = resolveLogoUrl(company?.invoice_logo_url) || '/hoang-phat-logo.jpg';

  const companyDisplayName = 'BAN QUAN LY ' + (company?.code || '');

  // Render 1 logo duy nhất dành cho hóa đơn từ company.invoice_logo_url
  const renderHeaderLogo = () => {
    return (
      <div className="flex justify-center mb-2.5">
        <img
          src={invoiceLogo}
          alt="Logo"
          className="w-[170px] max-w-[75%] h-auto mx-auto object-contain grayscale contrast-150 brightness-90"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>
    );
  };

  return (
    <>
      {/* Thông báo tiến trình in trên màn hình POS (tự động ẩn khi in giấy) */}
      <div className="no-print print:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-slate-800 border border-slate-200">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
              <Printer className={`w-5 h-5 ${isPrinting ? 'animate-pulse' : ''}`} />
              <span>{printStatusText}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-xs text-slate-600 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div><strong>Mã đơn hàng:</strong> <span className="font-mono">{order.order_code}</span></div>
            <div><strong>Khách hàng:</strong> {effectiveCustomerName || 'Khách lẻ'}</div>
            <div><strong>Tổng thanh toán:</strong> <span className="font-bold text-emerald-700">{Math.round(order.final_amount).toLocaleString('vi-VN')} đ</span></div>
            <div className="pt-1 border-t border-slate-200/60 text-[11px]">
              <span className="text-slate-500 block mb-0.5 font-medium">Phiếu in:</span>
              {shouldPrintTickets && shouldPrintInvoice ? (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {displayTickets.length} Thẻ vé QR +  1 Hóa đơn
                </span>
              ) : shouldPrintTickets ? (
                <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {displayTickets.length} Thẻ vé QR (Không lấy HĐ)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  1 Hóa đơn thanh toán
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isPrinting}
              onClick={() => triggerPrint(true)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4" /> {isPrinting ? 'Đang gửi in...' : 'Bấm vào đây để in lại'}
            </button>

            <button
              type="button"
              onClick={onNewOrder}
              className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold text-center border-t border-slate-100 pt-3"
            >
              Hoàn tất / Đóng cửa sổ in
            </button>
          </div>
        </div>
      </div>

      {/* Vùng HTML in ra máy in nhiệt K80 / 80mm (@media print & html2canvas capture) */}
      {typeof document !== 'undefined' && createPortal(
        <div
          id="receipt-print-portal"
          className="fixed -left-[9999px] top-0 pointer-events-none z-[-9999] bg-white print:static print:left-auto print:top-auto print:pointer-events-auto print:z-auto print:block w-[380px]"
          style={{ width: '380px' }}
        >
          {/* CSS chuẩn in nhiệt 80mm chống tràn lề, chống trang trắng, triệt để cô lập nội dung in */}
          <style>{`
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              * {
                box-sizing: border-box !important;
              }
              /* ẨN TRIỆT ĐỂ TOÀN BỘ WEBSITE (#root, sidebar, tables, background) */
              body > *:not(#receipt-print-portal) {
                display: none !important;
                height: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                visibility: hidden !important;
                opacity: 0 !important;
              }
              .no-print, [class*="print:hidden"], header, aside, nav, [role="dialog"] {
                display: none !important;
                visibility: hidden !important;
              }
              html, body {
                background: white !important;
                height: auto !important;
                width: 80mm !important;
                max-width: 80mm !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
                position: static !important;
              }
              #receipt-print-portal {
                display: block !important;
                position: static !important;
                left: auto !important;
                top: auto !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                visibility: visible !important;
              }
              #receipt-print-area {
                display: block !important;
                width: 80mm !important;
                max-width: 80mm !important;
                margin: 0 auto !important;
                padding: 0 !important;
                background: white !important;
                visibility: visible !important;
                box-sizing: border-box !important;
              }
              .receipt-ticket-card {
                width: 72mm !important;
                max-width: 72mm !important;
                margin: 0 auto !important;
                padding: 2mm 3mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                word-break: break-word !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}</style>

          {/* Container máy in POS 80mm */}
          <div id="receipt-print-area" className="w-full">
          {/* 1. CÁC TỜ PHIẾU VÉ (Mỗi vé một trang in riêng) */}
          {shouldPrintTickets && displayTickets.map((tkt, idx) => {
            const isUnlimited = tkt.allowed_passes === 999999 || tkt.allowed_passes === -1 ||
              (tkt as any).ticket_type === 'UNLIMITED' ||
              tkt.ticket_template_name?.toLowerCase().includes('tháng') ||
              tkt.ticket_template_name?.toLowerCase().includes('gia đình');

            let ticketQty = 1;
            if (tkt.allowed_passes && tkt.allowed_passes > 1 && !isUnlimited) {
              ticketQty = tkt.allowed_passes;
            }

            const detailsList = order.details || (order as any).items || [];
            const orderDetail = detailsList.find((d: any) => d.item_id === tkt.ticket_template_id);
            const basePrice = orderDetail ? orderDetail.unit_price : (tkt.unit_price || 0);
            const effectivePrice = orderDetail
              ? Math.round(Number(orderDetail.total_price) / (orderDetail.quantity || 1))
              : basePrice;

            const qrCode =
              tkt.qr_display ||
              tkt.qr_code_string ||
              (tkt as any).qrCode ||
              (tkt as any).ticket_code ||
              defaultQrValue ||
              order.invoice_lookup_code ||
              order.order_code;

            const ticketTitle = (
              tkt.ticket_template_name?.toLowerCase().includes('tháng')
                ? 'THẺ VÉ THÁNG'
                : (tkt.ticket_template_name || tkt.ticket_template_code || 'VÉ VÀO CỬA')
            ).toUpperCase().replace(/\s*\(.*?\)/g, '').trim();

            const expiryDateStr = tkt.expire_at
              ? new Date(tkt.expire_at).toLocaleDateString('vi-VN')
              : (tkt.valid_date ? new Date(tkt.valid_date).toLocaleDateString('vi-VN') : dateObj.toLocaleDateString('vi-VN'));

            return (
              <div
                key={tkt.id || idx}
                className="receipt-ticket-card bg-white mx-auto text-black font-sans w-[380px] max-w-[380px] px-3 pb-4 pt-2 print:border-none print:mb-0 print:pb-0 box-border overflow-hidden"
                style={{ pageBreakAfter: (shouldPrintInvoice || idx < displayTickets.length - 1) ? 'always' : 'auto' }}
              >
                {/* Header vé */}
                <div className="mb-4 pt-1 print:pt-1">
                  {renderHeaderLogo()}
                  <div className="text-left px-1.5 space-y-0.5">
                    <div className="font-bold text-[15px] uppercase tracking-wide">
                      {'BAN QUAN LY ' + (company?.code || '')}
                    </div>
                    {company?.tax_code && (
                      <div className="text-[12px]">
                        Mã số thuế: {company.tax_code}
                      </div>
                    )}
                    {company?.address && (
                      <div className="text-[12px] leading-tight">
                        Địa chỉ: {company.address}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center font-bold text-[18px] uppercase mb-2.5 tracking-wider">
                  {ticketTitle}
                </div>

                {/* Chi tiết vé */}
                <div className="text-center text-[13px] leading-tight px-1 mb-2 space-y-1">
                  <div>Loại vé: <span className="font-bold text-[14px]">{(tkt.ticket_template_code || tkt.ticket_template_name || orderDetail?.item_name || 'VE NGUOI LON').replace(/\s*\(.*?\)/g, '').trim()}</span></div>
                  <div>Mã vé: <span className="italic text-[12px]">{qrCode}</span></div>
                  <div>Số HĐ: <span className="italic text-[12px]">{order.invoice_code || order.order_code}</span></div>
                  <div>Ngày tạo: <span className="italic text-[12px]">{new Date(tkt.created_at || order.created_at || new Date().toISOString()).toLocaleString('vi-VN')}</span></div>
                  <div>Hạn sử dụng: <span className="font-bold">{expiryDateStr}</span></div>
                  {(tkt.customer_name || effectiveCustomerName) && (
                    <div>Khách hàng: <span className="font-bold">{tkt.customer_name || effectiveCustomerName}</span></div>
                  )}
                  <div>Số lượt quét: <span className="font-bold text-[14px]">{isUnlimited ? 'VÔ HẠN' : ticketQty}</span></div>
                </div>

                {/* Mã QR Code sắc nét kèm mã vé bên dưới */}
                <div className="flex justify-center mb-1">
                  <div className="p-0">
                    <QRCodeDisplay value={tkt.qr_display || qrCode} size={145} showText={true} />
                  </div>
                </div>

                <div className="text-center text-[12px] font-medium mb-1 px-2">
                  Vé có giá trị đến ngày {expiryDateStr}
                </div>

                <div className="flex justify-between items-center px-1 font-bold text-[14px] mb-2">
                  <span>Thành tiền</span>
                  <span>{effectivePrice.toLocaleString('vi-VN')}</span>
                </div>

                {/* Tra cứu hóa đơn điện tử */}
                <div className="text-center text-[13px] space-y-0.5 px-1 mt-2">
                  <div>Tra cứu hóa đơn điện tử:</div>
                  <div className="font-sans text-[11px] break-words">https://vinvoice.viettel.vn/utilities/invoice-search</div>
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

          {/* 2. HÓA ĐƠN THANH TOÁN (Itemized Receipt) */}
          {shouldPrintInvoice && (
            <div
              className="receipt-ticket-card receipt-invoice-card bg-white mx-auto text-black font-sans w-[380px] max-w-[380px] px-3 pb-4 pt-3 print:mb-0 print:pb-0 print:pt-4 box-border overflow-hidden"
              style={{ pageBreakAfter: 'auto' }}
            >
              <div className="mb-4 pt-1 print:pt-1">
                {renderHeaderLogo()}
                <div className="text-left px-1.5 space-y-0.5">
                  <div className="font-bold text-[15px] uppercase tracking-wide">
                    {'BAN QUAN LY ' + (company?.code || '')}
                  </div>
                  {company?.tax_code && (
                    <div className="text-[12px]">
                      Mã số thuế: {company.tax_code}
                    </div>
                  )}
                  {company?.address && (
                    <div className="text-[12px] leading-tight">
                      Địa chỉ: {company.address}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-[16px] font-bold mb-3.5">HÓA ĐƠN THANH TOÁN</div>

              <div className="text-[13px] mb-3 space-y-1">
                <div>Mã HĐ: <span className="font-bold">{order.order_code}</span></div>
                <div>Ngày: {new Date(order.created_at || new Date().toISOString()).toLocaleString('vi-VN')}</div>
                <div>Khách hàng: {effectiveCustomerName || 'Khách lẻ'}</div>
                {effectiveCustomerGroupName && (
                  <div>Nhóm khách: <span className="font-bold uppercase">{effectiveCustomerGroupName}</span></div>
                )}
                <div>Thu ngân: {cashierName || 'admin'}</div>
              </div>

              <div className="border-t border-b border-dashed border-black py-2 mb-3" style={{ borderColor: '#000000' }}>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="font-bold border-b border-dashed border-black" style={{ borderColor: '#000000' }}>
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
                        <td className="text-right py-1">{Number(d.unit_price).toLocaleString('vi-VN')}</td>
                        <td className="text-right py-1 font-bold">{Number(d.total_price).toLocaleString('vi-VN')}</td>
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
                  <div className="flex justify-between font-bold" style={{ color: '#000000' }}>
                    <span>Chiết khấu:</span>
                    <span>-{Math.round(order.discount_amount || (order.total_amount - order.final_amount)).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Trị giá trước thuế:</span>
                  <span>{order.total_pre_tax_amount ? Math.round(Number(order.total_pre_tax_amount)).toLocaleString('vi-VN') : Math.round(Number(order.final_amount) / 1.08).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tiền thuế VAT:</span>
                  <span>{order.total_tax_amount ? Math.round(Number(order.total_tax_amount)).toLocaleString('vi-VN') : Math.round(Number(order.final_amount) - Number(order.final_amount) / 1.08).toLocaleString('vi-VN')}</span>
                </div>
              </div>

              <div className="border-t border-black pt-2 mb-4" style={{ borderColor: '#000000' }}>
                <div className="flex justify-between font-bold text-[16px]">
                  <span>Tổng thanh toán:</span>
                  <span>{Math.round(order.final_amount).toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="text-center text-[12px] italic space-y-0.5 mt-4">
                <div>Cảm ơn quý khách và hẹn gặp lại!</div>
                {company?.phone && <div>Hotline: {company.phone}</div>}
              </div>

              <div className="text-center text-[13px] space-y-0.5 mt-3 pt-3 border-t border-dashed border-black" style={{ borderColor: '#000000' }}>
                <div>Tra cứu hóa đơn điện tử tại:</div>
                <div className="font-sans text-[11px] break-words">https://vinvoice.viettel.vn/utilities/invoice-search</div>
                <div>Mã tra cứu: <span className="font-bold">{order.invoice_lookup_code || ''}</span></div>
              </div>
            </div>
          )}
        </div>
      </div>,
      document.body
    )}
    </>
  );
};
