import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { useReports } from '../hooks/useReports';
import {
  RevenueReportTab,
  TicketReportTab,
  UserRevenueReportTab,
  TicketTypeRevenueReportTab,
  ProductRevenueReportTab,
  GateLogReportTab,
  SystemLogReportTab,
  LogSnapshotModal,
  ComparisonReportTab
} from '../components';

interface ReportsModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({ subTab = 'BaoCaoDoanhThu', onSelectSubTab }) => {
  const reportsData = useReports(subTab);

  const {
    activeSubTab, setActiveSubTab,
    chartView, setChartView,
    fromDate, setFromDate, toDate, setToDate,
    posFilter, setPosFilter, sellerFilter, setSellerFilter,
    customerGroupFilter, setCustomerGroupFilter, customerSourceFilter, setCustomerSourceFilter,
    selectedMonth, setSelectedMonth, ticketTypeFilter, setTicketTypeFilter,
    nameSearch, setNameSearch, selectedLog, setSelectedLog,
    exportNotice, page, setPage, pageSize, searchTrigger, setSearchTrigger, handleSearch, handleExportExcel,
    users, salesCounters, customerGroups, customerSources, ticketTemplates,
    orders, rawOrders, issuedTickets, ticketPageResponse,
    totalRevenue, totalTicketsSold, chartData, ticketStatsArray, totalCash, totalBankTransfer,
    ticketTotalRevenue, ticketTotalCash, ticketTotalBankTransfer,
    ticketTemplateStats, productStats, loadDropdowns, isLoading
  } = reportsData;

  const currentTab = onSelectSubTab ? subTab : activeSubTab;
  
  const handleRefresh = () => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  React.useEffect(() => {
    if (onSelectSubTab) {
      setActiveSubTab(subTab);
    }
  }, [subTab, onSelectSubTab, setActiveSubTab]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {exportNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exportNotice}</span>
        </div>
      )}

      {currentTab === 'BaoCaoDoanhThu' && (
        <RevenueReportTab 
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
          setSearchTrigger={setSearchTrigger}
          handleExportExcel={() => handleExportExcel('BaoCaoDoanhThu', {
            fromDate, toDate, ticketStatsArray, totalRevenue
          })}
          totalRevenue={totalRevenue} totalTicketsSold={totalTicketsSold}
          chartView={chartView} setChartView={setChartView} chartData={chartData} ticketStatsArray={ticketStatsArray}
          ticketTotalCash={totalCash} ticketTotalBankTransfer={totalBankTransfer}
        />
      )}


      {currentTab === 'BaoCaoSoSanh' && (
        <ComparisonReportTab
          handleExportExcel={handleExportExcel}
        />
      )}

      {currentTab === 'BaoCaoVeChiTiet' && (
        <TicketReportTab
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
          posFilter={posFilter} setPosFilter={setPosFilter} sellerFilter={sellerFilter} setSellerFilter={setSellerFilter}
          customerGroupFilter={customerGroupFilter} setCustomerGroupFilter={setCustomerGroupFilter} customerSourceFilter={customerSourceFilter} setCustomerSourceFilter={setCustomerSourceFilter}
          setSearchTrigger={setSearchTrigger}
          handleSearch={handleSearch}
          handleExportExcel={handleExportExcel}
          salesCounters={salesCounters} users={users} customerGroups={customerGroups} customerSources={customerSources}
          totalRevenue={totalRevenue} totalCash={totalCash} totalBankTransfer={totalBankTransfer} 
          ticketTotalRevenue={ticketPageResponse?.summary?.totalRevenue ?? ticketTotalRevenue}
          ticketTotalCash={ticketPageResponse?.summary?.totalCash ?? ticketTotalCash}
          ticketTotalBankTransfer={ticketPageResponse?.summary?.totalBankTransfer ?? ticketTotalBankTransfer}
          issuedTickets={ticketPageResponse?.content ?? issuedTickets}
          rawOrders={rawOrders}
          page={page} setPage={setPage} pageSize={pageSize}
          totalElements={ticketPageResponse?.totalElements}
          totalPages={ticketPageResponse?.totalPages}
          onFilterFocus={loadDropdowns}
        />
      )}

      {currentTab === 'BaoCaoDoanhThu_User_Thang' && (
        <UserRevenueReportTab
          sellerFilter={sellerFilter} setSellerFilter={setSellerFilter} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          setSearchTrigger={setSearchTrigger}
          handleExportExcel={() => handleExportExcel('BaoCaoDoanhThu_User_Thang', {
            selectedMonth, users, rawOrders: orders, sellerRevenueStats: reportsData.sellerRevenueStats
          })}
          users={users} orders={orders} totalRevenue={totalRevenue}
          sellerRevenueStats={reportsData.sellerRevenueStats}
          onFilterFocus={loadDropdowns}
        />
      )}

      {currentTab === 'BaoCaoDoanhThu_LoaiVe' && (
        <TicketTypeRevenueReportTab
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} ticketTypeFilter={ticketTypeFilter} setTicketTypeFilter={setTicketTypeFilter}
          setSearchTrigger={setSearchTrigger}
          handleExportExcel={() => handleExportExcel('BaoCaoDoanhThu_LoaiVe', {
            fromDate, toDate, ticketTemplateStats
          })}
          ticketTemplates={ticketTemplates} ticketTemplateStats={ticketTemplateStats}
          onFilterFocus={loadDropdowns}
        />
      )}

      {currentTab === 'BaoCaoDoanhThu_SanPham' && (
        <ProductRevenueReportTab
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
          setSearchTrigger={setSearchTrigger}
          handleExportExcel={() => handleExportExcel('BaoCaoDoanhThu_SanPham', {
            fromDate, toDate, productStats
          })}
          productStats={productStats}
        />
      )}

      {currentTab === 'BaoCaoRaVao' && (
        <GateLogReportTab
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} nameSearch={nameSearch} setNameSearch={setNameSearch}
          searchTrigger={searchTrigger} setSearchTrigger={setSearchTrigger} handleExportExcel={handleExportExcel} page={page} setPage={setPage} pageSize={pageSize}
        />
      )}

      {currentTab === 'BaoCaoHeThong' && (
        <SystemLogReportTab
          fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate}
          searchTrigger={searchTrigger} setSearchTrigger={setSearchTrigger} handleExportExcel={handleExportExcel}
          page={page} setPage={setPage} pageSize={pageSize} setSelectedLog={setSelectedLog}
        />
      )}

      {selectedLog && (
        <LogSnapshotModal selectedLog={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
};
