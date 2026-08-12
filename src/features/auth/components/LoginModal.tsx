import React, { useState } from 'react';
import { Lock, User, Key, Server, CheckCircle, AlertCircle, X, Zap } from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { dbStore } from '../../../shared/data/mockDatabase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string, token: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (userStr: string, passStr: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await iamService.login(userStr, passStr);
      if (res && res.data && res.data.token) {
        localStorage.setItem('hpticket_token', res.data.token);
        localStorage.setItem('hpticket_username', userStr);
        localStorage.setItem('hpticket_role', res.data.role || 'ADMIN');

        // Thông báo đồng bộ hệ thống
        setSuccessMsg(`Đăng nhập thành công (${userStr})! Đang kéo dữ liệu thực từ cơ sở dữ liệu PostgreSQL...`);
        window.dispatchEvent(new Event('hpticket_auth_changed'));

        // Tự động đồng bộ với backend nếu đang chế độ Live
        if (true) {
          await dbStore.syncFromBackend(true);
        }

        setTimeout(() => {
          onLoginSuccess(userStr, res.data.token);
          onClose();
        }, 800);
      } else {
        setErrorMsg(res.message || 'Không nhận được JWT Token từ máy chủ Spring Boot.');
      }
    } catch (err: any) {
      console.error('[Login Modal Error]:', err);
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ Spring Boot (cổng 8080). Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 transform transition-all">
        {/* Header bar */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 px-6 py-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-5 h-5 text-emerald-200" />
            <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
              Secure Access
            </span>
          </div>
          <h2 className="text-xl font-black">ĐĂNG NHẬP HPTICKET</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Vui lòng đăng nhập để truy cập hệ thống quản trị
          </p>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5">
          {/* Messages */}
          {errorMsg && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-3 rounded-xl">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form inputs */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin(username, password);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tài khoản (Username)
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực với Spring Boot...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>ĐĂNG NHẬP HỆ THỐNG</span>
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-center text-xs text-slate-500">
          <span>&copy; {new Date().getFullYear()} HPTicket Management System</span>
        </div>
      </div>
    </div>
  );
};
