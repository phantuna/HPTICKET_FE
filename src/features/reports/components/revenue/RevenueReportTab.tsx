import React, { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';
import { generateZaloReport } from '../../utils/zaloReportFormatter';
import { toast } from '../../../../shared/utils/toast';
import { apiClient, API_ENDPOINTS } from '../../../../api/apiConfig';
import { ReportDateRangeFilter } from '../shared/ReportDateRangeFilter';
import { RevenueOverviewCards } from './RevenueOverviewCards';
import { RevenueBreakdownTable } from './RevenueBreakdownTable';
import { RevenueChartSection } from './RevenueChartSection';

export const getDateRangeForChartView = (view: string, referenceDateStr?: string) => {
  let base = new Date();
  if (referenceDateStr) {
    const parsed = new Date(referenceDateStr);
    if (!isNaN(parsed.getTime())) {
      base = parsed;
    }
  }

  const y = base.getFullYear();
  const m = base.getMonth(); // 0 - 11

  const format = (dt: Date) => {
    const year = dt.getFullYear();
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (view === 'day') {
    // Các ngày trong tháng: từ ngày 01 đến ngày cuối tháng
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return { fromDate: format(firstDay), toDate: format(lastDay) };
  }

  if (view === 'week') {
    // Các tuần trong tháng hiện tại: từ ngày 01 đến ngày cuối tháng
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);
    return { fromDate: format(firstDay), toDate: format(lastDay) };
  }

  if (view === 'quarter') {
    // Các quý trong năm hiện tại: từ ngày 01/01 đến 31/12 của năm hiện tại
    const firstDay = new Date(y, 0, 1);
    const lastDay = new Date(y, 11, 31);
    return { fromDate: format(firstDay), toDate: format(lastDay) };
  }

  if (view === 'month') {
    // Các tháng trong năm: từ 01/01 đến 31/12
    const firstDay = new Date(y, 0, 1);
    const lastDay = new Date(y, 11, 31);
    return { fromDate: format(firstDay), toDate: format(lastDay) };
  }

  return { fromDate: format(base), toDate: format(base) };
};

export interface RevenueReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  totalRevenue: number;
  totalTicketsSold: number;
  chartView: string; setChartView: (v: string) => void;
  chartData: any[];
  ticketStatsArray: any[];
  ticketTotalCash: number;
  ticketTotalBankTransfer: number;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const RevenueReportTab: React.FC<RevenueReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, setSearchTrigger, handleExportExcel,
  totalRevenue, totalTicketsSold, chartView, setChartView, chartData, ticketStatsArray,
  ticketTotalCash, ticketTotalBankTransfer, onRefresh, isLoading
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleChartViewChange = (newView: string) => {
    setChartView(newView);
    let refDate = toDate || fromDate;
    if ((newView === 'day' || newView === 'week') && fromDate && toDate) {
      const fromD = new Date(fromDate);
      const toD = new Date(toDate);
      if (fromD.getMonth() !== toD.getMonth() || fromD.getFullYear() !== toD.getFullYear()) {
        refDate = undefined; // reset về tháng/ngày hiện tại
      }
    }
    const range = getDateRangeForChartView(newView, refDate);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    setSearchTrigger(prev => prev + 1);
  };

  const handleExportTxt = async () => {
    setIsExporting(true);
    try {
      const toD = new Date(toDate);
      const firstDayStr = `${toD.getFullYear()}-${String(toD.getMonth() + 1).padStart(2, '0')}-01`;
      
      let cumulativeRevenue = 0;
      try {
         const res = (await apiClient.get(API_ENDPOINTS.SALES.REPORTS_SUMMARY, { fromDate: firstDayStr, toDate: toDate })) as any;
         if (res?.data) {
             cumulativeRevenue = res.data.total_revenue || 0;
         }
      } catch (e) {
         console.error("Failed to fetch cumulative revenue", e);
      }

      let companyName = 'Hệ thống HP Ticket';
      try {
        const compRes = (await apiClient.get(API_ENDPOINTS.MARKETING.COMPANIES)) as any;
        const compList = Array.isArray(compRes?.data) ? compRes.data : compRes?.data?.content || [];
        if (compList.length > 0) {
          const comp = compList[0];
          companyName = comp.name || comp.company_name || companyName;
        }
      } catch (e) {
        console.error("Lỗi khi lấy thông tin công ty từ DB", e);
      }

      const text = generateZaloReport({
        companyName,
        fromDate,
        toDate,
        totalRevenue,
        totalTicketsSold,
        ticketStatsArray,
        ticketTotalCash,
        ticketTotalBankTransfer,
        cumulativeRevenue
      });

      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeDate = fromDate === toDate ? fromDate : `${fromDate}_${toDate}`;
      link.download = `Bao_Cao_GM_${safeDate}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Đã xuất file báo cáo TXT thành công!');

      // Ghi nhận nhật ký kiểm toán cho thao tác xuất báo cáo TXT
      apiClient.post('/system/exports/log-client-export', null, {
        params: { reportTitle: 'Báo cáo GM doanh thu tổng quan (TXT)', fileType: 'txt' }
      }).catch(() => {});
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xuất báo cáo!');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bộ lọc ngày và các nút xuất */}
      <ReportDateRangeFilter
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        onSearch={() => setSearchTrigger(prev => prev + 1)}
        onRefresh={onRefresh}
        isLoading={isLoading}
      >
        <div className="flex items-end">
          <button
            onClick={handleExportTxt}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />} Xuất báo cáo
          </button>
        </div>
        <div className="flex items-end">
          <ExportExcelButton 
            onExport={() => handleExportExcel('BaoCaoDoanhThu')} 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"
            buttonText="Xuất Excel"
          />
        </div>
      </ReportDateRangeFilter>

      {/* Thẻ tổng kết doanh thu */}
      <RevenueOverviewCards
        totalRevenue={totalRevenue}
        totalTicketsSold={totalTicketsSold}
        ticketTotalCash={ticketTotalCash}
        ticketTotalBankTransfer={ticketTotalBankTransfer}
        ticketStatsArray={ticketStatsArray}
      />

      {/* Bảng chi tiết vé & sản phẩm */}
      <RevenueBreakdownTable ticketStatsArray={ticketStatsArray} />

      {/* Khu vực đồ thị */}
      <RevenueChartSection
        chartView={chartView}
        onChartViewChange={handleChartViewChange}
        chartData={chartData}
        ticketStatsArray={ticketStatsArray}
      />
    </div>
  );
};
