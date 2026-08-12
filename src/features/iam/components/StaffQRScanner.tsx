import React from 'react';
import { Scan, Search, Phone, BadgeCheck, AlertCircle } from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { User, Role } from '../../../shared/types/hpticket';

interface StaffQRScannerProps {
  scanInput: string;
  setScanInput: (v: string) => void;
  handleScanStaffQR: (code?: string) => void;
  setIsCameraModalOpen: (v: boolean) => void;
  hasScanned: boolean;
  scannedStaff: User | null;
  roles: Role[];
}

export const StaffQRScanner: React.FC<StaffQRScannerProps> = ({
  scanInput, setScanInput, handleScanStaffQR, setIsCameraModalOpen,
  hasScanned, scannedStaff, roles
}) => (
  <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm space-y-4">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
      <div className="flex items-center gap-2">
        <Scan className="w-5 h-5 text-emerald-600" />
        <div>
          <h3 className="text-sm font-bold text-slate-900">MÁY QUÉT MÃ QR & TRUY XUẤT SỐ ĐIỆN THOẠI NHÂN VIÊN</h3>
          <p className="text-[11px] text-slate-500">Tra cứu nhanh Họ Tên, SĐT, Quyền Hạn từ mã QR hoặc số điện thoại</p>
        </div>
      </div>
      <button
        onClick={() => setIsCameraModalOpen(true)}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
      >
        <Scan className="w-4 h-4 text-emerald-400 animate-pulse" /> Mở Camera Web / Điện Thoại Quét Trực Tiếp
      </button>
    </div>

    <div className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={scanInput}
          onChange={(e) => setScanInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScanStaffQR()}
          placeholder="Quét mã QR (e.g. EMP-SUPERADMIN-001) hoặc nhập SĐT nhân viên..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        />
      </div>
      <button
        onClick={() => handleScanStaffQR()}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition shadow-xs"
      >
        <Scan className="w-4 h-4" /> Tra Cứu Thẻ
      </button>
    </div>

    <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
      <div className="font-bold flex items-center gap-1.5 text-amber-800">
        <span>💡 HƯỚNG DẪN DÙNG CAMERA ĐIỆN THOẠI THÔNG THƯỜNG QUÉT MÃ QR NHÂN VIÊN</span>
      </div>
      <p className="text-[11px] text-amber-800 leading-relaxed">
        Ống kính camera mặc định trên điện thoại (iPhone / Android Camera) chỉ có thể hiển thị SĐT & Họ Tên khi mã QR được tạo dưới dạng <strong>"Văn Bản & SĐT"</strong> hoặc <strong>"Danh Bạ vCard"</strong>. Khi bấm xem <i>Thẻ Nhân Viên</i>, bạn có thể chuyển chế độ QR sang <strong>Văn Bản & SĐT</strong> để khi lấy điện thoại cá nhân quét, điện thoại sẽ lập tức hiển thị thông tin nhân viên ngay trên màn hình!
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
      <span className="text-slate-600 text-[11px] font-medium">Quét nhanh mẫu:</span>
      <button
        onClick={() => {
          setScanInput('EMP-SUPERADMIN-001');
          handleScanStaffQR('EMP-SUPERADMIN-001');
        }}
        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] border border-slate-200 transition"
      >
        EMP-SUPERADMIN-001 (Admin)
      </button>
      <button
        onClick={() => {
          setScanInput('EMP-CASHIER-002');
          handleScanStaffQR('EMP-CASHIER-002');
        }}
        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] border border-slate-200 transition"
      >
        EMP-CASHIER-002 (Thu ngân)
      </button>
      <button
        onClick={() => {
          setScanInput('0901234567');
          handleScanStaffQR('0901234567');
        }}
        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] border border-slate-200 transition"
      >
        Tra Theo SĐT: 0901234567
      </button>
    </div>

    {hasScanned && (
      <div className="pt-2">
        {scannedStaff ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-xs">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> XÁC THỰC THÀNH CÔNG
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  ID: {scannedStaff.id}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-slate-900">{scannedStaff.fullname}</h4>
                <p className="text-xs text-slate-500 font-mono">@{scannedStaff.username}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Số Điện Thoại</span>
                  <span className="text-sm font-mono font-black text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {scannedStaff.phone || '0901234567'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Chức Danh / Quyền</span>
                  <span className="text-xs font-bold text-slate-800 mt-1 block">
                    {roles.find((r) => r.id === scannedStaff.role_id)?.name || 'Nhân viên'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center bg-white p-3 rounded-2xl border border-emerald-200 shadow-xs shrink-0">
              <QRCodeDisplay value={scannedStaff.qr_code} size={110} />
              <span className="text-[10px] font-mono font-bold text-slate-600 mt-2">
                {scannedStaff.qr_code}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
            <div>
              <span className="font-bold block">Không tìm thấy thông tin nhân viên!</span>
              <span>Vui lòng kiểm tra lại mã QR, tên đăng nhập hoặc số điện thoại đã nhập.</span>
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
