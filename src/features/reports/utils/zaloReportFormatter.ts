export interface ZaloReportData {
  companyName: string;
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalTicketsSold: number;
  ticketStatsArray: any[];
  ticketTotalCash: number;
  ticketTotalBankTransfer: number;
  cumulativeRevenue: number;
}

export const generateZaloReport = (data: ZaloReportData): string => {
  const {
    companyName, fromDate, toDate,
    totalRevenue, totalTicketsSold, ticketStatsArray,
    ticketTotalCash, ticketTotalBankTransfer, cumulativeRevenue
  } = data;

  const fbItems = ticketStatsArray.filter(t => t.itemType === 'PRODUCT' || t.label === 'Dịch vụ / Sản phẩm');
  const fb = {
    qty: fbItems.reduce((sum, t) => sum + (t.qty || 0), 0),
    revenue: fbItems.reduce((sum, t) => sum + (t.revenue || 0), 0)
  };
  const tickets = ticketStatsArray.filter(t => t.itemType !== 'PRODUCT' && t.label !== 'Dịch vụ / Sản phẩm' && t.qty > 0);

  // Dựa vào doanh thu (hoặc giá trị gộp) để biết vé nào là miễn phí
  const freeTickets = tickets.filter(t => t.revenue === 0);
  const paidTickets = tickets.filter(t => t.revenue > 0);

  const ticketRevenue = totalRevenue - (fb.revenue || 0);
  const mienphiQty = freeTickets.reduce((sum, t) => sum + t.qty, 0);
  const paidQty = paidTickets.reduce((sum, t) => sum + t.qty, 0);
  
  let dateStr = '';
  if (fromDate === toDate) {
    dateStr = `ngày ${new Date(fromDate).toLocaleDateString('vi-VN')}`;
  } else {
    dateStr = `từ ${new Date(fromDate).toLocaleDateString('vi-VN')} đến ${new Date(toDate).toLocaleDateString('vi-VN')}`;
  }

  const toD = new Date(toDate);
  const month = toD.getMonth() + 1;
  const year = toD.getFullYear();
  const endDateStr = toD.toLocaleDateString('vi-VN');

  let freeTicketsText = '';
  if (freeTickets.length > 0) {
    freeTicketsText = `+ Miễn phí: ${mienphiQty.toLocaleString('vi-VN')} vé, gồm:\n${freeTickets.map(t => ` ${t.label}: ${t.qty.toLocaleString('vi-VN')} vé.`).join('\n')}`;
  } else {
    freeTicketsText = `+ Miễn phí: 0 vé`;
  }

  // Format cash and bank
  // Since ticketTotalCash might not divide perfectly if there are discounts, we just use the amounts
  const cashText = `=> TM: ${ticketTotalCash.toLocaleString('vi-VN')} đồng`;
  const bankText = `=>Bank: ${ticketTotalBankTransfer.toLocaleString('vi-VN')} đồng`;

  return `BÁO CÁO DOANH THU ${companyName.toUpperCase()}
${dateStr}:
*- Doanh thu vé: ${ticketRevenue.toLocaleString('vi-VN')} đồng*
- Tổng lượng khách: ${totalTicketsSold.toLocaleString('vi-VN')} vé, bao gồm:

+Khách tham quan: ${paidQty.toLocaleString('vi-VN')} vé, doanh thu: ${ticketRevenue.toLocaleString('vi-VN')} đồng
${freeTicketsText}
${cashText}
${bankText}
*- Doanh thu FB : ${(fb.revenue || 0).toLocaleString('vi-VN')} đồng.*
 
*Tổng doanh thu ${dateStr}: ${totalRevenue.toLocaleString('vi-VN')} đồng*
 Doanh thu luỹ kế tháng ${month} đến hết ngày ${endDateStr}: ${cumulativeRevenue.toLocaleString('vi-VN')} đồng.
Trân Trọng!`;
};
