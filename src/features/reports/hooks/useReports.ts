import { useReportFilters } from './useReportFilters';
import { useReportData } from './useReportData';
import { useReportCalculations } from './useReportCalculations';
import { useReportExport } from './useReportExport';

export const useReports = (initialTab: string) => {
  const filters = useReportFilters(initialTab);
  
  const data = useReportData({
    activeSubTab: filters.activeSubTab,
    searchTrigger: filters.searchTrigger,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    selectedMonth: filters.selectedMonth,
    page: filters.page,
    pageSize: filters.pageSize,
    posFilter: filters.posFilter,
    sellerFilter: filters.sellerFilter,
    customerGroupFilter: filters.customerGroupFilter,
    customerSourceFilter: filters.customerSourceFilter,
  });

  const calculations = useReportCalculations({
    isDataLoaded: data.isDataLoaded,
    activeSubTab: filters.activeSubTab,
    chartView: filters.chartView,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    posFilter: filters.posFilter,
    sellerFilter: filters.sellerFilter,
    customerGroupFilter: filters.customerGroupFilter,
    customerSourceFilter: filters.customerSourceFilter,
    selectedMonth: filters.selectedMonth,
    ticketTypeFilter: filters.ticketTypeFilter,
    nameSearch: filters.nameSearch,
    salesCounters: data.salesCounters,
    customerGroups: data.customerGroups,
    customerSources: data.customerSources,
    ticketTemplates: data.ticketTemplates,
    liveOrders: data.liveOrders,
    liveTickets: data.liveTickets,
    liveGateLogs: data.liveGateLogs,
    liveSystemLogs: data.liveSystemLogs,
    liveProducts: data.liveProducts,
    summaryStats: data.summaryStats,
    ticketRevenueStats: data.ticketRevenueStats,
    productRevenueStats: data.productRevenueStats,
    sellerRevenueStats: data.sellerRevenueStats
  });

  const { handleExportExcel } = useReportExport(filters.setExportNotice);

  return {
    // Filters and UI State
    ...filters,
    isLoading: data.isLoading,
    handleExportExcel,

    // Data Loaders and Master Data
    users: data.users,
    salesCounters: data.salesCounters,
    customerGroups: data.customerGroups,
    customerSources: data.customerSources,
    ticketTemplates: data.ticketTemplates,
    sellerRevenueStats: data.sellerRevenueStats,
    loadDropdowns: data.loadDropdowns,

    // Computed Lists
    orders: calculations.orders,
    rawOrders: calculations.rawOrders,
    issuedTickets: calculations.issuedTickets,
    ticketPageResponse: data.ticketPageResponse,

    // Computed Stats
    totalRevenue: calculations.totalRevenue,
    totalTicketsSold: calculations.totalTicketsSold,
    chartData: calculations.chartData,
    ticketStatsArray: calculations.ticketStatsArray,
    totalCash: calculations.totalCash,
    totalBankTransfer: calculations.totalBankTransfer,
    
    ticketTotalRevenue: calculations.ticketTotalRevenue,
    ticketTotalCash: calculations.ticketTotalCash,
    ticketTotalBankTransfer: calculations.ticketTotalBankTransfer,

    ticketTemplateStats: calculations.ticketTemplateStats,
    productStats: calculations.productStats
  };
};
