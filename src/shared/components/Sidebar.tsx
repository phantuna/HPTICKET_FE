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
  CalendarClock,
  Gift,
  ShoppingCart,
  Receipt,
  QrCode,
  TerminalSquare,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  TrendingUp,
  Package,
  Clock,
  FileText,
  Home,
  Menu,
  X,
  Mail,
  Database
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
  const [saoluuOpen, setSaoluuOpen] = useState(true);

  const handleNavClick = (module: string, subTab?: string) => {
    onSelectRoute(module, subTab);
    if (window.innerWidth < 1024) {
      onToggleSidebar();
    }
  };


  const declarationMenu = [
    { label: 'Khai báo thông tin công ty', module: 'location', subTab: 'khaibaocongty', icon: Building2, requirePermission: 'VIEW_COMPANY' },
    { label: 'Khai báo nhóm nguồn khách', module: 'marketing', subTab: 'khaibaoNhomNguonKhach', icon: Users, requirePermission: 'VIEW_CUSTOMER_GROUP' },
    { label: 'Khai báo nguồn khách', module: 'marketing', subTab: 'KhaiBaoNguonKhach', icon: Building2, requirePermission: 'VIEW_CUSTOMER_SOURCE' },
    { label: 'Khai báo điểm bán vé', module: 'location', subTab: 'KhaiBaoDiemBanVe', icon: MapPin, requirePermission: 'VIEW_SALES_LOCATION' },
    { label: 'Khai báo quầy bán vé', module: 'location', subTab: 'KhaiBaoQuayVe', icon: Store, requirePermission: 'VIEW_SALES_COUNTER' },
    { label: 'Khai báo khu kiểm soát', module: 'location', subTab: 'KhaibaosKhuKiemSoat', icon: ShieldCheck, requirePermission: 'VIEW_CONTROL_ZONE' },
    { label: 'Khai báo cửa kiểm soát', module: 'location', subTab: 'KhaiBaoCuaKS', icon: Server, requirePermission: 'VIEW_CONTROL_GATE' },
    { label: 'Khai báo đối tượng', module: 'ticketing', subTab: 'KhaiBaoDoiTuong', icon: Users, requirePermission: 'VIEW_AUDIENCE_TYPE' },
    { label: 'Khai báo mẫu vé / Loại vé', module: 'ticketing', subTab: 'KhaibaoVe', icon: Ticket, requirePermission: 'VIEW_TICKET_TEMPLATE' },
    { label: 'Khai báo nhóm vé áp dụng (Khu vực)', module: 'ticketing', subTab: 'KhaiBaoVe_KS', icon: Layers, requirePermission: 'VIEW_TICKET_ZONE' },
    { label: 'Quản lý vé tháng', module: 'ticketing', subTab: 'VeThangHetHan', icon: CalendarClock, requirePermission: 'VIEW_ISSUED_TICKET' },
    { label: 'Khai báo nhóm quyền', module: 'iam', subTab: 'KhaiBaoPhanQuyen', icon: Shield, requirePermission: 'VIEW_ROLE' },
    { label: 'Khai báo tài khoản đăng nhập', module: 'iam', subTab: 'KhaibaoDangNhap', icon: UserCheck, requirePermission: 'VIEW_USER' },
    { label: 'Khai báo thẻ nhân viên / QR', module: 'iam', subTab: 'KhaiBaoThe_NV', icon: QrCode, requirePermission: 'VIEW_USER' },
    { label: 'Khai báo các ngày lễ', module: 'marketing', subTab: 'Hoiday', icon: Calendar, requirePermission: 'VIEW_HOLIDAY' },
    { label: 'Khai báo chương trình khuyến mại', module: 'marketing', subTab: 'KhaiBaoKhuyenMai', icon: Gift, requirePermission: 'VIEW_PROMOTION' },
    { label: 'Quản lý kho & Sản phẩm', module: 'inventory', icon: Package, requirePermission: 'VIEW_PRODUCT' },
  ];

  const posMenu = [
    { label: 'Đặt vé / Bán vé thu ngân', module: 'pos', icon: ShoppingCart, badge: 'POS', requirePermission: 'CREATE_ORDER' },
    { label: 'Danh sách hóa đơn vé', module: 'orders', icon: Receipt, requirePermission: 'VIEW_ORDER' },
    { label: 'Kiểm tra vé / Soát cổng', module: 'gate', icon: QrCode, requirePermission: 'SCAN_TICKET' },
  ];

  const reportsMenu = [
    { label: 'Báo cáo doanh thu tổng quan', module: 'reports', subTab: 'BaoCaoDoanhThu', icon: TrendingUp, requirePermission: 'VIEW_REPORT' },
    { label: 'Báo cáo so sánh doanh thu', module: 'reports', subTab: 'BaoCaoSoSanh', icon: BarChart3, requirePermission: 'VIEW_REPORT' },
    { label: 'Báo cáo doanh thu chi tiết vé', module: 'reports', subTab: 'BaoCaoVeChiTiet', icon: Ticket, requirePermission: 'VIEW_REPORT' },
    { label: 'Doanh thu nhân viên / tháng', module: 'reports', subTab: 'BaoCaoDoanhThu_User_Thang', icon: UserCheck, requirePermission: 'VIEW_REPORT' },
    {
      label: 'Doanh thu dịch vụ & Loại vé',
      icon: Package,
      children: [
        { label: 'Doanh thu theo loại vé', module: 'reports', subTab: 'BaoCaoDoanhThu_LoaiVe', icon: Ticket, requirePermission: 'VIEW_REPORT' },
        { label: 'Doanh thu theo sản phẩm', module: 'reports', subTab: 'BaoCaoDoanhThu_SanPham', icon: Package, requirePermission: 'VIEW_REPORT' },
      ],
    },
    { label: 'Báo cáo ra vào cổng', module: 'reports', subTab: 'BaoCaoRaVao', icon: Clock, requirePermission: 'VIEW_REPORT' },
    { label: 'Nhật ký lịch sử hệ thống', module: 'reports', subTab: 'BaoCaoHeThong', icon: FileText, requirePermission: 'VIEW_SYSTEM_LOG' },
  ];

  const systemMenu = [
    { label: 'Sao lưu & Phục hồi dữ liệu', module: 'system', subTab: 'BackupRestore', icon: Database, requirePermission: 'SUPER_ADMIN' },
  ];

  // Xác định quyền bằng cách đọc JWT token — động, không fix cứng role
  const { can, isAdmin } = usePermission();

  // Lọc menu dựa trên quyền (RBAC)
  const filteredDeclarationMenu = declarationMenu.filter(item => !item.requirePermission || can(item.requirePermission));
  const filteredPosMenu = posMenu.filter(item => !item.requirePermission || can(item.requirePermission));
  const filteredReportsMenu = reportsMenu.map(item => {
    if (item.children) {
      return {
        ...item,
        children: item.children.filter(child => !child.requirePermission || can(child.requirePermission))
      };
    }
    return item;
  }).filter(item => {
    if (item.requirePermission && !can(item.requirePermission)) return false;
    if (item.children && item.children.length === 0) return false;
    return true;
  });

  const filteredSystemMenu = systemMenu.filter(item => isAdmin);

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
        {filteredDeclarationMenu.length > 0 && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setKhaibaoOpen(!khaibaoOpen)}
              aria-expanded={khaibaoOpen}
              aria-label="Khai Báo Hệ Thống"
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${filteredDeclarationMenu.some((item) => isRouteActive(item.module, item.subTab))
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
                {filteredDeclarationMenu.map((item, idx) => {
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
        )}

        {/* 2. QUẢN LÝ VẾ & POS SECTION */}
        {filteredPosMenu.length > 0 && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setQuanlyveOpen(!quanlyveOpen)}
              aria-expanded={quanlyveOpen}
              aria-label="Quản Lý Vé & POS"
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${filteredPosMenu.some((item) => isRouteActive(item.module))
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
                {filteredPosMenu.map((item, idx) => {
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
        )}

        {/* 3. BÁO CÁO & THỐNG KÊ SECTION */}
        {filteredReportsMenu.length > 0 && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setBaocaoOpen(!baocaoOpen)}
              aria-expanded={baocaoOpen}
              aria-label="Báo Cáo & Thống Kê"
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${filteredReportsMenu.some((item) => isRouteActive(item.module, item.subTab) || (item.children && isAnyChildActive(item.children)))
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
                {filteredReportsMenu.map((item, idx) => {
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
        )}

        {/* 4. SAO LƯU HỆ THỐNG SECTION */}
        {filteredSystemMenu.length > 0 && (
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setSaoluuOpen(!saoluuOpen);
                handleNavClick('system', 'BackupRestore');
              }}
              aria-expanded={saoluuOpen}
              aria-label="Sao Lưu Hệ Thống"
              className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition text-left ${filteredSystemMenu.some((item) => isRouteActive(item.module, item.subTab))
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'text-slate-700 hover:bg-slate-100'
                }`}
              title="Sao Lưu Hệ Thống"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className={`truncate ${isOpen ? 'inline' : 'hidden'}`}>Sao Lưu Hệ Thống</span>
              </div>
              {isOpen && (
                saoluuOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </button>

            {saoluuOpen && (
              <div className={`space-y-0.5 ${isOpen ? 'pl-3 border-l border-slate-200 ml-3 mt-1' : 'pl-0 border-none ml-0 mt-1'}`}>
                {filteredSystemMenu.map((item, idx) => {
                  const Icon = item.icon;
                  const active = isRouteActive(item.module, item.subTab);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleNavClick(item.module, item.subTab)}
                      title={item.label}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition text-left ${active
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
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
        )}
      </div>

    </aside>
  );
};
