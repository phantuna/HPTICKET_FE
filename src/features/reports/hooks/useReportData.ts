import { useState, useEffect, useRef } from 'react';
import { salesService } from '../../../api/salesService';
import { iamService } from '../../../api/iamService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { Order, IssuedTicket, SystemLog, Product } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';

interface DataFetchParams {
  activeSubTab: string;
  searchTrigger: number;
  fromDate: string;
  toDate: string;
}

export const useReportData = ({ activeSubTab, searchTrigger, fromDate, toDate }: DataFetchParams) => {
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [liveTickets, setLiveTickets] = useState<IssuedTicket[]>([]);
  const [liveSystemLogs, setLiveSystemLogs] = useState<SystemLog[]>([]);
  const [liveGateLogs, setLiveGateLogs] = useState<any[]>([]);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [ticketRevenueStats, setTicketRevenueStats] = useState<any[]>([]);
  const [productRevenueStats, setProductRevenueStats] = useState<any[]>([]);

  const [users, setUsers] = useState<any[]>([]);
  const [salesCounters, setSalesCounters] = useState<any[]>([]);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [customerSources, setCustomerSources] = useState<any[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
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
        const isAdmin = user?.role_id?.toLowerCase().includes('admin') || user?.roles?.some((r: any) => r.code === 'ADMIN');
        
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

  const lastFetched = useRef({ tab: '', trigger: -1 });

  useEffect(() => {
    if (lastFetched.current.tab === activeSubTab && lastFetched.current.trigger === searchTrigger) {
      return;
    }
    lastFetched.current = { tab: activeSubTab, trigger: searchTrigger };

    const loadData = async () => {
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
        let summaryIdx = -1, ticketRevIdx = -1, productRevIdx = -1;

        if (['BaoCaoVeChiTiet', 'BaoCaoDoanhThu_User_Thang', 'BaoCaoDoanhThu_LoaiVe'].includes(activeSubTab)) {
          loadDropdowns();
        }

        const requiresOrders = ['BaoCaoDoanhThu', 'BaoCaoVeChiTiet', 'BaoCaoDoanhThu_User_Thang', 'BaoCaoDoanhThu_LoaiVe', 'BaoCaoDoanhThu_SanPham'].includes(activeSubTab);
        if (requiresOrders) {
          orderIdx = fetchPromises.length;
          fetchPromises.push(salesService.fetchOrders().catch(() => ({ data: [] })));
        }

        if (activeSubTab === 'BaoCaoDoanhThu') {
          summaryIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_SUMMARY, { fromDate, toDate }).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoDoanhThu' || activeSubTab === 'BaoCaoDoanhThu_LoaiVe') {
          ticketRevIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_TICKET, { fromDate, toDate }).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoDoanhThu' || activeSubTab === 'BaoCaoDoanhThu_SanPham') {
          productRevIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.REPORTS_PRODUCT, { fromDate, toDate }).catch(() => null));
        }

        if (activeSubTab === 'BaoCaoVeChiTiet') {
          ticketIdx = fetchPromises.length;
          fetchPromises.push(salesService.fetchIssuedTickets().catch(() => ({ data: [] })));
        }

        if (activeSubTab === 'BaoCaoDoanhThu_SanPham') {
          productsIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.SALES.PRODUCTS).catch(() => ({ data: [] })));
        }

        if (activeSubTab === 'BaoCaoHeThong') {
          logsIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.IAM.SYSTEM_LOGS, { size: 50, fromDate, toDate }).catch(() => ({ data: [] })));
        }

        if (activeSubTab === 'BaoCaoRaVao') {
          gateLogsIdx = fetchPromises.length;
          fetchPromises.push(apiClient.get(API_ENDPOINTS.TICKETING.ACCESS_LOGS, { fromDate, toDate, size: 2000 }).catch(() => ({ data: [] })));
        }

        const results = await Promise.allSettled(fetchPromises);
        if (orderIdx !== -1 && results[orderIdx].status === 'fulfilled') setLiveOrders(extractList((results[orderIdx] as any).value));
        if (ticketIdx !== -1 && results[ticketIdx].status === 'fulfilled') setLiveTickets(extractList((results[ticketIdx] as any).value));
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

        setIsDataLoaded(true);
      } catch (err) {
        console.error('Failed to fetch data for dashboard:', err);
      }
    };
    loadData();
  }, [searchTrigger, activeSubTab, fromDate, toDate]);

  return {
    isDataLoaded,
    liveOrders, liveTickets, liveSystemLogs, liveGateLogs, liveProducts,
    summaryStats, ticketRevenueStats, productRevenueStats,
    users, salesCounters, customerGroups, customerSources, ticketTemplates,
    loadDropdowns
  };
};
