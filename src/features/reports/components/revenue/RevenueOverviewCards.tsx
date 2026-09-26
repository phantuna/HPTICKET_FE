import React from 'react';
import { Banknote, ShoppingCart } from 'lucide-react';
import { ReportStatCard } from '../shared/ReportStatCard';

interface RevenueOverviewCardsProps {
  totalRevenue: number;
  totalTicketsSold: number;
  ticketTotalCash: number;
  ticketTotalBankTransfer: number;
  ticketStatsArray: any[];
}

export const RevenueOverviewCards: React.FC<RevenueOverviewCardsProps> = ({
  totalRevenue,
  totalTicketsSold,
  ticketTotalCash,
  ticketTotalBankTransfer,
  ticketStatsArray
}) => {
  const serviceRevenue = ticketStatsArray
    .filter(t => t.itemType === 'PRODUCT' || t.label === 'Dịch vụ / Sản phẩm')
    .reduce((sum, t) => sum + (t.revenue || 0), 0);

  const freeTicketsCount = ticketStatsArray
    .filter(t => t.itemType !== 'PRODUCT' && t.label !== 'Dịch vụ / Sản phẩm' && (t.amountBeforeVatAndDiscount === 0 || t.unitPrice === 0))
    .reduce((sum, t) => sum + (t.qty || 0), 0);

  return (
    <div className="space-y-6">
      {/* 2 Thẻ lớn tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex items-center justify-center gap-6">
          <Banknote className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          <div className="flex flex-col items-center">
            <span className="text-xl text-slate-800 font-bold font-mono">{totalRevenue.toLocaleString('vi-VN')} đ</span>
            <span className="text-sm font-medium text-slate-400 mt-1">Tổng doanh thu</span>
          </div>
        </div>
        <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm flex items-center justify-center gap-6">
          <ShoppingCart className="w-10 h-10 text-purple-400" strokeWidth={1.5} />
          <div className="flex flex-col items-center">
            <span className="text-xl text-slate-800 font-bold font-mono">{totalTicketsSold.toLocaleString('vi-VN')}</span>
            <span className="text-sm font-medium text-slate-400 mt-1">Tổng vé bán</span>
          </div>
        </div>
      </div>

      {/* 4 Thẻ tóm tắt phân bổ doanh thu */}
      <div className="bg-white border border-slate-100 rounded-md p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-4">Tóm tắt phân bổ doanh thu</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <ReportStatCard
            label="Tiền mặt"
            value={`${ticketTotalCash.toLocaleString('vi-VN')} đ`}
            theme="blue"
          />
          <ReportStatCard
            label="Chuyển khoản"
            value={`${ticketTotalBankTransfer.toLocaleString('vi-VN')} đ`}
            theme="emerald"
          />
          <ReportStatCard
            label="Dịch vụ / FB"
            value={`${serviceRevenue.toLocaleString('vi-VN')} đ`}
            theme="amber"
          />
          <ReportStatCard
            label="Vé miễn phí"
            value={`${freeTicketsCount.toLocaleString('vi-VN')} vé`}
            theme="rose"
          />
        </div>
      </div>
    </div>
  );
};
