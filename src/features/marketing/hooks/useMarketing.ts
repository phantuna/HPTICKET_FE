import { useState, useEffect } from 'react';
import { marketingService } from '../../../api/marketingService';
import { CustomerGroup, CustomerSource, Holiday, Promotion } from '../../../shared/types/hpticket';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';

const globalMarketingCache: any = {
  groups: null,
  sources: null,
  holidays: null,
  promotions: null,
  templates: null
};

export const useMarketing = (currentTab?: string) => {
  const [groups, setGroups] = useState<CustomerGroup[]>(globalMarketingCache.groups || []);
  const [sources, setSources] = useState<CustomerSource[]>(globalMarketingCache.sources || []);
  const [holidays, setHolidays] = useState<Holiday[]>(globalMarketingCache.holidays || []);
  const [promotions, setPromotions] = useState<Promotion[]>(globalMarketingCache.promotions || []);
  const [ticketTemplates, setTicketTemplates] = useState<any[]>(globalMarketingCache.templates || []);
  const [loading, setLoading] = useState<boolean>(false);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      if (!currentTab || currentTab === 'khaibaoNhomNguonKhach') {
        if (!globalMarketingCache.groups) {
          const res = await marketingService.fetchCustomerGroups();
          if (res.data) { setGroups(res.data); globalMarketingCache.groups = res.data; }
        }
      }

      if (!currentTab || currentTab === 'KhaiBaoNguonKhach') {
        if (!globalMarketingCache.groups) {
          const res = await marketingService.fetchCustomerGroups();
          if (res.data) { setGroups(res.data); globalMarketingCache.groups = res.data; }
        }
        if (!globalMarketingCache.sources) {
          const res = await marketingService.fetchCustomerSources();
          if (res.data) { setSources(res.data); globalMarketingCache.sources = res.data; }
        }
      }

      if (!currentTab || currentTab === 'Hoiday') {
        if (!globalMarketingCache.holidays) {
          const res = await marketingService.fetchHolidays();
          if (res.data) { setHolidays(res.data); globalMarketingCache.holidays = res.data; }
        }
      }

      if (!currentTab || currentTab === 'KhaiBaoKhuyenMai') {
        if (!globalMarketingCache.promotions) {
          const res = await marketingService.fetchPromotions();
          if (res.data) { setPromotions(res.data); globalMarketingCache.promotions = res.data; }
        }
        if (!globalMarketingCache.templates) {
          const tRes = await apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES);
          const list = Array.isArray(tRes) ? tRes : (tRes?.data?.content || tRes?.data || []);
          if (list.length > 0) {
            const activeTemplates = list.filter(isItemActive);
            setTicketTemplates(activeTemplates);
            globalMarketingCache.templates = activeTemplates;
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [currentTab]);

  return {
    groups, setGroups,
    sources, setSources,
    holidays, setHolidays,
    promotions, setPromotions,
    ticketTemplates,
    loading,
    refreshData: fetchAll
  };
};
