import { useMemo } from 'react';
import { dbStore } from '../../../shared/data/mockDatabase';
import { filterOrders, filterIssuedTickets } from './calculations/orderFiltering';
import { calculateRevenueStats, calculateTicketTotals } from './calculations/revenueCalculations';
import { calculateTicketTemplateStats } from './calculations/ticketTemplateCalculations';
import { calculateProductStats } from './calculations/productCalculations';
import { filterGateLogs, filterSystemLogs } from './calculations/logFiltering';

export interface CalcParams {
  isDataLoaded: boolean;
  activeSubTab: string;
  chartView: string;
  fromDate: string;
  toDate: string;
  posFilter: string;
  sellerFilter: string;
  customerGroupFilter: string;
  customerSourceFilter: string;
  selectedMonth: string;
  ticketTypeFilter: string;
  nameSearch: string;
  salesCounters: any[];
  customerGroups: any[];
  customerSources: any[];
  ticketTemplates: any[];
  liveOrders: any[];
  liveTickets: any[];
  liveGateLogs: any[];
  liveSystemLogs: any[];
  liveProducts: any[];
  summaryStats: any;
  ticketRevenueStats: any[];
  productRevenueStats: any[];
  sellerRevenueStats?: any[];
}

export const useReportCalculations = (params: CalcParams) => {
  const { rawOrders, rawIssuedTickets, rawGateLogs, rawSystemLogs, productList } = useMemo(() => {
    return {
      rawOrders: params.isDataLoaded ? params.liveOrders : dbStore.orders,
      rawIssuedTickets: params.isDataLoaded ? params.liveTickets : dbStore.issuedTickets,
      rawGateLogs: params.isDataLoaded ? params.liveGateLogs : dbStore.gateAccessLogs,
      rawSystemLogs: params.isDataLoaded ? params.liveSystemLogs : dbStore.systemLogs,
      productList: params.isDataLoaded && params.liveProducts.length > 0 ? params.liveProducts : dbStore.products,
    };
  }, [params.isDataLoaded, params.liveOrders, params.liveTickets, params.liveGateLogs, params.liveSystemLogs, params.liveProducts]);

  const orders = useMemo(() => {
    return filterOrders(rawOrders, {
      activeSubTab: params.activeSubTab,
      selectedMonth: params.selectedMonth,
      fromDate: params.fromDate,
      toDate: params.toDate,
      posFilter: params.posFilter,
      sellerFilter: params.sellerFilter,
      customerGroupFilter: params.customerGroupFilter,
      customerSourceFilter: params.customerSourceFilter,
      salesCounters: params.salesCounters,
      customerGroups: params.customerGroups,
      customerSources: params.customerSources,
    });
  }, [rawOrders, params.activeSubTab, params.selectedMonth, params.fromDate, params.toDate, params.posFilter, params.sellerFilter, params.customerGroupFilter, params.customerSourceFilter, params.salesCounters, params.customerGroups, params.customerSources]);

  const issuedTickets = useMemo(() => {
    return filterIssuedTickets(rawIssuedTickets, orders, params.activeSubTab);
  }, [params.activeSubTab, orders, rawIssuedTickets]);

  const revenueStats = useMemo(() => {
    return calculateRevenueStats(orders, {
      chartView: params.chartView,
      fromDate: params.fromDate,
      toDate: params.toDate,
      summaryStats: params.summaryStats,
      ticketRevenueStats: params.ticketRevenueStats,
      productRevenueStats: params.productRevenueStats,
      sellerRevenueStats: params.sellerRevenueStats,
      activeSubTab: params.activeSubTab,
    });
  }, [orders, params.chartView, params.fromDate, params.toDate, params.summaryStats, params.ticketRevenueStats, params.productRevenueStats, params.sellerRevenueStats, params.activeSubTab]);

  const ticketTotals = useMemo(() => {
    return calculateTicketTotals(orders);
  }, [orders]);

  const gateLogs = useMemo(() => {
    return filterGateLogs(rawGateLogs, params.fromDate, params.toDate, params.nameSearch);
  }, [rawGateLogs, params.fromDate, params.toDate, params.nameSearch]);

  const systemLogs = useMemo(() => {
    return filterSystemLogs(rawSystemLogs, params.fromDate, params.toDate);
  }, [rawSystemLogs, params.fromDate, params.toDate]);

  const ticketTemplateStats = useMemo(() => {
    return calculateTicketTemplateStats(orders, {
      ticketRevenueStats: params.ticketRevenueStats,
      ticketTemplates: params.ticketTemplates,
      ticketTypeFilter: params.ticketTypeFilter,
    });
  }, [params.ticketTemplates, params.ticketTypeFilter, orders, params.ticketRevenueStats]);

  const productStats = useMemo(() => {
    return calculateProductStats(orders, {
      productRevenueStats: params.productRevenueStats,
      productList,
    });
  }, [productList, orders, params.productRevenueStats]);

  return {
    rawOrders,
    orders,
    issuedTickets,
    gateLogs,
    rawGateLogs,
    systemLogs,
    totalRevenue: revenueStats.totalRevenue,
    totalTicketsSold: revenueStats.totalTicketsSold,
    chartData: revenueStats.chartData,
    ticketStatsArray: revenueStats.ticketStatsArray,
    totalCash: revenueStats.totalCash,
    totalBankTransfer: revenueStats.totalBankTransfer,
    ticketTemplateStats,
    productStats,
    ticketTotalRevenue: ticketTotals.rev,
    ticketTotalCash: ticketTotals.cash,
    ticketTotalBankTransfer: ticketTotals.bank
  };
};
