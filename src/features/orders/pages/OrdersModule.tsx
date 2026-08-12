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
    fetchData, fetchOrderDetail, goToPage, changePageSize
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
    (t) =>
      t.qr_code_string.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.ticket_template_name && t.ticket_template_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 relative">
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
  );
};
