import { PaymentMethod } from '../../../../shared/types/hpticket';
import { getLocalDateStr } from './orderFiltering';

export interface RevenueCalcParams {
  chartView: string;
  fromDate: string;
  toDate: string;
  summaryStats: any;
  ticketRevenueStats: any[];
  productRevenueStats: any[];
  sellerRevenueStats?: any[];
  activeSubTab: string;
}

export interface RevenueStatsResult {
  totalRevenue: number;
  totalTicketsSold: number;
  totalCash: number;
  totalBankTransfer: number;
  chartData: { name: string; fullLabel?: string; DoanhThu: number }[];
  ticketStatsArray: any[];
}

export const calculateRevenueStats = (orders: any[], params: RevenueCalcParams): RevenueStatsResult => {
  if (params.summaryStats) {
    const finalStatsArray = params.ticketRevenueStats.map((t: any) => {
      const gross = t.grossRevenue != null ? t.grossRevenue : t.revenue;
      return {
        label: t.itemName,
        itemType: 'TICKET',
        qty: t.quantity,
        unitPrice: t.unitPrice || 0,
        amountBeforeVatAndDiscount: gross,
        discount: gross - t.revenue,
        taxAmount: t.taxAmount || 0,
        revenue: t.revenue
      };
    });

    if (params.productRevenueStats.length > 0) {
      params.productRevenueStats.forEach((p: any) => {
        const gross = p.grossRevenue != null ? p.grossRevenue : p.revenue;
        const qty = p.quantity || 0;
        const unitPrice = p.unitPrice != null && Number(p.unitPrice) > 0
          ? Number(p.unitPrice)
          : (qty > 0 ? Math.round(gross / qty) : 0);

        finalStatsArray.push({
          label: p.itemName || 'Dịch vụ / Sản phẩm',
          itemType: 'PRODUCT',
          qty: qty,
          unitPrice: unitPrice,
          amountBeforeVatAndDiscount: gross,
          discount: gross - (p.revenue || 0),
          taxAmount: p.taxAmount || 0,
          revenue: p.revenue || 0
        });
      });
    }

    let aggregatedChartData: { name: string; DoanhThu: number; fullLabel?: string }[] = [];
    const rawDailyList = params.summaryStats.daily_revenue || [];

    if (params.chartView === 'week') {
      const refDate = new Date(params.fromDate || params.toDate || new Date());
      const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();
      const m = isNaN(refDate.getTime()) ? new Date().getMonth() : refDate.getMonth();
      const monthNum = m + 1;
      const monthStr = String(monthNum).padStart(2, '0');
      const lastDayOfMonth = new Date(y, m + 1, 0).getDate();

      const weeks: { name: string; fullLabel: string; DoanhThu: number }[] = [
        { name: 'Tuần 1', fullLabel: `Tuần 1 (01/${monthStr} - 07/${monthStr})`, DoanhThu: 0 },
        { name: 'Tuần 2', fullLabel: `Tuần 2 (08/${monthStr} - 14/${monthStr})`, DoanhThu: 0 },
        { name: 'Tuần 3', fullLabel: `Tuần 3 (15/${monthStr} - 21/${monthStr})`, DoanhThu: 0 },
        { name: 'Tuần 4', fullLabel: `Tuần 4 (22/${monthStr} - 28/${monthStr})`, DoanhThu: 0 },
      ];

      if (lastDayOfMonth > 28) {
        weeks.push({
          name: 'Tuần 5',
          fullLabel: `Tuần 5 (29/${monthStr} - ${String(lastDayOfMonth).padStart(2, '0')}/${monthStr})`,
          DoanhThu: 0
        });
      }

      rawDailyList.forEach((d: any) => {
        if (!d.date_str) return;
        const parts = d.date_str.split('-');
        if (parts.length !== 3) return;
        const dy = parseInt(parts[0], 10);
        const dm = parseInt(parts[1], 10);
        const dayNum = parseInt(parts[2], 10);

        if (dy === y && dm === monthNum) {
          const rev = Number(d.revenue || 0);
          if (dayNum >= 1 && dayNum <= 7) weeks[0].DoanhThu += rev;
          else if (dayNum >= 8 && dayNum <= 14) weeks[1].DoanhThu += rev;
          else if (dayNum >= 15 && dayNum <= 21) weeks[2].DoanhThu += rev;
          else if (dayNum >= 22 && dayNum <= 28) weeks[3].DoanhThu += rev;
          else if (weeks[4]) weeks[4].DoanhThu += rev;
        }
      });

      aggregatedChartData = weeks;

    } else if (params.chartView === 'quarter') {
      const refDate = new Date(params.fromDate || params.toDate || new Date());
      const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();

      const quarters = [
        { name: 'Quý 1', fullLabel: `Quý 1/${y} (Tháng 1 - Tháng 3)`, DoanhThu: 0 },
        { name: 'Quý 2', fullLabel: `Quý 2/${y} (Tháng 4 - Tháng 6)`, DoanhThu: 0 },
        { name: 'Quý 3', fullLabel: `Quý 3/${y} (Tháng 7 - Tháng 9)`, DoanhThu: 0 },
        { name: 'Quý 4', fullLabel: `Quý 4/${y} (Tháng 10 - Tháng 12)`, DoanhThu: 0 },
      ];

      rawDailyList.forEach((d: any) => {
        if (!d.date_str) return;
        const parts = d.date_str.split('-');
        if (parts.length !== 3) return;
        const dy = parseInt(parts[0], 10);
        const dm = parseInt(parts[1], 10);
        if (dy === y && dm >= 1 && dm <= 12) {
          const q = Math.ceil(dm / 3);
          if (q >= 1 && q <= 4) {
            quarters[q - 1].DoanhThu += Number(d.revenue || 0);
          }
        }
      });

      aggregatedChartData = quarters;

    } else if (params.chartView === 'month') {
      const refDate = new Date(params.fromDate || params.toDate || new Date());
      const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();

      const months = Array.from({ length: 12 }, (_, i) => ({
        name: `T${i + 1}`,
        fullLabel: `Tháng ${i + 1}/${y}`,
        DoanhThu: 0
      }));

      rawDailyList.forEach((d: any) => {
        if (!d.date_str) return;
        const parts = d.date_str.split('-');
        if (parts.length !== 3) return;
        const dy = parseInt(parts[0], 10);
        const dm = parseInt(parts[1], 10);
        if (dy === y && dm >= 1 && dm <= 12) {
          months[dm - 1].DoanhThu += Number(d.revenue || 0);
        }
      });

      aggregatedChartData = months;

    } else {
      // params.chartView === 'day'
      const dayMap: Record<string, { name: string; fullLabel: string; DoanhThu: number }> = {};

      if (params.fromDate && params.toDate) {
        const start = new Date(params.fromDate);
        const end = new Date(params.toDate);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && (end.getTime() - start.getTime()) <= 62 * 86400000) {
          const curr = new Date(start);
          while (curr <= end) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            dayMap[dateStr] = {
              name: `${d}/${m}`,
              fullLabel: `Ngày ${d}/${m}/${y}`,
              DoanhThu: 0
            };
            curr.setDate(curr.getDate() + 1);
          }
        }
      }

      rawDailyList.forEach((d: any) => {
        if (!d.date_str) return;
        const rev = Number(d.revenue || 0);
        if (dayMap[d.date_str]) {
          dayMap[d.date_str].DoanhThu += rev;
        } else {
          const parts = d.date_str.split('-');
          if (parts.length === 3) {
            dayMap[d.date_str] = {
              name: `${parts[2]}/${parts[1]}`,
              fullLabel: `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`,
              DoanhThu: rev
            };
          }
        }
      });

      aggregatedChartData = Object.keys(dayMap)
        .sort((a, b) => a.localeCompare(b))
        .map(k => dayMap[k]);
    }

    return {
      totalRevenue: params.summaryStats.total_revenue || 0,
      totalTicketsSold: params.summaryStats.total_tickets_sold || 0,
      totalCash: params.summaryStats.total_cash || 0,
      totalBankTransfer: params.summaryStats.total_bank || 0,
      chartData: aggregatedChartData,
      ticketStatsArray: finalStatsArray
    };
  }

  // Fallback: tính toán từ orders
  let totalRev = orders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
  if (params.activeSubTab === 'BaoCaoDoanhThu_User_Thang' && params.sellerRevenueStats && params.sellerRevenueStats.length > 0) {
    totalRev = params.sellerRevenueStats.reduce((acc: number, s: any) => acc + Number(s.totalRevenue || 0), 0);
  }
  const totalCashAmt = orders.filter((o) => o.payment_method === PaymentMethod.CASH || o.payment_method === 'TIEN_MAT').reduce((acc, o) => acc + (o.final_amount || 0), 0);
  const totalBankAmt = orders.filter((o) => o.payment_method !== PaymentMethod.CASH && o.payment_method !== 'TIEN_MAT').reduce((acc, o) => acc + (o.final_amount || 0), 0);

  let totalTix = 0;

  const ticketStats: Record<string, any> = {
    NL: { label: 'Vé Người Lớn', itemType: 'TICKET', qty: 0, unitPrice: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
    TE: { label: 'Vé Trẻ Em', itemType: 'TICKET', qty: 0, unitPrice: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
    DP: { label: 'Vé Địa Phương', itemType: 'TICKET', qty: 0, unitPrice: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 },
    OTHER: { label: 'Khác', itemType: 'TICKET', qty: 0, unitPrice: 0, amountBeforeVatAndDiscount: 0, discount: 0, revenue: 0 }
  };
  const productStatsMap: Record<string, any> = {};

  orders.forEach(o => {
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
      const qty = item.quantity || 1;
      const itemTotal = item.total_price != null ? item.total_price : ((item.price || item.pre_tax_price || item.unit_price || 0) * qty);

      let itemDiscount = 0;
      if (item.item_type === 'PRODUCT') {
        const prodName = item.item_name || item.item_id || 'Dịch vụ / Sản phẩm';
        if (!productStatsMap[prodName]) {
          productStatsMap[prodName] = {
            label: prodName,
            itemType: 'PRODUCT',
            qty: 0,
            unitPrice: item.price || item.unit_price || item.pre_tax_price || 0,
            amountBeforeVatAndDiscount: 0,
            discount: 0,
            taxAmount: item.tax_amount || 0,
            revenue: 0
          };
        }
        productStatsMap[prodName].qty += qty;
        productStatsMap[prodName].amountBeforeVatAndDiscount += itemTotal;
        productStatsMap[prodName].revenue += itemTotal;
        if ((!productStatsMap[prodName].unitPrice || productStatsMap[prodName].unitPrice === 0) && qty > 0) {
          productStatsMap[prodName].unitPrice = Math.round(itemTotal / qty);
        }
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

  let cData: { name: string; fullLabel?: string; DoanhThu: number }[] = [];
  if (params.chartView === 'week') {
    const refDate = new Date(params.fromDate || params.toDate || new Date());
    const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();
    const m = isNaN(refDate.getTime()) ? new Date().getMonth() : refDate.getMonth();
    const monthNum = m + 1;
    const monthStr = String(monthNum).padStart(2, '0');
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();

    const weeks = [
      { name: 'Tuần 1', fullLabel: `Tuần 1 (01/${monthStr} - 07/${monthStr})`, DoanhThu: 0 },
      { name: 'Tuần 2', fullLabel: `Tuần 2 (08/${monthStr} - 14/${monthStr})`, DoanhThu: 0 },
      { name: 'Tuần 3', fullLabel: `Tuần 3 (15/${monthStr} - 21/${monthStr})`, DoanhThu: 0 },
      { name: 'Tuần 4', fullLabel: `Tuần 4 (22/${monthStr} - 28/${monthStr})`, DoanhThu: 0 },
    ];
    if (lastDayOfMonth > 28) {
      weeks.push({
        name: 'Tuần 5',
        fullLabel: `Tuần 5 (29/${monthStr} - ${String(lastDayOfMonth).padStart(2, '0')}/${monthStr})`,
        DoanhThu: 0
      });
    }

    orders.forEach(o => {
      const dateStr = getLocalDateStr(o.created_at);
      const parts = dateStr.split('-');
      if (parts.length !== 3) return;
      const dy = parseInt(parts[0], 10);
      const dm = parseInt(parts[1], 10);
      const dayNum = parseInt(parts[2], 10);
      if (dy === y && dm === monthNum) {
        const rev = Number(o.final_amount || 0);
        if (dayNum >= 1 && dayNum <= 7) weeks[0].DoanhThu += rev;
        else if (dayNum >= 8 && dayNum <= 14) weeks[1].DoanhThu += rev;
        else if (dayNum >= 15 && dayNum <= 21) weeks[2].DoanhThu += rev;
        else if (dayNum >= 22 && dayNum <= 28) weeks[3].DoanhThu += rev;
        else if (weeks[4]) weeks[4].DoanhThu += rev;
      }
    });
    cData = weeks;
  } else if (params.chartView === 'quarter') {
    const refDate = new Date(params.fromDate || params.toDate || new Date());
    const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();

    const quarters = [
      { name: 'Quý 1', fullLabel: `Quý 1/${y} (Tháng 1 - Tháng 3)`, DoanhThu: 0 },
      { name: 'Quý 2', fullLabel: `Quý 2/${y} (Tháng 4 - Tháng 6)`, DoanhThu: 0 },
      { name: 'Quý 3', fullLabel: `Quý 3/${y} (Tháng 7 - Tháng 9)`, DoanhThu: 0 },
      { name: 'Quý 4', fullLabel: `Quý 4/${y} (Tháng 10 - Tháng 12)`, DoanhThu: 0 },
    ];

    orders.forEach(o => {
      const dateStr = getLocalDateStr(o.created_at);
      const parts = dateStr.split('-');
      if (parts.length !== 3) return;
      const dy = parseInt(parts[0], 10);
      const dm = parseInt(parts[1], 10);
      if (dy === y && dm >= 1 && dm <= 12) {
        const q = Math.ceil(dm / 3);
        if (q >= 1 && q <= 4) {
          quarters[q - 1].DoanhThu += Number(o.final_amount || 0);
        }
      }
    });
    cData = quarters;
  } else if (params.chartView === 'month') {
    const refDate = new Date(params.fromDate || params.toDate || new Date());
    const y = isNaN(refDate.getTime()) ? new Date().getFullYear() : refDate.getFullYear();

    const months = Array.from({ length: 12 }, (_, i) => ({
      name: `T${i + 1}`,
      fullLabel: `Tháng ${i + 1}/${y}`,
      DoanhThu: 0
    }));

    orders.forEach(o => {
      const dateStr = getLocalDateStr(o.created_at);
      const parts = dateStr.split('-');
      if (parts.length !== 3) return;
      const dy = parseInt(parts[0], 10);
      const dm = parseInt(parts[1], 10);
      if (dy === y && dm >= 1 && dm <= 12) {
        months[dm - 1].DoanhThu += Number(o.final_amount || 0);
      }
    });
    cData = months;
  } else {
    // day
    const dayMap: Record<string, { name: string; fullLabel: string; DoanhThu: number }> = {};
    if (params.fromDate && params.toDate) {
      let start = new Date(params.fromDate);
      let end = new Date(params.toDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && (end.getTime() - start.getTime()) <= 62 * 86400000) {
        let curr = new Date(start);
        while (curr <= end) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          const dateStr = `${y}-${m}-${d}`;
          dayMap[dateStr] = {
            name: `${d}/${m}`,
            fullLabel: `Ngày ${d}/${m}/${y}`,
            DoanhThu: 0
          };
          curr.setDate(curr.getDate() + 1);
        }
      }
    }
    orders.forEach(o => {
      const dateStr = getLocalDateStr(o.created_at);
      const rev = Number(o.final_amount || 0);
      if (dayMap[dateStr]) {
        dayMap[dateStr].DoanhThu += rev;
      } else {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          dayMap[dateStr] = {
            name: `${parts[2]}/${parts[1]}`,
            fullLabel: `Ngày ${parts[2]}/${parts[1]}/${parts[0]}`,
            DoanhThu: rev
          };
        }
      }
    });
    cData = Object.keys(dayMap).sort((a, b) => a.localeCompare(b)).map(k => dayMap[k]);
  }

  Object.keys(ticketStats).forEach(k => {
    if (ticketStats[k].qty > 0) {
      ticketStats[k].unitPrice = Math.round(ticketStats[k].amountBeforeVatAndDiscount / ticketStats[k].qty);
    }
  });

  const tStatsArray = [
    ...Object.values(ticketStats).filter(t => t.qty > 0 || t.revenue > 0),
    ...Object.values(productStatsMap).filter(p => p.qty > 0 || p.revenue > 0)
  ].sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue: totalRev,
    totalTicketsSold: totalTix,
    chartData: cData,
    ticketStatsArray: tStatsArray,
    totalCash: totalCashAmt,
    totalBankTransfer: totalBankAmt
  };
};

export const calculateTicketTotals = (orders: any[]): { rev: number; cash: number; bank: number } => {
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
};
