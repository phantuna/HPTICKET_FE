import React from 'react';
import { Download, Search, Banknote, ShoppingCart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface RevenueReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  totalRevenue: number;
  totalTicketsSold: number;
  chartView: string; setChartView: (v: string) => void;
  chartData: any[];
  ticketStatsArray: any[];
}

export const RevenueReportTab: React.FC<RevenueReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, setSearchTrigger, handleExportExcel,
  totalRevenue, totalTicketsSold, chartView, setChartView, chartData, ticketStatsArray
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-md shadow-sm border border-slate-100 mb-6">
      <div className="flex flex-col">
        <span className="text-slate-600 font-medium text-sm mb-1">Từ ngày:</span>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm text-slate-800" />
      </div>
      <div className="flex flex-col">
        <span className="text-slate-600 font-medium text-sm mb-1">Đến ngày:</span>
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 text-sm text-slate-800" />
      </div>
      <div className="flex items-end">
        <button onClick={() => setSearchTrigger(prev => prev + 1)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"><Search className="w-4 h-4" /> Tìm kiếm</button>
      </div>
      <div className="flex items-end">
        <button onClick={() => handleExportExcel('BaoCaoDoanhThu')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"><Download className="w-4 h-4" /> Xuất Excel</button>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex items-center justify-center gap-6">
        <Banknote className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
        <div className="flex flex-col items-center">
          <span className="text-xl text-slate-800 font-bold">{totalRevenue.toLocaleString('vi-VN')}</span>
          <span className="text-sm font-medium text-slate-400 mt-1">Tổng doanh thu</span>
        </div>
      </div>
      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex items-center justify-center gap-6">
        <ShoppingCart className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
        <div className="flex flex-col items-center">
          <span className="text-xl text-slate-800 font-bold">{totalTicketsSold.toLocaleString('vi-VN')}</span>
          <span className="text-sm font-medium text-slate-400 mt-1">Tổng vé bán</span>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex-1" style={{ minHeight: '360px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">Biểu đồ doanh số</h3>
            <select value={chartView} onChange={(e) => setChartView(e.target.value)} className="bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 shadow-sm">
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
              <option value="quarter">Theo quý</option>
            </select>
          </div>
          <div className="w-full h-[calc(100%-60px)] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
            <div style={{ minWidth: '600px', width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                <Bar dataKey="DoanhThu" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm" style={{ height: '320px' }}>
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Top Vé Theo Doanh Thu</h3>
          <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ticketStatsArray.filter(t => t.label !== 'Dịch vụ / Sản phẩm')} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} width={100} tick={{fontSize: 11, fill: '#64748b'}} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']} />
                <Bar dataKey="revenue" fill="#3b82f6" barSize={25} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex-1" style={{ minHeight: '320px' }}>
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Phân Bổ Số Lượng Vé</h3>
          <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ticketStatsArray.filter(t => t.qty > 0 && t.label !== 'Dịch vụ / Sản phẩm')} dataKey="qty" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({percent}) => `${(percent * 100).toFixed(0)}%`}>
                  {ticketStatsArray.filter(t => t.qty > 0 && t.label !== 'Dịch vụ / Sản phẩm').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} vé`, 'Số lượng']} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-6">
      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Thống kê chi tiết Vé & Sản phẩm</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Loại vé</th>
                <th className="p-3 text-center">Số lượng vé (SL)</th>
                <th className="p-3 text-right">Trước discount</th>
                <th className="p-3 text-right">Giảm giá</th>
                <th className="p-3 text-right">Sau discount (Doanh thu)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ticketStatsArray.map((stat, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{stat.label}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{stat.qty.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right text-slate-500">{stat.amountBeforeVatAndDiscount.toLocaleString('vi-VN')} đ</td>
                  <td className="p-3 text-right text-amber-600">{stat.discount.toLocaleString('vi-VN')} đ</td>
                  <td className="p-3 text-right font-bold text-emerald-700">{stat.revenue.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
              <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                <td className="p-3 text-emerald-900">Tổng cộng</td>
                <td className="p-3 text-center text-emerald-900">{ticketStatsArray.reduce((sum, s) => sum + s.qty, 0).toLocaleString('vi-VN')}</td>
                <td className="p-3 text-right text-emerald-900">{ticketStatsArray.reduce((sum, s) => sum + s.amountBeforeVatAndDiscount, 0).toLocaleString('vi-VN')} đ</td>
                <td className="p-3 text-right text-amber-700">{ticketStatsArray.reduce((sum, s) => sum + s.discount, 0).toLocaleString('vi-VN')} đ</td>
                <td className="p-3 text-right text-emerald-700">{ticketStatsArray.reduce((sum, s) => sum + s.revenue, 0).toLocaleString('vi-VN')} đ</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
