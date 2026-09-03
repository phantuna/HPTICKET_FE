import React from 'react';
import { Search, Download, Clock } from 'lucide-react';
import { downloadExcelFromApi } from '../utils/excelExporter';
import { toast } from '../../../shared/utils/toast';

interface GateLogReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  nameSearch: string; setNameSearch: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  rawGateLogs: any[];
  gateLogs: any[];
  page: number; setPage: React.Dispatch<React.SetStateAction<number>>; pageSize: number;
}

export const GateLogReportTab: React.FC<GateLogReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, nameSearch, setNameSearch,
  setSearchTrigger, rawGateLogs, gateLogs, page, setPage, pageSize
}) => {
  const handleExport = async () => {
    if (!fromDate || !toDate) {
      toast.info("Vui lòng chọn Từ ngày và Đến ngày để xuất Excel.");
      return;
    }
    const diff = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 3600 * 24));
    if (diff < 0) return toast.info("Đến ngày phải lớn hơn hoặc bằng Từ ngày.");
    if (diff > 7) return toast.info("Chỉ cho phép xuất báo cáo tối đa 7 ngày để đảm bảo hiệu suất hệ thống.");

    try {
      await downloadExcelFromApi('/ticketing/access-logs/export', { fromDate, toDate }, 'NhatKySoatVe.xlsx');
    } catch (error: any) {
      toast.error(error?.message || 'Lỗi khi xuất dữ liệu. Vui lòng thử lại sau.');
    }
  };

  return (
  <div className="space-y-6">
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">BÁO CÁO RA VÀO NHÂN VIÊN</h2>
      <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs items-center">
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Từ ngày :</span>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Đến ngày :</span>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-mono font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-700 font-semibold whitespace-nowrap">Chọn cổng soát vé :</span>
            <select value={nameSearch} onChange={(e) => setNameSearch(e.target.value)} className="bg-white border border-slate-200 px-2.5 py-1.5 text-slate-900 font-medium rounded-lg outline-none focus:border-emerald-500 w-full shadow-xs">
              <option value="">-- Tất cả các cổng --</option>
              {Array.from(new Set(rawGateLogs.map(l => l.gate_name).filter(Boolean))).map((gateName, idx) => (
                <option key={idx} value={gateName as string}>{gateName as string}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setSearchTrigger(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Search className="w-3.5 h-3.5" /> Tìm kiếm</button>
            <button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"><Download className="w-3.5 h-3.5" /> Xuất excel</button>
          </div>
        </div>
      </div>
    </div>
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600" /> Báo Cáo Lượt Ra Vào Nhân Viên & Khách
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200">
            <tr><th className="p-3">Thời Gian Scanned</th><th className="p-3">Cổng Soát Vé</th><th className="p-3">Mã QR Vé Scanned</th><th className="p-3 text-center">Kết Quả Soát Cổng</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {gateLogs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500 italic">Chưa có lượt quẹt vé mới.</td></tr>
            ) : (
              [...gateLogs].sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime()).slice((page - 1) * pageSize, page * pageSize).map((gl) => (
                <tr key={gl.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-mono text-slate-500">{new Date(gl.scan_time).toLocaleString()}</td>
                  <td className="p-3 font-bold text-slate-800">{gl.gate_name}</td>
                  <td className="p-3 font-mono text-blue-600">{gl.ticket_qr}</td>
                  <td className="p-3 text-center"><span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">{gl.status_result}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4 p-2 text-xs font-medium text-slate-500">
        <span>Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, gateLogs.length)} trong tổng số {gateLogs.length}</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Trước</button>
          <button onClick={() => setPage(p => Math.min(Math.ceil(gateLogs.length / pageSize), p + 1))} disabled={page === Math.ceil(gateLogs.length / pageSize) || gateLogs.length === 0} className="px-3 py-1 bg-slate-100 rounded hover:bg-slate-200 disabled:opacity-50">Sau</button>
        </div>
      </div>
    </div>
  </div>
  );
};
