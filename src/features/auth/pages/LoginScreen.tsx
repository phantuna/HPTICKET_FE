import React, { useState } from 'react';
import { Lock, User, Key, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { dbStore } from '../../../shared/data/mockDatabase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await iamService.login(username, password);
      if (res && res.data && res.data.token) {
        localStorage.setItem('hpticket_token', res.data.token);
        localStorage.setItem('hpticket_username', username);
        localStorage.setItem('hpticket_role', res.data.role || 'ADMIN');

        setSuccessMsg(`Đăng nhập thành công! Đang tải dữ liệu hệ thống...`);
        
        // Tự động đồng bộ với backend nếu đang chế độ Live
        if (true) {
          await dbStore.syncFromBackend(true);
        }

        setTimeout(() => {
          onLoginSuccess();
        }, 1000);
      } else {
        setErrorMsg(res.message || 'Không nhận được JWT Token từ máy chủ.');
      }
    } catch (err: any) {
      console.error('[Login Error]:', err);
      setErrorMsg(err.message || 'Lỗi kết nối tới máy chủ Spring Boot (cổng 8080). Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-900 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      {/* Background decorations - Thêm một lớp Overlay làm tối ảnh đi một chút để nổi box login */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">HPTICKET <span className="text-emerald-400">PRO</span></h1>
          <p className="text-slate-400 mt-2 font-medium">Hệ Thống Quản Lý Bán Vé & Kiểm Soát</p>
        </div>

        {/* Login Box */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Đăng nhập hệ thống</h2>

          {/* Messages */}
          {errorMsg && (
            <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm p-4 rounded-2xl mb-6">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-sm p-4 rounded-2xl mb-6">
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
                Tài khoản (Username)
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e); }}
                  placeholder="Nhập username..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-2 tracking-wider">
                Mật khẩu (Password)
              </label>
              <div className="relative">
                <Key className="w-5 h-5 absolute left-4 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(e); }}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>ĐĂNG NHẬP</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="text-center mt-8 text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} HPTicket Management System. V2.4 Enterprise.
        </div>
      </div>
    </div>
  );
};
