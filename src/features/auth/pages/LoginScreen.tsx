import React, { useState } from 'react';
import { Lock, User, Key, CheckCircle, AlertCircle, Shield, Loader2, ArrowRight } from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { dbStore } from '../../../shared/data/mockDatabase';
import { API_BASE_URL } from '../../../api/apiConfig';

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

    // Bypass API cho mục đích Demo UI
    if (username === 'admin' && password === '123456') {
      localStorage.setItem('hpticket_token', 'demo-token-123456');
      localStorage.setItem('hpticket_username', 'admin');
      localStorage.setItem('hpticket_role', 'ADMIN');
      setSuccessMsg(`Đăng nhập thành công! (Chế độ Demo UI)`);
      setTimeout(() => {
        onLoginSuccess();
      }, 1000);
      setLoading(false);
      return;
    }

    try {
      const res = await iamService.login(username, password);
      if (res && res.data && res.data.token) {
        localStorage.setItem('hpticket_token', res.data.token);
        localStorage.setItem('hpticket_username', username);
        localStorage.setItem('hpticket_role', res.data.role || 'ADMIN');

        setSuccessMsg(`Đăng nhập thành công! Đang tải dữ liệu hệ thống...`);

        // Đã xóa hàm tự động kéo toàn bộ dữ liệu (Fat Client) ở đây để tăng tốc login
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg-office.jpg')" }}
    >
      {/* Background decorations - Overlay mờ nhẹ để nổi box login */}
      <div className="absolute inset-0 bg-white/30 backdrop-blur-sm pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white rounded-[2rem] shadow-xl shadow-slate-300/60 mb-5 border border-slate-100/50 backdrop-blur-sm">
            <img 
              src={(() => {
                const url = dbStore.companies?.[0]?.web_logo_url;
                if (!url || url === '/logo.png') return "/logo.png";
                if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) return url;
                return API_BASE_URL + url;
              })()}
              alt="Hoàng Phát Technology Era" 
              className="h-24 w-auto max-w-[240px] object-contain scale-110" 
            />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1">HPTICKET</h1>
          <p className="text-slate-500 mt-1 font-medium">Hệ Thống Quản Lý Bán Vé & Kiểm Soát</p>
        </div>

        {/* Login Box */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 p-8 rounded-3xl shadow-2xl shadow-slate-300/50">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Đăng nhập hệ thống</h2>

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
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2 tracking-wider">
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
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading || !username || !password}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 px-4 transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Đăng Nhập</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>

        <div className="text-center mt-8 text-slate-400 text-sm">
          &copy; {new Date().getFullYear()} Công ty TNHH Phát Triển Kỹ Thuật Công Nghệ Hoàng Phát
        </div>
      </div>
    </div>
  );
};
