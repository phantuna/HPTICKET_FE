import { SummaryCardItem } from '../../utils/excelExporter';

export interface ExportParams {
  tab: string;
  ticketStatsArray?: any[];
  totalRevenue?: number;
  issuedTickets?: any[];
  rawOrders?: any[];
  ticketTemplateStats?: any[];
  productStats?: any[];
  users?: any[];
  sellerRevenueStats?: any[];
  fromDate?: string;
  toDate?: string;
  selectedMonth?: string;
  comparisonData?: any[];
}

export interface FormattedReportResult {
  headers: string[];
  rows: any[];
  filename: string;
  reportTitle: string;
  fromDate?: string;
  toDate?: string;
  summaryCards?: SummaryCardItem[];
}

export const getDateTag = (params?: Omit<ExportParams, 'tab'>): string => {
  return params?.fromDate
    ? (params.fromDate === params?.toDate ? params.fromDate : `${params.fromDate}_${params.toDate}`)
    : new Date().toISOString().slice(0, 10);
};

export const formatRevenueReportExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const stats = params?.ticketStatsArray ?? [];
  const headers = ['Loại Vé / Sản Phẩm', 'Số Lượng', 'Trước Giảm Giá (đ)', 'Giảm Giá (đ)', 'Doanh Thu (đ)'];
  const rows: any[] = stats.map((s: any) => [
    s.label,
    s.qty,
    s.amountBeforeVatAndDiscount,
    s.discount,
    s.revenue,
  ]);

  const totalQty = stats.reduce((sum: number, s: any) => sum + s.qty, 0);
  const totalBeforeDiscount = stats.reduce((sum: number, s: any) => sum + s.amountBeforeVatAndDiscount, 0);
  const totalDiscount = stats.reduce((sum: number, s: any) => sum + s.discount, 0);
  const totalRevenue = params?.totalRevenue ?? stats.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0);

  rows.push([
    'TỔNG CỘNG',
    totalQty,
    totalBeforeDiscount,
    totalDiscount,
    totalRevenue,
  ]);

  const summaryCards: SummaryCardItem[] = [
    { title: 'TỔNG SỐ LƯỢNG MỤC', value: `${totalQty.toLocaleString('vi-VN')} lượt` },
    { title: 'TỔNG TIỀN NIÊM YẾT', value: `${totalBeforeDiscount.toLocaleString('vi-VN')} đ` },
    { title: 'TỔNG GIẢM GIÁ', value: `${totalDiscount.toLocaleString('vi-VN')} đ` },
    { title: 'TỔNG DOANH THU THỰC THU', value: `${totalRevenue.toLocaleString('vi-VN')} đ`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoDoanhThu_TongHop_${dateTag}`,
    reportTitle: 'BÁO CÁO DOANH THU TỔNG QUAN',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};

export const formatTicketDetailExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const tickets = params?.issuedTickets ?? [];
  const ordersMap = new Map((params?.rawOrders ?? []).map((o: any) => [o.id || o.order_id, o]));
  const headers = ['STT', 'Mã Vé (QR)', 'Loại Vé', 'Thanh Toán', 'Thành Tiền (đ)', 'Giảm Giá (đ)', 'Doanh Thu (đ)', 'Trạng Thái', 'Ngày Tạo'];
  
  let grandTotalDiscount = 0;
  let grandTotalRevenue = 0;

  const rows = tickets.map((t: any, idx: number) => {
    const order = ordersMap.get(t.order_id);
    const details = order?.details || order?.items || [];
    const det = details.find((d: any) => d.item_id === t.ticket_template_id || d.item_name === t.ticket_template_name);
    const fallbackPrice = det?.unit_price || det?.price || det?.pre_tax_price || 0;
    const orderTotal = order?.total_amount > 0 ? order.total_amount : 1;
    const orderDiscount = order?.applied_discount_amount || order?.discount_amount || 0;
    const fallbackDiscount = Math.round((fallbackPrice / orderTotal) * orderDiscount);
    const unitPrice = t.unit_price ?? fallbackPrice;
    const discount = t.discount_amount ?? fallbackDiscount;
    const revenue = t.revenue ?? (unitPrice - discount);
    
    grandTotalDiscount += Number(discount || 0);
    grandTotalRevenue += Number(revenue || 0);

    const isCash = order?.payment_method === 'TIEN_MAT' || order?.payment_method === 'CASH';
    const statusMap: Record<string, string> = { UNUSED: 'Chưa dùng', USED: 'Đã dùng', PARTIAL_USED: 'Đã dùng', EXPIRED: 'Hết hạn' };
    const d = new Date(t.created_at || '');
    const dateStr = isNaN(d.getTime()) ? '' : `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
    return [idx + 1, t.qr_code_string, t.ticket_template_name, order ? (isCash ? 'Tiền mặt' : 'Chuyển khoản') : '---', unitPrice, discount, revenue, statusMap[t.status] ?? t.status, dateStr];
  });

  const summaryCards: SummaryCardItem[] = [
    { title: 'TỔNG SỐ LƯỢT VÉ', value: `${tickets.length.toLocaleString('vi-VN')} vé` },
    { title: 'TỔNG TIỀN GIẢM GIÁ', value: `${grandTotalDiscount.toLocaleString('vi-VN')} đ` },
    { title: 'THỰC THU TIỀN VÉ', value: `${grandTotalRevenue.toLocaleString('vi-VN')} đ`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoVeChiTiet_${dateTag}`,
    reportTitle: 'BÁO CÁO DOANH THU CHI TIẾT VÉ',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};

export const formatTicketTypeExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const stats = params?.ticketTemplateStats ?? [];
  const total = stats.reduce((sum: number, t: any) => sum + t.revenue, 0);
  const totalQty = stats.reduce((s: number, t: any) => s + t.soldQty, 0);
  const headers = ['STT', 'Mã Loại Vé', 'Tên Loại Vé', 'Số Lượng', 'Doanh Thu (đ)', '% Tổng'];
  const rows: any[] = stats.map((t: any, idx: number) => [
    idx + 1, t.code, t.name, t.soldQty, t.revenue,
    total > 0 ? `${((t.revenue / total) * 100).toFixed(1)}%` : '0%',
  ]);
  rows.push(['', '', 'TỔNG CỘNG', totalQty, total, '100.0%']);

  const summaryCards: SummaryCardItem[] = [
    { title: 'TỔNG SỐ LOẠI VÉ', value: `${stats.length} loại vé` },
    { title: 'TỔNG VÉ BÁN RA', value: `${totalQty.toLocaleString('vi-VN')} vé` },
    { title: 'TỔNG DOANH THU VÉ', value: `${total.toLocaleString('vi-VN')} đ`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoDoanhThu_LoaiVe_${dateTag}`,
    reportTitle: 'BÁO CÁO DOANH THU THEO LOẠI VÉ',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};

export const formatProductExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const stats = params?.productStats ?? [];
  const total = stats.reduce((sum: number, p: any) => sum + p.revenue, 0);
  const totalQty = stats.reduce((s: number, p: any) => s + p.soldQty, 0);
  const headers = ['STT', 'Mã Hàng', 'Tên Hàng Hóa / Dịch Vụ', 'Số Lượng', 'Doanh Thu (đ)', '% Tổng'];
  const rows: any[] = stats.map((p: any, idx: number) => [
    idx + 1, p.sku || p.code, p.name, p.soldQty, p.revenue,
    total > 0 ? `${((p.revenue / total) * 100).toFixed(1)}%` : '0%',
  ]);
  rows.push(['', '', 'TỔNG CỘNG', totalQty, total, '100.0%']);

  const summaryCards: SummaryCardItem[] = [
    { title: 'TỔNG SỐ MẶT HÀNG', value: `${stats.length} sản phẩm` },
    { title: 'TỔNG SL BÁN RA', value: `${totalQty.toLocaleString('vi-VN')} món` },
    { title: 'TỔNG DOANH THU DỊCH VỤ', value: `${total.toLocaleString('vi-VN')} đ`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoDoanhThu_SanPham_${dateTag}`,
    reportTitle: 'BÁO CÁO DOANH THU THEO SẢN PHẨM & DỊCH VỤ',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};

export const formatUserRevenueExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const users = params?.users ?? [];
  const orders = params?.rawOrders ?? [];
  const sellerRevenueStats = params?.sellerRevenueStats ?? [];
  const headers = ['STT', 'Họ Tên', 'Username', 'Số Điện Thoại', 'Số Đơn Hàng', 'Tổng Doanh Thu (đ)'];

  let grandTotalRev = 0;
  let grandTotalOrders = 0;

  const rows = users.map((u: any, idx: number) => {
    let total = 0;
    let count = 0;
    if (sellerRevenueStats.length > 0) {
      const stat = sellerRevenueStats.find((s: any) => s.username === u.username);
      if (stat) {
        total = Number(stat.totalRevenue || 0);
        count = Number(stat.orderCount || 0);
      }
    } else {
      const userOrders = orders.filter((o: any) => o.created_by === u.username);
      total = userOrders.reduce((acc: number, o: any) => acc + (o.final_amount || 0), 0);
      count = userOrders.length;
    }
    grandTotalRev += total;
    grandTotalOrders += count;
    return [idx + 1, u.fullname, u.username, u.phone, count, total];
  });

  const monthStr = params?.selectedMonth ? `Thang${params.selectedMonth}` : dateTag;

  const summaryCards: SummaryCardItem[] = [
    { title: 'TỔNG NHÂN VIÊN', value: `${users.length} người` },
    { title: 'TỔNG ĐƠN HÀNG BÁN', value: `${grandTotalOrders.toLocaleString('vi-VN')} đơn` },
    { title: 'TỔNG DOANH THU NHÂN VIÊN', value: `${grandTotalRev.toLocaleString('vi-VN')} đ`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoDoanhThu_NhanVien_${monthStr}`,
    reportTitle: 'BÁO CÁO DOANH THU THEO NHÂN VIÊN',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};

export const formatComparisonExcel = (params?: Omit<ExportParams, 'tab'>): FormattedReportResult => {
  const dateTag = getDateTag(params);
  const stats = params?.comparisonData ?? [];
  const headers = [
    'STT', 
    'Tên hàng hóa dịch vụ', 
    'Kỳ Báo Cáo - Số lượng', 'Kỳ Báo Cáo - Doanh thu', 'Kỳ Báo Cáo - Thành tiền',
    'Kỳ So Sánh - Số lượng', 'Kỳ So Sánh - Doanh thu', 'Kỳ So Sánh - Thành tiền',
    'Tăng/Giảm SL (%)', 'Tăng/Giảm TT (%)'
  ];
  const rows: any[] = stats.map((item: any, idx: number) => [
    idx + 1,
    item.itemName,
    item.period1Qty,
    item.period1Revenue,
    item.period1Revenue,
    item.period2Qty,
    item.period2Revenue,
    item.period2Revenue,
    item.qtyDiffPercent != null ? `${item.qtyDiffPercent}%` : '0%',
    item.revenueDiffPercent != null ? `${item.revenueDiffPercent}%` : '0%'
  ]);
  
  const totalPeriod1Qty = stats.reduce((sum: number, i: any) => sum + (i.period1Qty || 0), 0);
  const totalPeriod1Rev = stats.reduce((sum: number, i: any) => sum + (i.period1Revenue || 0), 0);
  const totalPeriod2Qty = stats.reduce((sum: number, i: any) => sum + (i.period2Qty || 0), 0);
  const totalPeriod2Rev = stats.reduce((sum: number, i: any) => sum + (i.period2Revenue || 0), 0);
  let totalRevDiff = 0;
  if (totalPeriod2Rev > 0) {
    totalRevDiff = ((totalPeriod1Rev - totalPeriod2Rev) / totalPeriod2Rev) * 100;
  } else if (totalPeriod1Rev > 0) {
    totalRevDiff = 100;
  }

  rows.push([
    '',
    'TỔNG CỘNG',
    totalPeriod1Qty,
    '-',
    totalPeriod1Rev,
    totalPeriod2Qty,
    '-',
    totalPeriod2Rev,
    '-',
    totalRevDiff != null ? `${totalRevDiff > 0 ? '+' : ''}${totalRevDiff.toFixed(1)}%` : '0%'
  ]);

  const summaryCards: SummaryCardItem[] = [
    { title: 'KỲ BÁO CÁO - SL', value: `${totalPeriod1Qty.toLocaleString('vi-VN')}` },
    { title: 'KỲ BÁO CÁO - DOANH THU', value: `${totalPeriod1Rev.toLocaleString('vi-VN')} đ` },
    { title: 'KỲ SO SÁNH - DOANH THU', value: `${totalPeriod2Rev.toLocaleString('vi-VN')} đ` },
    { title: 'TĂNG / GIẢM DOANH THU', value: `${totalRevDiff > 0 ? '+' : ''}${totalRevDiff.toFixed(1)}%`, isHighlight: true },
  ];

  return {
    headers,
    rows,
    filename: `BaoCaoSoSanh_${dateTag}`,
    reportTitle: 'BÁO CÁO SO SÁNH DOANH THU',
    fromDate: params?.fromDate,
    toDate: params?.toDate,
    summaryCards,
  };
};
