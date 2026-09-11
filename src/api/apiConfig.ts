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
}

// Dual-Mode Feature Flag: Cho phép chuyển qua lại giữa Real Spring Boot Backend và Offline Mock DB
export const getUseMockApi = (): boolean => {
  return localStorage.getItem('hpticket_use_mock_api') === 'true';
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
    EXPIRING_TICKETS: '/sales/issued-tickets/expiring-soon',
    UPDATE_CUSTOMER_INFO: (id: string) => `/sales/issued-tickets/${id}/customer-info`,
    RENEW_TICKET: (id: string) => `/sales/issued-tickets/${id}/renew`,
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
  },
};

// Các biến toàn cục để quản lý Refresh Token Lock và Axios Queue (Phase 4)
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: any) => void }[] = [];

// Quản lý Request Anti-Spam (Phase 3)
const pendingRequests = new Map<string, Promise<any>>();

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

// Kênh giao tiếp giữa các Tab
const authChannel = new BroadcastChannel('hpticket_auth_channel');
authChannel.onmessage = (event) => {
  if (event.data.type === 'SESSION_REFRESHED' && event.data.token) {
    localStorage.setItem('hpticket_token', event.data.token);
    // Nếu tab này đang chờ refresh, báo cho queue chạy tiếp
    if (isRefreshing) {
      isRefreshing = false;
      processQueue(null, event.data.token);
    }
  } else if (event.data.type === 'SESSION_EXPIRED') {
    localStorage.removeItem('hpticket_token');
    window.dispatchEvent(new CustomEvent('session_expired_modal'));
  }
};

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
    const { params, headers, ...customConfig } = config;
    const fullUrl = this.buildUrl(endpoint, params);

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '2.4.0',
    };

    const token = localStorage.getItem('hpticket_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const mergedConfig: RequestInit = {
      method: customConfig.method || 'GET',
      headers: { ...defaultHeaders, ...headers },
      credentials: 'include', // Bắt buộc cho HTTP-Only Cookie (Phase 4)
      ...customConfig,
    };

    // 3. Xử lý Chống Spam (Deduplication) cho các method thay đổi dữ liệu
    const isModifyingRequest = mergedConfig.method !== 'GET';
    const requestKey = isModifyingRequest ? `${mergedConfig.method}_${fullUrl}_${mergedConfig.body || ''}` : null;

    if (requestKey && pendingRequests.has(requestKey)) {
      console.warn(`[apiClient] Deduplicating request: ${requestKey}`);
      return pendingRequests.get(requestKey) as Promise<T>;
    }

    const executeRequest = async (): Promise<T> => {
      try {
        let response = await fetch(fullUrl, mergedConfig);

        if (response.status === 401) {
          const isRefreshEndpoint = endpoint.includes('/auth/refresh');
          
          if (isRefreshEndpoint) {
            throw new Error('Phiên Refresh bị lỗi 401');
          }

          if (isRefreshing) {
            return new Promise<T>((resolve, reject) => {
              failedQueue.push({
                resolve: (newToken: string) => {
                  const newHeaders = { ...mergedConfig.headers, Authorization: `Bearer ${newToken}` };
                  fetch(fullUrl, { ...mergedConfig, headers: newHeaders })
                    .then(r => { if(r.ok) r.json().then(resolve).catch(reject); else reject(new Error('Retry failed')) })
                    .catch(reject);
                },
                reject: (err) => reject(err)
              });
            });
          }

          isRefreshing = true;
          console.warn('[apiClient] 401 Unauthorized — Đang refresh token (Locking)...');

          try {
            const refreshRes = await fetch(`${API_BASE_URL}/iam/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({}) 
            });

            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              const newAccessToken: string = refreshData?.data?.token;

              if (newAccessToken) {
                localStorage.setItem('hpticket_token', newAccessToken);
                authChannel.postMessage({ type: 'SESSION_REFRESHED', token: newAccessToken });
                
                isRefreshing = false;
                processQueue(null, newAccessToken);

                const retryHeaders = { ...mergedConfig.headers, Authorization: `Bearer ${newAccessToken}` };
                const retryResponse = await fetch(fullUrl, { ...mergedConfig, headers: retryHeaders });
                if (retryResponse.ok) return await retryResponse.json();
                throw new Error(`API Error: ${retryResponse.status}`);
              }
            }
            throw new Error('Refresh Token không hợp lệ hoặc đã hết hạn');

          } catch (refreshErr) {
            isRefreshing = false;
            processQueue(refreshErr, null);
            localStorage.removeItem('hpticket_token');
            authChannel.postMessage({ type: 'SESSION_EXPIRED' });
            
            window.dispatchEvent(new CustomEvent('session_expired_modal'));
            throw new Error('Phiên đăng nhập hết hạn. Đang hiển thị Modal đăng nhập.');
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;
          window.dispatchEvent(new CustomEvent('api_error', { detail: { message: errorMessage } }));
          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error) {
        console.error(`[API Call Failed] ${endpoint}:`, error);
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
