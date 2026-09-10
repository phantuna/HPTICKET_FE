import React from 'react';
import { usePOS } from '../hooks/usePOS';
import { ReceiptPrintModal } from '../components/ReceiptPrintModal';
import { CounterSelectionModal } from '../components/CounterSelectionModal';
import { POSInvoiceForm } from '../components/POSInvoiceForm';
import { POSCartTable } from '../components/POSCartTable';
import { POSCatalog } from '../components/POSCatalog';
import { POSActionBar } from '../components/POSActionBar';

export const POSModule: React.FC = () => {
  const {
    searchBookingCode, setSearchBookingCode,
    invoiceCode, setInvoiceCode,
    bookingCode, setBookingCode,
    customerName, setCustomerName,
    companyAddress, setCompanyAddress,
    email, setEmail,
    selectedGroupCode, setSelectedGroupCode,
    selectedSourceId, setSelectedSourceId,
    invoiceStatus, setInvoiceStatus,
    companyTaxCode, setCompanyTaxCode,
    lineItems, setLineItems,
    depositAmount, setDepositAmount,
    extraDiscount, setExtraDiscount,
    paymentMethod, setPaymentMethod,
    selectedCounterId, setSelectedCounterId,
    isProcessing,
    completedOrder, setCompletedOrder,
    generatedTickets,
    activeListTab, setActiveListTab,
    ticketTemplates, ticketZones, products, customerGroups, customerSources, promotions, selectedPromotionId, setSelectedPromotionId, counters,
    toastMessage, showToast, closeToast,
    handleToggleItem, updateLineItem, handleCheckBookingCode, handleResetForm, handleCheckout
  } = usePOS();

  React.useEffect(() => {
    const handleToast = (e: any) => {
      if (e.detail) {
        showToast(e.detail.type, e.detail.title, e.detail.message);
      }
    };
    window.addEventListener('toast_notification', handleToast);
    return () => window.removeEventListener('toast_notification', handleToast);
  }, [showToast]);

  const totalSubtotalBeforeDiscount = lineItems.reduce(
    (acc, item) => acc + item.unit_price * (Number(item.quantity) || 0), 0
  );

  // Tiền sau khi áp dụng giảm giá nhóm KH trên từng dòng vé
  const subtotalAfterLineDiscounts = lineItems.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const lineTotal = Math.round(item.unit_price * qty * (1 - (item.discount_percent || 0) / 100));
    return acc + lineTotal;
  }, 0);

  // Tổng tiền giảm của nhóm KH (chỉ để hiển thị)
  const systemDiscountAmount = totalSubtotalBeforeDiscount - subtotalAfterLineDiscounts;

  // 2. MANUAL Discount (Thu ngân gõ tay vào ô Giảm giá thêm)
  const manualDiscountAmount = extraDiscount || 0;

  // 3. PROMOTION Discount (Voucher KM) - so sánh với systemDiscount, lấy cái nào lớn hơn
  let promotionDiscountAmount = 0;
  const appliedPromo = promotions.find(p => p.id === selectedPromotionId);
  if (appliedPromo) {
    if (appliedPromo.discount_percent > 0) {
      promotionDiscountAmount = Math.round(totalSubtotalBeforeDiscount * (appliedPromo.discount_percent / 100));
    } else if (appliedPromo.discount_value > 0) {
      promotionDiscountAmount = appliedPromo.discount_value;
    }
  }

  // Cơ chế MAX: So sánh System (nhóm KH) vs Promotion
  // Nếu nhóm KH giảm nhiều hơn -> Dùng giảm giá dòng (discount_percent) -> extraDiscount trên bill = 0
  // Nếu Promotion giảm nhiều hơn -> Bỏ qua giảm giá dòng, dùng promotionDiscount trên toàn đơn
  let effectiveExtraDiscount = 0;
  let grandTotal = 0;

  if (systemDiscountAmount >= promotionDiscountAmount) {
    // Nhóm KH thắng: Dùng giảm giá đã tính trong từng dòng
    effectiveExtraDiscount = Math.max(manualDiscountAmount, 0);
    grandTotal = Math.max(0, subtotalAfterLineDiscounts - effectiveExtraDiscount);
  } else {
    // Promotion thắng: Bỏ qua giảm giá nhóm KH, áp promotion lên giá gốc
    effectiveExtraDiscount = Math.max(manualDiscountAmount, promotionDiscountAmount);
    grandTotal = Math.max(0, totalSubtotalBeforeDiscount - effectiveExtraDiscount);
  }

  const remainingPayable = Math.max(0, grandTotal - depositAmount);

  const selectedCounter = counters.find(c => c.id === selectedCounterId);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5 text-slate-800 print:p-0 print:m-0 print:max-w-none">
      {!selectedCounterId && counters.length > 0 && (
        <CounterSelectionModal counters={counters} setSelectedCounterId={setSelectedCounterId} />
      )}

      <div className="no-print space-y-5">
        <POSInvoiceForm
          searchBookingCode={searchBookingCode} setSearchBookingCode={setSearchBookingCode} handleCheckBookingCode={handleCheckBookingCode}
          selectedCounterId={selectedCounterId} setSelectedCounterId={setSelectedCounterId} counters={counters}
          invoiceCode={invoiceCode} setInvoiceCode={setInvoiceCode}
          selectedGroupCode={selectedGroupCode} setSelectedGroupCode={setSelectedGroupCode} customerGroups={customerGroups}
          selectedPromotionId={selectedPromotionId} setSelectedPromotionId={setSelectedPromotionId} promotions={promotions}
          setExtraDiscount={setExtraDiscount} bookingCode={bookingCode} setBookingCode={setBookingCode}
          selectedSourceId={selectedSourceId} setSelectedSourceId={setSelectedSourceId} customerSources={customerSources}
          setLineItems={setLineItems} invoiceStatus={invoiceStatus} setInvoiceStatus={setInvoiceStatus}
          customerName={customerName} setCustomerName={setCustomerName} companyTaxCode={companyTaxCode} setCompanyTaxCode={setCompanyTaxCode}
          companyAddress={companyAddress} setCompanyAddress={setCompanyAddress} email={email} setEmail={setEmail}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <POSCartTable
            lineItems={lineItems} setLineItems={setLineItems} updateLineItem={updateLineItem}
            selectedGroupCode={selectedGroupCode} customerGroups={customerGroups} effectiveExtraDiscount={effectiveExtraDiscount}
            handleCheckout={handleCheckout} subtotalAfterLineDiscounts={subtotalAfterLineDiscounts}
            depositAmount={depositAmount} setDepositAmount={setDepositAmount}
            extraDiscount={extraDiscount} setExtraDiscount={setExtraDiscount}
            selectedPromotionId={selectedPromotionId} setSelectedPromotionId={setSelectedPromotionId}
            remainingPayable={remainingPayable} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
            totalSubtotalBeforeDiscount={totalSubtotalBeforeDiscount} grandTotal={grandTotal}
          />

          <POSCatalog
            activeListTab={activeListTab} setActiveListTab={setActiveListTab}
            ticketTemplates={ticketTemplates} ticketZones={ticketZones} products={products}
            lineItems={lineItems} handleToggleItem={handleToggleItem}
            selectedCounter={selectedCounter}
          />
        </div>

        <POSActionBar
          handleResetForm={handleResetForm} handleCheckout={handleCheckout}
          effectiveExtraDiscount={effectiveExtraDiscount} lineItemsCount={lineItems.length} isProcessing={isProcessing}
        />
      </div>

      {completedOrder && (
        (() => {
          const appliedGroup = customerGroups.find(g => g.code === selectedGroupCode);
          const appliedPromo = promotions.find(p => p.id === selectedPromotionId);

          return (
            <ReceiptPrintModal
              order={completedOrder}
              tickets={generatedTickets}
              customerName={customerName}
              phoneNumber={""}
              paymentMethod={paymentMethod}
              customerSourceName={selectedSourceId ? customerSources.find((s) => s.id === selectedSourceId)?.company_name || 'Khách vãng lai' : 'Khách vãng lai'}
              groupDiscountNote={appliedGroup && appliedGroup.discount_percent > 0 ? `${appliedGroup.discount_percent}%` : ''}
              groupDiscountAmount={systemDiscountAmount}
              promoDiscountNote={appliedPromo ? appliedPromo.name : ''}
              promoDiscountAmount={extraDiscount}
              onClose={() => { setCompletedOrder(null); handleResetForm(); }}
              onNewOrder={() => { setCompletedOrder(null); handleResetForm(); }}
            />
          );
        })()
      )}

      {toastMessage && (
        <div className={`fixed top-8 right-8 z-[9999] p-4 rounded-xl shadow-lg flex items-start gap-3 min-w-[320px] max-w-md transform transition-all duration-300 ease-out border-l-4 ${
          toastMessage.type === 'error' 
            ? 'bg-white border-rose-500 text-slate-800' 
            : 'bg-white border-emerald-500 text-slate-800'
        }`}>
            <div className={`mt-0.5 flex-shrink-0 ${toastMessage.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>
              {toastMessage.type === 'error' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              )}
            </div>
            <div className="flex-1">
               <h4 className="text-base font-semibold">{toastMessage.title}</h4>
               <p className="text-sm mt-1 text-slate-600">{toastMessage.message}</p>
            </div>
            <button onClick={closeToast} className="text-slate-400 hover:text-slate-600 transition-colors p-1" title="Đóng">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
        </div>
      )}
    </div>
  );
};
