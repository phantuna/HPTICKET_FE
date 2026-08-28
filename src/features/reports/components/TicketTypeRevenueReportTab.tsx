import React from 'react';
import { Search, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface TicketTypeRevenueReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  ticketTypeFilter: string; setTicketTypeFilter: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  ticketTemplates: any[];
  ticketTemplateStats: any[];
  onFilterFocus?: () => void;
}

export const TicketTypeRevenueReportTab: React.FC<TicketTypeRevenueReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, ticketTypeFilter, setTicketTypeFilter,
  setSearchTrigger, handleExportExcel, ticketTemplates, ticketTemplateStats, onFilterFocus
}) => {
  const totalLoaiVeGross = ticketTemplateStats.reduce((sum, t) => sum + t.grossRevenue, 0);
  const totalLoaiVeDoanhThu = ticketTemplateStats.reduce((sum, t) => sum + t.revenue, 0);
  const totalLoaiVeQty = ticketTemplateStats.reduce((sum, t) => sum + t.soldQty, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2"><span className="text-slate-600 font-medium text-sm">Từ ngày:</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm" /></div>
        <div className="flex items-center gap-2"><span className="text-slate-600 font-medium text-sm">Đến ngày:</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm" /></div>
        <div className="flex items-center gap-2"><span className="text-slate-600 font-medium text-sm">Loại vé :</span>
          <select onFocus={onFilterFocus} onMouseEnter={onFilterFocus} value={ticketTypeFilter} onChange={(e) => setTicketTypeFilter(e.target.value)} className="bg-white border border-slate-200 px-3 py-1.5 text-sm text-slate-800 rounded-md outline-none focus:border-emerald-500">
            <option value="all">Tất cả</option>
            {ticketTemplates.map((t) => <option key={t.id} value={t.code}>{t.name}</option>)}
          </select>
        </div>
        <button onClick={() => setSearchTrigger(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ml-auto"><Search className="w-4 h-4" /> Tìm kiếm</button>
        <button onClick={() => handleExportExcel('BaoCaoDoanhThu_LoaiVe')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"><Download className="w-4 h-4" /> Xuất excel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 xl:p-6 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group hover:border-slate-300 transition min-w-0">
          <div className="absolute top-0 right-0 px-2 xl:px-3 py-1 bg-slate-100 text-slate-500 rounded-bl-xl text-[9px] xl:text-[10px] font-bold uppercase tracking-widest border-b border-l border-slate-200 z-10">Trước giảm</div>
          <p className="text-xs xl:text-sm font-bold text-slate-500 mb-1 xl:mb-2 uppercase tracking-wide text-center mt-3 xl:mt-0">Doanh Thu Gộp</p>
          <p className="text-lg md:text-base lg:text-xl xl:text-2xl font-bold text-slate-400 line-through decoration-slate-300 text-center break-words w-full px-2">{totalLoaiVeGross.toLocaleString('vi-VN')} đ</p>
        </div>
        <div className="bg-white border border-sky-100 rounded-xl p-4 xl:p-6 shadow-sm flex flex-col items-center justify-center bg-sky-50/30 min-w-0">
          <p className="text-xs xl:text-sm font-bold text-sky-700 mb-1 xl:mb-2 uppercase tracking-wide text-center">Số Lượng Vé Bán</p>
          <p className="text-2xl md:text-xl lg:text-3xl xl:text-4xl font-extrabold text-sky-600 text-center break-words w-full px-2">{totalLoaiVeQty.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 xl:p-6 shadow-md flex flex-col items-center justify-center relative overflow-hidden min-w-0">
          <div className="absolute top-0 right-0 px-2 xl:px-3 py-1 bg-emerald-500 text-white rounded-bl-xl text-[9px] xl:text-[10px] font-bold shadow-sm uppercase tracking-widest z-10">Thực thu</div>
          <p className="text-xs xl:text-sm font-bold text-emerald-800 mb-1 xl:mb-2 uppercase tracking-wide text-center mt-3 xl:mt-0">Doanh Thu Ròng</p>
          <p className="text-2xl md:text-xl lg:text-3xl xl:text-4xl font-extrabold text-emerald-600 drop-shadow-sm text-center break-words w-full px-1">{totalLoaiVeDoanhThu.toLocaleString('vi-VN')} đ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Top Vé Theo Doanh Thu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketTemplateStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#3b82f6" barSize={30} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Phân Bổ Số Lượng Vé</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ticketTemplateStats} dataKey="soldQty" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({percent}) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {ticketTemplateStats.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value} vé`, 'Số lượng']} />
                <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: '11px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Chi Tiết Doanh Thu Vé</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr><th className="p-3">STT</th><th className="p-3">Mã loại vé</th><th className="p-3">Tên loại vé</th><th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Doanh thu</th><th className="p-3 text-right">% Tổng</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ticketTemplateStats.map((t: any, idx: number) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-600">{idx + 1}</td>
                  <td className="p-3 font-mono text-slate-600">{t.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{t.name}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{t.soldQty}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{t.revenue.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right font-mono text-slate-600">{totalLoaiVeDoanhThu > 0 ? ((t.revenue / totalLoaiVeDoanhThu) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="p-3" colSpan={3}>Tổng cộng</td>
                <td className="p-3 text-right text-slate-900">{totalLoaiVeQty}</td>
                <td className="p-3 text-right text-emerald-700">{totalLoaiVeDoanhThu.toLocaleString('vi-VN')}</td>
                <td className="p-3 text-right text-slate-900">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
