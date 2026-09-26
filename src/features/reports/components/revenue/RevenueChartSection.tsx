import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface RevenueChartSectionProps {
  chartView: string;
  onChartViewChange: (view: string) => void;
  chartData: any[];
  ticketStatsArray: any[];
}

export const RevenueChartSection: React.FC<RevenueChartSectionProps> = ({
  chartView,
  onChartViewChange,
  chartData,
  ticketStatsArray
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Biểu đồ doanh số chính */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex-1" style={{ minHeight: '360px' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">Biểu đồ doanh số</h3>
            <select
              value={chartView}
              onChange={(e) => onChartViewChange(e.target.value)}
              className="bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-md px-3 py-1.5 outline-none focus:border-emerald-500 shadow-sm"
            >
              <option value="day">Theo ngày (trong tháng)</option>
              <option value="week">Theo tuần (trong tháng)</option>
              <option value="quarter">Theo quý (trong năm)</option>
              <option value="month">Theo tháng (trong năm)</option>
            </select>
          </div>
          <div className="w-full h-[calc(100%-60px)] overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-slate-200">
            <div style={{ minWidth: chartData.length > 15 ? `${Math.max(600, chartData.length * 36)}px` : '100%', width: '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    dx={-10}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && (payload[0].payload as any)?.fullLabel) {
                        return (payload[0].payload as any).fullLabel;
                      }
                      return label;
                    }}
                    formatter={(value: number) => [`${value.toLocaleString('vi-VN')} đ`, 'Doanh thu']}
                  />
                  <Bar dataKey="DoanhThu" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phụ: Top vé theo doanh thu & Phân bổ số lượng vé */}
      <div className="flex flex-col gap-6">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm" style={{ height: '320px' }}>
          <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase">Top Vé Theo Doanh Thu</h3>
          <div style={{ width: '100%', height: 'calc(100% - 30px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ticketStatsArray.filter(t => t.itemType !== 'PRODUCT' && t.label !== 'Dịch vụ / Sản phẩm')}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
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
                <Pie
                  data={ticketStatsArray.filter(t => t.qty > 0 && t.itemType !== 'PRODUCT' && t.label !== 'Dịch vụ / Sản phẩm')}
                  dataKey="qty"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {ticketStatsArray.filter(t => t.qty > 0 && t.itemType !== 'PRODUCT' && t.label !== 'Dịch vụ / Sản phẩm').map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toLocaleString('vi-VN')} vé`, 'Số lượng']} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
