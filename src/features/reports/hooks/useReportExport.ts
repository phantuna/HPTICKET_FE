import { Dispatch, SetStateAction } from 'react';
import { exportToExcel } from '../utils/excelExporter';
import { toast } from '../../../shared/utils/toast';

export interface ExportParams {
  tab: string;
  // Doanh thu tổng hợp
  ticketStatsArray?: any[];
  totalRevenue?: number;
  // Vé chi tiết
  issuedTickets?: any[];
  rawOrders?: any[];
  // Loại vé
  ticketTemplateStats?: any[];
  // Sản phẩm
  productStats?: any[];
  // Nhân viên
  users?: any[];
  // Khoảng thời gian (để đặt tên file)
  fromDate?: string;
  toDate?: string;
  selectedMonth?: string;
}

export const useReportExport = (_setExportNotice: Dispatch<SetStateAction<string | null>>) => {
  const handleExportExcel = (tab: string, params?: Omit<ExportParams, 'tab'>) => {
    try {
      const dateTag = params?.fromDate
        ? (params.fromDate === params?.toDate ? params.fromDate : `${params.fromDate}_${params.toDate}`)
        : new Date().toISOString().slice(0, 10);

      switch (tab) {
        // ── Tab 1: Doanh Thu Tổng Hợp ──────────────────────────────────────
        case 'BaoCaoDoanhThu': {
          const stats = params?.ticketStatsArray ?? [];
          const headers = ['Loại Vé / Sản Phẩm', 'Số Lượng', 'Trước Giảm Giá (đ)', 'Giảm Giá (đ)', 'Doanh Thu (đ)'];
          const rows = stats.map((s: any) => [
            s.label,
            s.qty,
            s.amountBeforeVatAndDiscount,
            s.discount,
            s.revenue,
          ]);
          // Dòng tổng cộng
          rows.push([
            'TỔNG CỘNG',
            stats.reduce((sum: number, s: any) => sum + s.qty, 0),
            stats.reduce((sum: number, s: any) => sum + s.amountBeforeVatAndDiscount, 0),
            stats.reduce((sum: number, s: any) => sum + s.discount, 0),
            stats.reduce((sum: number, s: any) => sum + s.revenue, 0),
          ]);
          exportToExcel(headers, rows, `DoanhThuTongHop_${dateTag}`);
          break;
        }

        // ── Tab 2: Vé Chi Tiết ─────────────────────────────────────────────
        case 'BaoCaoVeChiTiet': {
          const tickets = params?.issuedTickets ?? [];
          const ordersMap = new Map((params?.rawOrders ?? []).map((o: any) => [o.id || o.order_id, o]));
          const headers = ['STT', 'Mã Vé (QR)', 'Loại Vé', 'Thanh Toán', 'Thành Tiền (đ)', 'Giảm Giá (đ)', 'Doanh Thu (đ)', 'Trạng Thái', 'Ngày Tạo'];
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
            const isCash = order?.payment_method === 'TIEN_MAT' || order?.payment_method === 'CASH';
            const statusMap: Record<string, string> = { UNUSED: 'Chưa dùng', USED: 'Đã dùng', PARTIAL_USED: 'Đã dùng', EXPIRED: 'Hết hạn' };
            const d = new Date(t.created_at || '');
            const dateStr = isNaN(d.getTime()) ? '' : `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')} ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
            return [idx + 1, t.qr_code_string, t.ticket_template_name, order ? (isCash ? 'Tiền mặt' : 'Chuyển khoản') : '---', unitPrice, discount, revenue, statusMap[t.status] ?? t.status, dateStr];
          });
          exportToExcel(headers, rows, `BaoCaoVeChiTiet_${dateTag}`);
          break;
        }

        // ── Tab 3: Doanh Thu Theo Loại Vé ──────────────────────────────────
        case 'BaoCaoDoanhThu_LoaiVe': {
          const stats = params?.ticketTemplateStats ?? [];
          const total = stats.reduce((sum: number, t: any) => sum + t.revenue, 0);
          const headers = ['STT', 'Mã Loại Vé', 'Tên Loại Vé', 'Số Lượng', 'Doanh Thu (đ)', '% Tổng'];
          const rows = stats.map((t: any, idx: number) => [
            idx + 1, t.code, t.name, t.soldQty, t.revenue,
            total > 0 ? `${((t.revenue / total) * 100).toFixed(1)}%` : '0%',
          ]);
          rows.push(['', '', 'TỔNG CỘNG', stats.reduce((s: number, t: any) => s + t.soldQty, 0), total, '100.0%']);
          exportToExcel(headers, rows, `BaoCaoDoanhThu_LoaiVe_${dateTag}`);
          break;
        }

        // ── Tab 4: Doanh Thu Sản Phẩm ──────────────────────────────────────
        case 'BaoCaoDoanhThu_SanPham': {
          const stats = params?.productStats ?? [];
          const total = stats.reduce((sum: number, p: any) => sum + p.revenue, 0);
          const headers = ['STT', 'Mã Hàng', 'Tên Hàng Hóa / Dịch Vụ', 'Số Lượng', 'Doanh Thu (đ)', '% Tổng'];
          const rows = stats.map((p: any, idx: number) => [
            idx + 1, p.sku || p.code, p.name, p.soldQty, p.revenue,
            total > 0 ? `${((p.revenue / total) * 100).toFixed(1)}%` : '0%',
          ]);
          rows.push(['', '', 'TỔNG CỘNG', stats.reduce((s: number, p: any) => s + p.soldQty, 0), total, '100.0%']);
          exportToExcel(headers, rows, `BaoCaoDoanhThu_SanPham_${dateTag}`);
          break;
        }

        // ── Tab 5: Doanh Thu Nhân Viên ─────────────────────────────────────
        case 'BaoCaoDoanhThu_User_Thang': {
          const users = params?.users ?? [];
          const orders = params?.rawOrders ?? [];
          const headers = ['STT', 'Họ Tên', 'Username', 'Số Điện Thoại', 'Số Đơn Hàng', 'Tổng Doanh Thu (đ)'];
          const rows = users.map((u: any, idx: number) => {
            const userOrders = orders.filter((o: any) => o.created_by === u.username);
            const total = userOrders.reduce((acc: number, o: any) => acc + (o.final_amount || 0), 0);
            return [idx + 1, u.fullname, u.username, u.phone, userOrders.length, total];
          });
          const monthStr = params?.selectedMonth ? `Thang${params.selectedMonth}` : dateTag;
          exportToExcel(headers, rows, `BaoCaoDoanhThu_NhanVien_${monthStr}`);
          break;
        }

        default:
          toast.error(`Chưa hỗ trợ xuất Excel cho tab: ${tab}`);
          return;
      }

      toast.success('Đã xuất file Excel thành công!');
    } catch (err) {
      console.error('Export Excel error:', err);
      toast.error('Xuất Excel thất bại. Vui lòng thử lại!');
    }
  };

  return { handleExportExcel };
};
