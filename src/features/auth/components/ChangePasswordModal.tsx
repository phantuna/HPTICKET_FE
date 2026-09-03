import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle, Key } from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { toast } from '../../../shared/utils/toast';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [oldPassword,     setOldPassword]     = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld,         setShowOld]         = useState(false);
  const [showNew,         setShowNew]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null);
  const [successMsg,      setSuccessMsg]      = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClose = () => { resetForm(); onClose(); };

  // Strength meter
  const getStrength = (pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
    if (pw.length === 0)  return { level: 0, label: '', color: '' };
    if (pw.length < 6)    return { level: 1, label: 'Yếu', color: 'bg-rose-500' };
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
                          return { level: 2, label: 'Trung bình', color: 'bg-amber-500' };
    return                       { level: 3, label: 'Mạnh', color: 'bg-emerald-500' };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Client-side validation
    if (newPassword.length < 6) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại.');
      return;
    }
    if (newPassword === oldPassword) {
      setErrorMsg('Mật khẩu mới phải khác mật khẩu hiện tại.');
      return;
    }

    setLoading(true);
    try {
      await iamService.changePassword(oldPassword, newPassword);
      setSuccessMsg('Đổi mật khẩu thành công! Vui lòng đăng nhập lại trên tất cả thiết bị.');
      toast.success('✅ Đổi mật khẩu thành công!');
      // Đăng xuất sau 2 giây (backend đã revoke token)
      setTimeout(async () => {
        await iamService.logout();
        window.dispatchEvent(new Event('hpticket_auth_changed'));
        window.location.hash = '/login';
      }, 2000);
    } catch (err: any) {
      const msg = err?.message || 'Lỗi khi đổi mật khẩu. Vui lòng thử lại.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const EyeButton = ({
    show, toggle,
  }: { show: boolean; toggle: () => void }) => (
    <button
      type="button"
      onClick={toggle}
      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 overflow-hidden animate-[slideIn_0.2s_ease-out]">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-5 text-white">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-indigo-200" />
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Bảo mật tài khoản
            </span>
          </div>
          <h2 className="text-xl font-black">ĐỔI MẬT KHẨU</h2>
          <p className="text-xs text-indigo-100 mt-1">
            Mật khẩu mới sẽ được mã hóa BCrypt và lưu an toàn.
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl mb-4">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Old password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mật khẩu hiện tại
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="cp-old-password"
                  type={showOld ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <EyeButton show={showOld} toggle={() => setShowOld(!showOld)} />
              </div>
            </div>

            {/* New password + strength */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Mật khẩu mới <span className="text-slate-400 normal-case font-normal">(tối thiểu 6 ký tự)</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="cp-new-password"
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <EyeButton show={showNew} toggle={() => setShowNew(!showNew)} />
              </div>
              {/* Strength meter */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          i <= strength.level ? strength.color : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-[10px] font-bold ${
                    strength.level === 1 ? 'text-rose-600'
                    : strength.level === 2 ? 'text-amber-600'
                    : 'text-emerald-600'
                  }`}>
                    Độ mạnh: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  id="cp-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  className={`w-full pl-9 pr-10 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition ${
                    confirmPassword && confirmPassword !== newPassword
                      ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : confirmPassword && confirmPassword === newPassword
                      ? 'border-emerald-400 focus:ring-emerald-500/20 focus:border-emerald-500'
                      : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                <EyeButton show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[10px] text-rose-600 font-bold mt-1">⚠ Mật khẩu xác nhận chưa khớp</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Mật khẩu khớp</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>XÁC NHẬN ĐỔI MẬT KHẨU</span>
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-400 mt-4">
            🔒 Sau khi đổi, bạn sẽ được đăng xuất và cần đăng nhập lại trên tất cả thiết bị.
          </p>
        </div>
      </div>
    </div>
  );
};
