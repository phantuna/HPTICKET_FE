import React, { useState, useEffect } from 'react';
import { Lock, Key, ShieldAlert, AlertTriangle, RefreshCw, CheckCircle2, PhoneCall } from 'lucide-react';
import { dbStore } from '../../../shared/data/mockDatabase';

interface SystemLockScreenProps {
  onUnlocked: () => void;
}

export const SystemLockScreen: React.FC<SystemLockScreenProps> = ({ onUnlocked }) => {
  const [unlockKey, setUnlockKey] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const license = dbStore.licenseConfig;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = dbStore.unlockSystem(unlockKey);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMessage(res.message);
        setTimeout(() => {
          onUnlocked();
        }, 1200);
      } else {
        setErrorMessage(res.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-red-500 selection:text-white">
      {/* Background glow & grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative max-w-lg w-full bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 shadow-2xl shadow-red-950/50 backdrop-blur-xl text-center space-y-6">
        {/* Animated Lock Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 border border-red-400/30">
          <Lock className="w-10 h-10 animate-pulse" />
        </div>

        {/* Title & Reason */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono font-bold">
            <ShieldAlert className="w-3.5 h-3.5" /> SYSTEM ACCESS LOCKED
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Hệ Thống Đã Bị Khóa Access</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
            {license.lock_reason || 'Bản quyền vận hành hệ thống HPTICKET đã hết hạn hoặc bị tạm khóa bởi Quản trị viên.'}
          </p>
        </div>

        {/* Info card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-400">
            <span>Mã Bản Quyền (License ID):</span>
            <span className="text-red-400 font-bold">{license.license_key}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Thời điểm kích hoạt:</span>
            <span className="text-slate-200">{new Date(license.activated_at).toLocaleString('vi-VN')}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Thời gian hết hạn:</span>
            <span className="text-amber-400 font-bold">
              {license.expires_at ? new Date(license.expires_at).toLocaleString('vi-VN') : 'Đã khóa khẩn cấp'}
            </span>
          </div>
        </div>

        {/* Unlock Form */}
        <form onSubmit={handleUnlock} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              Nhập Key Kích Hoạt Bản Quyền Vĩnh Viễn:
            </label>
            <input
              type="text"
              required
              value={unlockKey}
              onChange={(e) => setUnlockKey(e.target.value)}
              placeholder="Nhập Key mở khóa vĩnh viễn (Ví dụ: VIP-SYSTEM-UNLOCK-9999)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:ring-1 focus:ring-emerald-500 transition shadow-inner"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Gợi ý Key mở khóa trọn đời: <code className="text-amber-300 font-mono">VIP-SYSTEM-UNLOCK-9999</code>
            </p>
            <p className="text-[10px] text-emerald-400/90 mt-0.5 italic">
              ⚡ Lưu ý: Sau khi kích hoạt thành công, hệ thống sẽ mở khóa VĨNH VIỄN và không bao giờ bị khóa lại nữa.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Key className="w-4 h-4" />
            )}
            <span>XÁC NHẬN MỞ KHÓA HỆ THỐNG</span>
          </button>
        </form>

        {/* Footer Support */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <PhoneCall className="w-3 h-3 text-slate-400" /> Hotline Hỗ Trợ: 1900 8888
          </span>
          <span className="font-mono">HPTICKET SECURITY v2.4</span>
        </div>
      </div>
    </div>
  );
};
