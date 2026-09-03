import React from 'react';
import { Receipt } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { useInvoice } from '../hooks/useInvoice';
import { OrderFilterBar } from '../components/OrderFilterBar';
import { OrdersTable } from '../components/OrdersTable';
import { TicketsGrid } from '../components/TicketsGrid';
import { OrderDetailModal } from '../components/OrderDetailModal';
import { TicketQRModal } from '../components/TicketQRModal';
import { InvoiceActionBar } from '../components/InvoiceActionBar';
import { IssueInvoiceModal } from '../components/IssueInvoiceModal';
import { salesService } from '../../../api/salesService';
import { ReceiptPrintModal } from '../../pos/components/ReceiptPrintModal';
import { PromptModal } from '../../../shared/components/PromptModal';
import { downloadExcelFromApi } from '../../reports/utils/excelExporter';

export const OrdersModule: React.FC = () => {
  const {
    activeSubTab, setActiveSubTab,
    searchQuery, setSearchQuery,
    fromDate, setFromDate,
    toDate, setToDate,
    filterCounterId, setFilterCounterId,
    filterSourceId, setFilterSourceId,
    filterOrderCode, setFilterOrderCode,
    filterBookingCode, setFilterBookingCode,
    ticketCounters, customerSources,
    selectedOrder, setSelectedOrder,
    selectedTicket, setSelectedTicket,
    orders, issuedTickets,
    orderDetail,
    currentPage, pageSize, totalElements, totalPages, isLoading,
    fetchData, fetchOrderDetail, goToPage, changePageSize, loadDropdowns
  } = useOrders();

  const {
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
    clearToast
  } = useInvoice();

  const [reprintData, setReprintData] = React.useState<{order: any, tickets: any[]} | null>(null);
  const [isReprinting, setIsReprinting] = React.useState(false);
  const [isCancellingId, setIsCancellingId] = React.useState<string | undefined>();

  const [promptModalOpen, setPromptModalOpen] = React.useState(false);
  const [orderToCancel, setOrderToCancel] = React.useState<any>(null);

  const handleCancelOrderClick = (ord: any) => {
    setOrderToCancel(ord);
    setPromptModalOpen(true);
  };

  const handleConfirmCancel = async (reason: string) => {
    if (!orderToCancel || !reason) return;
    
    setPromptModalOpen(false);
    setIsCancellingId(orderToCancel.id);
    
    try {
      const res = await salesService.cancelOrder(orderToCancel.id, reason);
      if (res.code === 200 || res.code === 201 || res.code === 204) {
        // Clear selection just in case the cancelled order was previously selected
        clearSelection();
        fetchData(); 
      } else {
        alert(res.message || 'Hủy đơn hàng thất bại');
      }
    } catch (err: any) {
      if (err.code === 403 || (err.message && err.message.toLowerCase().includes('quyền'))) {
        alert('Lỗi 403: Bạn không có quyền thao tác trên quầy bán này hoặc quyền đã bị thu hồi. Ứng dụng sẽ tải lại.');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        alert('Lỗi khi hủy đơn hàng. Vui lòng thử lại sau.');
      }
    } finally {
      setIsCancellingId(undefined);
      setOrderToCancel(null);
    }
  };

  const handleReprintOrder = async (ord: any) => {
    setIsReprinting(true);
    try {
      // 1. Gọi API lấy thông tin Order chi tiết
      const orderRes = await salesService.fetchOrderDetail(ord.id);
      // 2. Gọi API lấy toàn bộ vé của order đó
      const ticketsRes = await salesService.fetchIssuedTicketsByOrder(ord.id);
      
      let fullOrder = ord;
      if (orderRes && typeof orderRes === 'object') {
        fullOrder = orderRes.data || orderRes;
      }

      let ticketsList: any[] = [];
      if (Array.isArray(ticketsRes)) {
        ticketsList = ticketsRes;
      } else if (ticketsRes && Array.isArray(ticketsRes.data)) {
        ticketsList = ticketsRes.data;
      } else if (ticketsRes && typeof ticketsRes === 'object' && !ticketsRes.data && !ticketsRes.code) {
        // Fallback for single object without wrapper
        ticketsList = [ticketsRes];
      } else if (ticketsRes && ticketsRes.data && typeof ticketsRes.data === 'object') {
        ticketsList = [ticketsRes.data];
      }

      if (ticketsList.length === 0) {
        alert('Đơn hàng này không có vé nào để in!');
        return;
      }
      // 3. Đưa vào State để render ReceiptPrintModal
      setReprintData({ order: fullOrder, tickets: ticketsList });
    } catch (error) {
      console.error("Lỗi khi tải thông tin vé để in lại:", error);
      alert('Đã xảy ra lỗi khi kết nối với máy chủ để in lại vé!');
    } finally {
      setIsReprinting(false);
    }
  };

  const filteredOrders = orders
    .filter((o) => {
      if (searchQuery) {
        const sq = searchQuery.toLowerCase();
        if (!o.order_code.toLowerCase().includes(sq) &&
            !(o.invoice_number && o.invoice_number.toLowerCase().includes(sq))) {
          return false;
        }
      }
      
      if (filterOrderCode && !o.order_code.toLowerCase().includes(filterOrderCode.toLowerCase())) return false;
      if (filterBookingCode && o.booking_code && !o.booking_code.toLowerCase().includes(filterBookingCode.toLowerCase())) return false;
      if (filterCounterId && String(o.sales_counter_id) !== filterCounterId) return false;
      if (filterSourceId && String(o.customer_source_id) !== filterSourceId) return false;
      
      if (fromDate) {
        const oDate = new Date(o.created_at);
        const fDate = new Date(fromDate);
        fDate.setHours(0, 0, 0, 0);
        if (oDate < fDate) return false;
      }
      if (toDate) {
        const oDate = new Date(o.created_at);
        const tDate = new Date(toDate);
        tDate.setHours(23, 59, 59, 999);
        if (oDate > tDate) return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });

  const filteredTickets = issuedTickets.filter(
    (t: any) =>
      t.qr_code_string.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ticket_template_name && t.ticket_template_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleExportOrders = async () => {
    if (!fromDate || !toDate) {
      alert("Vui lòng chọn Từ ngày và Đến ngày để xuất Excel.");
      return;
    }
    const fDate = new Date(fromDate);
    const tDate = new Date(toDate);
    const diffDays = Math.ceil((tDate.getTime() - fDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 0) {
      alert("Đến ngày phải lớn hơn hoặc bằng Từ ngày.");
      return;
    }
    if (diffDays > 7) {
      alert("Chỉ cho phép xuất danh sách đơn hàng tối đa 7 ngày để đảm bảo hiệu suất hệ thống.");
      return;
    }

    try {
      await downloadExcelFromApi('/sales/orders/export', { fromDate, toDate }, 'DanhSachDonHang.xlsx');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Lỗi khi xuất dữ liệu. Vui lòng thử lại sau.');
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 relative print:p-0 print:m-0 print:space-y-0 print:max-w-none">
      <div className="print:hidden space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-fade-in">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3">
            <span className="text-sm font-medium">{toastMessage}</span>
            <button onClick={clearToast} className="text-slate-400 hover:text-white transition">
              <span className="sr-only">Close</span>
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" /> Quản Lý Đơn Hàng POS
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý và đối soát danh sách hóa đơn bán hàng
          </p>
        </div>
      </div>

      <OrderFilterBar
        activeSubTab={activeSubTab}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        fromDate={fromDate} setFromDate={setFromDate}
        toDate={toDate} setToDate={setToDate}
        filterCounterId={filterCounterId} setFilterCounterId={setFilterCounterId}
        filterOrderCode={filterOrderCode} setFilterOrderCode={setFilterOrderCode}
        filterBookingCode={filterBookingCode} setFilterBookingCode={setFilterBookingCode}
        filterSourceId={filterSourceId} setFilterSourceId={setFilterSourceId}
        ticketCounters={ticketCounters} customerSources={customerSources}
        isLoading={isLoading}
        onSearch={() => { goToPage(0); }}
        onFilterFocus={loadDropdowns}
        onExportOrders={handleExportOrders}
      />

      {/* Invoice Action Bar */}
      {activeSubTab === 'orders' && (
        <div className="mb-2">
           <InvoiceActionBar
              selectedCount={selectedOrderIds.length}
              isSubmitting={isSubmitting}
              todayDate={new Date().toISOString().split('T')[0]}
              onIssueSelected={openIssueModal}
              onIssueBulkRetail={() => issueBulkRetail(undefined, () => fetchData())}
              onClearSelection={clearSelection}
           />
        </div>
      )}

      {activeSubTab === 'orders' && (
        <OrdersTable
          orders={filteredOrders}
          fetchOrderDetail={fetchOrderDetail}
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          goToPage={goToPage}
          changePageSize={changePageSize}
          // Invoice Selection Props
          selectedOrderIds={selectedOrderIds}
          onToggleSelectOrder={toggleSelectOrder}
          onToggleSelectAll={toggleSelectAll}
          isAllSelected={isAllSelected(filteredOrders)}
          onReprintOrder={handleReprintOrder}
          isReprinting={isReprinting}
          onCancelOrder={handleCancelOrderClick}
          isCancellingId={isCancellingId}
        />
      )}

      {activeSubTab === 'tickets' && (
        <TicketsGrid tickets={filteredTickets} setSelectedTicket={setSelectedTicket} />
      )}

      <OrderDetailModal
        selectedOrder={selectedOrder}
        orderDetail={orderDetail}
        issuedTickets={issuedTickets}
        selectedTicket={selectedTicket}
        setSelectedOrder={setSelectedOrder}
        setSelectedTicket={setSelectedTicket}
      />

      <TicketQRModal
        selectedTicket={selectedTicket}
        setSelectedTicket={setSelectedTicket}
      />

      <IssueInvoiceModal
        isOpen={isModalOpen}
        selectedCount={selectedOrderIds.length}
        isSubmitting={isSubmitting}
        onClose={closeIssueModal}
        onSubmitCompany={(payload) => issueSelectedOrders(payload, () => fetchData())}
      />
      </div>

      {reprintData && (
        <ReceiptPrintModal
          order={reprintData.order}
          tickets={reprintData.tickets}
          onClose={() => setReprintData(null)}
          onNewOrder={() => setReprintData(null)} // Đóng modal sau khi in xong
        />
      )}
      {/* Prompt Modal Hủy Đơn */}
      <PromptModal
        isOpen={promptModalOpen}
        onClose={() => {
          setPromptModalOpen(false);
          setOrderToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Hủy đơn hàng"
        message={`Bạn đang yêu cầu hủy đơn hàng ${orderToCancel?.order_code}.\nHành động này không thể hoàn tác và sẽ tự động hoàn lại số lượng tồn kho.\n\nVui lòng nhập lý do hủy:`}
        type="danger"
        confirmText="Xác nhận Hủy"
        placeholder="Nhập lý do hủy..."
        required={true}
      />

    </div>
  );
};
