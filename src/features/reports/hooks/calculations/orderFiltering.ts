export const getLocalDateStr = (isoString?: string): string => {
  if (!isoString) return new Date().toISOString().split('T')[0];
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return isoString.split('T')[0];
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export interface OrderFilterParams {
  activeSubTab: string;
  selectedMonth: string;
  fromDate: string;
  toDate: string;
  posFilter: string;
  sellerFilter: string;
  customerGroupFilter: string;
  customerSourceFilter: string;
  salesCounters: any[];
  customerGroups: any[];
  customerSources: any[];
}

export const filterOrders = (rawOrders: any[], params: OrderFilterParams): any[] => {
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
};

export const filterIssuedTickets = (rawIssuedTickets: any[], orders: any[], activeSubTab: string): any[] => {
  if (activeSubTab === 'BaoCaoVeChiTiet') {
    return rawIssuedTickets;
  }
  const validOrderIds = new Set(orders.map(o => o.id || (o as any).order_id));
  return rawIssuedTickets.filter(t => validOrderIds.has(t.order_id));
};
