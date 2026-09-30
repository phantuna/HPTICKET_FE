import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
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
const SystemModule = lazy(() => import('./features/system/pages/SystemModule').then(m => ({ default: m.SystemModule })));
const SystemLockScreen = lazy(() => import('./features/auth/pages/SystemLockScreen').then(m => ({ default: m.SystemLockScreen })));
const LoginScreen = lazy(() => import('./features/auth/pages/LoginScreen').then(m => ({ default: m.LoginScreen })));
import { SessionLoginModal } from './shared/components/SessionLoginModal';
import { RateLimitCountdownToast } from './shared/components/RateLimitCountdownToast';
import { dbStore } from './shared/data/mockDatabase';
import { physicalBackupService } from './api/physicalBackupService';
import { hasPermission } from './shared/utils/permissionGuard';

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

  // Check system lock state on mount and listen to lock events (eliminate 1000ms polling)
  useEffect(() => {
    setIsLocked(dbStore.isSystemLocked());
    const handleLockChanged = () => setIsLocked(dbStore.isSystemLocked());
    window.addEventListener('hpticket_lock_changed', handleLockChanged);
    return () => window.removeEventListener('hpticket_lock_changed', handleLockChanged);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isInitializing, setIsInitializing] = useState(true);

  // Check authentication status once on startup (Mount only, not on every activeTab switch)
  useEffect(() => {
    const initializeAuth = async () => {
      const hash = window.location.hash.replace('#/', '');
      
      if (hash.startsWith('login')) {
        setIsInitializing(false);
        return;
      }

      try {
        const { tokenRefreshService } = await import('./api/tokenRefreshService');
        const { authState } = await import('./api/authState');
        const token = authState.getToken();
        
        if (token) {
          setIsInitializing(false);
          return; // Đã đăng nhập trong phiên memory này
        }

        // Thử khôi phục session bằng Silent Refresh
        const recovered = await tokenRefreshService.resume();
        if (!recovered) {
          window.location.hash = '/login';
        }
      } catch (err) {
        console.error("Init auth failed:", err);
        window.location.hash = '/login';
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, []);
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
  const [toastInfo, setToastInfo] = useState<{message: string, title: string, type: 'error' | 'success'} | null>(null);
  useEffect(() => {
    const handleSessionExpired = (e: any) => {
      setToastInfo({ message: e.detail?.message || 'Phiên đăng nhập đã hết hạn!', title: 'Hết hạn đăng nhập', type: 'error' });
      setTimeout(() => setToastInfo(null), 3500);
      window.location.hash = '/login'; // Chuyển hướng ngay lập tức về trang đăng nhập
    };
    window.addEventListener('session_expired', handleSessionExpired);
    
    const handleModalExpired = () => {
      window.location.hash = '/login';
    };
    window.addEventListener('session_expired_modal', handleModalExpired);
    
    return () => {
      window.removeEventListener('session_expired', handleSessionExpired);
      window.removeEventListener('session_expired_modal', handleModalExpired);
    };
  }, []);

  const lastToastRef = useRef<{ message: string; time: number }>({ message: '', time: 0 });
  const toastTimerRef = useRef<any>(null);

  const triggerToast = useCallback((info: { message: string; title: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
    const now = Date.now();
    // Bỏ qua toast trùng lặp nội dung trong vòng 1.5s
    if (lastToastRef.current.message === info.message && now - lastToastRef.current.time < 1500) {
      return;
    }
    lastToastRef.current = { message: info.message, time: now };
    setToastInfo(info);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastInfo(null), 4000);
  }, []);

  // Lắng nghe các lỗi nghiệp vụ từ API (Business Exceptions)
  useEffect(() => {
    const handleApiError = (e: any) => {
      triggerToast({ message: e.detail?.message || 'Đã xảy ra lỗi hệ thống khi gọi API!', title: 'Lỗi hệ thống', type: 'error' });
    };
    window.addEventListener('api_error', handleApiError);
    return () => window.removeEventListener('api_error', handleApiError);
  }, [triggerToast]);

  // Lắng nghe Toast chung (Thành công/Thất bại/Cảnh báo từ code người dùng gọi)
  useEffect(() => {
    const handleToast = (e: any) => {
      triggerToast({ message: e.detail?.message, title: e.detail?.title || 'Thông báo', type: e.detail?.type || 'success' });
    };
    window.addEventListener('toast_notification', handleToast);
    return () => window.removeEventListener('toast_notification', handleToast);
  }, [triggerToast]);

  // Global background watcher for backup jobs (theo dõi tiến trình kể cả khi user rời trang Sao lưu sang POS bán vé)
  useEffect(() => {
    let timer: any = null;
    let isMonitoring = false;
    let lastActiveCount = 0;

    const checkBackupStatus = async () => {
      if (!hasPermission('SUPER_ADMIN')) return;
      try {
        const res = await physicalBackupService.getAllBackups();
        const data = (res as any)?.data || res;
        if (Array.isArray(data)) {
          const activeJobs = data.filter((b: any) => b.status === 'RUNNING' || b.status === 'PENDING');
          if (activeJobs.length > 0) {
            isMonitoring = true;
            lastActiveCount = activeJobs.length;
            timer = setTimeout(checkBackupStatus, 4000);
          } else {
            if (isMonitoring && lastActiveCount > 0) {
              const latest = data[0];
              if (latest?.status === 'COMPLETED') {
                triggerToast({
                  title: 'Sao lưu CSDL hoàn tất',
                  message: `Bản sao lưu CSDL (${latest.fileName || latest.backupId}) đã tạo thành công và sẵn sàng để tải về!`,
                  type: 'success',
                });
              } else if (latest?.status === 'FAILED') {
                triggerToast({
                  title: 'Sao lưu CSDL thất bại',
                  message: latest.errorMessage || 'Tiến trình sao lưu gặp sự cố.',
                  type: 'error',
                });
              }
              window.dispatchEvent(new CustomEvent('backup_job_completed'));
            }
            isMonitoring = false;
            lastActiveCount = 0;
          }
        }
      } catch (_) {}
    };

    const handleJobStarted = () => {
      isMonitoring = true;
      lastActiveCount = 1;
      if (timer) clearTimeout(timer);
      timer = setTimeout(checkBackupStatus, 2000);
    };

    window.addEventListener('backup_job_started', handleJobStarted);
    return () => {
      window.removeEventListener('backup_job_started', handleJobStarted);
      if (timer) clearTimeout(timer);
    };
  }, [triggerToast]);

  const handleUserSwitch = useCallback(() => {
    setUserContextKey((prev) => prev + 1);
    setIsLocked(dbStore.isSystemLocked());
  }, []);

  const handleSelectRoute = useCallback((module: string, subTab?: string) => {
    let finalSubTab = subTab;
    if (!subTab) {
      if (module === 'location') finalSubTab = 'khaibaocongty';
      if (module === 'ticketing') finalSubTab = 'KhaiBaoDoiTuong';
      if (module === 'marketing') finalSubTab = 'khaibaoNhomNguonKhach';
      if (module === 'iam') finalSubTab = 'KhaiBaoPhanQuyen';
      if (module === 'reports') finalSubTab = 'BaoCaoDoanhThu';
      if (module === 'system') finalSubTab = 'BackupRestore';
    }
    
    // Update hash to show path
    window.location.hash = `/${module}${finalSubTab ? `/${finalSubTab}` : ''}`;
  }, []);

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin shadow-md"></div>
          <p className="text-slate-500 font-medium text-sm animate-pulse">Khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  // Render trang Login độc lập nếu đang ở route login
  if (activeTab === 'login') {
    return (
      <>
        {/* Vẫn giữ Toast chung cho toàn App kể cả khi ở Login */}
        {toastInfo && (
          <div className={`fixed top-8 right-8 z-[9999] p-4 rounded-xl shadow-xl flex items-start gap-3 min-w-[340px] max-w-md transform transition-all duration-300 ease-out border-l-4 bg-white ${
            toastInfo.type === 'error' ? 'border-rose-500 text-slate-800' :
            toastInfo.type === 'warning' ? 'border-amber-500 text-slate-800' :
            toastInfo.type === 'info' ? 'border-blue-500 text-slate-800' :
            'border-emerald-500 text-slate-800'
          }`}>
            <div className={`mt-0.5 shrink-0 ${
              toastInfo.type === 'error' ? 'text-rose-500' :
              toastInfo.type === 'warning' ? 'text-amber-500' :
              toastInfo.type === 'info' ? 'text-blue-500' :
              'text-emerald-500'
            }`}>
              {toastInfo.type === 'error' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              ) : toastInfo.type === 'warning' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              ) : toastInfo.type === 'info' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900">{toastInfo.title}</h4>
              <p className="text-xs mt-1 text-slate-600 leading-relaxed break-words">{toastInfo.message}</p>
            </div>
            <button onClick={() => setToastInfo(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1" title="Đóng">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        )}
        <RateLimitCountdownToast />
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-slate-100"><div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div></div>}>
          <LoginScreen onLoginSuccess={() => window.location.hash = '/reports/BaoCaoDoanhThu'} />
        </Suspense>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-emerald-600 selection:text-white flex flex-col">
      {toastInfo && (
        <div className={`fixed top-8 right-8 z-[9999] p-4 rounded-xl shadow-xl flex items-start gap-3 min-w-[340px] max-w-md transform transition-all duration-300 ease-out border-l-4 bg-white ${
          toastInfo.type === 'error' ? 'border-rose-500 text-slate-800' :
          toastInfo.type === 'warning' ? 'border-amber-500 text-slate-800' :
          toastInfo.type === 'info' ? 'border-blue-500 text-slate-800' :
          'border-emerald-500 text-slate-800'
        }`}>
          <div className={`mt-0.5 shrink-0 ${
            toastInfo.type === 'error' ? 'text-rose-500' :
            toastInfo.type === 'warning' ? 'text-amber-500' :
            toastInfo.type === 'info' ? 'text-blue-500' :
            'text-emerald-500'
          }`}>
            {toastInfo.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            ) : toastInfo.type === 'warning' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            ) : toastInfo.type === 'info' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900">{toastInfo.title}</h4>
            <p className="text-xs mt-1 text-slate-600 leading-relaxed break-words">{toastInfo.message}</p>
          </div>
          <button onClick={() => setToastInfo(null)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 -mr-1" title="Đóng">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
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
        <main className={`flex-1 min-w-0 ${activeTab === 'pos' ? 'h-[calc(100vh-64px)]' : 'pb-12'}`}>
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
            {activeTab === 'system' && <SystemModule subTab={activeSubTab} onSelectSubTab={setActiveSubTab} />}
          </Suspense>
        </main>
      </div>

      <RateLimitCountdownToast />
      <SessionLoginModal />
    </div>
  );
}

