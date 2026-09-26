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
          const { headers, rows, filename } = formatRevenueReportExcel(params);
          await exportToExcel(headers, rows, filename);
          break;
        }

        // ── Tab 2: Vé Chi Tiết ─────────────────────────────────────────────
        case 'BaoCaoVeChiTiet': {
          const { headers, rows, filename } = formatTicketDetailExcel(params);
          await exportToExcel(headers, rows, filename);
          break;
        }

        // ── Tab 3: Doanh Thu Theo Loại Vé ──────────────────────────────────
        case 'BaoCaoDoanhThu_LoaiVe': {
          const { headers, rows, filename } = formatTicketTypeExcel(params);
          await exportToExcel(headers, rows, filename);
          break;
        }

        // ── Tab 4: Doanh Thu Sản Phẩm ──────────────────────────────────────
        case 'BaoCaoDoanhThu_SanPham': {
          const { headers, rows, filename } = formatProductExcel(params);
          await exportToExcel(headers, rows, filename);
          break;
        }

        // ── Tab 5: Doanh Thu Nhân Viên ─────────────────────────────────────
        case 'BaoCaoDoanhThu_User_Thang': {
          const { headers, rows, filename } = formatUserRevenueExcel(params);
          await exportToExcel(headers, rows, filename);
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
          const { headers, rows, filename } = formatComparisonExcel(params);
          await exportToExcel(headers, rows, filename);
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
