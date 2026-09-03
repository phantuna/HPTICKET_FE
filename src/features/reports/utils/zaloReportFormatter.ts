export const generateZaloReport = (
  fromDate: string,
  toDate: string,
  totalRevenue: number,
  totalTicketsSold: number,
  ticketStatsArray: any[]
): string => {
  const fb = ticketStatsArray.find(t => t.label === 'Dịch vụ / Sản phẩm') || { qty: 0, revenue: 0 };
  const tickets = ticketStatsArray.filter(t => t.label !== 'Dịch vụ / Sản phẩm' && t.qty > 0);

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

  let freeTicketsText = '';
  if (freeTickets.length > 0) {
    freeTicketsText = `+ Miễn phí: ${mienphiQty.toLocaleString('vi-VN')} vé, gồm:\n${freeTickets.map(t => `  ${t.label}: ${t.qty.toLocaleString('vi-VN')} vé.`).join('\n')}`;
  } else {
    freeTicketsText = `+ Miễn phí: 0 vé`;
  }

  return `Báo cáo GM,

Báo cáo doanh thu Eo Gió ${dateStr}:

- *Doanh thu vé: ${ticketRevenue.toLocaleString('vi-VN')} vnđ
- Tổng lượng khách: ${totalTicketsSold.toLocaleString('vi-VN')} vé, gồm:*

+ Khách tham quan: ${paidQty.toLocaleString('vi-VN')} vé, doanh thu ${ticketRevenue.toLocaleString('vi-VN')} đồng.
${freeTicketsText}

- *Doanh thu F&B: ${(fb.revenue || 0).toLocaleString('vi-VN')} đồng.*

*Tổng doanh thu ${dateStr}: ${totalRevenue.toLocaleString('vi-VN')} đồng.*

Trân trọng.`;
};
