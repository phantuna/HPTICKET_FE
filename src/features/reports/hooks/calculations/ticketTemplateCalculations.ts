export interface TicketTemplateCalcParams {
  ticketRevenueStats: any[];
  ticketTemplates: any[];
  ticketTypeFilter: string;
}

export const calculateTicketTemplateStats = (orders: any[], params: TicketTemplateCalcParams): any[] => {
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
};
