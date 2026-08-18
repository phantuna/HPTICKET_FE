import { useState, useEffect } from 'react';
import { ticketingService } from '../../../api/ticketingService';
import { AudienceType, TicketTemplate, TicketZone, ControlZone } from '../../../shared/types/hpticket';

export const useTicketing = (currentTab?: string) => {
  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<TicketTemplate[]>([]);
  const [ticketZones, setTicketZones] = useState<TicketZone[]>([]);
  const [controlZones, setControlZones] = useState<ControlZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAll = async () => {
    setLoading(true);
    const promises = [];

    if (!currentTab || currentTab === 'KhaiBaoDoiTuong' || currentTab === 'KhaibaoVe') {
      promises.push(
        ticketingService.fetchAudienceTypes()
          .then(res => { if (res.data) setAudienceTypes(res.data); })
          .catch(() => {})
      );
    }

    if (!currentTab || currentTab === 'KhaibaoVe' || currentTab === 'KhaiBaoVe_KS') {
      promises.push(
        ticketingService.fetchTicketTemplates()
          .then(res => { if (res.data) setTicketTemplates(res.data); })
          .catch(() => {})
      );
      promises.push(
        ticketingService.fetchTicketZones()
          .then(res => { if (res.data) setTicketZones(res.data); })
          .catch(() => {})
      );
    }

    if (!currentTab || currentTab === 'KhaiBaoKhuKiemSoat' || currentTab === 'KhaiBaoVe_KS') {
      promises.push(
        ticketingService.fetchControlZones()
          .then(res => { if (res.data) setControlZones(res.data); })
          .catch(() => {})
      );
    }

    await Promise.all(promises);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [currentTab]);

  return {
    audienceTypes, setAudienceTypes,
    ticketTemplates, setTicketTemplates,
    ticketZones, setTicketZones,
    controlZones, setControlZones,
    loading,
    refreshData: fetchAll
  };
};
