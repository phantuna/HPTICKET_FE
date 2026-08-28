import React from 'react';
import { Phone } from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { User, Role } from '../../../shared/types/hpticket';

interface BadgeModalProps {
  selectedBadgeUser: User;
  roles: Role[];
  badgeQrMode: 'text' | 'vcard' | 'code';
  setBadgeQrMode: (mode: 'text' | 'vcard' | 'code') => void;
  onClose: () => void;
}

export const BadgeModal: React.FC<BadgeModalProps> = ({
  selectedBadgeUser, roles, badgeQrMode, setBadgeQrMode, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-900 flex flex-col items-center space-y-4">
      <div className="w-full bg-emerald-600 text-white rounded-2xl p-4 text-center shadow-sm">
        <h3 className="text-base font-black tracking-tight">HPTICKET STAFF BADGE</h3>
        <p className="text-[10px] uppercase font-mono tracking-widest text-emerald-100 mt-0.5">Thẻ Định Danh QR Nhân Viên</p>
      </div>

      {(() => {
        const qrPayload = selectedBadgeUser.qr_code || '0000000000';

        return (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center w-full mt-4">
            <QRCodeDisplay value={qrPayload} size={180} />
            <p className="text-[11px] text-slate-500 font-mono mt-2 text-center px-2">
              Dùng để quét tại Cổng Kiểm Soát Ra Vào (Turnstile)
            </p>
          </div>
        );
      })()}

      <div className="w-full text-center space-y-1">
        <h4 className="text-lg font-black text-slate-900">{selectedBadgeUser.fullname}</h4>
        <p className="text-xs text-emerald-700 font-mono font-bold">@{selectedBadgeUser.username}</p>
        <p className="text-xs text-slate-700 font-mono font-bold flex items-center justify-center gap-1">
          <Phone className="w-3.5 h-3.5 text-emerald-600" /> SĐT: {selectedBadgeUser.phone || '0901234567'}
        </p>
      </div>

      <button
        onClick={onClose}
        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition"
      >
        Đóng
      </button>
    </div>
  </div>
);
