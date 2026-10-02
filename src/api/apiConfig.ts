/**
 * Centralized API Registry & Configuration Layer (Backend API Manager)
 * 
 * BÀI TOÁN QUẢN LÝ API BACKEND TẬP TRUNG CHO FRONTEND:
 * Khi Backend thay đổi URL, đường dẫn endpoint, format request/response hoặc bổ sung header auth,
 * Frontend KHÔNG CẦN đi tìm kiếm trong hàng chục component/file.
 * Tất cả chỉ cần cập nhật DUY NHẤT tại 1 file cấu hình này!
 */

// 1. Quản lý Domain Base URL cho các môi trường (Dev, Staging, Production, Local Spring Boot 8080)
export const API_BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : 'https://api.vnscout.io.vn/api/v1';

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
  bypassCache?: boolean;
  silent?: boolean;
}

// In-memory cache cho GET dropdown / master data
interface CacheEntry {
  timestamp: number;
  data: any;
}
const getCache = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 30000; // Cache 30s cho dropdowns

const CACHEABLE_PATTERNS = [
  '/master-data',
  '/active',
  '/templates',
  '/zones',
  '/products',
  '/iam/users/me',
  '/roles',
  '/sales/reports',
  '/sales/orders'
];

const isCacheableUrl = (url: string): boolean => {
  return CACHEABLE_PATTERNS.some(pattern => url.includes(pattern));
};

export const clearApiCache = (): void => {
  getCache.clear();
};

export const getUseMockApi = (): boolean => {
  // Đã chuyển sang dùng Backend API thật. Các service dùng if(true) để bypass hàm này.
  // Giữ false để phản ánh đúng trạng thái hệ thống — không dùng Mock nữa.
  return false;
};

export const setUseMockApi = (value: boolean): void => {
  localStorage.setItem('hpticket_use_mock_api', String(value));
  window.dispatchEvent(new Event('hpticket_mode_changed'));
};

export const toggleUseMockApi = (): boolean => {
  const current = getUseMockApi();
  setUseMockApi(!current);
  return !current;
};

// 2. TẬP TRUNG TẤT CẢ DANH SÁCH ENDPOINTS TRONG HỆ THỐNG
// Khi Backend đổi URL (Ví dụ: /api/v1/tickets -> /api/v2/tickets-management), chỉ cần sửa ở đây!
export const API_ENDPOINTS = {
  // 0. SYSTEM MASTER DATA
  SYSTEM: {
    MASTER_DATA: '/system/master-data',
    UPLOAD_LOGO: '/system/upload/logo',
  },
  // 1. MODULE IAM (Xác thực & Phân quyền) - Base: /api/v1/iam
  IAM: {
    AUTH_LOGIN: '/iam/auth/login',
    AUTH_ME: '/iam/auth/me',
    AUTH_REFRESH: '/iam/auth/refresh',           // Gia hạn phịn bằng Refresh Token
    AUTH_LOGOUT: '/iam/auth/logout',             // Đăng xuất an toàn (revoke token)
    AUTH_CHANGE_PASSWORD: '/iam/auth/change-password', // Đổi mật khẩu
    USERS: '/iam/users',
    USERS_ACTIVE: '/iam/users/active',
    USER_DETAIL: (id: string) => `/iam/users/${id}`,
    USER_STATUS: (id: string) => `/iam/users/${id}/status`,
    ROLES: '/iam/roles',
    ROLE_DETAIL: (id: string) => `/iam/roles/${id}`,
    ROLE_STATUS: (id: string) => `/iam/roles/${id}/status`,
    ROLE_PERMISSIONS: (id: string) => `/iam/roles/${id}/permissions`,
    PERMISSIONS: '/iam/permissions',
    SYSTEM_LOGS: '/iam/system-logs',
  },

  // 2. MODULE MARKETING (Nhóm khách, Khuyến mãi, Ngày lễ) - Base: /api/v1/marketing
  MARKETING: {
    CUSTOMER_GROUPS: '/marketing/customer-groups',
    CUSTOMER_GROUPS_ACTIVE: '/marketing/customer-groups/active',
    CUSTOMER_GROUP_DETAIL: (id: string) => `/marketing/customer-groups/${id}`,
    CUSTOMER_GROUP_STATUS: (id: string) => `/marketing/customer-groups/${id}/status`,
    CUSTOMER_SOURCES: '/marketing/customer-sources',
    CUSTOMER_SOURCES_ACTIVE: '/marketing/customer-sources/active',
    CUSTOMER_SOURCE_DETAIL: (id: string) => `/marketing/customer-sources/${id}`,
    CUSTOMER_SOURCE_STATUS: (id: string) => `/marketing/customer-sources/${id}/status`,
    COMPANIES: '/marketing/companies',
    COMPANY_DETAIL: (id: string) => `/marketing/companies/${id}`,
    COMPANY_STATUS: (id: string) => `/marketing/companies/${id}/status`,
    PROMOTIONS: '/marketing/promotions',
    PROMOTIONS_ACTIVE: '/marketing/promotions/active',
    PROMOTION_DETAIL: (id: string) => `/marketing/promotions/${id}`,
    PROMOTION_STATUS: (id: string) => `/marketing/promotions/${id}/status`,
    HOLIDAYS: '/marketing/holidays',
    HOLIDAY_DETAIL: (id: string) => `/marketing/holidays/${id}`,
    HOLIDAY_STATUS: (id: string) => `/marketing/holidays/${id}/status`,
    EMAIL_SETTINGS: '/marketing/email/settings',
    EMAIL_TEMPLATES: '/marketing/email/templates',
    EMAIL_TEMPLATE_DETAIL: (id: string) => `/marketing/email/templates/${id}`,
    SEND_TICKET_EMAIL: '/marketing/emails/send-ticket',
    CALENDAR_TODAY: '/business-calendar/today',
    CALENDAR_RESOLVE: '/business-calendar/resolve',
  },

  // 3. MODULE SALES (Điểm bán, Quầy bán, Hàng hóa & Đơn hàng POS) - Base: /api/v1/sales
  SALES: {
    LOCATIONS: '/sales/locations',
    LOCATION_DETAIL: (id: string) => `/sales/locations/${id}`,
    LOCATION_STATUS: (id: string) => `/sales/locations/${id}/status`,
    COUNTERS: '/sales/counters',
    COUNTERS_ACTIVE: '/sales/counters/active',
    COUNTER_DETAIL: (id: string) => `/sales/counters/${id}`,
    COUNTER_STATUS: (id: string) => `/sales/counters/${id}/status`,
    PRODUCTS: '/sales/products',
    PRODUCT_DETAIL: (id: string) => `/sales/products/${id}`,
    PRODUCT_STATUS: (id: string) => `/sales/products/${id}/status`,
    ORDERS: '/sales/orders',
    ORDER_DETAIL: (id: string) => `/sales/orders/${id}`,
    CANCEL_ORDER: (id: string) => `/sales/orders/${id}/cancel`,
    ISSUED_TICKETS: '/sales/issued-tickets',
    ISSUED_TICKET_DETAIL: (id: string) => `/sales/issued-tickets/${id}`,
    LOCK_ISSUED_TICKET: (id: string) => `/sales/issued-tickets/${id}/lock`,
    REPORTS_SUMMARY: '/sales/reports/summary',
    REPORTS_TICKET: '/sales/reports/ticket-revenue',
    REPORTS_PRODUCT: '/sales/reports/product-revenue',
    REPORTS_GENERAL: '/sales/reports/general',
    REPORTS_COMPARE: '/sales/reports/compare',
    REPORTS_SELLER: '/sales/reports/seller-revenue',
    EXPIRING_TICKETS: '/sales/issued-tickets/expiring-soon',
    EXPIRING_TICKETS_EXPORT: '/sales/issued-tickets/expiring-soon/export',
    UPDATE_CUSTOMER_INFO: (id: string) => `/sales/issued-tickets/${id}/customer-info`,
    RENEW_TICKET: (id: string) => `/sales/issued-tickets/${id}/renew`,
    STOCK_MOVEMENTS: '/sales/stock-movements',
    STOCK_MOVEMENTS_EXPORT_CHUNK: '/sales/stock-movements/export/chunk',
    BOOKINGS: '/sales/bookings',
    BOOKING_PUBLIC_TEMPLATES: '/sales/bookings/public/templates',
    BOOKING_PUBLIC_CREATE: '/sales/bookings/public',
    BOOKING_PUBLIC_LOOKUP: (code: string) => `/sales/bookings/public/lookup/${code}`,
    BOOKING_LOOKUP: (code: string) => `/sales/bookings/lookup/${code}`,
    BOOKING_LOOKUP_ALL: (code: string) => `/sales/bookings/lookup-all/${code}`,
    BOOKING_DETAIL: (id: string) => `/sales/bookings/${id}`,
    BOOKING_CHECKOUT: (id: string) => `/sales/bookings/${id}/checkout`,
    BOOKING_CANCEL: (id: string) => `/sales/bookings/${id}/cancel`,
    BOOKING_CONFIRM: (id: string) => `/sales/bookings/${id}/confirm`,
  },


  // 4. MODULE TICKETING (Cấu hình vé, Khu vực, Cổng & Soát vé) - Base: /api/v1/ticketing
  TICKETING: {
    ZONES: '/ticketing/zones',
    ZONE_DETAIL: (id: string) => `/ticketing/zones/${id}`,
    ZONE_STATUS: (id: string) => `/ticketing/zones/${id}/status`,
    AUDIENCE_TYPES: '/ticketing/audience-types',
    AUDIENCE_TYPE_DETAIL: (id: string) => `/ticketing/audience-types/${id}`,
    AUDIENCE_TYPE_STATUS: (id: string) => `/ticketing/audience-types/${id}/status`,
    TEMPLATES: '/ticketing/templates',
    TEMPLATE_DETAIL: (id: string) => `/ticketing/templates/${id}`,
    TEMPLATE_STATUS: (id: string) => `/ticketing/templates/${id}/status`,
    GATES: '/ticketing/gates',
    GATE_DETAIL: (id: string) => `/ticketing/gates/${id}`,
    GATE_STATUS: (id: string) => `/ticketing/gates/${id}/status`,
    CONTROL_ZONES: '/ticketing/control-zones',
    CONTROL_ZONE_DETAIL: (id: string) => `/ticketing/control-zones/${id}`,
    CONTROL_ZONE_STATUS: (id: string) => `/ticketing/control-zones/${id}/status`,
    SCAN: '/ticketing/scan',
    ACCESS_LOGS: '/ticketing/access-logs',
    UNREGISTERED_CARDS: '/ticketing/unregistered-cards',
  },

  // 5. MODULE VINVOICE (Hóa đơn điện tử Viettel S-Invoice)
  VINVOICE: {
    ISSUE_ORDER: (orderId: string) => `/invoices/issue/${orderId}`,
    ISSUE_BULK_RETAIL: `/invoices/issue-bulk-retail`,
    ISSUE_RECOVERY: `/invoices/issue-recovery`,
  },
};

// Các biến toàn cục để quản lý Refresh Token Lock và Axios Queue (Phase 4)
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

// Quản lý thời gian khóa Client khi bị Rate Limiting 429
let rateLimitBlockedUntil = 0;

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

import { authState } from './authState';

export const apiClient = {
  buildUrl(endpoint: string, params?: Record<string, string | number | boolean>): string {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  },

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, headers, bypassCache, ...customConfig } = config;
    const fullUrl = this.buildUrl(endpoint, params);

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '2.4.0',
    };

    const token = authState.getToken();
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const posCounter = typeof window !== 'undefined' ? localStorage.getItem('hpticket_pos_selected_counter') : null;
    if (posCounter) {
      defaultHeaders['X-Counter-Id'] = posCounter;
      defaultHeaders['X-Terminal-Id'] = posCounter;
    }

    const mergedConfig: RequestInit = {
      method: customConfig.method || 'GET',
      headers: { ...defaultHeaders, ...headers },
      credentials: 'include',
      ...customConfig,
    };

    const isModifyingRequest = mergedConfig.method !== 'GET';
    const requestKey = isModifyingRequest
      ? `${mergedConfig.method}_${fullUrl}_${mergedConfig.body || ''}`
      : `GET_${fullUrl}`;

    // 1. Kiểm tra in-memory cache cho GET request nếu hợp lệ
    if (!isModifyingRequest && !bypassCache && isCacheableUrl(fullUrl)) {
      const cached = getCache.get(fullUrl);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return Promise.resolve(cached.data as T);
      }
    }

    // 2. In-flight Request Deduplication: Tránh gửi nhiều request trùng lặp cùng lúc
    if (pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey) as Promise<T>;
    }

    // 3. Client Rate Limit Guard: Tạm dừng gửi tiếp nếu đang trong thời gian chờ Rate Limit
    if (Date.now() < rateLimitBlockedUntil) {
      const remaining = Math.max(1, Math.ceil((rateLimitBlockedUntil - Date.now()) / 1000));
      const msg = `Thao tác quá nhanh! Vui lòng chờ ${remaining} giây để tiếp tục.`;
      window.dispatchEvent(new CustomEvent('api_rate_limited', {
        detail: { message: msg, retryAfterSeconds: remaining }
      }));
      return Promise.reject(new Error(msg));
    }

    const executeRequest = async (): Promise<T> => {
      try {
        let response = await fetch(fullUrl, mergedConfig);

        // --- XỬ LÝ LỖI 401 VỚI CƠ CHẾ QUEUE & SILENT REFRESH ---
        if (response.status === 401) {
          const isRefreshEndpoint = endpoint.includes('/auth/refresh');

          // Tránh lặp vô hạn nếu chính API refresh cũng báo 401
          if (isRefreshEndpoint) {
            throw new Error('Phiên Refresh bị lỗi 401');
          }

          // Nếu đang có 1 request khác làm nhiệm vụ refresh rồi -> Xếp hàng chờ
          if (isRefreshing) {
            return new Promise<T>((resolve, reject) => {
              failedQueue.push({
                resolve: (newToken: string) => {
                  const newHeaders = { ...mergedConfig.headers, Authorization: `Bearer ${newToken}` };
                  fetch(fullUrl, { ...mergedConfig, headers: newHeaders })
                    .then(async r => {
                      if (r.ok) resolve(await r.json());
                      else reject(new Error(`Retry failed with status: ${r.status}`));
                    })
                    .catch(reject);
                },
                reject: (err) => reject(err)
              });
            });
          }

          // Nếu đây là request đầu tiên bị 401 -> Khóa cửa, đi lấy token mới
          isRefreshing = true;
          console.warn('[apiClient] 401 Unauthorized — Đang refresh token (Locking)...');

          let newAccessToken = null;
          try {
            const { tokenRefreshService } = await import('./tokenRefreshService');
            const { authState } = await import('./authState');
            const result = await tokenRefreshService.doRefresh();
            
            if (result === 'SUCCESS') {
              newAccessToken = authState.getToken();
            }
            
            if (!newAccessToken) {
              throw new Error('Refresh Token không hợp lệ hoặc đã hết hạn');
            }

            // 1. Mở khóa và nhả toàn bộ request đang xếp hàng chạy tiếp
            processQueue(null, newAccessToken);
          } catch (refreshErr) {
            // Lấy token mới THẤT BẠI (Hết hạn 7 ngày / bị block)
            processQueue(refreshErr, null); // Báo lỗi cho toàn bộ hàng đợi
            const { authState } = await import('./authState');
            authState.clearToken();
            window.dispatchEvent(new CustomEvent('session_expired_modal')); // Bắn Event ra UI hiển thị Popup đăng nhập
            throw new Error('Phiên đăng nhập hết hạn. Đang hiển thị Modal đăng nhập.');
          } finally {
            isRefreshing = false; // Luôn nhớ mở khóa dù thành công hay thất bại
          }

          // 3. Chạy lại chính cái request bị lỗi 401 ban đầu (NẰM NGOÀI TRY CATCH CỦA REFRESH)
          if (newAccessToken) {
            const retryHeaders = { ...mergedConfig.headers, Authorization: `Bearer ${newAccessToken}` };
            const retryResponse = await fetch(fullUrl, { ...mergedConfig, headers: retryHeaders });

            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              const errorMessage = errorData.message || `API Error: ${retryResponse.status} ${retryResponse.statusText}`;
              window.dispatchEvent(new CustomEvent('api_error', { detail: { message: errorMessage } }));
              throw new Error(errorMessage);
            }
            return await retryResponse.json();
          }
        }
        // --- KẾT THÚC XỬ LÝ 401 ---

        // --- XỬ LÝ LỖI 429 RATE LIMITING (CHỐNG SPAM API) ---
        if (response.status === 429) {
          const errorText = await response.text().catch(() => "");
          let errorData: any = {};
          try {
            errorData = errorText ? JSON.parse(errorText) : {};
          } catch(e) {}

          const retryHeader = response.headers.get('Retry-After');
          const retryAfter = errorData.data?.retryAfterSeconds 
            || (retryHeader ? parseInt(retryHeader, 10) : 10);
          const errorMessage = errorData.message || `Bạn đang thao tác quá nhanh! Vui lòng thử lại sau ${retryAfter} giây.`;

          // Cập nhật mốc thời gian khóa client
          rateLimitBlockedUntil = Date.now() + (retryAfter * 1000);

          console.warn(`[RateLimit 429] Endpoint: ${fullUrl} | Chờ: ${retryAfter}s`, errorData);

          // Bắn sự kiện riêng cho Toast đếm ngược (tránh bắn api_error thông thường)
          window.dispatchEvent(new CustomEvent('api_rate_limited', {
            detail: {
              message: errorMessage,
              retryAfterSeconds: retryAfter,
              tier: errorData.data?.tier
            }
          }));

          throw new Error(errorMessage);
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          let errorData: any = {};
          try {
            errorData = errorText ? JSON.parse(errorText) : {};
          } catch(e) {}
          
          const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;

          // Hỗ trợ Developer điều tra lỗi: In chi tiết Trace ID và devMessage ra Console F12
          if (!config?.silent && (errorData.traceId || errorData.devMessage)) {
            console.error(`[API Exception | ${errorData.traceId || 'NO-TRACE'}]`, {
              message: errorMessage,
              devDetail: errorData.devMessage,
              status: response.status,
              url: fullUrl
            });
          }

          if (!config?.silent) {
            window.dispatchEvent(new CustomEvent('api_error', { detail: { message: errorMessage } }));
          }
          throw new Error(errorMessage);
        }

        if (response.status === 204 || response.status === 205) {
          if (isModifyingRequest) getCache.clear();
          return {} as T;
        }

        const text = await response.text();
        if (!text) {
          if (isModifyingRequest) getCache.clear();
          return {} as T;
        }
        
        let result: any;
        try {
          result = JSON.parse(text);
        } catch (e) {
          result = text as unknown as T;
        }

        // Lưu cache nếu là GET request cho master data / dropdown
        if (!isModifyingRequest && isCacheableUrl(fullUrl)) {
          getCache.set(fullUrl, { timestamp: Date.now(), data: result });
        } else if (isModifyingRequest) {
          // Xóa cache khi có thao tác POST, PUT, DELETE làm thay đổi dữ liệu
          getCache.clear();
        }

        return result as T;
      } catch (error) {
        throw error;
      } finally {
        if (requestKey) {
          pendingRequests.delete(requestKey);
        }
      }
    };

    const reqPromise = executeRequest();
    if (requestKey) {
      pendingRequests.set(requestKey, reqPromise);
    }
    return reqPromise;
  },

  get<T>(endpoint: string, params?: Record<string, string | number | boolean>, config?: RequestConfig): Promise<T> {
    return apiClient.request<T>(endpoint, { ...config, method: 'GET', params });
  },

  post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return apiClient.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return apiClient.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return apiClient.request<T>(endpoint, { ...config, method: 'DELETE' });
  },

  patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
    return apiClient.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },
};
