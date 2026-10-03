import React, { useRef } from 'react';
import { X, Printer, Download, Calendar, Phone, Mail, ShieldCheck, Clock } from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { IssuedTicket } from '../../../api/salesService';
import { dbStore } from '../../../shared/data/mockDatabase';

interface MonthlyTicketCardModalProps {
  ticket: IssuedTicket | null;
  onClose: () => void;
  onRenew?: (ticket: IssuedTicket) => void;
}

export const MonthlyTicketCardModal: React.FC<MonthlyTicketCardModalProps> = ({ ticket, onClose, onRenew }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  if (!ticket) return null;

  const now = new Date();
  const expireDate = ticket.expire_at ? new Date(ticket.expire_at) : null;
  const isExpired = expireDate ? expireDate.getTime() < now.getTime() : false;
  const daysLeft = expireDate ? Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;

  const qrValue = ticket.qr_display || ticket.qr_code_string || ticket.id;
  const company = dbStore.companies?.[0];
  const companyName = company?.name || 'KHU DU LỊCH EO GIÓ';
  const companyPhone = company?.phone || '0987 654 321';

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
            @page { size: 85mm 125mm; margin: 5mm; }
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
              border: 2px solid #0f766e;
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
              font-size: 14px;
              font-weight: 800;
              color: #0f766e;
              text-transform: uppercase;
              letter-spacing: 1px;
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
              color: #0f766e;
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
                <td class="info-val" style="color: #b45309;">${ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date || '—'}</td>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-blue-300" />
            <div>
              <h3 className="font-bold text-base tracking-wide">Thẻ Vé Tháng Điện Tử</h3>
              <p className="text-xs text-blue-200">{companyName}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-blue-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Mockup Body */}
        <div className="p-6 bg-slate-50" ref={cardRef}>
          <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-blue-500/30">
            {/* Background decorative circles */}
            <div className="absolute -right-8 -top-8 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Card Brand Header */}
            <div className="flex items-start justify-between border-b border-blue-800/60 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">MONTHLY PASS</span>
                <h4 className="text-sm font-extrabold text-white tracking-wide uppercase">
                  {ticket.ticket_template_name || ticket.ticket_template_code || 'VÉ THÁNG THAM QUAN'}
                </h4>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                isExpired ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                (daysLeft !== null && daysLeft <= 7) ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/40'
              }`}>
                {isExpired ? 'ĐÃ HẾT HẠN' : (daysLeft !== null && daysLeft <= 7) ? `CÒN ${daysLeft} NGÀY` : 'HOẠT ĐỘNG'}
              </span>
            </div>

            {/* QR Code Center */}
            <div className="flex flex-col items-center my-4">
              <div className="bg-white p-3 rounded-xl shadow-md">
                <QRCodeDisplay value={qrValue} size={150} showText={false} className="!p-0 !border-0 !shadow-none" />
              </div>
              <div className="mt-2.5 font-mono text-sm font-bold tracking-widest text-blue-300 bg-blue-950/80 px-3 py-1 rounded-lg border border-blue-700/50">
                {ticket.qr_code_string}
              </div>
            </div>

            {/* Customer & Ticket Details */}
            <div className="space-y-2 mt-4 text-xs border-t border-blue-800/60 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-bold text-white text-sm">{ticket.customer_name || 'Khách vãng lai'}</span>
              </div>
              {ticket.customer_phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3 text-blue-400" /> SĐT:</span>
                  <span className="font-semibold text-blue-200">{ticket.customer_phone}</span>
                </div>
              )}
              {ticket.customer_email && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3 text-blue-400" /> Email:</span>
                  <span className="font-medium text-slate-300 truncate max-w-[200px]">{ticket.customer_email}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3 text-blue-400" /> Hạn dùng:</span>
                <span className={`font-bold ${isExpired ? 'text-rose-400' : 'text-amber-300'}`}>
                  {ticket.expire_at ? new Date(ticket.expire_at).toLocaleDateString('vi-VN') : ticket.valid_date || '—'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" /> Đã qua cổng:</span>
                <span className="font-bold text-blue-300">{ticket.used_passes ?? 0} lượt</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs"
              title="In thẻ vé vật lý hoặc xuất PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              In Thẻ
            </button>
            <button
              onClick={handleDownloadQR}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition shadow-xs border border-blue-200/60"
              title="Tải ảnh mã QR về máy để gửi Zalo cho khách"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Tải QR
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onRenew && (
              <button
                onClick={() => {
                  onClose();
                  onRenew(ticket);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-xs"
              >
                Gia hạn vé
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
