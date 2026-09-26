import React, { useMemo } from 'react';
import { PaymentMethod } from '../../../../shared/types/hpticket';
import { TicketFilterSection } from './TicketFilterSection';
import { TicketDetailTable } from './TicketDetailTable';

export interface TicketReportTabProps {
  fromDate: string; setFromDate: (v: string) => void;
  toDate: string; setToDate: (v: string) => void;
  posFilter: string; setPosFilter: (v: string) => void;
  sellerFilter: string; setSellerFilter: (v: string) => void;
  customerGroupFilter: string; setCustomerGroupFilter: (v: string) => void;
  customerSourceFilter: string; setCustomerSourceFilter: (v: string) => void;
  setSearchTrigger: React.Dispatch<React.SetStateAction<number>>;
  handleSearch?: () => void;
  handleExportExcel: (tab: string, params?: any) => void;
  salesCounters: any[];
  users: any[];
  customerGroups: any[];
  customerSources: any[];
  totalRevenue: number;
  totalCash: number;
  totalBankTransfer: number;
  ticketTotalRevenue?: number;
  ticketTotalCash?: number;
  ticketTotalBankTransfer?: number;
  issuedTickets: any[];
  rawOrders?: any[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  totalElements?: number;
  totalPages?: number;
  onFilterFocus?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const TicketReportTab: React.FC<TicketReportTabProps> = ({
  fromDate, setFromDate, toDate, setToDate, posFilter, setPosFilter,
  sellerFilter, setSellerFilter, customerGroupFilter, setCustomerGroupFilter,
  customerSourceFilter, setCustomerSourceFilter, setSearchTrigger, handleSearch,
  handleExportExcel, salesCounters, users, customerGroups, customerSources,
  ticketTotalRevenue, ticketTotalCash, ticketTotalBankTransfer, issuedTickets,
  rawOrders = [], page, setPage, pageSize, totalElements, totalPages, onFilterFocus
}) => {
  const ticketTotals = useMemo(() => {
    let rev = 0;
    let cash = 0;
    let bank = 0;

    issuedTickets.forEach((t: any) => {
      const isCash = t.payment_method === 'TIEN_MAT' || t.payment_method === 'CASH' || t.payment_method === PaymentMethod.CASH;
      const unitPrice = t.unit_price ?? 0;
      const itemDiscount = t.discount_amount ?? 0;
      const itemRevenue = t.revenue ?? (unitPrice - itemDiscount);
      
      rev += itemRevenue;
      if (isCash) cash += itemRevenue;
      else bank += itemRevenue;
    });

    return { rev, cash, bank };
  }, [issuedTickets]);

  const displayRevenue = ticketTotalRevenue ?? ticketTotals.rev;
  const displayCash = ticketTotalCash ?? ticketTotals.cash;
  const displayBankTransfer = ticketTotalBankTransfer ?? ticketTotals.bank;

  const actualTotal = totalElements ?? issuedTickets.length;
  const actualTotalPages = totalPages ?? Math.max(1, Math.ceil(actualTotal / pageSize));

  return (
    <div className="space-y-6">
      <TicketFilterSection
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        posFilter={posFilter}
        setPosFilter={setPosFilter}
        sellerFilter={sellerFilter}
        setSellerFilter={setSellerFilter}
        customerGroupFilter={customerGroupFilter}
        setCustomerGroupFilter={setCustomerGroupFilter}
        customerSourceFilter={customerSourceFilter}
        setCustomerSourceFilter={setCustomerSourceFilter}
        salesCounters={salesCounters}
        users={users}
        customerGroups={customerGroups}
        customerSources={customerSources}
        displayRevenue={displayRevenue}
        displayCash={displayCash}
        displayBankTransfer={displayBankTransfer}
        onSearch={handleSearch ? handleSearch : () => { setPage(1); setSearchTrigger(prev => prev + 1); }}
        onExportExcel={() => handleExportExcel('BaoCaoVeChiTiet', {
          issuedTickets,
          rawOrders,
          fromDate,
          toDate,
        })}
        onFilterFocus={onFilterFocus}
      />

      <TicketDetailTable
        issuedTickets={issuedTickets}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        actualTotal={actualTotal}
        actualTotalPages={actualTotalPages}
      />
    </div>
  );
};
