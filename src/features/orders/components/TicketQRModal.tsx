import React from 'react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { IssuedTicket } from '../../../shared/types/hpticket';

interface TicketQRModalProps {
  selectedTicket: IssuedTicket | null;
  setSelectedTicket: (ticket: IssuedTicket | null) => void;
}

export const TicketQRModal: React.FC<TicketQRModalProps> = ({ selectedTicket, setSelectedTicket }) => {
  if (!selectedTicket) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-800 flex flex-col items-center">
        <h3 className="text-base font-bold text-center text-slate-900 mb-1">{selectedTicket.ticket_template_name}</h3>
        <p className="text-xs text-slate-500 mb-4">Hạn dùng: {selectedTicket.valid_date}</p>

        <QRCodeDisplay value={selectedTicket.qr_display || selectedTicket.qr_code_string} size={180} />

        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs w-full">
          <p className="text-slate-500">Số lượt qua cổng đã dùng:</p>
          <p className="text-lg font-mono font-extrabold text-amber-600 mt-0.5">
            {selectedTicket.used_passes} / {selectedTicket.allowed_passes === 999999 || selectedTicket.ticket_type === 'UNLIMITED' ? 'Vô Hạn (30 Ngày)' : selectedTicket.allowed_passes} Lượt Quét
          </p>
        </div>

        <button
          onClick={() => setSelectedTicket(null)}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
