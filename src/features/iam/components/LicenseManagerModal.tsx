import React, { useState, useEffect } from 'react';
import { Shield, Clock, Lock, Key, AlertTriangle, CheckCircle2, Zap, Hourglass, X, ShieldAlert } from 'lucide-react';
import { dbStore } from '../../../shared/data/mockDatabase';

interface LicenseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStateChange: () => void;
}

export const LicenseManagerModal: React.FC<LicenseManagerModalProps> = ({
  isOpen,
  onClose,
  onStateChange,
}) => {
  if (!isOpen) return null;

  const license = dbStore.licenseConfig;

  const [customMinutes, setCustomMinutes] = useState<number>(1);
  const [newMasterKey, setNewMasterKey] = useState<string>(license.master_unlock_key);
  const [lockReason, setLockReason] = useState<string>(license.lock_reason);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Remaining time calculation
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      if (!license.expires_at) {
        setTimeLeftStr('Hoạt động vô thời hạn (Chưa đặt hẹn giờ)');
        return;
      }

      const diff = new Date(license.expires_at).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr('ĐÃ HẾT HẠN - HỆ THỐNG SẼ BỊ KHÓA');
      } else {
        const totalSec = Math.floor(diff / 1000);
        const hours = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;
        setTimeLeftStr(
          `${hours > 0 ? hours + ' giờ ' : ''}${mins} phút ${secs < 10 ? '0' : ''}${secs} giây`
        );
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [license.expires_at]);

  const handleSetTimer = (minutes: number) => {
    dbStore.setLockTimer(minutes);
    setStatusMsg({
      type: 'success',
      text: `Đã cài đặt hẹn giờ tự động khóa hệ thống sau ${minutes} phút!`,
    });
    onStateChange();
  };

  const handleImmediateLock = () => {
    if (window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn KHÓA HỆ THỐNG KHẨN CẤP ngay lập tức không?')) {
      dbStore.setManualLock(true, lockReason);
      setStatusMsg({
        type: 'error',
        text: 'Đã khóa khẩn cấp hệ thống!',
      });
      onStateChange();
      onClose();
    }
  };

  const handleUpdateMasterKey = () => {
    if (!newMasterKey.trim()) return;
    dbStore.licenseConfig.master_unlock_key = newMasterKey.trim();
    dbStore.saveToStorage();
    setStatusMsg({
      type: 'success',
      text: 'Đã cập nhật mã Master Unlock Key thành công!',
    });
    onStateChange();
  };

  const handleRemoveTimer = () => {
    dbStore.licenseConfig.expires_at = null;
    dbStore.licenseConfig.is_locked = false;
    dbStore.saveToStorage();
    setStatusMsg({
      type: 'success',
      text: 'Đã hủy hẹn giờ khóa, hệ thống hoạt động vô thời hạn.',
    });
    onStateChange();
  };

  const handleActivatePermanent = () => {
    const res = dbStore.unlockSystem(newMasterKey);
    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: res.message,
      });
      onStateChange();
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-900 space-y-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Quản Lý Bản Quyền & Mở Khóa Vĩnh Viễn
              </h3>
              <p className="text-xs text-slate-500">Dùng thử 30 ngày duy nhất & Kích hoạt bản quyền trọn đời</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Status */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 font-mono text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Trạng Thái Bản Quyền:</span>
            <span
              className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                license.is_permanent
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : license.is_locked
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {license.is_permanent
                ? 'BẢN QUYỀN VĨNH VIỄN (LIFETIME UNLOCKED)'
                : license.is_locked
                ? 'ĐÃ KHÓA ACCESS'
                : 'ĐANG DÙNG THỬ (30-DAY TRIAL)'}
            </span>
          </div>

          {license.is_permanent ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-sans text-xs space-y-1 mt-2">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> Đã Kích Hoạt Bản Quyền Vĩnh Viễn Trọn Đời
              </div>
              <p className="text-[11px] text-slate-700">
                Hệ thống đã kích hoạt Key chính thức (Mã: <code className="text-amber-800 font-mono font-bold">{license.permanent_key || license.master_unlock_key}</code>). Toàn bộ tính năng mở hoàn toàn và sẽ <strong>KHÔNG BAO GIỜ bị khóa lại nữa</strong>.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Thời Gian Dùng Thử Còn Lại (30 Ngày):</span>
                <span className="text-amber-700 font-bold flex items-center gap-1">
                  <Hourglass className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  {timeLeftStr}
                </span>
              </div>

              {license.expires_at && (
                <div className="flex justify-between items-center text-[11px] text-slate-500">
                  <span>Hạn Hết 30 Ngày Dùng Thử:</span>
                  <span>{new Date(license.expires_at).toLocaleString('vi-VN')}</span>
                </div>
              )}
            </>
          )}
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Lifetime License Activation Box */}
        <div className="space-y-3 p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
          <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            Kích Hoạt Bản Quyền Vĩnh Viễn (Không Bao Giờ Khóa Nữa):
          </label>
          <p className="text-[11px] text-slate-600">
            Nhập Key kích hoạt để chuyển hệ thống sang trạng thái vĩnh viễn trọn đời:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMasterKey}
              onChange={(e) => setNewMasterKey(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleActivatePermanent(); } }}
              placeholder="Key Vĩnh Viễn (Mặc định: VIP-SYSTEM-UNLOCK-9999)..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-emerald-500 shadow-xs"
            />
            <button
              onClick={handleActivatePermanent}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" /> KÍCH HOẠT VĨNH VIỄN
            </button>
          </div>
        </div>

        {/* Quick Timers & Testing */}
        {!license.is_permanent && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Cài Thử Nghiệm Hẹn Giờ Khóa (Trong thời gian dùng thử):
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleSetTimer(1)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition text-center"
              >
                ⚡ 1 Phút (Test)
              </button>
              <button
                onClick={() => handleSetTimer(5)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition text-center"
              >
                ⏱️ 5 Phút
              </button>
              <button
                onClick={() => handleSetTimer(60)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition text-center"
              >
                🕒 1 Giờ
              </button>
              <button
                onClick={() => handleSetTimer(30 * 24 * 60)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition text-center"
              >
                📅 30 Ngày Dùng Thử
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
