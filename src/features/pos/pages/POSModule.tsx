import React, { useMemo } from 'react';
import { usePOS } from '../hooks/usePOS';
import { ReceiptPrintModal } from '../components/ReceiptPrintModal';
import { CounterSelectionModal } from '../components/CounterSelectionModal';
import { BookingSelectionModal } from '../components/BookingSelectionModal';
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
    phoneNumber, setPhoneNumber,
    usageDate, setUsageDate,
    companyName, setCompanyName,
    companyTaxCode, setCompanyTaxCode,
    companyEmail, setCompanyEmail,
    companyAddress, setCompanyAddress,
    email, setEmail,
    selectedGroupCode, setSelectedGroupCode,
    selectedSourceId, setSelectedSourceId,
    invoiceStatus, setInvoiceStatus,
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
    dayContext,
    toastMessage, showToast, closeToast,
    currentBooking, isCheckingBooking,
    matchingBookings, isBookingSelectionOpen, setIsBookingSelectionOpen, applyBookingToPOS,
    handleToggleItem, updateLineItem, handleCheckBookingCode, handleResetForm, handleCheckout
  } = usePOS();

  const totalSubtotalBeforeDiscount = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => acc + item.unit_price * (Number(item.quantity) || 0), 0
    );
  }, [lineItems]);

  // Tiền sau khi áp dụng giảm giá nhóm KH trên từng dòng vé
  const subtotalAfterLineDiscounts = useMemo(() => {
    return lineItems.reduce((acc, item) => {
      const qty = Number(item.quantity) || 0;
      const lineTotal = Math.round(item.unit_price * qty * (1 - (item.discount_percent || 0) / 100));
      return acc + lineTotal;
    }, 0);
  }, [lineItems]);

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
    <div className="flex flex-col p-4 max-w-[1600px] mx-auto text-slate-800 print:h-auto print:p-0 print:m-0 print:max-w-none min-h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)]">
      {!selectedCounterId && counters.length > 0 && (
        <CounterSelectionModal counters={counters} setSelectedCounterId={setSelectedCounterId} />
      )}

      {isBookingSelectionOpen && (
        <BookingSelectionModal
          isOpen={isBookingSelectionOpen}
          onClose={() => setIsBookingSelectionOpen(false)}
          searchQuery={searchBookingCode}
          bookings={matchingBookings}
          onSelectBooking={applyBookingToPOS}
        />
      )}

      <div className="no-print flex-1 flex flex-col min-h-0 gap-4">
        <POSInvoiceForm
          searchBookingCode={searchBookingCode} setSearchBookingCode={setSearchBookingCode} handleCheckBookingCode={handleCheckBookingCode}
          selectedCounterId={selectedCounterId} setSelectedCounterId={setSelectedCounterId} counters={counters}
          invoiceCode={invoiceCode} setInvoiceCode={setInvoiceCode}
          selectedGroupCode={selectedGroupCode} setSelectedGroupCode={setSelectedGroupCode} customerGroups={customerGroups}
          selectedPromotionId={selectedPromotionId} setSelectedPromotionId={setSelectedPromotionId} promotions={promotions}
          setExtraDiscount={setExtraDiscount} bookingCode={bookingCode} setBookingCode={setBookingCode}
          selectedSourceId={selectedSourceId} setSelectedSourceId={setSelectedSourceId} customerSources={customerSources}
          customerName={customerName} setCustomerName={setCustomerName}
          companyName={companyName} setCompanyName={setCompanyName}
          companyTaxCode={companyTaxCode} setCompanyTaxCode={setCompanyTaxCode}
          companyAddress={companyAddress} setCompanyAddress={setCompanyAddress}
          companyEmail={companyEmail} setCompanyEmail={setCompanyEmail}
          email={email} setEmail={setEmail}
          phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} usageDate={usageDate} setUsageDate={setUsageDate}
          dayContext={dayContext}
          currentBooking={currentBooking}
          isCheckingBooking={isCheckingBooking}
          invoiceStatus={invoiceStatus} setInvoiceStatus={setInvoiceStatus}
          setLineItems={setLineItems}
        />

        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          <div className="flex-1 min-w-0 flex flex-col">
            <POSCartTable
              lineItems={lineItems} setLineItems={setLineItems} updateLineItem={updateLineItem}
              selectedGroupCode={selectedGroupCode} setSelectedGroupCode={setSelectedGroupCode}
              customerGroups={customerGroups} effectiveExtraDiscount={effectiveExtraDiscount}
              handleCheckout={handleCheckout} subtotalAfterLineDiscounts={subtotalAfterLineDiscounts}
              depositAmount={depositAmount} setDepositAmount={setDepositAmount}
              extraDiscount={extraDiscount} setExtraDiscount={setExtraDiscount}
              selectedPromotionId={selectedPromotionId} setSelectedPromotionId={setSelectedPromotionId}
              remainingPayable={remainingPayable} paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
              totalSubtotalBeforeDiscount={totalSubtotalBeforeDiscount} grandTotal={grandTotal}
            />
          </div>

          <div className="w-full lg:w-[340px] flex-shrink-0 flex flex-col">
            <POSCatalog
              activeListTab={activeListTab} setActiveListTab={setActiveListTab}
              ticketTemplates={ticketTemplates} ticketZones={ticketZones} products={products}
              lineItems={lineItems} handleToggleItem={handleToggleItem}
              selectedCounter={selectedCounter}
            />
          </div>
        </div>

        {!isBookingSelectionOpen && (
          <POSActionBar
            handleResetForm={handleResetForm} handleCheckout={handleCheckout}
            effectiveExtraDiscount={effectiveExtraDiscount} lineItemsCount={lineItems.length} isProcessing={isProcessing}
          />
        )}
      </div>

      {completedOrder && (
        (() => {
          const appliedGroup = customerGroups.find(g => g.code === selectedGroupCode);
          const appliedPromo = promotions.find(p => p.id === selectedPromotionId);

          return (
            <ReceiptPrintModal
              order={completedOrder}
              tickets={generatedTickets}
              customerName={customerName || (completedOrder as any).booker_name || ''}
              customerGroupName={appliedGroup?.name || (completedOrder as any).customer_group_name || ''}
              phoneNumber={phoneNumber || (completedOrder as any).customer_phone || ''}
              paymentMethod={paymentMethod || completedOrder.payment_method}
              customerSourceName={selectedSourceId ? (customerSources.find((s) => s.id === selectedSourceId)?.company_name || '') : ((completedOrder as any).customer_source_name || '')}
              groupDiscountNote={appliedGroup && appliedGroup.discount_percent > 0 ? `${appliedGroup.discount_percent}%` : ''}
              groupDiscountAmount={systemDiscountAmount}
              promoDiscountNote={appliedPromo ? appliedPromo.name : ''}
              invoiceRequested={
                invoiceStatus === 'IMMEDIATE' ||
                (completedOrder as any).invoice_status === 'IMMEDIATE' ||
                (completedOrder as any).invoice_status === 'ISSUED' ||
                (completedOrder as any).invoice_status === 'ISSUED_BULK' ||
                Boolean((completedOrder as any).invoice_number) ||
                Boolean((completedOrder as any).invoiceNumber) ||
                Boolean((completedOrder as any).invoice_lookup_code) ||
                Boolean((completedOrder as any).invoiceLookupCode)
              }
              onNewOrder={() => { setCompletedOrder(null); handleResetForm(); }}
            />
          );
        })()
      )}

    </div>
  );
};
