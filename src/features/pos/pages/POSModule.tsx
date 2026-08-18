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
    (acc, item) => acc + item.unit_price * item.quantity, 0
  );

  const totalLineDiscounts = lineItems.reduce(
    (acc, item) => acc + Math.round((item.unit_price * item.quantity * item.discount_percent) / 100), 0
  );

  const subtotalAfterLineDiscounts = totalSubtotalBeforeDiscount - totalLineDiscounts;

  let promotionDiscountAmount = 0;
  const appliedPromo = promotions.find(p => p.id === selectedPromotionId);
  if (appliedPromo) {
    if (appliedPromo.discount_percent > 0) {
      promotionDiscountAmount = Math.round((subtotalAfterLineDiscounts * appliedPromo.discount_percent) / 100);
    } else if (appliedPromo.discount_value > 0) {
      promotionDiscountAmount = appliedPromo.discount_value;
    }
  }

  const effectiveExtraDiscount = Math.max(extraDiscount, promotionDiscountAmount);
  const grandTotal = Math.max(0, subtotalAfterLineDiscounts - effectiveExtraDiscount);
  const remainingPayable = Math.max(0, grandTotal - depositAmount);

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
              groupDiscountAmount={totalLineDiscounts}
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
