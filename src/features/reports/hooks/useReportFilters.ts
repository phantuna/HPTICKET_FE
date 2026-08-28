import { useState, useEffect } from 'react';
import { SystemLog } from '../../../shared/types/hpticket';

export const useReportFilters = (initialTab: string) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const [chartView, setChartView] = useState<'day' | 'week' | 'month' | 'quarter'>('day');

  const getTodayDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const currentDay = getTodayDateString(today);

  const [fromDate, setFromDate] = useState<string>(currentDay);
  const [toDate, setToDate] = useState<string>(currentDay);
  const [posFilter, setPosFilter] = useState<string>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [customerGroupFilter, setCustomerGroupFilter] = useState<string>('all');
  const [customerSourceFilter, setCustomerSourceFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('1');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<string>('all');
  const [nameSearch, setNameSearch] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const [searchTrigger, setSearchTrigger] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => { setPage(1); }, [activeSubTab, searchTrigger]);

  return {
    activeSubTab, setActiveSubTab,
    chartView, setChartView,
    fromDate, setFromDate,
    toDate, setToDate,
    posFilter, setPosFilter,
    sellerFilter, setSellerFilter,
    customerGroupFilter, setCustomerGroupFilter,
    customerSourceFilter, setCustomerSourceFilter,
    selectedMonth, setSelectedMonth,
    ticketTypeFilter, setTicketTypeFilter,
    nameSearch, setNameSearch,
    selectedLog, setSelectedLog,
    exportNotice, setExportNotice,
    searchTrigger, setSearchTrigger,
    page, setPage, pageSize
  };
};
