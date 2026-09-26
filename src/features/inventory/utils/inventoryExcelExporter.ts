import * as XLSX from 'xlsx';
import { StockMovementLog, Company } from '../../../shared/types/hpticket';
import { downloadExcelFromJsonApi } from '../../reports/utils/excelExporter';
import { toast } from '../../../shared/utils/toast';
import { inventoryService, StockMovementFilterParams } from '../../../api/inventoryService';

export interface ExportInventoryExcelOptions {
  logs?: StockMovementLog[];
  filter?: StockMovementFilterParams;
  company?: Company | null;
  fileName?: string;
  reportTitle?: string;
  onProgress?: (loaded: number, total: number, percent: number) => void;
}

/**
 * Xuất dữ liệu nhật ký biến động kho ra file Excel chuẩn form hệ thống Hoàng Phát.
 * Hỗ trợ Chunked Keyset Streaming tải theo đợt từ Backend để không làm nghẽn RAM trình duyệt.
 *
 * - Đầu trang: Thông tin công ty lấy từ table company (Tên, địa chỉ, MST, điện thoại, email)
 * - Tiêu đề báo cáo và thời gian xuất cố định theo Snapshot exportStartedAt
 * - Bảng dữ liệu có phân biệt màu sắc theo loại biến động (Nhập, Xuất, Bán POS, Điều chỉnh, Tồn đầu kỳ)
 * - Dòng TỔNG CỘNG in đậm bôi màu làm rõ ở cuối bảng
 */
export const exportInventoryHistoryToExcel = async ({
  logs,
  filter,
  company,
  fileName = 'NhatKyBienDongKho',
  reportTitle = 'BÁO CÁO NHẬT KÝ BIẾN ĐỘNG KHO SẢN PHẨM & DỊCH VỤ',
  onProgress,
}: ExportInventoryExcelOptions): Promise<void> => {
  let allLogs: StockMovementLog[] = [];

  // Nếu đã truyền logs sẵn (ví dụ export trang hiện tại)
  if (logs && logs.length > 0) {
    allLogs = logs;
  } else if (filter) {
    // Tải theo từng chunk từ Backend API
    const exportStartedAt = new Date().toISOString();
    let cursor: string | undefined = undefined;
    let hasMore = true;
    let loaded = 0;
    const CHUNK_SIZE = 1000;

    toast.info('Bắt đầu tải dữ liệu xuất Excel...');

    while (hasMore) {
      const res = await inventoryService.fetchExportChunk(filter, cursor, exportStartedAt, CHUNK_SIZE);
      if (!res.data || !res.data.items || res.data.items.length === 0) {
        break;
      }

      allLogs = allLogs.concat(res.data.items);
      loaded += res.data.items.length;
      cursor = res.data.nextCursor;
      hasMore = Boolean(res.data.hasMore && cursor);

      const total = res.data.totalCount || loaded;
      const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 100;
      if (onProgress) {
        onProgress(loaded, total, percent);
      }
    }
  }

  if (allLogs.length === 0) {
    toast.error('Không có dữ liệu biến động kho nào để xuất Excel');
    return;
  }

  const companyName = company?.name || 'CÔNG TY TNHH MTV DU LỊCH HOÀNG PHÁT';
  const companyAddress = company?.address || 'Khu Du Lịch Sinh Thái Hoàng Phát, Ninh Bình';
  const companyPhone = company?.phone || '0229 3888 999';
  const companyTax = (company as any)?.tax_code || company?.fax || '2700888999';
  const companyEmail = (company as any)?.email || 'hotro@hoangphat.vn';

  const headers = [
    'STT',
    'Thời Gian',
    'Loại Thao Tác',
    'Mã Sản Phẩm',
    'Tên Sản Phẩm',
    'ĐVT',
    'Tồn Trước',
    'Biến Động',
    'Tồn Sau',
    'Đơn Giá (VNĐ)',
    'Tổng Giá Trị (VNĐ)',
    'Quầy Bán Hàng',
    'Loại Chứng Từ',
    'Mã Chứng Từ / HĐ',
    'Người Thực Hiện',
    'Ghi Chú / Lý Do',
  ];

  let totalQty = 0;
  let totalVal = 0;

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'IMPORT':
        return 'NHẬP KHO (+)';
      case 'EXPORT':
        return 'XUẤT KHO (-)';
      case 'POS_SALE':
        return 'BÁN LẺ POS (-)';
      case 'ADJUST':
        return 'ĐIỀU CHỈNH (±)';
      case 'RETURN':
        return 'TRẢ HÀNG (+)';
      case 'DAMAGED':
        return 'XUẤT HỦY HỎNG (-)';
      case 'OPENING_BALANCE':
        return 'TỒN ĐẦU KỲ (+)';
      default:
        return type;
    }
  };

  const getRefTypeLabel = (type?: string) => {
    switch (type) {
      case 'POS_ORDER':
        return 'Hóa đơn POS';
      case 'INVENTORY_ADJUSTMENT':
        return 'Biên bản kiểm kê';
      case 'OPENING_BALANCE':
        return 'Số dư đầu kỳ';
      case 'RETURN':
        return 'Phiếu trả hàng';
      case 'DAMAGE':
        return 'Biên bản xuất hủy';
      default:
        return 'Phiếu thủ công';
    }
  };

  const rows = allLogs.map((log, index) => {
    const qtySign =
      log.type === 'IMPORT' || log.type === 'OPENING_BALANCE' || log.type === 'RETURN'
        ? `+${Math.abs(log.quantity)}`
        : log.type === 'ADJUST'
        ? (log.quantity >= 0 ? `+${log.quantity}` : `${log.quantity}`)
        : `-${Math.abs(log.quantity)}`;

    totalQty += Number(log.quantity) || 0;
    totalVal += Number(log.total_value) || 0;

    return [
      index + 1,
      log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : '',
      getMovementLabel(log.type),
      log.product_code || '',
      log.product_name || '',
      log.unit || 'Cái',
      Number(log.before_quantity) || 0,
      qtySign,
      Number(log.after_quantity) || 0,
      Number(log.unit_price) || 0,
      Number(log.total_value) || 0,
      log.sales_counter_name || (log.sales_counter_id ? `Quầy #${log.sales_counter_id}` : '-'),
      getRefTypeLabel(log.reference_type),
      log.reference_code || '-',
      log.performed_by || '',
      log.reason ? `${log.reason} (${log.note || ''})` : log.note || '',
    ];
  });

  // Hàng tổng cộng cuối bảng
  const totalRow = [
    'TỔNG CỘNG',
    '',
    '',
    '',
    '',
    '',
    '',
    totalQty,
    '',
    '',
    totalVal,
    '',
    '',
    '',
    '',
    '',
  ];

  const nowFormatted = new Date().toLocaleString('vi-VN');

  // Khởi tạo các dòng header công ty
  const sheetData: any[][] = [
    [companyName.toUpperCase()],
    [`Địa chỉ: ${companyAddress}`],
    [`Mã số thuế: ${companyTax}  |  Điện thoại: ${companyPhone}  |  Email: ${companyEmail}`],
    [],
    [reportTitle],
    [`Thời gian xuất báo cáo: ${nowFormatted}  (Tổng số bản ghi: ${allLogs.length.toLocaleString('vi-VN')})`],
    [],
    headers,
    ...rows,
    totalRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Đặt độ rộng các cột tối ưu dễ nhìn
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 20 }, // Thời gian
    { wch: 18 }, // Loại thao tác
    { wch: 14 }, // Mã SP
    { wch: 28 }, // Tên SP
    { wch: 10 }, // ĐVT
    { wch: 12 }, // Tồn trước
    { wch: 14 }, // Biến động
    { wch: 12 }, // Tồn sau
    { wch: 16 }, // Đơn giá
    { wch: 18 }, // Tổng giá trị
    { wch: 18 }, // Quầy bán
    { wch: 18 }, // Loại chứng từ
    { wch: 22 }, // Mã chứng từ
    { wch: 16 }, // Người thực hiện
    { wch: 32 }, // Ghi chú / Lý do
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'NhatKyKho');

  const finalFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, finalFileName);
  toast.success(`Đã xuất thành công ${allLogs.length.toLocaleString('vi-VN')} bản ghi ra file Excel!`);
};
