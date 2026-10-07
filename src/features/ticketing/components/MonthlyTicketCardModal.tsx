import React, { useRef, useState, useEffect } from 'react';
import { 
  Printer, Download, Calendar, Phone, Mail, Clock, 
  Copy, Check, Ticket, RotateCw, User
} from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { IssuedTicket, Company } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { Modal, Button } from '../../../shared/components/ui';
import { toast } from '../../../shared/utils/toast';
import { dbStore } from '../../../shared/data/mockDatabase';

interface MonthlyTicketCardModalProps {
  ticket: IssuedTicket | null;
  onClose: () => void;
  onRenew?: (ticket: IssuedTicket) => void;
  onPrint?: (ticket: IssuedTicket) => void;
}

export const MonthlyTicketCardModal: React.FC<MonthlyTicketCardModalProps> = ({ 
  ticket, 
  onClose, 
  onRenew, 
  onPrint 
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    marketingService.fetchCompanies().then((res) => {
      if (res.data && res.data.length > 0) {
        setCompany(res.data[0]);
      }
    }).catch((err) => {
      console.warn('[MonthlyTicketCardModal] Fetch companies failed:', err);
    });
  }, []);

  if (!ticket) return null;

  const now = new Date();
  const expireDate = ticket.expire_at ? new Date(ticket.expire_at) : null;
  const isExpired = expireDate ? expireDate.getTime() < now.getTime() : false;
  const daysLeft = expireDate ? Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;

  const qrValue = ticket.qr_display || ticket.qr_code_string || ticket.id;
  const rawName = company?.name || dbStore.companies?.[0]?.name;
  const companyName = (rawName && !rawName.includes('VIETTELPOST')) ? rawName : 'HỆ THỐNG VÉ ĐIỆN TỬ HOÀNG PHÁT';
  const companyPhone = company?.hotline || company?.phone || '1900 xxxx';

  const handleCopyCode = () => {
    if (!ticket.qr_code_string) return;
    navigator.clipboard.writeText(ticket.qr_code_string);
    setCopied(true);
    toast.success('Đã sao chép mã vé vào clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!cardRef.current) return;
    const canvas = cardRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_VeThang_${ticket.customer_name ? ticket.customer_name.replace(/\s+/g, '_') : ticket.qr_code_string}.png`;
    a.click();
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint(ticket);
      onClose();
      return;
    }

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    const canvas = cardRef.current?.querySelector('canvas');
    const qrDataUrl = canvas ? canvas.toDataURL('image/png') : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thẻ Vé Tháng - ${ticket.customer_name || ticket.qr_code_string}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 10px;
              color: #1e293b;
              display: flex;
              justify-content: center;
              background: #fff;
            }
            .card {
              width: 80mm;
              border: 2px solid #0284c7;
              border-radius: 12px;
              padding: 14px;
              box-sizing: border-box;
              text-align: center;
              position: relative;
            }
            .header {
              border-bottom: 2px dashed #cbd5e1;
              padding-bottom: 8px;
              margin-bottom: 10px;
            }
            .brand {
              font-size: 13px;
              font-weight: 800;
              color: #0369a1;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .sub-brand {
              font-size: 10px;
              color: #64748b;
            }
            .title {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 4px;
              text-transform: uppercase;
            }
            .qr-box {
              margin: 10px auto;
              width: 140px;
              height: 140px;
            }
            .qr-box img {
              width: 100%;
              height: 100%;
            }
            .ticket-code {
              font-family: monospace;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 2px;
              color: #0369a1;
              margin-bottom: 8px;
            }
            .info-table {
              width: 100%;
              font-size: 11px;
              text-align: left;
              border-collapse: collapse;
              margin-top: 8px;
              border-top: 1px solid #e2e8f0;
              padding-top: 6px;
            }
            .info-table td {
              padding: 3px 0;
            }
            .info-label {
              color: #64748b;
              width: 35%;
            }
            .info-val {
              font-weight: 600;
              color: #0f172a;
            }
            .footer {
              margin-top: 10px;
              font-size: 9px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 6px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="brand">${companyName}</div>
              <div class="sub-brand">HỆ THỐNG VÉ ĐIỆN TỬ HOÀNG PHÁT</div>
              <div class="title">${ticket.ticket_template_name || ticket.ticket_template_code || 'VÉ THÁNG THAM QUAN'}</div>
            </div>

            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>

            <div class="ticket-code">${ticket.qr_code_string}</div>

            <table class="info-table">
              <tr>
                <td class="info-label">Khách hàng:</td>
                <td class="info-val">${ticket.customer_name || 'Khách vãng lai'}</td>
              </tr>
              ${ticket.customer_phone ? `
              <tr>
                <td class="info-label">Số điện thoại:</td>
                <td class="info-val">${ticket.customer_phone}</td>
              </tr>` : ''}
              <tr>
                <td class="info-label">Hạn sử dụng:</td>
                <td class="info-val" style="color: #0369a1;">${ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date || '—'}</td>
              </tr>
              <tr>
                <td class="info-label">Lượt qua cổng:</td>
                <td class="info-val">${ticket.used_passes ?? 0} lượt (Vô hạn)</td>
              </tr>
            </table>

            <div class="footer">
              Vui lòng quét mã QR tại cổng tự động khi vào tham quan.<br/>
              Hotline hỗ trợ: ${companyPhone}
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      isOpen={Boolean(ticket)}
      onClose={onClose}
      title="Thẻ Vé Tháng Điện Tử"
      subtitle={companyName}
      icon={<Ticket className="w-5 h-5 text-blue-600" />}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5 text-blue-600" />}
            onClick={handlePrint}
          >
            In Lại
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5 text-blue-600" />}
            onClick={handleDownloadQR}
          >
            Tải QR
          </Button>
          {onRenew && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="!bg-blue-600 hover:!bg-blue-700 shadow-blue-100"
              icon={<RotateCw className="w-3.5 h-3.5" />}
              onClick={() => {
                onClose();
                onRenew(ticket);
              }}
            >
              Gia Hạn Vé
            </Button>
          )}
        </div>
      }
    >
      {/* Electronic Pass Card Body - Tone Trắng Xanh Chuẩn Hệ Thống */}
      <div className="p-1" ref={cardRef}>
        <div className="bg-gradient-to-b from-blue-50/70 via-white to-slate-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
          {/* Subtle Decorative Accents */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Pass Header */}
          <div className="flex items-start justify-between border-b border-blue-100 pb-3 mb-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">MONTHLY MEMBERSHIP PASS</span>
              <h4 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase mt-0.5">
                {ticket.ticket_template_name || ticket.ticket_template_code || 'VÉ THÁNG THAM QUAN'}
              </h4>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
              isExpired 
                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                : (daysLeft !== null && daysLeft <= 7) 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {isExpired ? 'ĐÃ HẾT HẠN' : (daysLeft !== null && daysLeft <= 7) ? `CÒN ${daysLeft} NGÀY` : 'HOẠT ĐỘNG'}
            </span>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center my-3">
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-blue-100">
              <QRCodeDisplay value={qrValue} size={150} showText={false} className="!p-0 !border-0 !shadow-none" />
            </div>

            <div className="mt-3 flex items-center gap-1.5 bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl border border-blue-200/80 text-blue-900 transition shadow-2xs">
              <span className="font-mono text-xs font-bold tracking-widest text-blue-700 select-all">
                {ticket.qr_code_string}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-blue-500 hover:text-blue-800 p-0.5 rounded transition"
                title="Sao chép mã vé"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Customer & Pass Details */}
          <div className="space-y-2 mt-4 text-xs border-t border-slate-200/80 pt-3.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Khách hàng:
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {ticket.customer_name || 'Khách vãng lai'}
              </span>
            </div>

            {ticket.customer_phone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Số điện thoại:
                </span>
                <span className="font-semibold text-slate-800">{ticket.customer_phone}</span>
              </div>
            )}

            {ticket.customer_email && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> Email:
                </span>
                <span className="font-medium text-slate-700 truncate max-w-[220px]">{ticket.customer_email}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Hạn dùng:
              </span>
              <span className={`font-bold ${isExpired ? 'text-rose-600' : 'text-blue-700'}`}>
                {ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date || '—'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Đã qua cổng:
              </span>
              <span className="font-bold text-slate-800">
                {ticket.used_passes ?? 0} lượt (Vô hạn)
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
