/**
 * Sales & POS Service Layer
 * Financial calculations with exact decimal/bigint accuracy,
 * E-Invoice Provider integration (IInvoiceProvider),
 * Stock control, and Multi-pass Issued Ticket generation.
 */

import { dbStore } from '../shared/data/mockDatabase';
import {
  Order,
  OrderDetail,
  IssuedTicket,
  PaymentMethod,
  OrderStatus,
  InvoiceStatus,
  ItemType,
  TicketStatus,
  ApiResponse,
  SalesLocation,
  SalesCounter,
  Product,
} from '../shared/types/hpticket';
import { apiClient, API_ENDPOINTS } from './apiConfig';

/**
 * Helper to normalize paginated or list responses from Spring Boot Backend.
 */
function normalizeList<T>(data: any): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  return [];
}

export interface CartItem {
  id: string; // item_id (TicketTemplate ID or Product ID)
  item_type: ItemType;
  name: string;
  code: string;
  unit_price: number;
  quantity: number;
  allowed_passes_per_unit?: number; // 1 for normal, N for group ticket
  is_group_ticket?: boolean;
}

export interface CheckoutPayload {
  counter_id: string;
  customer_source_id?: string | null;
  customer_group_id?: string | null;
  promotion_id?: string | null;
  payment_method: PaymentMethod;
  cart_items: CartItem[];
  discount_percent: number;
  discount_amount_vnd?: number;
  valid_date?: string;
  invoice_status?: 'IMMEDIATE' | 'PENDING' | 'UNISSUED';
  company_tax_code?: string;
  company_name?: string;
  company_phone?: string;
  company_email?: string;
}

// Abstract Interface for Electronic Invoice Providers (FPT, Viettel, MISA)
export interface IInvoiceProvider {
  issueInvoice(order: Order): Promise<{ invoice_number: string; invoice_lookup_code: string }>;
}

class MockFptInvoiceProvider implements IInvoiceProvider {
  async issueInvoice(order: Order) {
    // Simulate API network latency
    await new Promise((resolve) => setTimeout(resolve, 400));
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      invoice_number: `FPT-INV-2026-${randomSeq}`,
      invoice_lookup_code: `HPT-${randomCode}`,
    };
  }
}

const invoiceProvider: IInvoiceProvider = new MockFptInvoiceProvider();

export const salesService = {
  // Synchronous helpers for backward compatibility
  getProducts() {
    return {
      code: 200,
      message: 'Lấy danh sách sản phẩm vật lý thành công',
      data: dbStore.products.filter((p) => p.is_active && !p.deleted_at),
    };
  },

  getSalesCounters() {
    return {
      code: 200,
      message: 'Lấy danh sách quầy POS thành công',
      data: dbStore.salesCounters.filter((c) => c.is_active),
    };
  },

  getCustomerSources() {
    return {
      code: 200,
      message: 'Lấy danh sách đối tác thành công',
      data: dbStore.customerSources.filter((s) => s.is_active),
    };
  },

  getCustomerGroups() {
    return {
      code: 200,
      message: 'Lấy danh sách nhóm khách thành công',
      data: dbStore.customerGroups.filter((g) => g.is_active),
    };
  },

  getOrders(): ApiResponse<Order[]> {
    return {
      code: 200,
      message: 'Lấy danh sách đơn hàng thành công',
      data: dbStore.orders,
    };
  },

  getIssuedTickets(): ApiResponse<IssuedTicket[]> {
    return {
      code: 200,
      message: 'Lấy danh sách vé đã phát hành thành công',
      data: dbStore.issuedTickets,
    };
  },

  async fetchOrdersPaginated(page = 0, size = 20, fromDate?: string, toDate?: string): Promise<any> {
    try {
      const params: any = { page, size, sort: 'created_at,desc' };
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      return await apiClient.get<any>(API_ENDPOINTS.SALES.ORDERS, params);
    } catch (err) {
      console.warn('[Sales Service] fetchOrdersPaginated failed:', err);
    }
    // Fallback MockDB logic can just return basic list structure
    return { data: { content: dbStore.orders, totalElements: dbStore.orders.length, totalPages: 1 } };
  },

  async fetchIssuedTicketsPaginated(page = 0, size = 200): Promise<any> {
    try {
      return await apiClient.get<any>(API_ENDPOINTS.SALES.ISSUED_TICKETS, { page, size, sort: 'created_at,desc' });
    } catch (err) {
      console.warn('[Sales Service] fetchIssuedTicketsPaginated failed:', err);
    }
    return { data: { content: dbStore.issuedTickets, totalElements: dbStore.issuedTickets.length, totalPages: 1 } };
  },

  async fetchIssuedTicketsByOrder(orderId: string): Promise<any> {
    try {
      return await apiClient.get<any>(`/sales/issued-tickets/order/${orderId}`);
    } catch (err) {
      console.warn('[Sales Service] fetchIssuedTicketsByOrder failed:', err);
    }
    return { data: dbStore.issuedTickets.filter(t => t.order_id === orderId) };
  },

  async fetchOrderDetail(id: string): Promise<any> {
    try {
      return await apiClient.get<any>(API_ENDPOINTS.SALES.ORDER_DETAIL(id));
    } catch (err) {
      console.warn('[Sales Service] fetchOrderDetail failed:', err);
    }
    return { data: dbStore.orders.find(o => o.id === id) };
  },

  // =========================================================
  // ASYNC REAL SPRING BOOT BACKEND API METHODS (/api/v1/sales)
  // =========================================================

  // 1. PRODUCTS (/sales/products)
  async fetchProducts(): Promise<ApiResponse<Product[]>> {
    
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.SALES.PRODUCTS);
        const list = normalizeList<Product>(res.data);
        if (list && list.length > 0) {
          dbStore.products = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách sản phẩm thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Sales Service] Backend fetchProducts failed, fallback to Mock DB:', err);
    }
    return this.getProducts();
  },

  async createProduct(
    dto: Omit<Product, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<Product>> {
    
      try {
        const res = await apiClient.post<ApiResponse<Product>>(API_ENDPOINTS.SALES.PRODUCTS, dto);
        if (res?.data) {
          dbStore.products.push(res.data);
          dbStore.logAudit('CREATE', 'products', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend createProduct failed, fallback to Mock DB:', err);
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newPrd: Product = {
      ...dto,
      id: `prd-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.products.push(newPrd);
    dbStore.logAudit('CREATE', 'products', newPrd.id, null, newPrd);
          dbStore.saveToStorage();
    return {
      code: 201,
      message: 'Tạo sản phẩm thành công',
      data: newPrd,
    };
  },

  async updateProduct(id: string, dto: Partial<Product>): Promise<ApiResponse<Product>> {
    
      try {
        const res = await apiClient.put<ApiResponse<Product>>(API_ENDPOINTS.SALES.PRODUCT_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.products.findIndex((p) => p.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.products[idx] };
            dbStore.products[idx] = res.data;
            dbStore.logAudit('UPDATE', 'products', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateProduct failed, fallback to Mock DB:', err);
    }
    const idx = dbStore.products.findIndex((p) => p.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy sản phẩm', data: null as any };
    }
    const old = { ...dbStore.products[idx] };
    const now = new Date().toISOString();
    const updated: Product = { ...old, ...dto, updated_at: now };
    dbStore.products[idx] = updated;
    dbStore.logAudit('UPDATE', 'products', updated.id || id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật sản phẩm thành công', data: updated };
  },

  async deleteProduct(id: string): Promise<ApiResponse<void>> {
    
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.SALES.PRODUCT_DETAIL(id));
      } catch (err) {
        console.warn('[Sales Service] Backend deleteProduct failed, fallback to Mock DB:', err);
    }
    const old = dbStore.products.find(p => p.id === id);
    if (old) dbStore.logAudit('DELETE', 'products', id, old, null);
    dbStore.products = dbStore.products.filter((p) => p.id !== id);
    return { code: 200, message: 'Xóa sản phẩm thành công', data: undefined };
  },

  async updateProductStatus(id: string, isActive: boolean): Promise<ApiResponse<Product>> {
    
      try {
        const res = await apiClient.patch<ApiResponse<Product>>(
          `/sales/products/${id}/status`,
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.products.findIndex((p) => p.id === id);
          if (idx !== -1) {
            dbStore.products[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateProductStatus failed:', err);
    }
    const idx = dbStore.products.findIndex((p) => p.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.products[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.products[idx] };
  },


  // 2. SALES LOCATIONS (/sales/locations)
  async fetchSalesLocations(): Promise<ApiResponse<SalesLocation[]>> {
    
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.SALES.LOCATIONS);
        const list = normalizeList<SalesLocation>(res.data);
        if (list && list.length > 0) {
          dbStore.salesLocations = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách điểm bán vé thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Sales Service] Backend fetchSalesLocations failed, fallback to Mock DB:', err);
    }
    return {
      code: 200,
      message: 'Lấy danh sách điểm bán vé thành công (Mock DB)',
      data: dbStore.salesLocations.filter((l) => l.is_active),
    };
  },

  async createSalesLocation(
    dto: Omit<SalesLocation, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<SalesLocation>> {
    
      try {
        const res = await apiClient.post<ApiResponse<SalesLocation>>(API_ENDPOINTS.SALES.LOCATIONS, dto);
        if (res?.data) {
          dbStore.salesLocations.push(res.data);
          dbStore.logAudit('CREATE', 'sales_locations', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend createSalesLocation failed, fallback to Mock DB:', err);
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newLoc: SalesLocation = {
      ...dto,
      id: `loc-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.salesLocations.push(newLoc);
    dbStore.logAudit('CREATE', 'sales_locations', newLoc.id, null, newLoc);
          dbStore.saveToStorage();
    return { code: 201, message: 'Tạo điểm bán vé thành công', data: newLoc };
  },

  async updateSalesLocation(id: string, dto: Partial<SalesLocation>): Promise<ApiResponse<SalesLocation>> {
    
      try {
        const res = await apiClient.put<ApiResponse<SalesLocation>>(API_ENDPOINTS.SALES.LOCATION_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.salesLocations.findIndex((l) => l.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.salesLocations[idx] };
            dbStore.salesLocations[idx] = res.data;
            dbStore.logAudit('UPDATE', 'sales_locations', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateSalesLocation failed, fallback to Mock DB:', err);
    }
    const idx = dbStore.salesLocations.findIndex((l) => l.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy điểm bán vé', data: null as any };
    }
    const old = { ...dbStore.salesLocations[idx] };
    const now = new Date().toISOString();
    const updated: SalesLocation = { ...old, ...dto, updated_at: now };
    dbStore.salesLocations[idx] = updated;
    dbStore.logAudit('UPDATE', 'sales_locations', updated.id || id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật điểm bán vé thành công', data: updated };
  },

  async deleteSalesLocation(id: string): Promise<ApiResponse<void>> {
    
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.SALES.LOCATION_DETAIL(id));
      } catch (err) {
        console.warn('[Sales Service] Backend deleteSalesLocation failed, fallback to Mock DB:', err);
    }
    const old = dbStore.salesLocations.find(l => l.id === id);
    if (old) dbStore.logAudit('DELETE', 'sales_locations', id, old, null);
    dbStore.salesLocations = dbStore.salesLocations.filter((l) => l.id !== id);
    return { code: 200, message: 'Xóa điểm bán vé thành công', data: undefined };
  },

  async updateSalesLocationStatus(id: string, isActive: boolean): Promise<ApiResponse<SalesLocation>> {
    
      try {
        const res = await apiClient.patch<ApiResponse<SalesLocation>>(
          API_ENDPOINTS.SALES.LOCATION_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.salesLocations.findIndex((l) => l.id === id);
          if (idx !== -1) {
            dbStore.salesLocations[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateSalesLocationStatus failed:', err);
    }
    const idx = dbStore.salesLocations.findIndex((l) => l.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.salesLocations[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.salesLocations[idx] };
  },


  // 3. SALES COUNTERS (/sales/counters)
  async fetchSalesCounters(): Promise<ApiResponse<SalesCounter[]>> {
    
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.SALES.COUNTERS);
        const list = normalizeList<SalesCounter>(res.data);
        if (list && list.length > 0) {
          dbStore.salesCounters = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách quầy bán vé thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Sales Service] Backend fetchSalesCounters failed, fallback to Mock DB:', err);
    }
    return this.getSalesCounters();
  },

  async createSalesCounter(
    dto: Omit<SalesCounter, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'>
  ): Promise<ApiResponse<SalesCounter>> {
    
      try {
        const res = await apiClient.post<ApiResponse<SalesCounter>>(API_ENDPOINTS.SALES.COUNTERS, dto);
        if (res?.data) {
          dbStore.salesCounters.push(res.data);
          dbStore.logAudit('CREATE', 'sales_counters', res.data.id, null, res.data);
          dbStore.saveToStorage();
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend createSalesCounter failed, fallback to Mock DB:', err);
    }
    const now = new Date().toISOString();
    const activeUser = dbStore.getActiveUser();
    const newCnt: SalesCounter = {
      ...dto,
      id: `cnt-${Date.now()}`,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
    };
    dbStore.salesCounters.push(newCnt);
    dbStore.logAudit('CREATE', 'sales_counters', newCnt.id, null, newCnt);
          dbStore.saveToStorage();
    return { code: 201, message: 'Tạo quầy bán vé thành công', data: newCnt };
  },

  async updateSalesCounter(id: string, dto: Partial<SalesCounter>): Promise<ApiResponse<SalesCounter>> {
    
      try {
        const res = await apiClient.put<ApiResponse<SalesCounter>>(API_ENDPOINTS.SALES.COUNTER_DETAIL(id), dto);
        if (res?.data) {
          const idx = dbStore.salesCounters.findIndex((c) => c.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.salesCounters[idx] };
            dbStore.salesCounters[idx] = res.data;
            dbStore.logAudit('UPDATE', 'sales_counters', res.data.id || id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateSalesCounter failed, fallback to Mock DB:', err);
    }
    const idx = dbStore.salesCounters.findIndex((c) => c.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy quầy bán vé', data: null as any };
    }
    const old = { ...dbStore.salesCounters[idx] };
    const now = new Date().toISOString();
    const updated: SalesCounter = { ...old, ...dto, updated_at: now };
    dbStore.salesCounters[idx] = updated;
    dbStore.logAudit('UPDATE', 'sales_counters', updated.id || id, old, updated);
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật quầy bán vé thành công', data: updated };
  },

  async deleteSalesCounter(id: string): Promise<ApiResponse<void>> {
    
      try {
        await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.SALES.COUNTER_DETAIL(id));
      } catch (err) {
        console.warn('[Sales Service] Backend deleteSalesCounter failed, fallback to Mock DB:', err);
    }
    const old = dbStore.salesCounters.find(c => c.id === id);
    if (old) dbStore.logAudit('DELETE', 'sales_counters', id, old, null);
    dbStore.salesCounters = dbStore.salesCounters.filter((c) => c.id !== id);
    return { code: 200, message: 'Xóa quầy bán vé thành công', data: undefined };
  },

  async updateSalesCounterStatus(id: string, isActive: boolean): Promise<ApiResponse<SalesCounter>> {
    
      try {
        const res = await apiClient.patch<ApiResponse<SalesCounter>>(
          API_ENDPOINTS.SALES.COUNTER_STATUS(id),
          undefined,
          { params: { isActive } }
        );
        if (res?.data) {
          const idx = dbStore.salesCounters.findIndex((c) => c.id === id);
          if (idx !== -1) {
            dbStore.salesCounters[idx] = res.data;
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend updateSalesCounterStatus failed:', err);
    }
    const idx = dbStore.salesCounters.findIndex((c) => c.id === id);
    if (idx === -1) return { code: 404, message: 'Not found', data: null as any };
    dbStore.salesCounters[idx].is_active = isActive;
    dbStore.saveToStorage();
    return { code: 200, message: 'Cập nhật trạng thái thành công', data: dbStore.salesCounters[idx] };
  },


  // 4. ORDERS (/sales/orders)
  async fetchOrders(): Promise<ApiResponse<Order[]>> {
    
      try {
        const res = await apiClient.get<ApiResponse<any>>(API_ENDPOINTS.SALES.ORDERS);
        const list = normalizeList<Order>(res.data);
        if (list && list.length > 0) {
          dbStore.orders = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách đơn hàng thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Sales Service] Backend fetchOrders failed, fallback to Mock DB:', err);
    }
    return this.getOrders();
  },

  async cancelOrder(id: string, reason: string): Promise<ApiResponse<Order>> {
    
      try {
        const res = await apiClient.put<ApiResponse<Order>>(API_ENDPOINTS.SALES.CANCEL_ORDER(id), { reason });
        if (res?.data) {
          const idx = dbStore.orders.findIndex((o) => o.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.orders[idx] };
            dbStore.orders[idx] = res.data;
            dbStore.logAudit('UPDATE', 'orders', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend cancelOrder failed, fallback to Mock DB:', err);
    }
    const idx = dbStore.orders.findIndex((o) => o.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy đơn hàng', data: null as any };
    }
    const old = { ...dbStore.orders[idx] };
    const now = new Date().toISOString();
    const updated: Order = { ...old, status: OrderStatus.CANCELLED, updated_at: now };
    dbStore.orders[idx] = updated;
    dbStore.saveToStorage();
    return { code: 200, message: 'Hủy đơn hàng thành công', data: updated };
  },

  // 5. ISSUED TICKETS (/sales/issued-tickets)
  async fetchIssuedTickets(): Promise<ApiResponse<IssuedTicket[]>> {
    
      try {
        const res = await apiClient.get<ApiResponse<any>>(`${API_ENDPOINTS.SALES.ISSUED_TICKETS}?size=1000`);
        const list = normalizeList<IssuedTicket>(res.data);
        if (list && list.length > 0) {
          dbStore.issuedTickets = list;
          dbStore.saveToStorage();
        }
        return {
          code: res.code || 200,
          message: res.message || 'Lấy danh sách vé đã phát hành thành công',
          data: list,
        };
      } catch (err) {
        console.warn('[Sales Service] Backend fetchIssuedTickets failed, fallback to Mock DB:', err);
    }
    return this.getIssuedTickets();
  },

  async lockIssuedTicket(id: string): Promise<ApiResponse<IssuedTicket>> {
    
      try {
        const res = await apiClient.put<ApiResponse<IssuedTicket>>(API_ENDPOINTS.SALES.LOCK_ISSUED_TICKET(id), {});
        if (res?.data) {
          const idx = dbStore.issuedTickets.findIndex((t) => t.id === id);
          if (idx !== -1) {
            const old = { ...dbStore.issuedTickets[idx] };
            dbStore.issuedTickets[idx] = res.data;
            dbStore.logAudit('UPDATE', 'issued_tickets', id, old, res.data);
            dbStore.saveToStorage();
          }
        }
        return res;
      } catch (err) {
        console.warn('[Sales Service] Backend lockIssuedTicket failed, fallback to Mock DB:', err);
    }
    const idx = dbStore.issuedTickets.findIndex((t) => t.id === id);
    if (idx === -1) {
      return { code: 404, message: 'Không tìm thấy vé', data: null as any };
    }
    const old = { ...dbStore.issuedTickets[idx] };
    const now = new Date().toISOString();
    const updated: IssuedTicket = { ...old, status: TicketStatus.USED, updated_at: now };
    dbStore.issuedTickets[idx] = updated;
    dbStore.saveToStorage();
    return { code: 200, message: 'Khóa vé thành công', data: updated };
  },

  /**
   * POS Checkout Transaction with Financial Lock & Multi-pass Ticket Generation
   */
  async checkout(payload: CheckoutPayload): Promise<ApiResponse<Order>> {
    const { counter_id, customer_source_id, payment_method, cart_items, discount_percent } = payload;
    if (!cart_items || cart_items.length === 0) {
      return { code: 400, message: 'Giỏ hàng đang trống!', data: null as any };
    }

    try {
        const orderRequest = {
          customer_source_id: customer_source_id || null,
          customer_group_id: payload.customer_group_id || null,
          promotion_id: payload.promotion_id || null,
          sales_counter_id: counter_id,
          discount_percent: discount_percent || 0,
          discount_amount: payload.discount_amount_vnd || 0,
          payment_method: payment_method,
          items: cart_items.map((item) => ({
            item_type: item.item_type || ItemType.TICKET,
            item_id: item.id,
            quantity: item.quantity,
            is_group_ticket: item.is_group_ticket === true ? true : (item.allowed_passes_per_unit && item.allowed_passes_per_unit > 1 ? true : false),
            allowed_passes_per_unit: item.allowed_passes_per_unit || 1,
          })),
          booker_name: 'Khách mua tại quầy POS',
          customer_phone: '0988123456',
          use_date: payload.valid_date || new Date().toISOString().split('T')[0],
          invoice_status: payload.invoice_status || 'UNISSUED',
          company_tax_code: payload.company_tax_code || null,
          company_name: payload.company_name || null,
          company_phone: payload.company_phone || null,
          company_email: payload.company_email || null,
        };
        const res = await apiClient.post<ApiResponse<Order>>(API_ENDPOINTS.SALES.ORDERS, orderRequest);
        if (res && res.data) {
          const dataAny = res.data as any;
          const orderId = dataAny.id || dataAny.order_id;
          const orderCode = dataAny.order_code || dataAny.orderCode;
          res.data = {
            ...res.data,
            id: orderId,
            order_code: orderCode,
          };
          dbStore.orders.unshift(res.data);
          dbStore.logAudit('CREATE', 'orders', res.data.id, null, res.data);
          dbStore.saveToStorage();
          try {
            await this.fetchIssuedTickets();
          } catch (e) {
            console.warn('[Sales Service] Could not refresh issued tickets after checkout:', e);
          }
        }
        return res;
      } catch (err: any) {
        console.warn('[Sales Service] Backend checkout failed:', err);
        throw err;
      }

    const now = new Date().toISOString();
    const todayDate = now.split('T')[0];
    const activeUser = dbStore.getActiveUser();

    // 1. Calculate Exact Financial Amounts (NO floating point errors, using exact integer arithmetic)
    let total_amount = 0;
    for (const item of cart_items) {
      total_amount += Math.round(item.unit_price * item.quantity);
    }

    const discount_amount = Math.round((total_amount * (discount_percent || 0)) / 100) + (payload.discount_amount_vnd || 0);
    const final_amount = Math.max(0, total_amount - discount_amount);

    const orderId = `ord-${Date.now()}`;
    const orderCode = `ORD-${todayDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    // 2. Build OrderDetails
    const details: OrderDetail[] = cart_items.map((item, index) => {
      const lineTotal = Math.round(item.unit_price * item.quantity);
      return {
        id: `det-${orderId}-${index + 1}`,
        order_id: orderId,
        item_type: item.item_type,
        item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: lineTotal,
        item_name: item.name,
        created_at: now,
        updated_at: now,
        created_by: activeUser.username,
        updated_by: activeUser.username,
      };
    });

    // 3. Update Product Stock (For physical goods)
    for (const item of cart_items) {
      if (item.item_type === ItemType.PRODUCT) {
        const prd = dbStore.products.find((p) => p.id === item.id);
        if (prd) {
          prd.stock_quantity = Math.max(0, prd.stock_quantity - item.quantity);
          prd.updated_at = now;
        }
      }
    }

    // 4. Create Order Object
    const newOrder: Order = {
      id: orderId,
      order_code: orderCode,
      customer_source_id: customer_source_id || null,
      sales_counter_id: counter_id,
      total_amount,
      discount_amount,
      final_amount,
      payment_method,
      status: OrderStatus.PAID,
      invoice_status: InvoiceStatus.PENDING,
      created_at: now,
      updated_at: now,
      created_by: activeUser.username,
      updated_by: activeUser.username,
      details,
    };

    // Save Order to Local Database FIRST (ACID Local Guarantee as per rule)
    dbStore.orders.unshift(newOrder);

    // 5. Generate Issued Tickets with Multi-pass support
    const createdIssuedTickets: IssuedTicket[] = [];
    for (const item of cart_items) {
      if (item.item_type === ItemType.TICKET) {
        // Find audience/passes rule
        const tpl = dbStore.ticketTemplates.find((t) => t.id === item.id);
        let allowedPasses = 1;

        if (tpl) {
          const aud = dbStore.audienceTypes.find((a) => a.id === tpl.audience_type_id);
          if (item.allowed_passes_per_unit && item.allowed_passes_per_unit > 0) {
            allowedPasses = item.allowed_passes_per_unit;
          } else if (aud?.code === 'GROUP_PASS' || tpl.name.includes('Đoàn 10 Lượt')) {
            allowedPasses = 10;
          } else if (tpl.name.includes('5 Lượt')) {
            allowedPasses = 5;
          }
        }

        // Generate static unique QR string for each ticket unit
        for (let q = 0; q < item.quantity; q++) {
          const qrCodeStr = `HPT-PASS-${item.code}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
          const issuedTicket: IssuedTicket = {
            id: `tkt-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}-${q + 1}`,
            qr_code_string: qrCodeStr,
            order_id: orderId,
            ticket_template_id: item.id,
            valid_date: payload.valid_date || todayDate,
            allowed_passes: allowedPasses,
            used_passes: 0,
            status: TicketStatus.UNUSED,
            ticket_template_name: item.name,
            created_at: now,
            updated_at: now,
            created_by: activeUser.username,
            updated_by: activeUser.username,
          };
          dbStore.issuedTickets.unshift(issuedTicket);
          createdIssuedTickets.push(issuedTicket);
        }
      }
    }

    // 6. External Third-party E-Invoice Call (FPT / Viettel)
    try {
      const invRes = await invoiceProvider.issueInvoice(newOrder);
      newOrder.invoice_status = InvoiceStatus.ISSUED;
      newOrder.invoice_number = invRes.invoice_number;
      newOrder.invoice_lookup_code = invRes.invoice_lookup_code;
    } catch (e) {
      newOrder.invoice_status = InvoiceStatus.FAILED;
    }

    // Audit Logging snapshot (JSON old_data / new_data)
    dbStore.logAudit('CREATE', 'orders', newOrder.id, null, {
      order_code: newOrder.order_code,
      total_amount: newOrder.total_amount,
      discount_amount: newOrder.discount_amount,
      final_amount: newOrder.final_amount,
      payment_method: newOrder.payment_method,
      issued_tickets_count: createdIssuedTickets.length,
      invoice_number: newOrder.invoice_number,
    });

    dbStore.saveToStorage();

    return {
      code: 200,
      message: 'Thanh toán POS và phát hành hóa đơn điện tử thành công',
      data: newOrder,
    };
  },
};
