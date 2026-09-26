/**
 * Centralized Enterprise Inventory & Stock Movement Service
 * Single Source of Truth for all stock deductions, imports, adjustments, and backend pagination.
 *
 * Implements:
 * 1. Backend Pagination with Pageable (page, size, stable sort: created_at DESC, id DESC).
 * 2. Export Snapshot & Chunked Keyset fetching for large data Excel export.
 * 3. Atomic CAS conditional updates & Idempotency protection.
 * 4. Dual-mode support (Spring Boot Backend API as Source of Truth, with safe local sync).
 */

import { Product, StockMovementLog, StockMovementType, ApiResponse } from '../shared/types/hpticket';
import { dbStore } from '../shared/data/mockDatabase';
import { apiClient, API_ENDPOINTS } from './apiConfig';

export interface RecordMovementParams {
  productId: string;
  type: StockMovementType;
  quantity?: number;
  unitPrice?: number;
  targetQuantity?: number; // Used for ADJUST to set exact target stock
  salesCounterId?: string;
  salesCounterName?: string;
  referenceType?: string;
  referenceCode?: string;
  idempotencyKey?: string;
  performedBy?: string;
  note?: string;
  reason?: string;
}

export interface MovementResult {
  success: boolean;
  log?: StockMovementLog;
  updatedProduct?: Product;
  message?: string;
  isDuplicate?: boolean;
}

export interface StockMovementFilterParams {
  keyword?: string;
  productId?: string;
  type?: StockMovementType | 'ALL';
  salesCounterId?: string;
  performedBy?: string;
  referenceCode?: string;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
}

export interface StockMovementPageResponse {
  content: StockMovementLog[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface StockMovementChunkResponse {
  items: StockMovementLog[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount: number;
  exportStartedAt: string;
}

/**
 * Chuẩn hóa đối tượng log biến động kho để xử lý linh hoạt cả snake_case và camelCase từ Backend.
 */
export function normalizeStockMovementLog(raw: any): StockMovementLog {
  if (!raw) return {} as StockMovementLog;

  const quantity = Number(raw.quantity ?? 0);
  const type = (raw.type || 'POS_SALE') as StockMovementType;

  // Extract created_at from any format
  let createdAt = raw.created_at || raw.createdAt;
  if (!createdAt || isNaN(new Date(createdAt).getTime())) {
    createdAt = new Date().toISOString();
  }

  // Extract date updated
  const updatedAt = raw.updated_at || raw.updatedAt || createdAt;

  // Extract performed by
  const performedBy = raw.performed_by || raw.performedBy || raw.created_by || raw.createdBy || 'admin';

  // Extract sales counter
  const salesCounterId = raw.sales_counter_id || raw.salesCounterId || '';
  const salesCounterName = raw.sales_counter_name || raw.salesCounterName || '';

  // Extract reference
  const referenceType = raw.reference_type || raw.referenceType || (type === 'POS_SALE' ? 'POS_ORDER' : 'MANUAL');
  const referenceCode = raw.reference_code || raw.referenceCode || '';

  // Extract prices
  const unitPrice = Number(raw.unit_price ?? raw.unitPrice ?? 0);
  const totalValue = Number(raw.total_value ?? raw.totalValue ?? (Math.abs(quantity) * unitPrice));

  // Extract quantities
  const beforeQty = raw.before_quantity !== undefined 
    ? Number(raw.before_quantity) 
    : (raw.beforeQuantity !== undefined ? Number(raw.beforeQuantity) : 0);
  const afterQty = raw.after_quantity !== undefined 
    ? Number(raw.after_quantity) 
    : (raw.afterQuantity !== undefined ? Number(raw.afterQuantity) : 0);

  // Extract product details
  const productId = raw.product_id || raw.productId || '';
  const productCode = raw.product_code || raw.productCode || 'PRD';
  const productName = raw.product_name || raw.productName || '—';
  const unit = raw.unit || 'Cái';

  return {
    id: String(raw.id || ''),
    product_id: productId,
    product_code: productCode,
    product_name: productName,
    unit: unit,
    type: type,
    quantity: quantity,
    before_quantity: beforeQty,
    after_quantity: afterQty,
    unit_price: unitPrice,
    total_value: totalValue,
    sales_counter_id: salesCounterId,
    sales_counter_name: salesCounterName,
    reference_type: referenceType,
    reference_code: referenceCode,
    idempotency_key: raw.idempotency_key || raw.idempotencyKey || '',
    reason: raw.reason || '',
    note: raw.note || '',
    performed_by: performedBy,
    created_at: createdAt,
    updated_at: updatedAt,
    created_by: performedBy,
    updated_by: performedBy,
  };
}

export const inventoryService = {
  /**
   * Truy vấn lịch sử biến động kho phân trang trực tiếp từ Backend (PostgreSQL LIMIT/OFFSET).
   */
  async fetchMovements(
    params: StockMovementFilterParams,
    page: number = 0,
    size: number = 25
  ): Promise<ApiResponse<StockMovementPageResponse>> {
    const queryParams: Record<string, string | number | boolean> = {
      page,
      size,
    };

    if (params.keyword) {
      queryParams.keyword = params.keyword;
    }

    if (params.productId && params.productId !== 'ALL') {
      queryParams.productId = params.productId;
    }

    if (params.type && params.type !== 'ALL') {
      queryParams.type = params.type;
    }

    if (params.salesCounterId) {
      queryParams.salesCounterId = params.salesCounterId;
    }

    if (params.performedBy) {
      queryParams.performedBy = params.performedBy;
    }

    if (params.referenceCode) {
      queryParams.referenceCode = params.referenceCode;
    }

    if (params.fromDate) {
      queryParams.fromDate = params.fromDate;
    }

    if (params.toDate) {
      queryParams.toDate = params.toDate;
    }

    try {
      const res = await apiClient.get<ApiResponse<StockMovementPageResponse>>(
        API_ENDPOINTS.SALES.STOCK_MOVEMENTS,
        queryParams
      );

      if (res && res.data) {
        if (Array.isArray(res.data.content)) {
          res.data.content = res.data.content.map(normalizeStockMovementLog);
        }
        return res;
      }
    } catch (err) {
      console.warn('[InventoryService] Backend fetchMovements failed, fallback to local store:', err);
    }

    // Fallback nếu Backend chưa bật: Phân trang từ dbStore
    return this.fallbackLocalMovements(params, page, size);
  },

  /**
   * Tải một chunk dữ liệu phục vụ Export Excel theo Keyset / Cursor với mốc snapshot exportStartedAt.
   */
  async fetchExportChunk(
    params: StockMovementFilterParams,
    cursor?: string,
    exportStartedAt?: string,
    limit: number = 1000
  ): Promise<ApiResponse<StockMovementChunkResponse>> {
    const queryParams: Record<string, string | number | boolean> = {
      limit,
    };

    if (cursor) {
      queryParams.cursor = cursor;
    }

    if (exportStartedAt) {
      queryParams.exportStartedAt = exportStartedAt;
    }

    if (params.keyword) {
      queryParams.keyword = params.keyword;
    }

    if (params.productId && params.productId !== 'ALL') {
      queryParams.productId = params.productId;
    }

    if (params.type && params.type !== 'ALL') {
      queryParams.type = params.type;
    }

    if (params.salesCounterId) {
      queryParams.salesCounterId = params.salesCounterId;
    }

    if (params.performedBy) {
      queryParams.performedBy = params.performedBy;
    }

    if (params.referenceCode) {
      queryParams.referenceCode = params.referenceCode;
    }

    if (params.fromDate) {
      queryParams.fromDate = params.fromDate;
    }

    if (params.toDate) {
      queryParams.toDate = params.toDate;
    }

    try {
      const res = await apiClient.get<ApiResponse<StockMovementChunkResponse>>(
        API_ENDPOINTS.SALES.STOCK_MOVEMENTS_EXPORT_CHUNK,
        queryParams
      );

      if (res && res.data) {
        if (Array.isArray(res.data.items)) {
          res.data.items = res.data.items.map(normalizeStockMovementLog);
        }
        return res;
      }
    } catch (err) {
      console.warn('[InventoryService] Backend fetchExportChunk failed:', err);
    }

    // Fallback client nếu Backend không sẵn sàng
    const all = dbStore.loadStockLogs().map(normalizeStockMovementLog);
    return {
      code: 200,
      message: 'OK',
      data: {
        items: all,
        nextCursor: undefined,
        hasMore: false,
        totalCount: all.length,
        exportStartedAt: exportStartedAt || new Date().toISOString(),
      },
    };
  },

  /**
   * Tạo biến động kho (Nhập kho, Xuất kho, Kiểm kê) trực tiếp qua Backend API với Atomic Update và Idempotency.
   */
  async recordStockMovement(params: RecordMovementParams): Promise<MovementResult> {
    const {
      productId,
      type,
      quantity,
      unitPrice,
      targetQuantity,
      salesCounterId,
      salesCounterName,
      referenceType = 'MANUAL',
      referenceCode,
      idempotencyKey,
      performedBy = 'admin',
      note,
      reason,
    } = params;

    const dto = {
      productId,
      type,
      quantity: quantity !== undefined ? Math.abs(quantity) : undefined,
      unitPrice,
      targetQuantity,
      salesCounterId,
      salesCounterName,
      referenceType,
      referenceCode,
      idempotencyKey: idempotencyKey || `MUTATION_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reason,
      note,
      performedBy: performedBy || 'admin',
    };

    try {
      const res = await apiClient.post<ApiResponse<StockMovementLog>>(
        API_ENDPOINTS.SALES.STOCK_MOVEMENTS,
        dto
      );
      if (res && res.data) {
        const savedLog = normalizeStockMovementLog(res.data);
        // Bắn event để UI cập nhật
        window.dispatchEvent(new CustomEvent('hpticket_stock_logs_updated'));
        window.dispatchEvent(new CustomEvent('hpticket_stock_changed'));
        return {
          success: true,
          log: savedLog,
          message: res.message || 'Ghi nhận biến động kho thành công',
        };
      }
    } catch (err: any) {
      console.warn('[InventoryService] Backend recordStockMovement error, falling back locally:', err);
      if (err?.message && err.message.includes('không đủ số lượng')) {
        return { success: false, message: err.message };
      }
    }

    // Fallback Local Store
    return this.fallbackLocalRecord(params);
  },

  /**
   * Helper dành riêng cho POS checkout để ghi log hàng loạt sản phẩm khi thanh toán thành công.
   */
  async recordPosSale(params: {
    orderId: string;
    orderCode: string;
    counterId: string;
    counterName?: string;
    items: Array<{ id: string; name: string; quantity: number; unit_price: number }>;
    performedBy: string;
  }): Promise<MovementResult[]> {
    const results: MovementResult[] = [];
    for (const item of params.items) {
      const res = await this.recordStockMovement({
        productId: item.id,
        type: 'POS_SALE',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        salesCounterId: params.counterId,
        salesCounterName: params.counterName,
        referenceType: 'POS_ORDER',
        referenceCode: params.orderCode,
        idempotencyKey: `POS_${params.orderId}_${item.id}`,
        performedBy: params.performedBy,
        note: `Bán lẻ POS tại Quầy #${params.counterName || params.counterId} (Thu ngân: ${params.performedBy})`,
        reason: `Hóa đơn bán hàng #${params.orderCode}`,
      });
      results.push(res);
    }
    return results;
  },

  /**
   * Fallback nội bộ: Phân trang từ dbStore khi Backend không có mạng hoặc chạy chế độ demo offline.
   */
  fallbackLocalMovements(
    params: StockMovementFilterParams,
    page: number,
    size: number
  ): ApiResponse<StockMovementPageResponse> {
    const all = dbStore.loadStockLogs().slice();
    // Stable sort: created_at DESC, id DESC
    all.sort((a, b) => {
      const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return String(b.id || '').localeCompare(String(a.id || ''));
    });

    const filtered = all.filter((log) => {
      if (params.productId && params.productId !== 'ALL' && log.product_id !== params.productId) return false;
      if (params.type && params.type !== 'ALL' && log.type !== params.type) return false;
      if (params.salesCounterId && log.sales_counter_id !== params.salesCounterId) return false;
      if (params.performedBy && !log.performed_by?.toLowerCase().includes(params.performedBy.toLowerCase())) return false;
      if (params.referenceCode && !log.reference_code?.toLowerCase().includes(params.referenceCode.toLowerCase())) return false;
      if (params.fromDate && log.created_at.split('T')[0] < params.fromDate) return false;
      if (params.toDate && log.created_at.split('T')[0] > params.toDate) return false;

      if (params.keyword && params.keyword.trim()) {
        const kw = params.keyword.toLowerCase().trim();
        const match =
          (log.product_name && log.product_name.toLowerCase().includes(kw)) ||
          (log.product_code && log.product_code.toLowerCase().includes(kw)) ||
          (log.reference_code && log.reference_code.toLowerCase().includes(kw)) ||
          (log.reason && log.reason.toLowerCase().includes(kw)) ||
          (log.performed_by && log.performed_by.toLowerCase().includes(kw));
        if (!match) return false;
      }
      return true;
    });

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const startIndex = page * size;
    const content = filtered.slice(startIndex, startIndex + size);

    return {
      code: 200,
      message: 'OK (Local Fallback)',
      data: {
        content: content.map(normalizeStockMovementLog),
        page,
        size,
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
      },
    };
  },

  fallbackLocalRecord(params: RecordMovementParams): MovementResult {
    const {
      productId,
      type,
      quantity = 1,
      unitPrice,
      targetQuantity,
      salesCounterId,
      salesCounterName,
      referenceType = 'MANUAL',
      referenceCode,
      idempotencyKey,
      performedBy = 'admin',
      note,
      reason,
    } = params;

    let product = dbStore.products.find((p) => p.id === productId);
    if (!product) {
      return { success: false, message: `Không tìm thấy sản phẩm ${productId}` };
    }

    const beforeQty = Number(product.stock_quantity) || 0;
    let afterQty = beforeQty;
    let delta = Math.abs(quantity);

    if (type === 'IMPORT' || type === 'RETURN') {
      afterQty = beforeQty + delta;
    } else if (type === 'EXPORT' || type === 'DAMAGED' || type === 'POS_SALE') {
      if (delta > beforeQty && type === 'EXPORT') {
        return { success: false, message: `Số lượng xuất (${delta}) vượt quá tồn kho (${beforeQty})` };
      }
      afterQty = Math.max(0, beforeQty - delta);
      delta = -delta;
    } else if (type === 'ADJUST') {
      afterQty = targetQuantity !== undefined ? Math.max(0, targetQuantity) : beforeQty + delta;
      delta = afterQty - beforeQty;
    }

    product.stock_quantity = afterQty;
    product.updated_at = new Date().toISOString();
    dbStore.saveToStorage();

    const price = unitPrice !== undefined ? unitPrice : (Number(product.price) || 0);
    const log: StockMovementLog = {
      id: `mov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      product_id: product.id,
      product_code: product.code,
      product_name: product.name,
      unit: product.unit,
      type,
      quantity: delta,
      before_quantity: beforeQty,
      after_quantity: afterQty,
      unit_price: price,
      total_value: Math.abs(delta) * price,
      sales_counter_id: salesCounterId,
      sales_counter_name: salesCounterName,
      reference_type: referenceType,
      reference_code: referenceCode,
      idempotency_key: idempotencyKey,
      performed_by: performedBy,
      reason,
      note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: performedBy,
      updated_by: performedBy,
    };

    dbStore.stockLogs.unshift(log);
    dbStore.saveToStorage();

    window.dispatchEvent(new CustomEvent('hpticket_stock_logs_updated'));
    window.dispatchEvent(new CustomEvent('hpticket_stock_changed'));

    return { success: true, log, updatedProduct: product };
  },
};
