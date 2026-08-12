import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './shared/components/Header';
import { Sidebar } from './shared/components/Sidebar';

// Lazy load modules (Code Splitting)
const POSModule = lazy(() => import('./features/pos/pages/POSModule').then(m => ({ default: m.POSModule })));
const GateScannerModule = lazy(() => import('./features/ticketing/pages/GateScannerModule').then(m => ({ default: m.GateScannerModule })));
const OrdersModule = lazy(() => import('./features/orders/pages/OrdersModule').then(m => ({ default: m.OrdersModule })));
const LocationModule = lazy(() => import('./features/locations/pages/LocationModule').then(m => ({ default: m.LocationModule })));
const TicketingModule = lazy(() => import('./features/ticketing/pages/TicketingModule').then(m => ({ default: m.TicketingModule })));
const MarketingModule = lazy(() => import('./features/marketing/pages/MarketingModule').then(m => ({ default: m.MarketingModule })));
const IAMModule = lazy(() => import('./features/iam/pages/IAMModule').then(m => ({ default: m.IAMModule })));
const InventoryModule = lazy(() => import('./features/inventory/pages/InventoryModule').then(m => ({ default: m.InventoryModule })));
const ReportsModule = lazy(() => import('./features/reports/pages/ReportsModule').then(m => ({ default: m.ReportsModule })));
const SystemLockScreen = lazy(() => import('./features/auth/pages/SystemLockScreen').then(m => ({ default: m.SystemLockScreen })));
const LoginScreen = lazy(() => import('./features/auth/pages/LoginScreen').then(m => ({ default: m.LoginScreen })));
import { dbStore } from './shared/data/mockDatabase';

export default function App() {
  const getInitialTab = () => {
    const hash = window.location.hash.replace('#/', '');
    if (!hash) return 'reports';
    return hash.split('/')[0] || 'reports';
  };

  const getInitialSubTab = () => {
    const hash = window.location.hash.replace('#/', '');
    if (!hash) return 'BaoCaoDoanhThu';
    return hash.split('/')[1] || 'BaoCaoDoanhThu';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [activeSubTab, setActiveSubTab] = useState<string>(getInitialSubTab);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [userContextKey, setUserContextKey] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(dbStore.isSystemLocked());

  // Check system lock state periodically (every 1 second)
  useEffect(() => {
    const checkLockState = () => {
      const locked = dbStore.isSystemLocked();
      setIsLocked(locked);
    };

    checkLockState();
    const interval = setInterval(checkLockState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem('hpticket_token');
    const hash = window.location.hash.replace('#/', '');
    if (!token && !hash.startsWith('login')) {
      window.location.hash = '/login';
    }
  }, [activeTab]); // Run when activeTab changes

  // Disable eager backend sync on mount to avoid loading all APIs
  useEffect(() => {
    const handleDataSynced = () => setUserContextKey((prev) => prev + 1);
    window.addEventListener('hpticket_data_synced', handleDataSynced);
    return () => {
      window.removeEventListener('hpticket_data_synced', handleDataSynced);
    };
  }, []);

  // Hash-based routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '') || 'reports/BaoCaoDoanhThu';
      const [module, subTab] = hash.split('/');
      setActiveTab(module);
      if (subTab) setActiveSubTab(subTab);
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Init
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Lắng nghe sự kiện hết hạn token JWT (401) từ apiConfig
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      setToastMessage(e.detail?.message || 'Phiên đăng nhập đã hết hạn!');
      // Ẩn toast sau 2 giây (để kịp redirect)
      setTimeout(() => setToastMessage(null), 2000);
    };
    window.addEventListener('session_expired', handleSessionExpired);
    return () => window.removeEventListener('session_expired', handleSessionExpired);
  }, []);

  const handleUserSwitch = () => {
    setUserContextKey((prev) => prev + 1);
    setIsLocked(dbStore.isSystemLocked());
  };

  const handleSelectRoute = (module: string, subTab?: string) => {
    let finalSubTab = subTab;
    if (!subTab) {
      if (module === 'location') finalSubTab = 'khaibaocongty';
      if (module === 'ticketing') finalSubTab = 'KhaiBaoDoiTuong';
      if (module === 'marketing') finalSubTab = 'khaibaoNhomNguonKhach';
      if (module === 'iam') finalSubTab = 'KhaiBaoPhanQuyen';
      if (module === 'reports') finalSubTab = 'BaoCaoDoanhThu';
    }
    
    // Update hash to show path
    window.location.hash = `/${module}${finalSubTab ? `/${finalSubTab}` : ''}`;
  };

  // Render trang Login độc lập nếu đang ở route login
  if (activeTab === 'login') {
    return (
      <>
        {/* Vẫn giữ Toast chung cho toàn App kể cả khi ở Login */}
        {toastMessage && (
          <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="font-semibold">{toastMessage}</div>
          </div>
        )}
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-100"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <LoginScreen onLoginSuccess={() => window.location.hash = '/reports/BaoCaoDoanhThu'} />
        </Suspense>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-emerald-600 selection:text-white flex flex-col">
      {/* Toast thông báo lỗi JWT */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="font-semibold">{toastMessage}</div>
        </div>
      )}

      {/* Full screen System Lock Overlay when locked */}
      {isLocked && (
        <Suspense fallback={<div className="fixed inset-0 z-[9999] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}>
          <SystemLockScreen
            onUnlocked={() => {
              setIsLocked(false);
              setUserContextKey((prev) => prev + 1);
            }}
          />
        </Suspense>
      )}

      {/* Top Header & 24 API Command Palette Search */}
      <Header
        activeTab={activeTab}
        activeSubTab={activeSubTab}
        onSelectRoute={handleSelectRoute}
        onUserSwitch={handleUserSwitch}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Workspace Layout with Left Sidebar Drawer */}
      <div className="flex-1 flex relative">
        <Sidebar
          activeTab={activeTab}
          activeSubTab={activeSubTab}
          onSelectRoute={handleSelectRoute}
          isOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 pb-12">
          <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center h-full pt-32 text-slate-400">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium">Đang tải dữ liệu...</p>
            </div>
          }>
            {activeTab === 'pos' && <POSModule />}
            {activeTab === 'gate' && <GateScannerModule />}
            {activeTab === 'orders' && <OrdersModule />}
            {activeTab === 'location' && <LocationModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
            {activeTab === 'ticketing' && <TicketingModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
            {activeTab === 'marketing' && <MarketingModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
            {activeTab === 'iam' && <IAMModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
            {activeTab === 'inventory' && <InventoryModule />}
            {activeTab === 'reports' && <ReportsModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

