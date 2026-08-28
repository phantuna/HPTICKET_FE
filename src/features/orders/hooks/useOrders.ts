import { useState, useEffect } from 'react';
import { salesService } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { Order, IssuedTicket } from '../../../shared/types/hpticket';
import { apiClient } from '../../../api/apiConfig';
import { API_ENDPOINTS } from '../../../api/apiConfig';
import { toast } from '../../../shared/utils/toast';

export const useOrders = () => {
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'tickets'>('orders');

  // Advanced Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState(todayDateStr);
  const [toDate, setToDate] = useState(todayDateStr);
  const [filterCounterId, setFilterCounterId] = useState('');
  const [filterSourceId, setFilterSourceId] = useState('');
  const [filterOrderCode, setFilterOrderCode] = useState('');
  const [filterBookingCode, setFilterBookingCode] = useState('');

  const [ticketCounters, setTicketCounters] = useState<any[]>([]);
  const [customerSources, setCustomerSources] = useState<any[]>([]);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<IssuedTicket | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [issuedTickets, setIssuedTickets] = useState<any[]>([]);

  const [isDropdownLoaded, setIsDropdownLoaded] = useState(false);

  const loadDropdowns = () => {
    if (isDropdownLoaded) return;
    apiClient.get(API_ENDPOINTS.SYSTEM.MASTER_DATA).then((res: any) => {
      const mData = res?.data;
      if (mData) {
        setTicketCounters(Array.isArray(mData.counters) ? mData.counters : []);
        setCustomerSources(Array.isArray(mData.customerSources) ? mData.customerSources : []);
        setIsDropdownLoaded(true);
      }
    }).catch(() => { });
  };
  const [orderDetail, setOrderDetail] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async (page = currentPage, size = pageSize) => {
    setIsLoading(true);
    try {
      // Chỉ gọi 1 API lấy danh sách orders có phân trang
      // KHÔNG gọi issued-tickets toàn bộ ở đây (chỉ tải khi mở chi tiết đơn)
      const ordJson = await salesService.fetchOrdersPaginated(page, size, fromDate, toDate);

      const pageData = ordJson?.data;
      if (pageData?.content && Array.isArray(pageData.content)) {
        setOrders(pageData.content.map((o: any) => ({ ...o, id: o.order_id || o.id })));
        setTotalElements(pageData.totalElements || 0);
        setTotalPages(pageData.totalPages || 0);
      } else if (Array.isArray(pageData)) {
        setOrders(pageData.map((o: any) => ({ ...o, id: o.order_id || o.id })));
      }
    } catch (err: any) {
      toast.error(err.message || 'Thao tác thất bại');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderDetail = async (ord: any) => {
    setSelectedOrder(ord);
    setOrderDetail(null);
    const id = ord.order_id || ord.id;
    try {
      const res = await salesService.fetchOrderDetail(id);
      if (res) setOrderDetail(res.data || res);
      const tktsRes = await salesService.fetchIssuedTicketsByOrder(id);
      if (tktsRes) {
        const tktList = tktsRes?.data?.content || tktsRes?.data || tktsRes || [];
        if (Array.isArray(tktList)) setIssuedTickets(tktList);
      }
    } catch (_) { }
  };

  useEffect(() => {
    // Chỉ tải danh sách đơn hàng chính
    fetchData(0, pageSize);
  }, []);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    fetchData(page, pageSize);
  };

  const changePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
    fetchData(0, size);
  };

  return {
    activeSubTab, setActiveSubTab,
    searchQuery, setSearchQuery,
    fromDate, setFromDate,
    toDate, setToDate,
    filterCounterId, setFilterCounterId,
    filterSourceId, setFilterSourceId,
    filterOrderCode, setFilterOrderCode,
    filterBookingCode, setFilterBookingCode,
    ticketCounters, customerSources,
    selectedOrder, setSelectedOrder,
    selectedTicket, setSelectedTicket,
    orders, setOrders,
    issuedTickets, setIssuedTickets,
    orderDetail, setOrderDetail,
    currentPage, pageSize, totalElements, totalPages, isLoading,
    fetchData, fetchOrderDetail, goToPage, changePageSize, loadDropdowns
  };
};
