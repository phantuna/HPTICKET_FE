import React from 'react';
import { Search, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface ProductRevenueReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  productStats: any[];
}

export const ProductRevenueReportTab: React.FC<ProductRevenueReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, setSearchTrigger, handleExportExcel, productStats
}) => {
  const totalProductDoanhThu = productStats.reduce((sum, p) => sum + p.revenue, 0);
  const totalProductQty = productStats.reduce((sum, p) => sum + p.soldQty, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2"><span className="text-slate-600 font-medium text-sm">Từ ngày:</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm" /></div>
        <div className="flex items-center gap-2"><span className="text-slate-600 font-medium text-sm">Đến ngày:</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm" /></div>
        <button onClick={() => setSearchTrigger(prev => prev + 1)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition ml-auto"><Search className="w-4 h-4" /> Tìm kiếm</button>
        <button onClick={() => handleExportExcel('BaoCaoDoanhThu_SanPham')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"><Download className="w-4 h-4" /> Xuất excel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Doanh Thu Sản Phẩm</p>
          <p className="text-2xl font-bold text-amber-500">{totalProductDoanhThu.toLocaleString('vi-VN')} VND</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Số Lượng Đã Bán</p>
          <p className="text-2xl font-bold text-sky-500">{totalProductQty.toLocaleString('vi-VN')}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm text-center">
          <p className="text-sm font-bold text-slate-500 mb-2 uppercase">Tổng Doanh Thu</p>
          <p className="text-2xl font-bold text-rose-500">{totalProductDoanhThu.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Top Sản Phẩm Theo Doanh Thu</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productStats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{fontSize: 10, fill: '#64748b'}} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#f59e0b" barSize={30} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Phân Bổ Doanh Thu Sản Phẩm</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={productStats} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {productStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Chi Tiết Doanh Thu Sản Phẩm</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr><th className="p-3">STT</th><th className="p-3">Mã hàng</th><th className="p-3">Tên hàng hóa/dịch vụ</th><th className="p-3 text-right">Số lượng</th><th className="p-3 text-right">Doanh thu</th><th className="p-3 text-right">% Tổng</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {productStats.map((p: any, idx: number) => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-600">{idx + 1}</td>
                  <td className="p-3 font-mono text-slate-600">{p.sku || p.code}</td>
                  <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                  <td className="p-3 text-right font-bold text-slate-800">{p.soldQty}</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{p.revenue.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right font-mono text-slate-600">{totalProductDoanhThu > 0 ? ((p.revenue / totalProductDoanhThu) * 100).toFixed(1) : 0}%</td>
                </tr>
              ))}
              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="p-3" colSpan={3}>Tổng cộng</td>
                <td className="p-3 text-right text-slate-900">{totalProductQty}</td>
                <td className="p-3 text-right text-emerald-700">{totalProductDoanhThu.toLocaleString('vi-VN')}</td>
                <td className="p-3 text-right text-slate-900">100.0%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
