/**
 * Invoice Service - Feature: orders
 * Gọi API Backend module vinvoice để phát hành HĐDT qua Viettel S-Invoice.
 */
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';

export interface IssueOrderPayload {
  buyer_tax_code?: string;
  buyer_legal_name?: string;
  buyer_address?: string;
  buyer_email?: string;
}

export interface BulkRetailPayload {
  date?: string; // YYYY-MM-DD, để trống = hôm nay
}

export const invoiceService = {
  async issueForOrder(orderId: string, payload: IssueOrderPayload) {
    const body = { ...payload };
    return apiClient.post<any>(API_ENDPOINTS.VINVOICE.ISSUE_ORDER(orderId), body);
  },

  /**
   * Gộp và phát hành HĐDT tổng cho toàn bộ đơn khách lẻ PENDING trong ngày.
   */
  async issueBulkRetail(date?: string) {
    const params = date ? { date } : {};
    return apiClient.post<any>(API_ENDPOINTS.VINVOICE.ISSUE_BULK_RETAIL, params);
  },
};
