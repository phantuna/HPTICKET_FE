import React, { useState, useEffect } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { API_BASE_URL } from '../../api/apiConfig';

export const SessionLoginModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState(localStorage.getItem('hpticket_username') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleSessionExpired = () => {
      setUsername(localStorage.getItem('hpticket_username') || '');
      setIsOpen(true);
    };

    window.addEventListener('session_expired_modal', handleSessionExpired);
    return () => window.removeEventListener('session_expired_modal', handleSessionExpired);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/iam/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include', // Để BE set cookie
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Đăng nhập thành công, lưu lại token
      localStorage.setItem('hpticket_token', data.data.token);
      localStorage.setItem('hpticket_username', data.data.username);
      
      // Báo cho các Tab khác biết phiên đã được khôi phục
      const authChannel = new BroadcastChannel('hpticket_auth_channel');
      authChannel.postMessage({ type: 'SESSION_REFRESHED', token: data.data.token });

      setIsOpen(false);
      setPassword('');
      window.dispatchEvent(new CustomEvent('toast_notification', {
        detail: { message: 'Đã khôi phục phiên đăng nhập thành công', type: 'success' }
      }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-md mx-4 animate-[slideIn_0.2s_ease-out]">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Phiên Đăng Nhập Hết Hạn</h2>
          <p className="text-slate-500 text-center mt-2">
            Vì lý do bảo mật, phiên của bạn đã hết hạn. Vui lòng đăng nhập lại để tiếp tục công việc (dữ liệu đang nhập sẽ không bị mất).
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 text-slate-500"
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Nhập lại mật khẩu..."
              autoFocus
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-5 h-5" />
              )}
              {loading ? 'Đang xác thực...' : 'Khôi Phục Phiên'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
