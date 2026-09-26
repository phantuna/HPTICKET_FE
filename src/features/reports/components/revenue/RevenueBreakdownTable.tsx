import React from 'react';

interface RevenueBreakdownTableProps {
  ticketStatsArray: any[];
}

export const RevenueBreakdownTable: React.FC<RevenueBreakdownTableProps> = ({ ticketStatsArray }) => {
  return (
    <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Thống kê chi tiết Vé & Sản phẩm</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="p-3">Loại vé / Sản phẩm</th>
              <th className="p-3 text-center">Số lượng (SL)</th>
              <th className="p-3 text-right">Đơn giá</th>
              <th className="p-3 text-right">Doanh thu</th>
              <th className="p-3 text-right">Giảm giá</th>
              <th className="p-3 text-right">Thuế (VAT)</th>
              <th className="p-3 text-right">Thành tiền (Net)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ticketStatsArray.map((stat, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">{stat.label}</td>
                <td className="p-3 text-center font-bold text-slate-900 whitespace-nowrap">{stat.qty.toLocaleString('vi-VN')}</td>
                <td className="p-3 text-right text-slate-500 whitespace-nowrap">{stat.unitPrice != null ? `${Number(stat.unitPrice).toLocaleString('vi-VN')} đ` : '-'}</td>
                <td className="p-3 text-right text-slate-500 whitespace-nowrap">{stat.amountBeforeVatAndDiscount.toLocaleString('vi-VN')} đ</td>
                <td className="p-3 text-right text-amber-600 whitespace-nowrap">{stat.discount.toLocaleString('vi-VN')} đ</td>
                <td className="p-3 text-right text-slate-500 whitespace-nowrap">{stat.taxAmount ? Math.round(stat.taxAmount).toLocaleString('vi-VN') : '0'} đ</td>
                <td className="p-3 text-right font-bold text-emerald-700 whitespace-nowrap">{stat.revenue.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
            <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
              <td className="p-3 text-emerald-900">Tổng cộng</td>
              <td className="p-3 text-center text-emerald-900 whitespace-nowrap">{ticketStatsArray.reduce((sum, s) => sum + s.qty, 0).toLocaleString('vi-VN')}</td>
              <td className="p-3 text-right text-emerald-900 whitespace-nowrap">-</td>
              <td className="p-3 text-right text-emerald-900 whitespace-nowrap">{ticketStatsArray.reduce((sum, s) => sum + s.amountBeforeVatAndDiscount, 0).toLocaleString('vi-VN')} đ</td>
              <td className="p-3 text-right text-amber-700 whitespace-nowrap">{ticketStatsArray.reduce((sum, s) => sum + s.discount, 0).toLocaleString('vi-VN')} đ</td>
              <td className="p-3 text-right text-emerald-900 whitespace-nowrap">{Math.round(ticketStatsArray.reduce((sum, s) => sum + (s.taxAmount || 0), 0)).toLocaleString('vi-VN')} đ</td>
              <td className="p-3 text-right text-emerald-700 whitespace-nowrap">{ticketStatsArray.reduce((sum, s) => sum + s.revenue, 0).toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
