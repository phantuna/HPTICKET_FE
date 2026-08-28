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
    toastMessage,
    handleToggleItem, updateLineItem, handleCheckBookingCode, handleResetForm, handleCheckout
  } = usePOS();

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
        <div className={`fixed top-8 right-8 z-[9999] p-6 rounded-2xl shadow-2xl flex flex-col gap-2 min-w-[380px] max-w-lg transition-colors duration-300 animate-pulse ${toastMessage.type === 'error' ? 'bg-rose-600 text-white border-2 border-rose-400' : 'bg-emerald-600 text-white border-2 border-emerald-400'}`}>
            <h4 className="text-lg font-bold flex items-center gap-2">{toastMessage.title}</h4>
            <p className={`text-sm mt-1 leading-relaxed ${toastMessage.type === 'error' ? 'text-rose-50' : 'text-emerald-50'}`}>{toastMessage.message}</p>
        </div>
      )}
    </div>
  );
};
