import React from 'react';
import { UserRevenueFilter } from './UserRevenueFilter';
import { UserRevenueCardList } from './UserRevenueCardList';

export interface UserRevenueReportTabProps {
  sellerFilter: string; setSellerFilter: (v: string) => void;
  selectedMonth: string; setSelectedMonth: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleExportExcel: (tab: string) => void;
  users: any[];
  orders: any[];
  totalRevenue: number;
  sellerRevenueStats?: any[];
  onFilterFocus?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const UserRevenueReportTab: React.FC<UserRevenueReportTabProps> = ({
  sellerFilter, setSellerFilter, selectedMonth, setSelectedMonth,
  setSearchTrigger, handleExportExcel, users, orders, totalRevenue,
  sellerRevenueStats, onFilterFocus
}) => {
  const filteredUsers = sellerFilter === 'all' ? users : users.filter(u => u.username === sellerFilter);

  const displayTotalRevenue = React.useMemo(() => {
    if (sellerRevenueStats && sellerRevenueStats.length > 0) {
      if (sellerFilter === 'all') {
        return sellerRevenueStats.reduce((sum: number, s: any) => sum + Number(s.totalRevenue || 0), 0);
      }
      const found = sellerRevenueStats.find((s: any) => s.username === sellerFilter);
      return found ? Number(found.totalRevenue || 0) : 0;
    }
    return totalRevenue;
  }, [sellerRevenueStats, sellerFilter, totalRevenue]);

  return (
    <div className="space-y-6">
      <UserRevenueFilter
        sellerFilter={sellerFilter}
        setSellerFilter={setSellerFilter}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        users={users}
        displayTotalRevenue={displayTotalRevenue}
        onSearch={() => setSearchTrigger(prev => prev + 1)}
        onExportExcel={() => handleExportExcel('BaoCaoDoanhThu_User_Thang')}
        onFilterFocus={onFilterFocus}
      />

      <UserRevenueCardList
        filteredUsers={filteredUsers}
        orders={orders}
        sellerRevenueStats={sellerRevenueStats}
      />
    </div>
  );
};
