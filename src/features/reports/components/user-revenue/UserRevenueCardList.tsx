import React from 'react';
import { UserCheck } from 'lucide-react';

interface UserRevenueCardListProps {
  filteredUsers: any[];
  orders: any[];
  sellerRevenueStats?: any[];
}

export const UserRevenueCardList: React.FC<UserRevenueCardListProps> = ({
  filteredUsers,
  orders,
  sellerRevenueStats
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" /> Báo Cáo Doanh Thu Nhân Viên Theo Tháng
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredUsers.map((usr) => {
          let userTotal = 0;
          let userOrderCount = 0;

          if (sellerRevenueStats && sellerRevenueStats.length > 0) {
            const stat = sellerRevenueStats.find((s: any) => s.username === usr.username);
            if (stat) {
              userTotal = Number(stat.totalRevenue || 0);
              userOrderCount = Number(stat.orderCount || 0);
            }
          } else {
            const userOrders = orders.filter((o) => o.created_by === usr.username);
            userTotal = userOrders.reduce((acc, o) => acc + (o.final_amount || 0), 0);
            userOrderCount = userOrders.length;
          }

          return (
            <div key={usr.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{usr.fullname}</h4>
                  <p className="text-xs text-blue-600 font-mono">@{usr.username} • SĐT: {usr.phone}</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold font-mono">
                  {userTotal.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="text-xs text-slate-600 flex justify-between pt-2 border-t border-slate-200">
                <span>Số đơn hàng thực hiện: <strong className="text-slate-900">{userOrderCount} Đơn</strong></span>
                <span>Thẻ QR Nhân viên: <strong className="text-slate-900 font-mono">{usr.qr_code}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
