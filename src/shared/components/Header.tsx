import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  QrCode,
  Users,
  Ticket,
  Building2,
  ChevronDown,
  UserCheck,
  Server,
  MapPin,
  Store,
  ShieldCheck,
  TrendingUp,
  Lock,
  Key,
  Menu,
} from 'lucide-react';
import { dbStore } from '../data/mockDatabase';
import { LicenseManagerModal } from '../../features/iam/components/LicenseManagerModal';
import { LoginModal } from '../../features/auth/components/LoginModal';

interface HeaderProps {
  activeTab: string;
  activeSubTab: string;
  onSelectRoute: (module: string, subTab?: string) => void;
  onUserSwitch: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  activeSubTab,
  onSelectRoute,
  onUserSwitch,
  onToggleSidebar,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [jwtUser, setJwtUser] = useState<string | null>(localStorage.getItem('hpticket_username'));

  useEffect(() => {
    const handleModeChange = () => setIsMockMode(false);
    const handleAuthChange = () => setJwtUser(localStorage.getItem('hpticket_username'));
    window.addEventListener('hpticket_mode_changed', handleModeChange);
    window.addEventListener('hpticket_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('hpticket_mode_changed', handleModeChange);
      window.removeEventListener('hpticket_auth_changed', handleAuthChange);
    };
  }, []);

  const activeUser = dbStore.getActiveUser() || { fullname: 'Loading...', username: 'loading', id: '', role_id: '' };
  const userRole = dbStore.roles.find((r) => r.id === activeUser.role_id);
  const license = dbStore.licenseConfig;

  // Group hubs
  const hubs = [
    { id: 'pos', label: 'Bán Vé & Đơn Hàng', icon: ShoppingCart, count: 3, badge: 'POS' },
    { id: 'location', label: 'Địa Điểm & Cổng', icon: MapPin, count: 5, badge: 'Cơ sở' },
    { id: 'ticketing', label: 'Mẫu Vé & Cấu Hình', icon: Ticket, count: 3, badge: 'Vé' },
    { id: 'marketing', label: 'Khách Hàng & MKT', icon: Building2, count: 4, badge: 'Đối tác' },
    { id: 'iam', label: 'Tài Khoản & Quyền', icon: Users, count: 3, badge: 'Phân quyền' },
    { id: 'reports', label: 'Báo Cáo & Thống Kê', icon: TrendingUp, count: 6, badge: 'Thống kê' },
  ];

  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-40 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100">
          {/* Brand & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                title="Bật / Tắt Menu Khai Báo Dạng Cây"
              >
                <Menu className="w-4 h-4 text-emerald-600" />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-xl text-white shadow-md shadow-emerald-600/20">
              HP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">HPTICKET</h1>
                {!jwtUser && (
                  <button
                    onClick={() => setLoginModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3 h-3" />
                    Đăng nhập hệ thống
                  </button>
                )}
                <button
                  onClick={async () => {
                    const synced = await dbStore.syncFromBackend(true);
                    if (synced) {
                      alert("✅ Đã tải dữ liệu mới nhất từ cơ sở dữ liệu Spring Boot (PostgreSQL)!");
                    } else {
                      alert("⚠️ Không thể tải dữ liệu. Kiểm tra máy chủ Java 8080 đang chạy hoặc đăng nhập lại.");
                    }
                  }}
                  title="Đồng bộ dữ liệu mới nhất"
                  className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 transition border border-slate-200 cursor-pointer"
                >
                  <Server className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-slate-500">Hệ Thống Khai Báo, Bán Vé POS & Soát Vé Cổng Lễ Hội</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 transition text-left"
              >
                <img 
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${activeUser.username}&backgroundColor=3f72af`}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-slate-200 bg-emerald-50"
                />
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">{activeUser.fullname}</p>
                  <p className="text-[10px] text-emerald-700 font-medium leading-none mt-0.5">
                    {userRole?.name || activeUser.username}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 ml-0.5" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-slate-800">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                    <img 
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${activeUser.username}&backgroundColor=3f72af`}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">{activeUser.fullname}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">@{activeUser.username}</p>
                    </div>
                  </div>
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition text-sm text-slate-700 font-medium cursor-pointer">
                      <UserCheck className="w-4 h-4 text-slate-400" /> Hồ sơ cá nhân
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition text-sm text-slate-700 font-medium cursor-pointer">
                      <Lock className="w-4 h-4 text-slate-400" /> Đổi mật khẩu
                    </button>
                  </div>
                  <div className="border-t border-slate-100 py-1 mt-1">
                    <button
                      onClick={() => {
                        localStorage.removeItem('hpticket_token');
                        localStorage.removeItem('hpticket_username');
                        setJwtUser(null);
                        window.dispatchEvent(new Event('hpticket_auth_changed'));
                        setUserDropdownOpen(false);
                        // ĐẨY VỀ TRANG LOGIN NGAY LẬP TỨC
                        window.location.hash = '/login';
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-rose-50 text-rose-600 transition text-sm font-bold cursor-pointer"
                    >
                      <Key className="w-4 h-4" /> Đăng xuất hệ thống
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* License & System Lock Manager Modal */}
      <LicenseManagerModal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        onStateChange={() => {
          onUserSwitch(); // Trigger re-render across app
        }}
      />

      {/* Login Modal for JWT Authentication */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(username) => {
          setJwtUser(username);
          onUserSwitch();
        }}
      />
    </header>
  );
};
