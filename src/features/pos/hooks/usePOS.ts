import { useState, useEffect } from 'react';
import { salesService } from '../../../api/salesService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { PaymentMethod, ItemType, Order, IssuedTicket } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';

export interface TicketLineItem {
  item_id: string;
  item_type: ItemType;
  name: string;
  code: string;
  quantity: number;
  unit_price: number;
  tax_percent: number;
  discount_percent: number;
  is_group_ticket?: boolean;
  ticket_type?: string;
  allowed_passes_per_unit?: number;
  base_price_per_pass?: number;
}

export const usePOS = () => {
  const [searchBookingCode, setSearchBookingCode] = useState<string>('');
  const [invoiceCode, setInvoiceCode] = useState<string>(`2026_${Math.floor(1000000000 + Math.random() * 9000000000)}`);
  const [bookingCode, setBookingCode] = useState<string>('');
  const [customerMode, setCustomerMode] = useState<'RETAIL' | 'GROUP'>('RETAIL');
  const [customerName, setCustomerName] = useState<string>('Khách lẻ không lấy hóa đơn');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [usageDate, setUsageDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [invoiceStatus, setInvoiceStatus] = useState<'PENDING' | 'IMMEDIATE'>('PENDING');
  const [companyName, setCompanyName] = useState<string>('');
  const [companyTaxCode, setCompanyTaxCode] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyAddress, setCompanyAddress] = useState<string>('');

  const [lineItems, setLineItems] = useState<TicketLineItem[]>([]);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [extraDiscount, setExtraDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [selectedCounterId, setSelectedCounterId] = useState<string>(() => localStorage.getItem('hpticket_pos_selected_counter') || '');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [generatedTickets, setGeneratedTickets] = useState<IssuedTicket[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [activeListTab, setActiveListTab] = useState<'TICKETS' | 'PRODUCTS'>('TICKETS');

  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);
  const [ticketZones, setTicketZones] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [customerSources, setCustomerSources] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [counters, setCounters] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error', title: string, message: string } | null>(null);

  useEffect(() => {
    if (selectedCounterId) {
      localStorage.setItem('hpticket_pos_selected_counter', selectedCounterId);
    }
  }, [selectedCounterId]);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  useEffect(() => {
    const extractList = (json: any) => {
      if (Array.isArray(json)) return json;
      if (json?.data && Array.isArray(json.data)) return json.data;
      if (json?.data?.content && Array.isArray(json.data.content)) return json.data.content;
      if (json?.content && Array.isArray(json.content)) return json.content;
      return [];
    };

    const fetchAll = async () => {
      try {
        const promises = [
          apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES).then(json => {
            const list = extractList(json);
            if (list.length > 0) setTicketTemplates(list.filter(isItemActive));
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.TICKETING.ZONES).then(json => {
            const list = extractList(json);
            if (list.length > 0) setTicketZones(list);
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS_ACTIVE).then(json => {
            const list = extractList(json);
            if (list.length > 0) {
              setCustomerGroups(list);
              if (!list.some((g: any) => g.code === selectedGroupCode)) {
                const retailGroup = list.find((g: any) => g.code === 'KHACH_LE' || g.code === 'RETAIL');
                setSelectedGroupCode(retailGroup ? retailGroup.code : list[0].code);
              }
            }
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES_ACTIVE).then(json => {
            const list = extractList(json);
            if (list.length > 0) setCustomerSources(list);
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS_ACTIVE).then(json => {
            const list = extractList(json);
            const activePromos = list.filter(isItemActive);
            if (activePromos.length > 0) {
              setPromotions(activePromos);
              setSelectedPromotionId(activePromos[0].id);
            }
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.SALES.COUNTERS_ACTIVE).then(json => {
            const list = extractList(json);
            const activeList = list.filter(isItemActive);
            if (activeList.length > 0) {
              setCounters(activeList);
              setSelectedCounterId(prev => {
                if (prev && !activeList.some((c: any) => c.id === prev)) {
                  localStorage.removeItem('hpticket_pos_selected_counter');
                  return '';
                }
                return prev;
              });
            } else {
              setCounters([]);
              setSelectedCounterId('');
              localStorage.removeItem('hpticket_pos_selected_counter');
            }
          }).catch(() => {}),

          apiClient.get<any>(API_ENDPOINTS.SALES.PRODUCTS).then(json => {
            const list = extractList(json);
            if (list.length > 0) setProducts(list.filter(isItemActive));
          }).catch(() => {})
        ];

        await Promise.all(promises);
      } catch (err) { }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedPromotionId) return;
    const promo = promotions.find((p) => p.id === selectedPromotionId);
    if (!promo) return;

    let totalPromoDiscount = 0;
    let eligibleTotal = 0;
    const hasEligibleTicket = lineItems.some((item) => {
      if (item.item_type === ItemType.TICKET) {
        const tpl = ticketTemplates.find((t) => t.id === item.item_id);
        if (tpl && (tpl.is_promotion_applicable || tpl.isPromotionApplicable)) {
          eligibleTotal += item.unit_price * item.quantity * (1 - item.discount_percent / 100);
          return true;
        }
      }
      return false;
    });

    if (hasEligibleTicket) {
      if (promo.discount_type === 'PERCENTAGE' || promo.discount_percent > 0) {
        const percent = promo.discount_percent || promo.discount_value || 0;
        totalPromoDiscount = Math.round(eligibleTotal * (percent / 100));
      } else {
        totalPromoDiscount = promo.discount_value || 0;
      }
      if (totalPromoDiscount > eligibleTotal) totalPromoDiscount = eligibleTotal;
    }
    setExtraDiscount(totalPromoDiscount);
  }, [selectedPromotionId, lineItems, promotions, ticketTemplates]);

  const showToast = (type: 'success' | 'error', title: string, message: string) => {
    setToastMessage({ type, title, message });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleItem = (itemData: any, itemType: ItemType) => {
    const existingIndex = lineItems.findIndex((item) => item.item_id === itemData.id);
    if (existingIndex >= 0) {
      setLineItems((prev) => prev.filter((_, idx) => idx !== existingIndex));
    } else {
      const grp = customerGroups.find((g) => g.code === selectedGroupCode);
      const discount = (grp && itemType === ItemType.TICKET) ? grp.discount_percent : 0;
      const defaultTax = itemType === ItemType.PRODUCT ? 10 : 8;
      const basePasses = itemData.allowedPasses || itemData.allowed_passes || 1;

      setLineItems((prev) => [
        ...prev,
        {
          item_id: itemData.id,
          item_type: itemType,
          name: itemData.name,
          code: itemData.code,
          quantity: 1,
          unit_price: itemData.price,
          tax_percent: itemData.tax_percent !== undefined ? itemData.tax_percent : defaultTax,
          discount_percent: discount,
          ticket_type: itemData.ticket_type,
          allowed_passes_per_unit: basePasses,
          base_price_per_pass: itemData.price / basePasses
        },
      ]);

      if (itemType === ItemType.TICKET && selectedPromotionId) {
        const promo = promotions.find((p) => p.id === selectedPromotionId);
        if (promo && (itemData.is_promotion_applicable || itemData.isPromotionApplicable)) {
          showToast('success', "🎁 Khuyến mại đơn hàng", `Áp dụng mã ${promo.name}, giảm ${(promo.discount_value || 0).toLocaleString('vi-VN')}đ cho tổng hóa đơn!`);
        }
      }
    }
  };

  const updateLineItem = (index: number, field: keyof TicketLineItem, value: any) => {
    setLineItems((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' && updated.quantity < 1) updated.quantity = 1;
          if (field === 'discount_percent') {
            if (updated.discount_percent < 0) updated.discount_percent = 0;
            if (updated.discount_percent > 100) updated.discount_percent = 100;
          }
          return updated;
        }
        return item;
      })
    );
  };

  const handleCheckBookingCode = () => {
    if (!searchBookingCode.trim()) return;
    setBookingCode(searchBookingCode.trim().toUpperCase());
    setCustomerName('Đoàn Khách Lữ Hành Á Châu');
    setPhoneNumber('0905111222');
    setEmail('booking@achautravel.com');
    setSelectedGroupCode('doan_lu_hanh');
    setLineItems([
      {
        item_id: 'tpl-1',
        item_type: ItemType.TICKET,
        name: 'Vé thăm quan người lớn (Trong tuần)',
        code: 'VTQ-NL-NT',
        quantity: 10,
        unit_price: 50000,
        tax_percent: 8,
        discount_percent: 20,
      },
      {
        item_id: 'tpl-3',
        item_type: ItemType.TICKET,
        name: 'Vé Zipline người lớn (Trong tuần)',
        code: 'VZIP-NL-NT',
        quantity: 5,
        unit_price: 150000,
        tax_percent: 8,
        discount_percent: 20,
      },
    ]);
  };

  const handleResetForm = () => {
    setInvoiceCode(`2026_${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setBookingCode('');
    setSearchBookingCode('');
    setCustomerMode('RETAIL');
    setCustomerName('Khách lẻ không lấy hóa đơn');
    setPhoneNumber('');
    setEmail('');
    setInvoiceStatus('PENDING');
    setCompanyName('');
    setCompanyTaxCode('');
    setCompanyEmail('');
    setCompanyAddress('');
    setDepositAmount(0);
    setExtraDiscount(0);
    setLineItems([]);
    if (customerGroups.length > 0) {
      setSelectedGroupCode(customerGroups[0].code);
    } else {
      setSelectedGroupCode('');
    }
    setSelectedSourceId('');
  };

  const handleCheckout = async (effectiveExtraDiscount: number) => {
    if (lineItems.length === 0) return;

    if (invoiceStatus === 'IMMEDIATE') {
      if (!companyTaxCode.trim()) {
        showToast('error', 'Thiếu thông tin', 'Vui lòng nhập Mã số thuế để xuất hóa đơn điện tử!');
        return;
      }
      if (!customerName.trim()) {
        showToast('error', 'Thiếu thông tin', 'Vui lòng nhập Tên công ty để xuất hóa đơn điện tử!');
        return;
      }
    }

    setIsProcessing(true);

    try {
      const cartForService = lineItems.map((item) => ({
        id: item.item_id,
        item_type: item.item_type,
        name: item.name,
        code: item.code,
        unit_price: item.unit_price,
        quantity: item.quantity,
        allowed_passes_per_unit: item.allowed_passes_per_unit || 1
      }));

      const grp = customerGroups.find((g) => g.code === selectedGroupCode);
      const groupDiscount = grp ? grp.discount_percent : 0;

      const res = await salesService.checkout({
        counter_id: selectedCounterId,
        customer_group_id: selectedGroupCode || null,
        customer_source_id: selectedSourceId || null,
        promotion_id: selectedPromotionId || null,
        payment_method: paymentMethod,
        cart_items: cartForService,
        discount_percent: groupDiscount,
        discount_amount_vnd: effectiveExtraDiscount,
        valid_date: usageDate,
        invoice_status: invoiceStatus,
        company_tax_code: companyTaxCode,
        company_name: customerName,
        company_address: companyAddress,
        company_email: email,
      });

      if (res.code === 200 && res.data) {
        const orderId = (res.data as any).id || (res.data as any).order_id;
        const normalizedOrder = {
          ...res.data,
          id: orderId,
          order_code: (res.data as any).order_code || (res.data as any).orderCode,
          details: (res.data as any).items || (res.data as any).details || [],
        };
        let ticketsForOrder: any[] = [];
        let retries = 0;
        
        while (ticketsForOrder.length === 0 && retries < 6) {
          try {
            await salesService.fetchIssuedTickets();
            ticketsForOrder = dbStore.issuedTickets.filter(
              (t) => t.order_id === orderId || (t as any).orderId === orderId
            );
          } catch (e) {
            console.warn("Lỗi khi fetch vé:", e);
          }
          if (ticketsForOrder.length > 0) break;
          await new Promise(r => setTimeout(r, 500));
          retries++;
        }

        if (ticketsForOrder.length === 0 && (res.data as any).issued_qr_codes?.length > 0) {
          ticketsForOrder = (res.data as any).issued_qr_codes.map((qrStr: string, idx: number) => {
            const isFamily = lineItems.some((item) => item.code?.includes('FAMILY') || item.name?.toLowerCase().includes('gia đình') || item.name?.toLowerCase().includes('tháng'));
            return {
              id: `tkt-${orderId}-${idx}`,
              order_id: orderId,
              qr_code_string: qrStr,
              ticket_template_name: lineItems[0]?.name || 'Vé Vui Chơi Trải Nghiệm',
              allowed_passes: isFamily ? 999999 : (lineItems[0]?.allowed_passes_per_unit || 1),
              ticket_type: isFamily ? 'UNLIMITED' : 'SINGLE',
              status: 'UNUSED',
            } as IssuedTicket;
          });
        }

        setGeneratedTickets(ticketsForOrder);
        setCompletedOrder(normalizedOrder);
      }
    } catch (e: any) {
      console.error('Order creation failed:', e);
      showToast('error', 'Lỗi thanh toán', e.message || 'Thanh toán thất bại! Vui lòng kiểm tra lại thông tin vé hoặc số lượng.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    searchBookingCode, setSearchBookingCode,
    invoiceCode, setInvoiceCode,
    bookingCode, setBookingCode,
    customerMode, setCustomerMode,
    customerName, setCustomerName,
    phoneNumber, setPhoneNumber,
    email, setEmail,
    selectedGroupCode, setSelectedGroupCode,
    selectedSourceId, setSelectedSourceId,
    usageDate, setUsageDate,
    invoiceStatus, setInvoiceStatus,
    companyName, setCompanyName,
    companyTaxCode, setCompanyTaxCode,
    companyEmail, setCompanyEmail,
    companyAddress, setCompanyAddress,
    lineItems, setLineItems,
    depositAmount, setDepositAmount,
    extraDiscount, setExtraDiscount,
    paymentMethod, setPaymentMethod,
    selectedCounterId, setSelectedCounterId,
    isProcessing, setIsProcessing,
    completedOrder, setCompletedOrder,
    generatedTickets, setGeneratedTickets,
    editingIndex, setEditingIndex,
    activeListTab, setActiveListTab,
    ticketTemplates, ticketZones, products, customerGroups, customerSources, promotions, selectedPromotionId, setSelectedPromotionId, counters,
    toastMessage, showToast,
    handleToggleItem, updateLineItem, handleCheckBookingCode, handleResetForm, handleCheckout
  };
};
