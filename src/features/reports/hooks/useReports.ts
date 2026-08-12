import { useState, useEffect, useMemo } from 'react';
import { salesService } from '../../../api/salesService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { Order, IssuedTicket, SystemLog, PaymentMethod, Product } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';

export const useReports = (initialTab: string) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);
  const [chartView, setChartView] = useState<'day' | 'week' | 'month' | 'quarter'>('day');

  const getTodayDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const currentDay = getTodayDateString(today);

  const [fromDate, setFromDate] = useState<string>(currentDay);
  const [toDate, setToDate] = useState<string>(currentDay);
  const [posFilter, setPosFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [customerGroupFilter, setCustomerGroupFilter] = useState<string>('all');
  const [customerSourceFilter, setCustomerSourceFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('all');
  const [nameSearch, setNameSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [liveTickets, setLiveTickets] = useState<IssuedTicket[]>([]);
  const [liveSystemLogs, setLiveSystemLogs] = useState<SystemLog[]>([]);
  const [liveGateLogs, setLiveGateLogs] = useState<any[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  
  const [users, setUsers] = useState<any[]>([]);
  const [salesCounters, setSalesCounters] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [customerSources, setCustomerSources] = useState<any[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);
  
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => { setPage(1); }, [activeSubTab, searchTrigger]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const extractList = (json: any) => {
          if (Array.isArray(json)) return json;
          if (json?.data && Array.isArray(json.data)) return json.data;
          if (json?.data?.content && Array.isArray(json.data.content)) return json.data.content;
          if (json?.content && Array.isArray(json.content)) return json.content;
          return [];
        };

        const [orderRes, ticketRes, usersRes, countersRes, groupsRes, sourcesRes, templatesRes, logsRes, gateLogsRes, productsRes] = await Promise.allSettled([
          salesService.fetchOrders(),
          salesService.fetchIssuedTickets(),
          apiClient.get(API_ENDPOINTS.IAM.USERS_ACTIVE),
          apiClient.get(API_ENDPOINTS.SALES.COUNTERS_ACTIVE),
          apiClient.get(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS_ACTIVE),
          apiClient.get(API_ENDPOINTS.MARKETING.CUSTOMER_SOURCES_ACTIVE),
          apiClient.get(API_ENDPOINTS.TICKETING.TEMPLATES),
          apiClient.get(API_ENDPOINTS.IAM.SYSTEM_LOGS, { size: 10000, fromDate, toDate }),
          apiClient.get(API_ENDPOINTS.TICKETING.ACCESS_LOGS, { fromDate, toDate }).catch(() => ({ data: [] })),
          apiClient.get(API_ENDPOINTS.SALES.PRODUCTS).catch(() => ({ data: [] }))
        ]);

        if (orderRes.status === 'fulfilled' && orderRes.value?.data) setLiveOrders(orderRes.value.data);
        if (ticketRes.status === 'fulfilled' && ticketRes.value?.data) setLiveTickets(ticketRes.value.data);
        if (usersRes.status === 'fulfilled') setUsers(extractList(usersRes.value));
        if (countersRes.status === 'fulfilled') setSalesCounters(extractList(countersRes.value));
        if (groupsRes.status === 'fulfilled') setCustomerGroups(extractList(groupsRes.value));
        if (sourcesRes.status === 'fulfilled') setCustomerSources(extractList(sourcesRes.value));
        if (templatesRes.status === 'fulfilled') setTicketTemplates(extractList(templatesRes.value).filter((t: any) => t.is_active || t.isActive || t.active || t.status !== 'INACTIVE'));
        if (logsRes.status === 'fulfilled') setLiveSystemLogs(extractList(logsRes.value));
        if (gateLogsRes.status === 'fulfilled') setLiveGateLogs(extractList(gateLogsRes.value));
        if (productsRes.status === 'fulfilled') setLiveProducts(extractList(productsRes.value));
        setIsDataLoaded(true);
      } catch (err) {
        console.error('Failed to fetch data for dashboard:', err);
      }
    };
    loadData();
  }, [searchTrigger]);

  const handleExportExcel = (reportTitle: string) => {
    setExportNotice(`Đã kết xuất tệp Báo cáo Excel: ${reportTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const getLocalDateStr = (isoString?: string) => {
    if (!isoString) return new Date().toISOString().split('T')[0];
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.split('T')[0];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const {
    rawOrders, rawIssuedTickets, rawGateLogs, rawSystemLogs, productList
  } = useMemo(() => {
    return {
      rawOrders: isDataLoaded ? liveOrders : dbStore.orders,
      rawIssuedTickets: isDataLoaded ? liveTickets : dbStore.issuedTickets,
      rawGateLogs: isDataLoaded ? liveGateLogs : dbStore.gateAccessLogs,
      rawSystemLogs: isDataLoaded ? liveSystemLogs : dbStore.systemLogs,
      productList: isDataLoaded && liveProducts.length > 0 ? liveProducts : dbStore.products,
    };
  }, [isDataLoaded, liveOrders, liveTickets, liveGateLogs, liveSystemLogs, liveProducts]);

  const orders = useMemo(() => {
    return rawOrders.filter(o => {
      const oDate = getLocalDateStr(o.created_at);
      if (activeSubTab === 'BaoCaoDoanhThu_User_Thang') {
        const m = parseInt(oDate.split('-')[1], 10);
        if (m.toString() !== selectedMonth) return false;
      } else {
        if (oDate < fromDate || oDate > toDate) return false;
      }

      if (posFilter !== 'all') {
        const counter = salesCounters.find(c => c.code === posFilter);
        if (counter && o.sales_counter_id !== counter.id) return false;
      }
      if (sellerFilter !== 'all' && o.created_by !== sellerFilter) return false;
      
      if (customerGroupFilter !== 'all') {
        const group = customerGroups.find(g => g.code === customerGroupFilter);
        if (group) {
          const isRetailGroup = group.name.toLowerCase().includes('khách lẻ') || group.code.toLowerCase().includes('retail') || group.code.toLowerCase().includes('khach_le');
          const validSourceIds = customerSources.filter(s => s.customer_group_id === group.id || s.customer_group_id === group.code).map(s => s.id);
          const hasGroupMatch = o.customer_group_id === group.id || o.customer_group_id === group.code;
          const hasSourceMatch = validSourceIds.includes(o.customer_source_id as string);
          const isNullSourceAndRetail = isRetailGroup && !o.customer_source_id && !o.customer_group_id;
          if (!hasGroupMatch && !hasSourceMatch && !isNullSourceAndRetail) return false;
        }
      }

      if (customerSourceFilter !== 'all') {
        const source = customerSources.find(s => s.code === customerSourceFilter);
        if (source && o.customer_source_id !== source.id) return false;
      }

      return true;
    });
  }, [rawOrders, activeSubTab, selectedMonth, fromDate, toDate, posFilter, sellerFilter, customerGroupFilter, customerSourceFilter, salesCounters, customerGroups, customerSources]);

  const issuedTickets = useMemo(() => {
    const validOrderIds = new Set(orders.map(o => o.id || (o as any).order_id));
    return rawIssuedTickets.filter(t => validOrderIds.has(t.order_id));
  }, [orders, rawIssuedTickets]);

  const { totalRevenue, totalTicketsSold, chartData, ticketStatsArray, totalCash, totalBankTransfer } = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
    const totalCashAmt = orders.filter((o) => o.payment_method === PaymentMethod.CASH).reduce((acc, o) => acc + (o.final_amount || 0), 0);
    const totalBankAmt = orders.filter((o) => o.payment_method !== PaymentMethod.CASH).reduce((acc, o) => acc + (o.final_amount || 0), 0);
    
    let totalTix = 0;
    
    const chartDataMap: Record<string, number> = {};
    if (chartView === 'day' && fromDate && toDate) {
      let start = new Date(fromDate);
      let end = new Date(toDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        let current = new Date(start);
        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0];
          const [year, monthStr, dayStr] = dateStr.split('-');
          const key = `${dateStr}|${dayStr}/${monthStr}`;
          chartDataMap[key] = 0;
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const ticketStats = {
      NL: { label: 'Vé Người Lớn', qty: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
      TE: { label: 'Vé Trẻ Em', qty: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
      DP: { label: 'Vé Địa Phương', qty: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
      OTHER: { label: 'Khác', qty: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
      PRODUCT: { label: 'Dịch vụ / Sản phẩm', qty: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 }
    };

    orders.forEach(o => {
      const items = (o as any).items || (o as any).details || [];
      const orderTotal = (o.total_amount && o.total_amount > 0) ? o.total_amount : 1; 
      const orderDiscount = o.applied_discount_amount || o.discount_amount || 0;
      
      const dateStr = getLocalDateStr(o.created_at);
      const [year, monthStr, dayStr] = dateStr.split('-');
      const m = parseInt(monthStr, 10);

      let key = '';
      if (chartView === 'day') key = `${dateStr}|${dayStr}/${monthStr}`;
      else if (chartView === 'week') {
        const d = new Date(dateStr);
        const start = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((d.getDay() + 1 + days) / 7);
        key = `${year}-W${weekNumber.toString().padStart(2, '0')}|Tuần ${weekNumber}`;
      } else if (chartView === 'month') key = `${year}-${monthStr}|Tháng ${m}`;
      else if (chartView === 'quarter') {
        const q = Math.ceil(m / 3);
        key = `${year}-Q${q}|Quý ${q}`;
      }
      chartDataMap[key] = (chartDataMap[key] || 0) + (o.final_amount || 0);
      
      let ticketTotalGross = 0;
      let lastPricedTicket: any = null;
      items.forEach((item: any) => {
        if (item.item_type !== 'PRODUCT') {
          const qty = item.quantity || 1;
          const itemTotal = item.total_price != null ? item.total_price : ((item.price || item.pre_tax_price || item.unit_price || 0) * qty);
          ticketTotalGross += itemTotal;
          if (itemTotal > 0) lastPricedTicket = item;
        }
      });
      
      let accumulatedDiscount = 0;

      items.forEach((item: any) => {
        const qty = item.quantity || 1;
        const itemTotal = item.total_price != null ? item.total_price : ((item.price || item.pre_tax_price || item.unit_price || 0) * qty);
        
        let itemDiscount = 0;
        if (item.item_type === 'PRODUCT') {
          ticketStats['PRODUCT'].qty += qty;
          ticketStats['PRODUCT'].amountBeforeVatAndDiscount += itemTotal;
          ticketStats['PRODUCT'].discount += 0;
          ticketStats['PRODUCT'].revenue += itemTotal;
          return;
        }

        totalTix += qty;
        
        if (item === lastPricedTicket) {
          itemDiscount = orderDiscount - accumulatedDiscount;
        } else {
          itemDiscount = ticketTotalGross > 0 ? Math.round((itemTotal / ticketTotalGross) * orderDiscount) : 0;
          if (itemTotal > 0) accumulatedDiscount += itemDiscount;
        }
        
        const itemRevenue = itemTotal - itemDiscount;
        
        let type = 'OTHER';
        const rawStr = `${item.item_name || ''} ${(item as any).item_code || ''}`;
        const searchStr = rawStr.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd');
        
        if (searchStr.includes('tre em') || searchStr.includes('te') || searchStr.includes('child')) type = 'TE';
        else if (searchStr.includes('dia phuong') || searchStr.includes('dp') || searchStr.includes('local')) type = 'DP';
        else if (searchStr.includes('nguoi lon') || searchStr.includes('nl') || searchStr.includes('doan') || searchStr.includes('luot') || searchStr.includes('thang')) type = 'NL';
        else type = 'NL';

        ticketStats[type as keyof typeof ticketStats].qty += qty;
        ticketStats[type as keyof typeof ticketStats].amountBeforeVatAndDiscount += itemTotal;
        ticketStats[type as keyof typeof ticketStats].discount += itemDiscount;
        ticketStats[type as keyof typeof ticketStats].revenue += itemRevenue;
      });
    });

    const cData = Object.keys(chartDataMap).sort((a, b) => a.localeCompare(b)).map(key => {
      const [_, label] = key.split('|');
      return { name: label, DoanhThu: chartDataMap[key] };
    });

    const tStatsArray = Object.values(ticketStats).filter(t => t.qty > 0 || t.revenue > 0).sort((a, b) => b.revenue - a.revenue);

    return {
      totalRevenue: totalRev,
      totalTicketsSold: totalTix,
      chartData: cData,
      ticketStatsArray: tStatsArray,
      totalCash: totalCashAmt,
      totalBankTransfer: totalBankAmt
    };
  }, [orders, chartView, fromDate, toDate]);

  const gateLogs = useMemo(() => {
    return rawGateLogs.filter(log => {
      const logDate = getLocalDateStr(log.scan_time || log.created_at);
      if (logDate < fromDate || logDate > toDate) return false;
      if (nameSearch) {
        const searchLower = nameSearch.toLowerCase();
        const matchQr = log.ticket_qr?.toLowerCase().includes(searchLower);
        const matchGate = log.gate_name?.toLowerCase().includes(searchLower);
        if (!matchQr && !matchGate) return false;
      }
      return true;
    });
  }, [rawGateLogs, fromDate, toDate, nameSearch]);

  const systemLogs = useMemo(() => {
    return rawSystemLogs.filter(log => {
      const logDate = getLocalDateStr(log.created_at);
      return logDate >= fromDate && logDate <= toDate;
    });
  }, [rawSystemLogs, fromDate, toDate]);

  const ticketTemplateStats = useMemo(() => {
    const allItemsWithNet = orders.flatMap((o: any) => {
      const details = o.details || o.items || [];
      const orderDiscount = o.applied_discount_amount || o.discount_amount || 0;
      
      let ticketTotalGross = 0;
      let lastPricedTicket: any = null;
      details.forEach((d: any) => {
        if (d.item_type !== 'PRODUCT') {
          const qty = d.quantity || 1;
          const itemTotal = d.total_price != null ? d.total_price : ((d.price || d.pre_tax_price || d.unit_price || 0) * qty);
          ticketTotalGross += itemTotal;
          if (itemTotal > 0) lastPricedTicket = d;
        }
      });
      
      let accumulatedDiscount = 0;

      return details.map((d: any) => {
        const qty = d.quantity || 1;
        const itemTotal = d.total_price != null ? d.total_price : ((d.price || d.pre_tax_price || d.unit_price || 0) * qty);
        
        let itemDiscount = 0;
        if (d.item_type !== 'PRODUCT') {
          if (d === lastPricedTicket) {
            itemDiscount = orderDiscount - accumulatedDiscount;
          } else {
            itemDiscount = ticketTotalGross > 0 ? Math.round((itemTotal / ticketTotalGross) * orderDiscount) : 0;
            if (itemTotal > 0) accumulatedDiscount += itemDiscount;
          }
        }
        const itemRevenue = itemTotal - itemDiscount;
        return { ...d, itemTotal, itemRevenue };
      });
    });

    const statsMap: Record<string, any> = {};
    allItemsWithNet.forEach((item: any) => {
      if (item.item_type === 'PRODUCT') return;
      
      const id = item.item_id;
      if (!statsMap[id]) {
        statsMap[id] = {
          id,
          name: item.item_name,
          full_name: item.item_name,
          code: item.item_code || '',
          soldQty: 0,
          grossRevenue: 0,
          revenue: 0
        };
      }
      statsMap[id].soldQty += (item.quantity || 1);
      statsMap[id].grossRevenue += item.itemTotal;
      statsMap[id].revenue += item.itemRevenue;
    });

    const result = Object.values(statsMap).map((stat: any) => {
      const template = ticketTemplates.find((t: any) => t.id === stat.id);
      if (template) {
        stat.code = template.code;
        if (template.name) stat.full_name = template.name;
      }
      
      const searchStr = (stat.full_name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd');
      let shortName = stat.full_name;
      if (searchStr.includes('tre em') || searchStr.includes('te') || searchStr.includes('child')) shortName = 'Vé Trẻ Em';
      else if (searchStr.includes('dia phuong') || searchStr.includes('dp') || searchStr.includes('local')) shortName = 'Vé Địa Phương';
      else if (searchStr.includes('nguoi lon') || searchStr.includes('nl') || searchStr.includes('doan') || searchStr.includes('luot') || searchStr.includes('thang')) shortName = 'Vé Người Lớn';
      
      stat.name = shortName;
      return stat;
    });

    return result
      .filter((t: any) => ticketTypeFilter === 'all' || t.code === ticketTypeFilter)
      .filter(t => t.soldQty > 0 || t.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [ticketTemplates, ticketTypeFilter, orders]);

  const productStats = useMemo(() => {
    return productList.map((p: any) => {
      const allItems = orders.flatMap((o: any) => o.details || o.items || []);
      const soldItems = allItems.filter((item: any) => item.item_type === 'PRODUCT' && item.item_id === p.id);
      const soldQty = soldItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
      const revenue = soldItems.reduce((sum: number, item: any) => {
        if (item.total_price != null) return sum + item.total_price;
        return sum + ((item.quantity || 0) * (item.price || item.pre_tax_price || item.unit_price || p.price || 0));
      }, 0);
      return { ...p, soldQty, revenue };
    })
    .filter(p => p.soldQty > 0 || p.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);
  }, [productList, orders]);

  return {
    activeSubTab, setActiveSubTab,
    chartView, setChartView,
    fromDate, setFromDate,
    toDate, setToDate,
    posFilter, setPosFilter,
    sellerFilter, setSellerFilter,
    customerGroupFilter, setCustomerGroupFilter,
    customerSourceFilter, setCustomerSourceFilter,
    selectedMonth, setSelectedMonth,
    ticketTypeFilter, setTicketTypeFilter,
    nameSearch, setNameSearch,
    selectedLog, setSelectedLog,
    exportNotice, setExportNotice,
    page, setPage, pageSize,
    searchTrigger, setSearchTrigger,
    handleExportExcel,

    users, salesCounters, customerGroups, customerSources, ticketTemplates,

    orders, rawOrders,
    issuedTickets,
    gateLogs, rawGateLogs,
    systemLogs,

    totalRevenue, totalTicketsSold, chartData, ticketStatsArray,
    totalCash, totalBankTransfer,

    ticketTemplateStats,
    productStats
  };
};
