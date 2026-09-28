import { Dispatch, SetStateAction } from 'react';
import { exportToExcel } from '../utils/excelExporter';
import { toast } from '../../../shared/utils/toast';
import {
  ExportParams,
  formatRevenueReportExcel,
  formatTicketDetailExcel,
  formatTicketTypeExcel,
  formatProductExcel,
  formatUserRevenueExcel,
  formatComparisonExcel
} from './export/exportFormatters';

export type { ExportParams };

export const useReportExport = (_setExportNotice: Dispatch<SetStateAction<string | null>>) => {
  const handleExportExcel = async (tab: string, params?: Omit<ExportParams, 'tab'>): Promise<void> => {
    try {
      switch (tab) {
        // ── Tab 1: Doanh Thu Tổng Hợp ──────────────────────────────────────
        case 'BaoCaoDoanhThu': {
          const res = formatRevenueReportExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        // ── Tab 2: Vé Chi Tiết ─────────────────────────────────────────────
        case 'BaoCaoVeChiTiet': {
          const res = formatTicketDetailExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        // ── Tab 3: Doanh Thu Theo Loại Vé ──────────────────────────────────
        case 'BaoCaoDoanhThu_LoaiVe': {
          const res = formatTicketTypeExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        // ── Tab 4: Doanh Thu Sản Phẩm ──────────────────────────────────────
        case 'BaoCaoDoanhThu_SanPham': {
          const res = formatProductExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        // ── Tab 5: Doanh Thu Nhân Viên ─────────────────────────────────────
        case 'BaoCaoDoanhThu_User_Thang': {
          const res = formatUserRevenueExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        // ── Tab 6: Báo Cáo Ra Vào (Gate Access Logs) - Async Heavy Job ─────
        case 'BaoCaoRaVao': {
          const { systemService } = await import('../../../api/systemService');
          await systemService.triggerExportJob('GATE_ACCESS_LOGS');
          toast.success('Đã đưa yêu cầu Xuất Nhật Ký Cổng vào hàng đợi ngầm. Hệ thống sẽ thông báo khi hoàn tất!');
          return;
        }

        // ── Tab 7: Báo Cáo Hệ Thống (System Logs) - Async Heavy Job ────────
        case 'BaoCaoHeThong': {
          const { systemService } = await import('../../../api/systemService');
          await systemService.triggerExportJob('SYSTEM_LOGS');
          toast.success('Đã đưa yêu cầu Xuất Nhật Ký Hệ Thống vào hàng đợi ngầm. Hệ thống sẽ thông báo khi hoàn tất!');
          return;
        }

        // ── Tab 8: Báo Cáo So Sánh ─────────────────────────────────────────
        case 'BaoCaoSoSanh': {
          const res = formatComparisonExcel(params);
          await exportToExcel(res.headers, res.rows, res.filename, res.reportTitle, res.fromDate, res.toDate, res.summaryCards);
          break;
        }

        default:
          toast.error(`Chưa hỗ trợ xuất Excel cho tab: ${tab}`);
          return;
      }
    } catch (err: any) {
      console.error('Export Excel error:', err);
      throw err;
    }
  };

  return { handleExportExcel };
};
