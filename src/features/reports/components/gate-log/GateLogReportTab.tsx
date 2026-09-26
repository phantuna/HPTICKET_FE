import React, { useState, useEffect } from 'react';
import { Search, Clock } from 'lucide-react';
import { downloadExcelFromApi } from '../../utils/excelExporter';
import { toast } from '../../../../shared/utils/toast';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';
import { apiClient, API_ENDPOINTS } from '../../../../api/apiConfig';
import { ReportPagination } from '../shared/ReportPagination';

export interface GateLogReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  nameSearch: string; setNameSearch: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  searchTrigger?: number;
  handleExportExcel?: (tab: string) => void;
  page: number; setPage: React.Dispatch<React.SetStateAction<number>>; pageSize: number;
  onRefresh?: () => void;
}

export const GateLogReportTab: React.FC<GateLogReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, nameSearch, setNameSearch,
  setSearchTrigger, searchTrigger = 0, page, setPage, pageSize, onRefresh
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [availableGates, setAvailableGates] = useState<string[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: page - 1,
          size: pageSize,
          fromDate,
          toDate
        };
        if (nameSearch) {
          params.keyword = nameSearch;
        }

        const res = await apiClient.get<any>(API_ENDPOINTS.TICKETING.ACCESS_LOGS, params);
        
        if (res && res.data) {
          if (Array.isArray(res.data.content)) {
            setLogs(res.data.content);
            setTotalElements(res.data.totalElements || res.data.content.length);
            
            const gates = new Set(res.data.content.map((l: any) => l.gate_name).filter(Boolean));
            setAvailableGates(prev => Array.from(new Set([...prev, ...Array.from(gates)])) as string[]);
          } else if (Array.isArray(res.data)) {
            setLogs(res.data);
            setTotalElements(res.data.length);
            const gates = new Set(res.data.map((l: any) => l.gate_name).filter(Boolean));
            setAvailableGates(Array.from(gates) as string[]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch gate logs", err);
        setLogs([]);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, pageSize, searchTrigger]);

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast.info("Vui lòng chọn Từ ngày và Đến ngày để xuất Excel.");
      return;
    }
    const diff = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24));
    if (diff < 0) return toast.info("Đến ngày phải lớn hơn hoặc bằng Từ ngày.");

    await downloadExcelFromApi('/ticketing/access-logs/export', { fromDate, toDate }, 'NhatKySoatVe.xlsx');
  };

  const totalPages = Math.ceil(totalElements / pageSize) || 1;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO RA VÀO NHÂN VIÊN</h2>
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Từ ngày :</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Đến ngày :</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-700 font-semibold whitespace-nowrap">Chọn cổng soát vé :</span>
              <select
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs"
              >
                <option value="">-- Tất cả các cổng --</option>
                {availableGates.map((gateName, idx) => (
                  <option key={idx} value={gateName}>{gateName}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSearchTrigger(prev => prev + 1)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
              >
                <Search className="w-3.5 h-3.5" /> Tìm kiếm
              </button>
              <ExportExcelButton 
                onExport={handleExport}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                buttonText="Xuất excel"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-600" /> Báo Cáo Lượt Ra Vào Nhân Viên & Khách
          </h3>
          {loading && <div className="text-xs text-emerald-600 font-semibold animate-pulse">Đang tải dữ liệu...</div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Thời Gian Scanned</th>
                <th className="p-3">Cổng Soát Vé</th>
                <th className="p-3">Mã QR Vé Scanned</th>
                <th className="p-3 text-center">Kết Quả Soát Cổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 && !loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Chưa có lượt quẹt vé mới.</td></tr>
              ) : (
                logs.map((gl) => (
                  <tr key={gl.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono text-slate-500">{new Date(gl.scan_time).toLocaleString()}</td>
                    <td className="p-3 font-bold text-slate-800">{gl.gate_name}</td>
                    <td className="p-3 font-mono text-blue-600">{gl.ticket_qr}</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                        {gl.status_result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ReportPagination
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          itemUnitLabel="lượt quét"
        />
      </div>
    </div>
  );
};
