import { useState, useEffect } from 'react';
import { marketingService } from '../../../api/marketingService';
import { CustomerGroup, CustomerSource, Holiday, Promotion } from '../../../shared/types/hpticket';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';

export const useMarketing = () => {
  const [groups, setGroups] = useState<CustomerGroup[]>([]);
  const [sources, setSources] = useState<CustomerSource[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const gRes = await marketingService.fetchCustomerGroups();
      if (gRes.data) setGroups(gRes.data);

      const sRes = await marketingService.fetchCustomerSources();
      if (sRes.data) setSources(sRes.data);

      const hRes = await marketingService.fetchHolidays();
      if (hRes.data) setHolidays(hRes.data);

      const pRes = await marketingService.fetchPromotions();
      if (pRes.data) setPromotions(pRes.data);

      const tRes = await apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES);
      const list = Array.isArray(tRes) ? tRes : (tRes?.data?.content || tRes?.data || []);
      if (list.length > 0) setTicketTemplates(list.filter(isItemActive));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

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
