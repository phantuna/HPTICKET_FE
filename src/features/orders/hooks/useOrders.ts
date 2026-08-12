import { useState, useEffect } from 'react';
import { salesService } from '../../../api/salesService';
import { marketingService } from '../../../api/marketingService';
import { Order, IssuedTicket } from '../../../shared/types/hpticket';

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
      const [ordJson, tktJson] = await Promise.all([
        salesService.fetchOrdersPaginated(page, size, fromDate, toDate),
        salesService.fetchIssuedTicketsPaginated(0, 200)
      ]);

      const pageData = ordJson?.data;
      if (pageData?.content && Array.isArray(pageData.content)) {
        setOrders(pageData.content.map((o: any) => ({ ...o, id: o.order_id || o.id })));
        setTotalElements(pageData.totalElements || 0);
        setTotalPages(pageData.totalPages || 0);
      } else if (Array.isArray(pageData)) {
        setOrders(pageData.map((o: any) => ({ ...o, id: o.order_id || o.id })));
      }
      
      const tktData = tktJson?.data;
      const tktList = tktData?.content || (Array.isArray(tktData) ? tktData : []);
      if (tktList.length > 0) setIssuedTickets(tktList);
    } catch (err) {
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
    fetchData(0, pageSize);
    salesService.fetchSalesCounters().then(res => {
      if (res.data) setTicketCounters(res.data);
    });
    marketingService.fetchCustomerSources().then(res => {
      if (res.data) setCustomerSources(res.data);
    });
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
    fetchData, fetchOrderDetail, goToPage, changePageSize
  };
};
