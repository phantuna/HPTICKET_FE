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

// 3. API Client Wrapper / Adapter Engine (Tự động đính kèm Token, Handling Error)
export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

export const apiClient = {
  /**
   * Helper build đầy đủ URL từ Endpoint
   */
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

  /**
   * Central Fetch Method
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, headers, ...customConfig } = config;

    const fullUrl = this.buildUrl(endpoint, params);

    // Default Headers tập trung
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '2.4.0',
    };

    // Tự động inject Bearer Token nếu có trong localStorage
    const token = localStorage.getItem('hpticket_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const mergedConfig: RequestInit = {
      method: customConfig.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      ...customConfig,
    };

    try {
      const response = await fetch(fullUrl, mergedConfig);

      // Tự động xử lý Refresh Token / Unauthorized 401 tập trung 1 nơi
      if (response.status === 401) {
        console.error('Unauthorized (401)! Token JWT hết hạn hoặc không hợp lệ.');
        // Xóa token cũ để tránh kẹt
        localStorage.removeItem('hpticket_token');

        // Bắn sự kiện ra toàn bộ App để UI (React) bắt được và hiển thị Toast (nếu có config)
        window.dispatchEvent(new CustomEvent('session_expired', {
          detail: { message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!' }
        }));

        // Chuyển hướng về login sau 1 giây
        setTimeout(() => {
          window.location.href = '/#/login';
        }, 1500);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `API Error: ${response.status} ${response.statusText}`;

        // Phát thanh sự kiện lỗi ra toàn hệ thống (bắt bởi App.tsx)
        window.dispatchEvent(new CustomEvent('api_error', {
          detail: { message: errorMessage }
        }));

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`[API Call Failed] ${endpoint}:`, error);
      throw error;
    }
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
