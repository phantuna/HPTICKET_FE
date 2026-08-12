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

      <div className="w-full bg-slate-100 p-1 rounded-xl flex text-xs font-bold gap-1 border border-slate-200">
        <button
          onClick={() => setBadgeQrMode('text')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            badgeQrMode === 'text' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📱 Văn Bản & SĐT
        </button>
        <button
          onClick={() => setBadgeQrMode('vcard')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            badgeQrMode === 'vcard' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📇 Danh Bạ vCard
        </button>
        <button
          onClick={() => setBadgeQrMode('code')}
          className={`flex-1 py-1.5 rounded-lg transition ${
            badgeQrMode === 'code' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ⚡ Mã Cổng Turnstile
        </button>
      </div>

      {(() => {
        const roleName = roles.find((r) => r.id === selectedBadgeUser.role_id)?.name || 'Nhân viên';
        const phone = selectedBadgeUser.phone || '0901234567';
        let qrPayload = selectedBadgeUser.qr_code;

        if (badgeQrMode === 'text') {
          qrPayload = `[NHÂN VIÊN HPTICKET]\nHọ tên: ${selectedBadgeUser.fullname}\nSĐT: ${phone}\nChức danh: ${roleName}\nTên đăng nhập: ${selectedBadgeUser.username}\nMã NV: ${selectedBadgeUser.qr_code}`;
        } else if (badgeQrMode === 'vcard') {
          qrPayload = `BEGIN:VCARD\nVERSION:3.0\nFN:${selectedBadgeUser.fullname}\nTEL;TYPE=CELL:${phone}\nTITLE:${roleName}\nORG:HPTicket System\nNOTE:Mã NV: ${selectedBadgeUser.qr_code}\nEND:VCARD`;
        }

        return (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl shadow-xs flex flex-col items-center w-full">
            <QRCodeDisplay value={qrPayload} size={180} />
            <p className="text-[11px] text-slate-500 font-mono mt-2 text-center px-2">
              {badgeQrMode === 'text' && '✨ Quét bằng camera điện thoại sẽ HIỆN NGAY Họ Tên, SĐT & Chức danh!'}
              {badgeQrMode === 'vcard' && '📞 Quét bằng camera điện thoại sẽ HIỆN NÚT GỌI & LƯU DANH BẠ!'}
              {badgeQrMode === 'code' && '⚡ Dùng cho máy quét mã vạch USB tại cổng kiểm soát ra vào.'}
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
