import { useState, useEffect, useRef } from 'react';
import { salesService } from '../../../api/salesService';
import { iamService } from '../../../api/iamService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { Order, IssuedTicket, SystemLog, Product } from '../../../shared/types/hpticket';

export interface IssuedTicketSummary {
  totalRevenue: number;
  totalCash: number;
  totalBankTransfer: number;
}

export interface TicketPageResponse {
  content: IssuedTicket[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  summary: IssuedTicketSummary;
}

interface DataFetchParams {
  activeSubTab: string;
  searchTrigger: number;
  fromDate: string;
  toDate: string;
  selectedMonth?: string;
  page?: number;
  pageSize?: number;
  posFilter?: string;
  sellerFilter?: string;
  customerGroupFilter?: string;
  customerSourceFilter?: string;
}

export const useReportData = ({
  activeSubTab,
  searchTrigger,
  fromDate,
  toDate,
  selectedMonth,
  page = 1,
  pageSize = 20,
  posFilter = 'all',
  sellerFilter = 'all',
  customerGroupFilter = 'all',
  customerSourceFilter = 'all'
}: DataFetchParams) => {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [liveTickets, setLiveTickets] = useState<IssuedTicket[]>([]);
  const [ticketPageResponse, setTicketPageResponse] = useState<TicketPageResponse>({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 1,
    summary: { totalRevenue: 0, totalCash: 0, totalBankTransfer: 0 }
  });
  const [liveSystemLogs, setLiveSystemLogs] = useState<SystemLog[]>([]);
  const [liveGateLogs, setLiveGateLogs] = useState<any[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [ticketRevenueStats, setTicketRevenueStats] = useState<any[]>([]);
  const [productRevenueStats, setProductRevenueStats] = useState<any[]>([]);
  const [sellerRevenueStats, setSellerRevenueStats] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [salesCounters, setSalesCounters] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [customerSources, setCustomerSources] = useState<any[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownLoaded, setIsDropdownLoaded] = useState(false);

  const loadDropdowns = () => {
    if (isDropdownLoaded) return;
    setIsDropdownLoaded(true);

    Promise.all([
      apiClient.get(API_ENDPOINTS.SYSTEM.MASTER_DATA),
      iamService.getCurrentUser()
    ]).then(([res, userRes]) => {
      const mData = (res as any)?.data;
      const user = userRes.data;

      if (mData) {
        setUsers(mData.users || []);
        setCustomerGroups(mData.customerGroups || []);
        setCustomerSources(mData.customerSources || []);
        setTicketTemplates((mData.templates || []).filter((t: any) => t.is_active || t.isActive || t.active || t.status !== 'INACTIVE'));

        let allCounters = mData.counters || [];
        const isAdmin = user?.role_id?.toLowerCase().includes('admin') || (user as any)?.roles?.some((r: any) => r.code === 'ADMIN');
        
        if (!isAdmin) {
          if (user?.assigned_counters && user.assigned_counters.length > 0) {
            const assignedIds = user.assigned_counters.map((c: any) => c.id);
            allCounters = allCounters.filter((c: any) => assignedIds.includes(c.id));
          } else {
            allCounters = [];
          }
        }
        setSalesCounters(allCounters);
      }
    }).catch(() => {
      setIsDropdownLoaded(false);
    });
  };

  const lastFetched = useRef({ tab: '', trigger: -1, page: -1 });

  useEffect(() => {
    let isCancelled = false;

    const isSameTab = lastFetched.current.tab === activeSubTab;
    const isSameTrigger = lastFetched.current.trigger === searchTrigger;
    const isSamePage = lastFetched.current.page === page;

    if (activeSubTab === 'BaoCaoVeChiTiet') {
      if (isSameTab && isSameTrigger && isSamePage) {
        return;
      }
    } else {
      if (isSameTab && isSameTrigger) {
        return;
      }
    }
    lastFetched.current = { tab: activeSubTab, trigger: searchTrigger, page };

    // Giải phóng bộ nhớ của các tab không còn active để tránh rò rỉ RAM
    if (activeSubTab !== 'BaoCaoVeChiTiet') {
      setLiveTickets([]);
    }
    if (activeSubTab !== 'BaoCaoDoanhThu_SanPham') {
      setLiveProducts([]);
    }

    const loadData = async () => {
      setIsLoading(true);
      try {
        const extractList = (json: any) => {
          if (Array.isArray(json)) return json;
          if (json?.data && Array.isArray(json.data)) return json.data;
          if (json?.data?.content && Array.isArray(json.data.content)) return json.data.content;
          if (json?.content && Array.isArray(json.content)) return json.content;
          return [];
        };

        const fetchPromises: Promise<any>[] = [];
        let orderIdx = -1, ticketIdx = -1, logsIdx = -1, gateLogsIdx = -1, productsIdx = -1;
        let summaryIdx = -1, ticketRevIdx = -1, productRevIdx = -1, sellerRevIdx = -1;

        if (['BaoCaoVeChiTiet', 'BaoCaoDoanhThu_User_Thang', 'BaoCaoDoanhThu_LoaiVe'].includes(activeSubTab)) {
          loadDropdowns();
        }

        const requiresOrders = ['BaoCaoDoanhThu', 'BaoCaoVeChiTiet', 'BaoCaoDoanhThu_User_Thang', 'BaoCaoDoanhThu_LoaiVe', 'BaoCaoDoanhThu_SanPham'].includes(activeSubTab);
        if (requiresOrders) {
          orderIdx = fetchPromises.length;
          let actualFromDate = fromDate;
          let actualToDate = toDate;
          
          if (activeSubTab === 'BaoCaoDoanhThu_User_Thang' && selectedMonth) {
            const y = new Date().getFullYear();
            const m = parseInt(selectedMonth, 10);
            actualFromDate = `${y}-${m.toString().padStart(2, '0')}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            actualToDate = `${y}-${m.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
          }
          
          fetchPromises.push(salesService.fetchOrders({ fromDate: actualFromDate, toDate: actualToDate }).catch(() => ({ data: [] })));
        }

        const isManualFilter = lastFetched.current.trigger !== -1 && lastFetched.current.trigger !== searchTrigger;
        const reqConfig = isManualFilter ? { bypassCache: true } : undefined;

        if (activeSubTab === 'BaoCaoDoanhThu') {
          summaryIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_SUMMARY, { fromDate, toDate }, reqConfig).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoDoanhThu' || activeSubTab === 'BaoCaoDoanhThu_LoaiVe') {
          ticketRevIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_TICKET, { fromDate, toDate }, reqConfig).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoDoanhThu' || activeSubTab === 'BaoCaoDoanhThu_SanPham') {
          productRevIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_PRODUCT, { fromDate, toDate }, reqConfig).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoDoanhThu_SanPham') {
          productsIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.PRODUCTS).catch(() => ({ data: [] })));
        }

        if (activeSubTab === 'BaoCaoDoanhThu_User_Thang') {
          sellerRevIdx = fetchPromises.length;
          const monthNum = selectedMonth ? parseInt(selectedMonth, 10) : new Date().getMonth() + 1;
          const yearNum = new Date().getFullYear();
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_SELLER, { month: monthNum, year: yearNum }, reqConfig).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoVeChiTiet') {
          ticketIdx = fetchPromises.length;
          const backendPage = Math.max(0, page - 1);
          fetchPromises.push(
            salesService.fetchIssuedTickets({
              page: backendPage,
              size: pageSize,
              fromDate,
              toDate,
              counter: posFilter,
              seller: sellerFilter,
              customerGroup: customerGroupFilter,
              customerSource: customerSourceFilter,
            }).catch(() => null)
          );
        }

        const results = await Promise.allSettled(fetchPromises);
        if (isCancelled) return;

        if (orderIdx !== -1 && results[orderIdx].status === 'fulfilled') setLiveOrders(extractList((results[orderIdx] as any).value));
        if (ticketIdx !== -1 && results[ticketIdx].status === 'fulfilled') {
          const resVal = (results[ticketIdx] as any).value;
          const rawData = resVal?.data || resVal;
          const content = extractList(resVal);

          setLiveTickets(content);
          setTicketPageResponse({
            content,
            page: rawData?.page ?? Math.max(0, page - 1),
            size: rawData?.size ?? pageSize,
            totalElements: rawData?.totalElements ?? content.length,
            totalPages: rawData?.totalPages ?? (Math.ceil((rawData?.totalElements ?? content.length) / pageSize) || 1),
            summary: rawData?.summary ?? {
              totalRevenue: content.reduce((sum: number, t: any) => sum + (t.revenue ?? ((t.unit_price ?? 0) - (t.discount_amount ?? 0))), 0),
              totalCash: content.filter((t: any) => t.payment_method === 'TIEN_MAT' || t.payment_method === 'CASH').reduce((sum: number, t: any) => sum + (t.revenue ?? ((t.unit_price ?? 0) - (t.discount_amount ?? 0))), 0),
              totalBankTransfer: content.filter((t: any) => t.payment_method !== 'TIEN_MAT' && t.payment_method !== 'CASH').reduce((sum: number, t: any) => sum + (t.revenue ?? ((t.unit_price ?? 0) - (t.discount_amount ?? 0))), 0),
            },
          });
        }
        if (productsIdx !== -1 && results[productsIdx].status === 'fulfilled') setLiveProducts(extractList((results[productsIdx] as any).value));
        if (logsIdx !== -1 && results[logsIdx].status === 'fulfilled') setLiveSystemLogs(extractList((results[logsIdx] as any).value));
        if (gateLogsIdx !== -1 && results[gateLogsIdx].status === 'fulfilled') setLiveGateLogs(extractList((results[gateLogsIdx] as any).value));

        if (summaryIdx !== -1 && results[summaryIdx].status === 'fulfilled') {
          const data = (results[summaryIdx] as any).value?.data;
          if (data) setSummaryStats(data);
        }
        if (ticketRevIdx !== -1 && results[ticketRevIdx].status === 'fulfilled') {
          const data = extractList((results[ticketRevIdx] as any).value);
          if (data) setTicketRevenueStats(data);
        }
        if (productRevIdx !== -1 && results[productRevIdx].status === 'fulfilled') {
          const data = extractList((results[productRevIdx] as any).value);
          if (data) setProductRevenueStats(data);
        }
        if (sellerRevIdx !== -1 && results[sellerRevIdx].status === 'fulfilled') {
          const data = extractList((results[sellerRevIdx] as any).value);
          if (data) setSellerRevenueStats(data);
        }

        setIsDataLoaded(true);
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to fetch data for dashboard:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };
    loadData();

    return () => {
      isCancelled = true;
    };
  }, [searchTrigger, activeSubTab, fromDate, toDate, selectedMonth, page, pageSize, posFilter, sellerFilter, customerGroupFilter, customerSourceFilter]);

  return {
    isDataLoaded,
    isLoading,
    liveOrders, liveTickets, ticketPageResponse, liveSystemLogs, liveGateLogs, liveProducts,
    summaryStats, ticketRevenueStats, productRevenueStats, sellerRevenueStats,
    users, salesCounters, customerGroups, customerSources, ticketTemplates,
    loadDropdowns
  };
};
