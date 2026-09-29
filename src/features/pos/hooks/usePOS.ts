import { useState, useEffect, useMemo } from 'react';
import { salesService } from '../../../api/salesService';
import { iamService } from '../../../api/iamService';
import { marketingService } from '../../../api/marketingService';
import { apiClient, API_ENDPOINTS, API_BASE_URL } from '../../../api/apiConfig';
import { PaymentMethod, ItemType, Order, IssuedTicket, BusinessDayContext } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';
import { toast } from '../../../shared/utils/toast';
import QRCode from 'qrcode';

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
  const [usageDate, setUsageDate] = useState<string>(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', }).format(new Date()));
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
  const [holidays, setHolidays] = useState<any[]>([]);
  const [dayContext, setDayContext] = useState<BusinessDayContext | null>(null);
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
        // Tối ưu hóa: Gọi API tổng hợp master-data thay vì spam 8 requests riêng lẻ
        const [masterRes, userRes] = await Promise.all([
          apiClient.get<any>(API_ENDPOINTS.SYSTEM.MASTER_DATA).catch(() => null),
          iamService.getCurrentUser().catch(() => null)
        ]);

        const masterData = masterRes?.data;
        const user = userRes?.data;

        // Xử lý quầy (Counters) kết hợp thông tin User
        const applyCounters = (counterList: any[], currentUser: any) => {
          const list = extractList({ data: counterList });
          const activeList = list.filter(isItemActive);
          let allowedCounters = activeList;

          const isAdmin = currentUser?.role_id?.toLowerCase().includes('admin') || (currentUser as any)?.roles?.some((r: any) => r.code === 'ADMIN');
          if (!isAdmin) {
            if (currentUser?.assigned_counters && currentUser.assigned_counters.length > 0) {
              const assignedIds = currentUser.assigned_counters.map((c: any) => c.id);
              allowedCounters = activeList.filter((c: any) => assignedIds.includes(c.id));
            } else {
              allowedCounters = [];
            }
          }

          if (allowedCounters.length > 0) {
            setCounters(allowedCounters);
            setSelectedCounterId(prev => {
              if (prev && !allowedCounters.some((c: any) => c.id === prev)) {
                localStorage.removeItem('hpticket_pos_selected_counter');
                if (allowedCounters.length === 1) return allowedCounters[0].id;
                return '';
              }
              if (!prev && allowedCounters.length === 1) return allowedCounters[0].id;
              return prev;
            });
          } else {
            setCounters([]);
            setSelectedCounterId('');
            localStorage.removeItem('hpticket_pos_selected_counter');
          }
        };

        if (masterData && (masterData.templates || masterData.products)) {
          // Dùng dữ liệu từ master-data
          if (masterData.templates) {
            const list = extractList({ data: masterData.templates });
            if (list.length > 0) setTicketTemplates(list.filter(isItemActive));
          }
          if (masterData.products) {
            const list = extractList({ data: masterData.products });
            if (list.length > 0) setProducts(list.filter(isItemActive));
          }
          if (masterData.customerSources) {
            const list = extractList({ data: masterData.customerSources });
            if (list.length > 0) setCustomerSources(list);
          }
          if (masterData.customerGroups) {
            const list = extractList({ data: masterData.customerGroups });
            if (list.length > 0) {
              setCustomerGroups(list);
              if (!list.some((g: any) => g.code === selectedGroupCode)) {
                const retailGroup = list.find((g: any) => g.code === 'KHACH_LE' || g.code === 'RETAIL');
                setSelectedGroupCode(retailGroup ? retailGroup.code : list[0].code);
              }
            }
          }
          if (masterData.counters) {
            applyCounters(masterData.counters, user);
          }
          if (masterData.zones) {
            const list = extractList({ data: masterData.zones });
            if (list.length > 0) setTicketZones(list);
          }
          if (masterData.promotions) {
            const list = extractList({ data: masterData.promotions });
            const activePromos = list.filter(isItemActive);
            setPromotions(activePromos);
            setSelectedPromotionId(prev => activePromos.some(p => p.id === prev) ? prev : '');
          } else {
            // Nếu masterData chưa có promotions, lấy riêng
            apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS_ACTIVE).then(json => {
              const list = extractList(json);
              const activePromos = list.filter(isItemActive);
              setPromotions(activePromos);
              setSelectedPromotionId(prev => activePromos.some(p => p.id === prev) ? prev : '');
            }).catch(() => { });
          }
          if (!masterData.zones) {
            apiClient.get<any>(API_ENDPOINTS.TICKETING.ZONES).then(json => {
              const list = extractList(json);
              if (list.length > 0) setTicketZones(list);
            }).catch(() => { });
          }
          if (masterData.holidays) {
            const list = extractList({ data: masterData.holidays });
            if (list.length > 0) setHolidays(list);
          } else {
            marketingService.fetchHolidays().then(hRes => {
              const list = extractList(hRes);
              if (list.length > 0) setHolidays(list);
            }).catch(() => { });
          }
        } else {
          // Fallback gọi các API riêng lẻ nếu master-data chưa có
          const promises = [
            apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES).then(json => {
              const list = extractList(json);
              if (list.length > 0) setTicketTemplates(list.filter(isItemActive));
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.SALES.PRODUCTS).then(json => {
              const list = extractList(json);
              if (list.length > 0) setProducts(list.filter(isItemActive));
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES_ACTIVE).then(json => {
              const list = extractList(json);
              if (list.length > 0) setCustomerSources(list);
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS_ACTIVE).then(json => {
              const list = extractList(json);
              if (list.length > 0) {
                setCustomerGroups(list);
                if (!list.some((g: any) => g.code === selectedGroupCode)) {
                  const retailGroup = list.find((g: any) => g.code === 'KHACH_LE' || g.code === 'RETAIL');
                  setSelectedGroupCode(retailGroup ? retailGroup.code : list[0].code);
                }
              }
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.SALES.COUNTERS_ACTIVE).then(countersRes => {
              applyCounters(extractList(countersRes), user);
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.TICKETING.ZONES).then(json => {
              const list = extractList(json);
              if (list.length > 0) setTicketZones(list);
            }).catch(() => { }),

            apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS_ACTIVE).then(json => {
              const list = extractList(json);
              const activePromos = list.filter(isItemActive);
              setPromotions(activePromos);
              setSelectedPromotionId(prev => activePromos.some(p => p.id === prev) ? prev : '');
            }).catch(() => { }),

            marketingService.fetchHolidays().then(hRes => {
              const list = extractList(hRes);
              if (list.length > 0) setHolidays(list);
            }).catch(() => { })
          ];

          await Promise.all(promises);
        }
      } catch (err) { }
    };

    fetchAll();
  }, []);

  // 1. Phân giải trạng thái Ngày làm việc (Lễ hay ngày thường) dựa trên usageDate
  useEffect(() => {
    let isMounted = true;
    const uDate = String(usageDate || '').substring(0, 10);

    const checkLocalHolidays = () => {
      return (holidays || []).find(h => {
        const active = h.is_active ?? h.isActive ?? true;
        if (!active || h.deleted_at) return false;
        const s = String(h.start_date || h.startDate || '').substring(0, 10);
        const e = String(h.end_date || h.endDate || '').substring(0, 10);
        return uDate >= s && uDate <= e;
      });
    };

    marketingService.resolveBusinessDay(usageDate).then(res => {
      if (!isMounted) return;
      if (res?.data?.isHoliday) {
        setDayContext(res.data);
      } else {
        const match = checkLocalHolidays();
        if (match) {
          setDayContext({
            businessDate: usageDate,
            isHoliday: true,
            holidayId: match.id,
            holidayName: match.name,
            holidayCode: match.code,
          });
        } else if (res?.data) {
          setDayContext(res.data);
        }
      }
    }).catch(() => {
      if (!isMounted) return;
      const match = checkLocalHolidays();
      setDayContext({
        businessDate: usageDate,
        isHoliday: !!match,
        holidayId: match?.id,
        holidayName: match?.name,
        holidayCode: match?.code,
      });
    });
    return () => { isMounted = false; };
  }, [usageDate, holidays]);

  // 2. Lọc danh sách mẫu vé hiển thị tại POS:
  //    - Ngày lễ: CHỈ hiển thị các mẫu vé có is_holiday_applicable = true
  //    - Ngày thường: hiển thị các mẫu vé áp dụng cho thứ tương ứng trong tuần
  const visibleTicketTemplates = useMemo(() => {
    return ticketTemplates.filter(t => {
      if (dayContext?.isHoliday) {
        const isApplicable = t.is_holiday_applicable ?? t.isHolidayApplicable;
        return Boolean(isApplicable);
      }

      // Ngày thường: kiểm tra các thứ trong tuần
      const validDays = t.valid_days || t.validDays;
      if (!validDays || !validDays.trim() || validDays === '30' || t.ticket_type === 'UNLIMITED' || t.ticketType === 'UNLIMITED') {
        return true;
      }
      const d = new Date(usageDate);
      const day = d.getDay(); // 0: CN, 1: T2...
      const vnDay = day === 0 ? 8 : day + 1; // T2=2..CN=8
      const arr = validDays.split(',').map((s: string) => s.trim());
      return arr.includes(String(vnDay));
    });
  }, [ticketTemplates, dayContext, usageDate]);

  // 3. Lọc danh sách khuyến mãi hiển thị tại POS:
  //    - Loại bỏ các KM chưa đến ngày hoặc đã hết hạn so với Ngày sử dụng đã chọn
  //    - Ngày lễ: Ẩn NORMAL_ONLY, chỉ giữ ALL_DAYS hoặc HOLIDAY_ONLY đúng lễ
  //    - Ngày thường: Ẩn HOLIDAY_ONLY
  const visiblePromotions = useMemo(() => {
    const uDateStr = usageDate ? String(usageDate).substring(0, 10) : '';

    return promotions.filter(p => {
      // ── Kiểm tra thời hạn khuyến mãi ──────────────────────────────────
      const rawStart = p.start_date || p.startDate;
      const rawEnd   = p.end_date   || p.endDate;

      if (rawStart && uDateStr) {
        const sStr = typeof rawStart === 'string' ? rawStart.substring(0, 10) : new Date(rawStart).toLocaleDateString('en-CA');
        if (sStr && uDateStr < sStr) return false; // Ngày SD trước ngày bắt đầu KM
      }
      if (rawEnd && uDateStr) {
        const eStr = typeof rawEnd === 'string' ? rawEnd.substring(0, 10) : new Date(rawEnd).toLocaleDateString('en-CA');
        if (eStr && uDateStr > eStr) return false;   // Ngày SD sau ngày kết thúc KM
      }

      // ── Kiểm tra chính sách ngày lễ / ngày thường ─────────────────────
      const policy = p.holiday_policy || p.holidayPolicy || 'ALL_DAYS';
      if (dayContext?.isHoliday) {
        if (policy === 'NORMAL_ONLY') return false;
        if (policy === 'HOLIDAY_ONLY') {
          const holId = p.holiday_id || p.holidayId || p.holiday?.id;
          if (holId && dayContext.holidayId && holId !== dayContext.holidayId) {
            return false;
          }
        }
      } else {
        if (policy === 'HOLIDAY_ONLY') return false;
      }
      return true;
    });
  }, [promotions, dayContext, usageDate]);

  // 4. Tự động dọn dẹp các vé không hợp lệ khỏi giỏ hàng khi thu ngân đổi Ngày sử dụng sang ngày lễ
  useEffect(() => {
    if (dayContext?.isHoliday) {
      setLineItems(prev => {
        const invalidItems = prev.filter(item => {
          if (item.item_type !== ItemType.TICKET) return false;
          const tpl = ticketTemplates.find(t => t.id === item.item_id);
          const isApplicable = tpl?.is_holiday_applicable ?? tpl?.isHolidayApplicable;
          return tpl && !Boolean(isApplicable);
        });
        if (invalidItems.length > 0) {
          showToast('error', 'Cập nhật giỏ hàng',
            `Đã loại bỏ ${invalidItems.length} vé không áp dụng cho ngày lễ (${dayContext.holidayName || 'Ngày lễ'}).`);
          return prev.filter(item => !invalidItems.includes(item));
        }
        return prev;
      });
    }
  }, [dayContext, ticketTemplates]);

  // 5. Tự động hủy chọn khuyến mãi nếu không còn khả dụng cho ngày sử dụng đã chọn
  useEffect(() => {
    if (selectedPromotionId) {
      const stillValid = visiblePromotions.some(p => p.id === selectedPromotionId);
      if (!stillValid) {
        setSelectedPromotionId('');
        setExtraDiscount(0);
        showToast('error', 'Khuyến mãi không áp dụng',
          'Khuyến mãi đã chọn không áp dụng cho ngày sử dụng này.');
      }
    }
  }, [visiblePromotions, selectedPromotionId]);

  // LRU Cache cho processedEventIds để deduplication event
  const [processedEventIds] = useState<Set<string>>(new Set());

  // Kết nối WebSocket và Initial Sync Low Stock
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let pingInterval: ReturnType<typeof setInterval>;
    let reconnectAttempts = 0;

    const fetchLowStock = async () => {
      try {
        const res = await apiClient.get<any>(API_ENDPOINTS.SALES.PRODUCTS + '/low-stock');
        let list = [];
        if (Array.isArray(res)) list = res;
        else if (res?.data && Array.isArray(res.data)) list = res.data;
        else if (res?.content && Array.isArray(res.content)) list = res.content;

        if (list.length > 0) {
          // Bắn ra DOM CustomEvent hoặc dùng setToastMessage trực tiếp 
          // Do showToast gọi state nên dùng an toàn
          window.dispatchEvent(new CustomEvent('toast_notification', {
            detail: {
              title: 'Cảnh báo tồn kho',
              message: `Có ${list.length} sản phẩm sắp hết hàng. Vui lòng kiểm tra kho!`,
              type: 'error'
            }
          }));
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách low-stock:", err);
      }
    };

    const connectWebSocket = () => {
      // Lấy URL WebSocket động từ API_BASE_URL của Backend (thay vì Frontend tĩnh)
      let wsUrl = '';
      try {
        const apiUrl = new URL(API_BASE_URL, window.location.origin);
        const wsProtocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${apiUrl.host}/ws/pos`;
      } catch (e) {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${wsProtocol}//${window.location.host}/ws/pos`;
      }

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("POS WebSocket connected");
          reconnectAttempts = 0;

          // Resync initial state
          fetchLowStock();

          // Heartbeat Ping mỗi 10s
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 10000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PONG') return;

            if (data.eventType === 'LOW_STOCK') {
              if (data.eventId && processedEventIds.has(data.eventId)) {
                return; // Bỏ qua trùng lặp
              }
              if (data.eventId) {
                processedEventIds.add(data.eventId);
                if (processedEventIds.size > 100) {
                  const firstItem = processedEventIds.values().next().value;
                  if (firstItem) processedEventIds.delete(firstItem);
                }
              }

              window.dispatchEvent(new CustomEvent('toast_notification', {
                detail: {
                  title: 'Cảnh báo: Sản phẩm sắp hết hàng',
                  message: `${data.productName} vừa tụt xuống mức ${data.currentStock} (Ngưỡng cảnh báo: ${data.threshold}).`,
                  type: 'error'
                }
              }));
            }
          } catch (e) {
            console.error("Lỗi xử lý WS message:", e);
          }
        };

        ws.onclose = () => {
          clearInterval(pingInterval);
          // Chỉ retry 1 lần duy nhất sau 15s để không spam console nếu server chưa mở WSS
          if (reconnectAttempts < 1) {
            reconnectAttempts++;
            reconnectTimeout = setTimeout(connectWebSocket, 15000);
          }
        };

        ws.onerror = () => {
          // Im lặng bỏ qua lỗi nếu WebSocket server chưa cấu hình reverse proxy
        };
      } catch (err) {
        // Im lặng bỏ qua lỗi khởi tạo
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
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
    if (type === 'error') {
      toast.error(message, title);
    } else {
      toast.success(message, title);
    }
  };

  const closeToast = () => {};

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
      const effectiveCompanyName = companyName.trim() || (customerName !== 'Khách lẻ không lấy hóa đơn' ? customerName.trim() : '');
      if (!effectiveCompanyName) {
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
        allowed_passes_per_unit: item.allowed_passes_per_unit || 1,
        ticket_type: item.ticket_type,
        is_group_ticket: item.is_group_ticket,
      }));

      const grp = customerGroups.find((g) => g.code === selectedGroupCode);
      const groupDiscount = grp ? grp.discount_percent : 0;

      const effectiveBookerName = customerName && customerName !== 'Khách lẻ không lấy hóa đơn'
        ? customerName.trim()
        : 'Khách lẻ';

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
        booker_name: effectiveBookerName,
        customer_phone: phoneNumber.trim() || null,
        customer_email: email.trim() || null,
        booking_code: bookingCode.trim() || null,
        invoice_status: invoiceStatus,
        company_tax_code: invoiceStatus === 'IMMEDIATE' ? companyTaxCode.trim() : null,
        company_name: invoiceStatus === 'IMMEDIATE' ? (companyName.trim() || effectiveBookerName) : null,
        company_address: invoiceStatus === 'IMMEDIATE' ? companyAddress.trim() : null,
        company_email: invoiceStatus === 'IMMEDIATE' ? (companyEmail.trim() || null) : null,
        invoice_recipient_email: invoiceStatus === 'IMMEDIATE' ? (companyEmail.trim() || null) : null,
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

        const hasTickets = lineItems.some(item => item.item_type === ItemType.TICKET);
        if (hasTickets) {
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

        // KỊCH BẢN GỬI EMAIL THÔNG BÁO VÉ & HÓA ĐƠN ĐIỆN TỬ
        const targetEmail = (invoiceStatus === 'IMMEDIATE' && companyEmail?.trim())
          ? companyEmail.trim()
          : (email?.trim() || companyEmail?.trim() || '');

        if (targetEmail) {
          try {
            // 1. Sinh Base64 QR Code và thông tin chi tiết từng vé khớp với vé in
            const emailTickets = await Promise.all(ticketsForOrder.map(async (t, idx) => {
              let qrCodeBase64 = '';
              const shortTicketCode = t.qr_code_string || t.id;
              try {
                qrCodeBase64 = await QRCode.toDataURL(shortTicketCode, { margin: 2, color: { dark: '#000000', light: '#ffffff' } });
              } catch (qrErr) {
                console.error('Failed to generate QR for email', qrErr);
              }

              // Tính giá thực thanh toán sau chiết khấu/khuyến mãi (khớp 100% với vé in)
              const detailsList = normalizedOrder.details || (normalizedOrder as any).items || [];
              const orderDetail = detailsList.find((d: any) => d.item_id === t.ticket_template_id);
              const basePrice = orderDetail ? orderDetail.unit_price : (cartForService.find(c => c.name === t.ticket_template_name)?.unit_price || 0);
              const effectivePrice = orderDetail && orderDetail.total_price !== undefined
                ? Math.round(Number(orderDetail.total_price) / (orderDetail.quantity || 1))
                : basePrice;

              // Loại vé / Mã mẫu vé (Ví dụ: TICKET-ADULT)
              const ticketTypeDisplay = (t.ticket_template_code || 'TICKET-STANDARD').replace(/\s*\(.*?\)/g, '').trim();

              // Tên vé (Ví dụ: Vé Người Lớn)
              const ticketNameDisplay = (t.ticket_template_name || 'Vé vào cửa').replace(/\s*\(.*?\)/g, '').trim();

              // Số lượt quét
              const isUnlimited = t.allowed_passes === 999999 || t.allowed_passes === -1 ||
                (t as any).ticket_type === 'UNLIMITED' ||
                t.ticket_template_name?.toLowerCase().includes('tháng') ||
                t.ticket_template_name?.toLowerCase().includes('gia đình');
              const passesDisplay = isUnlimited ? 'VÔ HẠN' : `${t.allowed_passes || 1} lượt`;

              return {
                index: idx + 1,
                seatInfo: ticketTypeDisplay,
                ticketType: ticketTypeDisplay,
                ticketName: ticketNameDisplay,
                passes: passesDisplay,
                price: effectivePrice.toLocaleString('vi-VN'),
                ticketCode: shortTicketCode,
                qrCodeBase64
              };
            }));

            const cName = (invoiceStatus === 'IMMEDIATE' && companyName?.trim()) ? companyName.trim() : (customerName || 'Khách Hàng');
            const cPhone = phoneNumber || '';
            const eName = 'Tham quan Vui Chơi Trải Nghiệm';
            const loc = 'Khu du lịch sinh thái';

            // Định dạng thời gian mua vé thực tế (HH:mm:ss dd/MM/yyyy) và ngày sử dụng (dd/MM/yyyy)
            const now = new Date();
            const pad = (n: number) => String(n).padStart(2, '0');
            const buyTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
            
            let usageDateStr = usageDate;
            if (usageDate && usageDate.includes('-')) {
              const [uYear, uMonth, uDay] = usageDate.split('-');
              usageDateStr = `${uDay}/${uMonth}/${uYear}`;
            }
            const sTime = `${buyTimeStr} (Ngày sử dụng: ${usageDateStr})`;

            // Tiền thanh toán cuối cùng sau chiết khấu (khớp 100% với Hóa đơn và Vé in)
            const finalPayment =
              normalizedOrder.final_amount !== undefined &&
                normalizedOrder.final_amount !== null
                ? Number(normalizedOrder.final_amount)
                : (
                  Number(normalizedOrder.total_amount || 0) -
                  Number(
                    (normalizedOrder as any).applied_discount_amount ??
                    normalizedOrder.discount_amount ??
                    0
                  )
                );
            const total = Math.round(finalPayment).toLocaleString('vi-VN');

            // 2. Fetch Active Template from Mock DB
            let htmlTemplate = '';
            let subjectTemplate = invoiceStatus === 'IMMEDIATE'
              ? `[HPTicket] Hóa đơn điện tử & Vé điện tử - Đơn hàng ${normalizedOrder.order_code || orderId}`
              : 'Sự kiện: Tham quan Vui Chơi Trải Nghiệm';
            try {
              const tmplRes = await marketingService.fetchEmailTemplates();
              if (tmplRes && tmplRes.data && tmplRes.data.length > 0) {
                const activeTmpl = tmplRes.data.find((x: any) => x.is_active);
                if (activeTmpl) {
                  htmlTemplate = activeTmpl.body_html || '';
                  if (activeTmpl.subject) subjectTemplate = activeTmpl.subject;
                }
              }
            } catch (e) { console.error('Failed to fetch templates:', e); }

            // 3. Generate Ticket Details Table (STT | Loại vé | Tên vé | Số lượt | Giá vé | Mã QR)
            let ticketListHtml = '<table width="100%" border="1" cellpadding="8" style="border-collapse: collapse; text-align: center; border-color: #ddd;">';
            ticketListHtml += '<tr style="background:#f9f9f9;"><th>STT</th><th>Loại vé</th><th>Tên vé</th><th>Số lượt</th><th>Giá vé</th><th>Mã QR</th></tr>';
            emailTickets.forEach(t => {
              ticketListHtml += `<tr>`;
              ticketListHtml += `<td>${t.index}</td>`;
              ticketListHtml += `<td>${t.ticketType}</td>`;
              ticketListHtml += `<td style="font-weight: bold;">${t.ticketName}</td>`;
              ticketListHtml += `<td>${t.passes}</td>`;
              ticketListHtml += `<td>${t.price} đ</td>`;
              ticketListHtml += `<td>`;
              ticketListHtml += `<img src="${t.qrCodeBase64}" width="120" height="120" alt="QR Code" style="display:block;margin:0 auto;" />`;
              ticketListHtml += `</td>`;
              ticketListHtml += `</tr>`;
            });
            ticketListHtml += `<tr style="font-weight: bold;"><td colspan="4" style="text-align: right; padding-right: 15px;">Tổng tiền thanh toán</td><td colspan="2" style="text-align: left; padding-left: 15px; color: #059669; font-size: 15px;">${total} VND</td></tr></table>`;

            // Khối thông tin Hóa đơn điện tử Viettel S-Invoice (nếu có yêu cầu xuất HĐ công ty)
            let invoiceInfoHtml = '';
            const lookupCode = normalizedOrder.invoice_lookup_code || (res.data as any).invoice_lookup_code || (res.data as any).invoiceLookupCode;
            const invoiceNo = normalizedOrder.invoice_number || (res.data as any).invoice_number || (res.data as any).invoiceNumber;

            if (invoiceStatus === 'IMMEDIATE' || lookupCode || invoiceNo) {
              invoiceInfoHtml = `
                <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
                  <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px;">📄 THÔNG TIN HÓA ĐƠN ĐIỆN TỬ (VIETTEL S-INVOICE)</h3>
                  ${companyTaxCode ? `<p style="margin: 4px 0; font-size: 13px;"><b>Mã số thuế:</b> <span style="font-family: monospace; font-weight: bold; color: #1e293b;">${companyTaxCode}</span></p>` : ''}
                  ${companyName ? `<p style="margin: 4px 0; font-size: 13px;"><b>Đơn vị mua hàng:</b> <b style="color: #1e293b;">${companyName}</b></p>` : ''}
                  ${invoiceNo ? `<p style="margin: 4px 0; font-size: 13px;"><b>Số hóa đơn:</b> <span style="font-family: monospace; font-weight: bold; color: #15803d;">${invoiceNo}</span></p>` : ''}
                  ${lookupCode ? `<p style="margin: 6px 0; font-size: 13px;"><b>Mã tra cứu HĐĐT:</b> <span style="font-family: monospace; font-weight: bold; font-size: 15px; color: #047857; background: #dcfce7; padding: 2px 8px; border-radius: 4px; border: 1px dashed #059669;">${lookupCode}</span></p>` : ''}
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #475569;">
                    Tra cứu & tải hóa đơn gốc (PDF / XML) tại: 
                    <a href="https://sinvoice.viettel.vn/tracuuhoadon" target="_blank" style="color: #059669; font-weight: bold; text-decoration: underline;">Portal Tra cứu Hóa đơn Viettel S-Invoice</a>
                  </p>
                </div>
              `;
            }

            // Default fallback if no template is saved
            if (!htmlTemplate) {
              htmlTemplate = `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                  <h2>Kính gửi {customer_name},</h2>
                  <p>Cảm ơn quý khách đã mua vé tham gia sự kiện <b>{event_name}</b>.</p>
                  <p><b>Thời gian mua vé:</b> {buy_time}</p>
                  <p><b>Ngày sử dụng:</b> {usage_date}</p>
                  <p><b>Địa điểm:</b> {location}</p>
                  {invoice_info}
                  <h3>Thông tin vé:</h3>
                  {ticket_details}
                  <p style="margin-top: 20px;">Trân trọng,<br/>Đội ngũ HPTicket</p>
                </div>
               `;
            }

            // Replace template variables
            let bodyHtml = htmlTemplate
              .replace(/{customer_name}/g, cName)
              .replace(/{event_name}/g, eName)
              .replace(/{start_time}/g, sTime)
              .replace(/{buy_time}/g, buyTimeStr)
              .replace(/{usage_date}/g, usageDateStr)
              .replace(/{location}/g, loc)
              .replace(/{total_payment}/g, total)
              .replace(/{invoice_info}/g, invoiceInfoHtml)
              .replace(/{ticket_details}/g, ticketListHtml);

            if (invoiceInfoHtml && !bodyHtml.includes(invoiceInfoHtml)) {
              bodyHtml = invoiceInfoHtml + bodyHtml;
            }

            // 4. Tạo Data Payload để gửi lên Backend
            const emailPayload = {
              emailTo: targetEmail,
              subject: subjectTemplate,
              customerName: cName,
              customerPhone: cPhone,
              customerEmail: targetEmail,
              eventName: eName,
              startTime: sTime,
              location: loc,
              totalPayment: total,
              tickets: emailTickets,
              bodyHtml: bodyHtml
            };

            console.log('[Email Payload generated at Frontend]:', emailPayload);
            // 5. Gọi API Gửi Mail
            await marketingService.sendTicketEmail(emailPayload);
            showToast('success', 'Gửi Email & HĐĐT', `Đã xuất hóa đơn Viettel & gửi email thông báo tới ${targetEmail}`);
          } catch (emailErr) {
            console.error('Failed to send email:', emailErr);
            showToast('error', 'Lỗi Gửi Email', 'Không thể gửi email thông báo, vui lòng kiểm tra cấu hình SMTP.');
          }
        }

      }
    } catch (e: any) {
      console.error('Order creation failed:', e);

      // Auto-reload on 403 (Data-Level Security rejection)
      if (e.code === 403 || (e.message && e.message.toLowerCase().includes('quyền'))) {
        showToast('error', 'Đã thay đổi phân quyền', 'Quyền thao tác trên quầy này đã bị thu hồi hoặc thay đổi. Hệ thống sẽ tự động tải lại...');
        setTimeout(() => {
          window.location.reload();
        }, 2500);
        return;
      }

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
    ticketTemplates: visibleTicketTemplates,
    rawTicketTemplates: ticketTemplates,
    ticketZones,
    products,
    customerGroups,
    customerSources,
    promotions: visiblePromotions,
    rawPromotions: promotions,
    selectedPromotionId,
    setSelectedPromotionId,
    counters,
    holidays,
    dayContext,
    toastMessage, showToast, closeToast,
    handleToggleItem, updateLineItem, handleCheckBookingCode, handleResetForm, handleCheckout
  };
};
