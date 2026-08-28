import React, { useState } from 'react';
import { usePermission } from '../hooks/usePermission';
import {
  Settings,
  Ticket,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  MapPin,
  Store,
  ShieldCheck,
  Server,
  Layers,
  Shield,
  UserCheck,
  Calendar,
  Gift,
  ShoppingCart,
  Receipt,
  QrCode,
  TrendingUp,
  Package,
  Clock,
  FileText,
  Home,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  activeSubTab: string;
  onSelectRoute: (module: string, subTab?: string) => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  activeSubTab,
  onSelectRoute,
  isOpen,
  onToggleSidebar,
}) => {
  // Accordion open/close states
  const [khaibaoOpen, setKhaibaoOpen] = useState(true);
  const [quanlyveOpen, setQuanlyveOpen] = useState(true);
  const [baocaoOpen, setBaocaoOpen] = useState(true);
  const [dichvuOpen, setDichvuOpen] = useState(false);

  const handleNavClick = (module: string, subTab?: string) => {
    onSelectRoute(module, subTab);
    if (window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };


  const declarationMenu = [
    { label: 'Khai báo thông tin công ty', module: 'location', subTab: 'khaibaocongty', icon: Building2 },
    { label: 'Khai báo nhóm nguồn khách', module: 'marketing', subTab: 'khaibaoNhomNguonKhach', icon: Users },
    { label: 'Khai báo nguồn khách', module: 'marketing', subTab: 'KhaiBaoNguonKhach', icon: Building2 },
    { label: 'Khai báo điểm bán vé', module: 'location', subTab: 'KhaiBaoDiemBanVe', icon: MapPin },
    { label: 'Khai báo quầy bán vé', module: 'location', subTab: 'KhaiBaoQuayVe', icon: Store },
    { label: 'Khai báo khu kiểm soát', module: 'location', subTab: 'KhaibaosKhuKiemSoat', icon: ShieldCheck },
    { label: 'Khai báo cửa kiểm soát', module: 'location', subTab: 'KhaiBaoCuaKS', icon: Server },
    { label: 'Khai báo đối tượng', module: 'ticketing', subTab: 'KhaiBaoDoiTuong', icon: Users },
    { label: 'Khai báo mẫu vé / Loại vé', module: 'ticketing', subTab: 'KhaibaoVe', icon: Ticket },
    { label: 'Khai báo nhóm vé áp dụng (Khu vực)', module: 'ticketing', subTab: 'KhaiBaoVe_KS', icon: Layers },
    { label: 'Khai báo nhóm quyền', module: 'iam', subTab: 'KhaiBaoPhanQuyen', icon: Shield },
    { label: 'Khai báo tài khoản đăng nhập', module: 'iam', subTab: 'KhaibaoDangNhap', icon: UserCheck },
    { label: 'Khai báo thẻ nhân viên / QR', module: 'iam', subTab: 'KhaiBaoThe_NV', icon: QrCode },
    { label: 'Khai báo các ngày lễ', module: 'marketing', subTab: 'Hoiday', icon: Calendar },
    { label: 'Khai báo chương trình khuyến mại', module: 'marketing', subTab: 'KhaiBaoKhuyenMai', icon: Gift },
    { label: 'Quản lý kho & Sản phẩm', module: 'inventory', icon: Package },
  ];

  const posMenu = [
    { label: 'Đặt vé / Bán vé thu ngân', module: 'pos', icon: ShoppingCart, badge: 'POS' },
    { label: 'Danh sách hóa đơn vé', module: 'orders', icon: Receipt },
    { label: 'Kiểm tra vé / Soát cổng', module: 'gate', icon: QrCode },
  ];

  const reportsMenu = [
    { label: 'Báo cáo doanh thu tổng hợp', module: 'reports', subTab: 'BaoCaoDoanhThu', icon: TrendingUp },
    { label: 'Báo cáo doanh thu chi tiết vé', module: 'reports', subTab: 'BaoCaoVeChiTiet', icon: Ticket },
    { label: 'Doanh thu nhân viên / tháng', module: 'reports', subTab: 'BaoCaoDoanhThu_User_Thang', icon: UserCheck },
    {
      label: 'Doanh thu dịch vụ & Loại vé',
      icon: Package,
      children: [
        { label: 'Doanh thu theo loại vé', module: 'reports', subTab: 'BaoCaoDoanhThu_LoaiVe', icon: Ticket },
        { label: 'Doanh thu theo sản phẩm', module: 'reports', subTab: 'BaoCaoDoanhThu_SanPham', icon: Package },
      ],
    },
    { label: 'Báo cáo ra vào cổng', module: 'reports', subTab: 'BaoCaoRaVao', icon: Clock },
    { label: 'Nhật ký lịch sử hệ thống', module: 'reports', subTab: 'BaoCaoHeThong', icon: FileText, requirePermission: 'VIEW_SYSTEM_LOG' },
  ];

  // Xác định quyền bằng cách đọc JWT token — động, không fix cứng role
  const { can } = usePermission();

  const isRouteActive = (module: string, subTab?: string) => {
    if (activeTab !== module) return false;
    if (subTab) return activeSubTab === subTab;
    return true;
  };

  const isAnyChildActive = (children: any[]) => {
    return children.some(child => isRouteActive(child.module, child.subTab));
  };

  return (
    <aside
      className={`sticky top-16 shrink-0 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-xs z-20 overflow-x-hidden ${isOpen ? 'w-72 min-w-[18rem]' : 'w-14 min-w-[3.5rem]'
        }`}
    >
      {/* Sidebar Header / Collapse Toggle */}
      <div className="p-3 border-b border-slate-200 flex items-center justify-center bg-slate-50/80 min-h-[3.5rem]">
        <div className={`flex items-center gap-2 overflow-hidden transition-all ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 whitespace-nowrap">
            Danh Mục Hệ Thống
          </span>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-200">
        {/* 1. KHAI BÁO SECTION */}
        <div className="space-y-1">
          <button
            onClick={() => setKhaibaoOpen(!khaibaoOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${declarationMenu.some((item) => isRouteActive(item.module, item.subTab))
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100'
              }`}
            title="Khai Báo Hệ Thống"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>Khai Báo Hệ Thống</span>
            </div>
            {isOpen && (
              khaibaoOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {khaibaoOpen && (
            <div className={`space-y-0.5 ${isOpen ? 'pl-3 border-l border-slate-200 ml-3 mt-1' : 'pl-0 border-none ml-0 mt-1'}`}>
              {declarationMenu.map((item, idx) => {
                const Icon = item.icon;
                const active = isRouteActive(item.module, item.subTab);
                return (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item.module, item.subTab)}
                    title={item.label}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${active
                        ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. QUẢN LÝ VẾ & POS SECTION */}
        <div className="space-y-1">
          <button
            onClick={() => setQuanlyveOpen(!quanlyveOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${posMenu.some((item) => isRouteActive(item.module))
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-700 hover:bg-slate-100'
              }`}
            title="Quản Lý Vé & POS"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Ticket className="w-4 h-4 text-blue-600 shrink-0" />
              <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>Quản Lý Vé & POS</span>
            </div>
            {isOpen && (
              quanlyveOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {quanlyveOpen && (
            <div className={`space-y-0.5 ${isOpen ? 'pl-3 border-l border-slate-200 ml-3 mt-1' : 'pl-0 border-none ml-0 mt-1'}`}>
              {posMenu.map((item, idx) => {
                const Icon = item.icon;
                const active = isRouteActive(item.module);
                return (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item.module)}
                    title={item.label}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${active
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>{item.label}</span>
                    </div>
                    {item.badge && isOpen && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-bold shrink-0 border border-blue-200">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. BÁO CÁO & THỐNG KÊ SECTION */}
        <div className="space-y-1">
          <button
            onClick={() => setBaocaoOpen(!baocaoOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${reportsMenu.some((item) => isRouteActive(item.module, item.subTab))
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'text-slate-700 hover:bg-slate-100'
              }`}
            title="Báo Cáo & Thống Kê"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <BarChart3 className="w-4 h-4 text-purple-600 shrink-0" />
              <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>Báo Cáo & Thống Kê</span>
            </div>
            {isOpen && (
              baocaoOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
          </button>

          {baocaoOpen && (
            <div className={`space-y-0.5 ${isOpen ? 'pl-3 border-l border-slate-200 ml-3 mt-1' : 'pl-0 border-none ml-0 mt-1'}`}>
              {reportsMenu.map((item, idx) => {
                // Ẩn menu nếu requirePermission được khai báo mà user không có quyền đó
                if (item.requirePermission && !can(item.requirePermission)) return null;

                if (item.children) {
                  const hasActiveChild = isAnyChildActive(item.children);
                  return (
                    <div key={idx} className="space-y-1">
                      <button
                        onClick={() => setDichvuOpen(!dichvuOpen)}
                        title={item.label}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${hasActiveChild ? 'bg-purple-100 text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <item.icon className={`w-3.5 h-3.5 shrink-0 ${hasActiveChild ? 'text-purple-600' : 'text-slate-400'}`} />
                          <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>{item.label}</span>
                        </div>
                        {isOpen && (
                          dichvuOpen || hasActiveChild ? <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {(dichvuOpen || hasActiveChild) && (
                        <div className={`space-y-0.5 ${isOpen ? 'pl-5 border-l border-slate-200 ml-4' : 'pl-0 border-none ml-0'}`}>
                          {item.children.map((child, cIdx) => {
                            const cActive = isRouteActive(child.module, child.subTab);
                            return (
                              <button
                                key={cIdx}
                                onClick={() => handleNavClick(child.module, child.subTab)}
                                title={child.label}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${cActive
                                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                              >
                                <child.icon className={`w-3.5 h-3.5 shrink-0 ${cActive ? 'text-white' : 'text-slate-400'}`} />
                                <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const Icon = item.icon;
                const active = isRouteActive(item.module, item.subTab);
                return (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item.module, item.subTab)}
                    title={item.label}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${active
                        ? 'bg-purple-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className={`p-3 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 ${isOpen ? 'block' : 'hidden'}`}>
        <p className="font-semibold text-slate-700">HPTicket POS v2.4 Enterprise</p>
        <p>Hệ thống bán vé & kiểm soát cổng ra vào</p>
      </div>
    </aside>
  );
};
