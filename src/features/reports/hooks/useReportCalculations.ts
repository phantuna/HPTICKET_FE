import { useMemo } from 'react';
import { dbStore } from '../../../shared/data/mockDatabase';
import { PaymentMethod } from '../../../shared/types/hpticket';

interface CalcParams {
  isDataLoaded: boolean;
  activeSubTab: string;
  chartView: string;
  fromDate: string;
  toDate: string;
  posFilter: string;
  sellerFilter: string;
  customerGroupFilter: string;
  customerSourceFilter: string;
  selectedMonth: string;
  ticketTypeFilter: string;
  nameSearch: string;
  salesCounters: any[];
  customerGroups: any[];
  customerSources: any[];
  ticketTemplates: any[];
  liveOrders: any[];
  liveTickets: any[];
  liveGateLogs: any[];
  liveSystemLogs: any[];
  liveProducts: any[];
  summaryStats: any;
  ticketRevenueStats: any[];
  productRevenueStats: any[];
}

export const useReportCalculations = (params: CalcParams) => {
  const getLocalDateStr = (isoString?: string) => {
    if (!isoString) return new Date().toISOString().split('T')[0];
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString.split('T')[0];
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const { rawOrders, rawIssuedTickets, rawGateLogs, rawSystemLogs, productList } = useMemo(() => {
    return {
      rawOrders: params.isDataLoaded ? params.liveOrders : dbStore.orders,
      rawIssuedTickets: params.isDataLoaded ? params.liveTickets : dbStore.issuedTickets,
      rawGateLogs: params.isDataLoaded ? params.liveGateLogs : dbStore.gateAccessLogs,
      rawSystemLogs: params.isDataLoaded ? params.liveSystemLogs : dbStore.systemLogs,
      productList: params.isDataLoaded && params.liveProducts.length > 0 ? params.liveProducts : dbStore.products,
    };
  }, [params.isDataLoaded, params.liveOrders, params.liveTickets, params.liveGateLogs, params.liveSystemLogs, params.liveProducts]);

  const orders = useMemo(() => {
    return rawOrders.filter(o => {
      const oDate = getLocalDateStr(o.created_at);
      if (params.activeSubTab === 'BaoCaoDoanhThu_User_Thang') {
        const m = parseInt(oDate.split('-')[1], 10);
        if (m.toString() !== params.selectedMonth) return false;
      } else {
        if (oDate < params.fromDate || oDate > params.toDate) return false;
      }

      if (params.posFilter !== 'all') {
        const counter = params.salesCounters.find(c => c.code === params.posFilter);
        if (counter && o.sales_counter_id !== counter.id) return false;
      }
      if (params.sellerFilter !== 'all' && o.created_by !== params.sellerFilter) return false;

      if (params.customerGroupFilter !== 'all') {
        const group = params.customerGroups.find(g => g.code === params.customerGroupFilter);
        if (group) {
          const isRetailGroup = group.name.toLowerCase().includes('khách lẻ') || group.code.toLowerCase().includes('retail') || group.code.toLowerCase().includes('khach_le');
          const validSourceIds = params.customerSources.filter(s => s.customer_group_id === group.id || s.customer_group_id === group.code).map(s => s.id);
          const hasGroupMatch = o.customer_group_id === group.id || o.customer_group_id === group.code;
          const hasSourceMatch = validSourceIds.includes(o.customer_source_id as string);
          const isNullSourceAndRetail = isRetailGroup && !o.customer_source_id && !o.customer_group_id;
          if (!hasGroupMatch && !hasSourceMatch && !isNullSourceAndRetail) return false;
        }
      }

      if (params.customerSourceFilter !== 'all') {
        const source = params.customerSources.find(s => s.code === params.customerSourceFilter);
        if (source && o.customer_source_id !== source.id) return false;
      }

      if (o.status === 'CANCELLED' || o.is_deleted === true) return false;

      return true;
    });
  }, [rawOrders, params.activeSubTab, params.selectedMonth, params.fromDate, params.toDate, params.posFilter, params.sellerFilter, params.customerGroupFilter, params.customerSourceFilter, params.salesCounters, params.customerGroups, params.customerSources]);

  const issuedTickets = useMemo(() => {
    const validOrderIds = new Set(orders.map(o => o.id || (o as any).order_id));
    return rawIssuedTickets.filter(t => validOrderIds.has(t.order_id));
  }, [orders, rawIssuedTickets]);

  const { totalRevenue, totalTicketsSold, chartData, ticketStatsArray, totalCash, totalBankTransfer } = useMemo(() => {
    if (params.summaryStats) {
      const finalStatsArray = params.ticketRevenueStats.map((t: any) => {
        const gross = t.grossRevenue != null ? t.grossRevenue : t.revenue;
        return {
          label: t.itemName,
          qty: t.quantity,
          revenue: t.revenue,
          amountBeforeVatAndDiscount: gross,
          discount: gross - t.revenue
        };
      });

      if (params.productRevenueStats.length > 0) {
        const productTotalQty = params.productRevenueStats.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
        const productTotalGross = params.productRevenueStats.reduce((sum: number, p: any) => sum + (p.grossRevenue != null ? p.grossRevenue : p.revenue), 0);
        const productTotalNet = params.productRevenueStats.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);

        if (productTotalQty > 0 || productTotalNet > 0) {
          finalStatsArray.push({
            label: 'Dịch vụ / Sản phẩm',
            qty: productTotalQty,
            revenue: productTotalNet,
            amountBeforeVatAndDiscount: productTotalGross,
            discount: productTotalGross - productTotalNet
          });
        }
      }

      return {
        totalRevenue: params.summaryStats.total_revenue || 0,
        totalTicketsSold: params.summaryStats.total_tickets_sold || 0,
        totalCash: params.summaryStats.total_cash || 0,
        totalBankTransfer: params.summaryStats.total_bank || 0,
        chartData: (params.summaryStats.daily_revenue || []).map((d: any) => ({
          name: d.date_str.split('-')[2] + '/' + d.date_str.split('-')[1],
          DoanhThu: d.revenue
        })),
        ticketStatsArray: finalStatsArray
      };
    }

    const totalRev = orders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
    const totalCashAmt = orders.filter((o) => o.payment_method === PaymentMethod.CASH || o.payment_method === 'TIEN_MAT').reduce((acc, o) => acc + (o.final_amount || 0), 0);
    const totalBankAmt = orders.filter((o) => o.payment_method !== PaymentMethod.CASH && o.payment_method !== 'TIEN_MAT').reduce((acc, o) => acc + (o.final_amount || 0), 0);

    let totalTix = 0;

    const chartDataMap: Record<string, number> = {};
    if (params.chartView === 'day' && params.fromDate && params.toDate) {
      let start = new Date(params.fromDate);
      let end = new Date(params.toDate);
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
      if (params.chartView === 'day') key = `${dateStr}|${dayStr}/${monthStr}`;
      else if (params.chartView === 'week') {
        const d = new Date(dateStr);
        const start = new Date(d.getFullYear(), 0, 1);
        const days = Math.floor((d.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
        const weekNumber = Math.ceil((d.getDay() + 1 + days) / 7);
        key = `${year}-W${weekNumber.toString().padStart(2, '0')}|Tuần ${weekNumber}`;
      } else if (params.chartView === 'month') key = `${year}-${monthStr}|Tháng ${m}`;
      else if (params.chartView === 'quarter') {
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
  }, [orders, params.chartView, params.fromDate, params.toDate, params.summaryStats, params.ticketRevenueStats, params.productRevenueStats]);

  const ticketTotals = useMemo(() => {
    let rev = 0;
    let cash = 0;
    let bank = 0;
    orders.forEach(o => {
      const isCash = o.payment_method === 'TIEN_MAT' || o.payment_method === 'CASH' || o.payment_method === PaymentMethod.CASH;
      const items = (o as any).items || (o as any).details || [];
      const orderTotal = (o.total_amount && o.total_amount > 0) ? o.total_amount : 1;
      const orderDiscount = o.applied_discount_amount || o.discount_amount || 0;

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
        if (item.item_type !== 'PRODUCT') {
          const qty = item.quantity || 1;
          const itemTotal = item.total_price != null ? item.total_price : ((item.price || item.pre_tax_price || item.unit_price || 0) * qty);
          let itemDiscount = 0;
          if (item === lastPricedTicket) {
            itemDiscount = orderDiscount - accumulatedDiscount;
          } else {
            itemDiscount = ticketTotalGross > 0 ? Math.round((itemTotal / ticketTotalGross) * orderDiscount) : 0;
            if (itemTotal > 0) accumulatedDiscount += itemDiscount;
          }
          const itemRevenue = itemTotal - itemDiscount;
          rev += itemRevenue;
          if (isCash) cash += itemRevenue;
          else bank += itemRevenue;
        }
      });
    });
    return { rev, cash, bank };
  }, [orders]);

  const gateLogs = useMemo(() => {
    return rawGateLogs.filter(log => {
      const logDate = getLocalDateStr(log.scan_time || log.created_at);
      if (logDate < params.fromDate || logDate > params.toDate) return false;
      if (params.nameSearch) {
        const searchLower = params.nameSearch.toLowerCase();
        const matchQr = log.ticket_qr?.toLowerCase().includes(searchLower);
        const matchGate = log.gate_name?.toLowerCase().includes(searchLower);
        if (!matchQr && !matchGate) return false;
      }
      return true;
    });
  }, [rawGateLogs, params.fromDate, params.toDate, params.nameSearch]);

  const systemLogs = useMemo(() => {
    return rawSystemLogs.filter(log => {
      const logDate = getLocalDateStr(log.created_at);
      return logDate >= params.fromDate && logDate <= params.toDate;
    });
  }, [rawSystemLogs, params.fromDate, params.toDate]);

  const ticketTemplateStats = useMemo(() => {
    if (params.ticketRevenueStats.length > 0) {
      return params.ticketRevenueStats.map((t: any) => {
        const template = params.ticketTemplates.find((temp: any) => temp.id === t.itemCode);
        return {
          id: t.itemCode,
          name: t.itemName,
          full_name: t.itemName,
          code: template ? template.code : t.itemCode,
          soldQty: t.quantity,
          grossRevenue: t.grossRevenue != null ? t.grossRevenue : t.revenue,
          revenue: t.revenue
        };
      }).filter((t: any) => params.ticketTypeFilter === 'all' || t.code === params.ticketTypeFilter);
    }

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
      const template = params.ticketTemplates.find((t: any) => t.id === stat.id);
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
      .filter((t: any) => params.ticketTypeFilter === 'all' || t.code === params.ticketTypeFilter)
      .filter(t => t.soldQty > 0 || t.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [params.ticketTemplates, params.ticketTypeFilter, orders, params.ticketRevenueStats]);

  const productStats = useMemo(() => {
    if (params.productRevenueStats.length > 0) {
      return params.productRevenueStats.map((p: any) => ({
        id: p.itemCode,
        name: p.itemName,
        soldQty: p.quantity,
        revenue: p.revenue
      }));
    }

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
  }, [productList, orders, params.productRevenueStats]);

  return {
    rawOrders,
    orders,
    issuedTickets,
    gateLogs,
    rawGateLogs,
    systemLogs,
    totalRevenue,
    totalTicketsSold,
    chartData,
    ticketStatsArray,
    totalCash,
    totalBankTransfer,
    ticketTemplateStats,
    productStats,
    ticketTotalRevenue: ticketTotals.rev,
    ticketTotalCash: ticketTotals.cash,
    ticketTotalBankTransfer: ticketTotals.bank
  };
};
