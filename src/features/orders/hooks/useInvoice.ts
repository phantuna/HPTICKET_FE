import { useState } from 'react';
import { invoiceService, IssueOrderPayload } from '../services/invoiceService';

export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'ISSUED_BULK' | 'FAILED' | null;

export interface UseInvoiceReturn {
  // Checkbox selection state
  selectedOrderIds: string[];
  toggleSelectOrder: (id: string) => void;
  clearSelection: () => void;
  isAllSelected: (orders: any[]) => boolean;
  toggleSelectAll: (orders: any[]) => void;

  // Modal state (nhập thông tin MST)
  isModalOpen: boolean;
  openIssueModal: () => void;
  closeIssueModal: () => void;

  // Submit logic
  isSubmitting: boolean;
  issueSelectedOrders: (payload: IssueOrderPayload, onSuccess: () => void) => Promise<void>;
  issueBulkRetail: (date: string | undefined, onSuccess: () => void) => Promise<void>;

  // UI feedback
  toastMessage: string | null;
  clearToast: () => void;
}

export const useInvoice = (): UseInvoiceReturn => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const clearSelection = () => setSelectedOrderIds([]);

  const isEligibleForInvoice = (order: any) => {
    const status = order.invoice_status || (order.invoice_number ? 'ISSUED' : 'UNISSUED');
    return status !== 'ISSUED' && status !== 'ISSUED_BULK' && status !== 'PENDING';
  };

  const isAllSelected = (orders: any[]) => {
    const eligibleOrders = orders.filter(isEligibleForInvoice);
    return eligibleOrders.length > 0 && eligibleOrders.every(o => selectedOrderIds.includes(o.id));
  };

  const toggleSelectAll = (orders: any[]) => {
    const eligibleOrders = orders.filter(isEligibleForInvoice);
    if (isAllSelected(orders)) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(eligibleOrders.map(o => o.id));
    }
  };

  const openIssueModal = () => {
    if (selectedOrderIds.length === 0) {
      showToast('⚠️ Vui lòng chọn ít nhất 1 đơn hàng để phát hành HĐDT!');
      return;
    }
    setIsModalOpen(true);
  };

  const closeIssueModal = () => setIsModalOpen(false);

  /**
   * Phát hành HĐ cho từng đơn được chọn (theo tuần tự).
   * Dùng cho khách công ty - mỗi đơn 1 HĐ riêng.
   */
  const issueSelectedOrders = async (payload: IssueOrderPayload, onSuccess: () => void) => {
    setIsSubmitting(true);
    try {
      // Gọi tuần tự từng orderId (tránh spam API song song)
      for (const orderId of selectedOrderIds) {
        await invoiceService.issueForOrder(orderId, payload);
      }
      showToast(`✅ Đã gửi yêu cầu tạo HĐ Nháp cho ${selectedOrderIds.length} đơn hàng!`);
      clearSelection();
      closeIssueModal();
      onSuccess();
    } catch (err: any) {
      // Bóc tách message lỗi từ backend (thường nằm ở err.response.data.message)
      const errorMsg = err?.response?.data?.message || err?.message || 'Lỗi không xác định';
      showToast(`❌ Lỗi tạo HĐDT: ${errorMsg}`);
      throw new Error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gộp và phát hành HĐ tổng cho toàn bộ khách lẻ trong ngày.
   */
  const issueBulkRetail = async (date: string | undefined, onSuccess: () => void) => {
    setIsSubmitting(true);
    try {
      const res = await invoiceService.issueBulkRetail(date);
      const status = res?.data?.status;
      if (status === 'SUCCESS') {
        showToast('✅ Phát hành HĐDT khách lẻ gộp thành công!');
        onSuccess();
      } else {
        showToast(`⚠️ ${res?.message || 'Không có đơn nào cần phát hành.'}`);
      }
    } catch (err: any) {
      showToast(`❌ Lỗi gộp HĐDT: ${err?.message || 'Không rõ lỗi'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    selectedOrderIds,
    toggleSelectOrder,
    clearSelection,
    isAllSelected,
    toggleSelectAll,
    isModalOpen,
    openIssueModal,
    closeIssueModal,
    isSubmitting,
    issueSelectedOrders,
    issueBulkRetail,
    toastMessage,
    clearToast: () => setToastMessage(null),
  };
};
