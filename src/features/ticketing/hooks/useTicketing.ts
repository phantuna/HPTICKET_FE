import { useState, useEffect } from 'react';
import { ticketingService } from '../../../api/ticketingService';
import { AudienceType, TicketTemplate, TicketZone, ControlZone } from '../../../shared/types/hpticket';

export const useTicketing = () => {
  const [audienceTypes, setAudienceTypes] = useState<AudienceType[]>([]);
  const [ticketTemplates, setTicketTemplates] = useState<TicketTemplate[]>([]);
  const [ticketZones, setTicketZones] = useState<TicketZone[]>([]);
  const [controlZones, setControlZones] = useState<ControlZone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const audRes = await ticketingService.fetchAudienceTypes();
      if (audRes.data) setAudienceTypes(audRes.data);
    } catch (err) {}

    try {
      const tplRes = await ticketingService.fetchTicketTemplates();
      if (tplRes.data) setTicketTemplates(tplRes.data);
    } catch (err) {}

    try {
      const tzRes = await ticketingService.fetchTicketZones();
      if (tzRes.data) setTicketZones(tzRes.data);
    } catch (err) {}

    try {
      const czRes = await ticketingService.fetchControlZones();
      if (czRes.data) setControlZones(czRes.data);
    } catch (err) {}
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    audienceTypes, setAudienceTypes,
    ticketTemplates, setTicketTemplates,
    ticketZones, setTicketZones,
    controlZones, setControlZones,
    loading,
    refreshData: fetchAll
  };
};
