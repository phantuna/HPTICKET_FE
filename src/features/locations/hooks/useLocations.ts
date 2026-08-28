import { useState, useEffect } from 'react';
import { marketingService } from '../../../api/marketingService';
import { salesService } from '../../../api/salesService';
import { ticketingService } from '../../../api/ticketingService';
import { Company, SalesLocation, SalesCounter, ControlZone, ControlGate } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';

const globalLocationsCache: any = {
  company: null,
  locs: null,
  counters: null,
  zones: null,
  gates: null
};

export const useLocations = (initialTab: string) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(initialTab);

  useEffect(() => {
    setActiveSubTab(initialTab);
  }, [initialTab]);

  const [company, setCompany] = useState<Company | null>(globalLocationsCache.company);
  const [locations, setLocations] = useState<SalesLocation[]>(globalLocationsCache.locs || []);
  const [counters, setCounters] = useState<SalesCounter[]>(globalLocationsCache.counters || []);
  const [controlZones, setControlZones] = useState<ControlZone[]>(globalLocationsCache.zones || []);
  const [controlGates, setControlGates] = useState<ControlGate[]>(globalLocationsCache.gates || []);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  useEffect(() => {
    const loadData = async () => {
      if (activeSubTab === 'khaibaocongty') {
        if (!globalLocationsCache.company) {
          try {
            const compRes = await marketingService.fetchCompanies();
            if (compRes.data && compRes.data.length > 0) {
              setCompany(compRes.data[0]);
              globalLocationsCache.company = compRes.data[0];
            }
          } catch (err) {}
        }
      } else if (activeSubTab === 'KhaiBaoDiemBanVe' || activeSubTab === 'KhaiBaoQuayVe') {
        if (!globalLocationsCache.locs) {
          const locRes = await salesService.fetchSalesLocations();
          if (locRes.data && locRes.data.length > 0) { setLocations(locRes.data); globalLocationsCache.locs = locRes.data; }
          const cntRes = await salesService.fetchSalesCounters();
          if (cntRes.data && cntRes.data.length > 0) { setCounters(cntRes.data); globalLocationsCache.counters = cntRes.data; }
        }
      } else if (activeSubTab === 'KhaibaosKhuKiemSoat' || activeSubTab === 'KhaiBaoCuaKS') {
        if (!globalLocationsCache.zones) {
          const zoneRes = await ticketingService.fetchControlZones();
          if (zoneRes.data && zoneRes.data.length > 0) { setControlZones(zoneRes.data); globalLocationsCache.zones = zoneRes.data; }
          const gateRes = await ticketingService.fetchControlGates();
          if (gateRes.data && gateRes.data.length > 0) { setControlGates(gateRes.data); globalLocationsCache.gates = gateRes.data; }
        }
      }
    };
    loadData();
  }, [activeSubTab]);

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showGateModal, setShowGateModal] = useState(false);

  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);

  const [editCompName, setEditCompName] = useState('');
  const [editCompAddress, setEditCompAddress] = useState('');
  const [editCompPhone, setEditCompPhone] = useState('');
  const [editCompFax, setEditCompFax] = useState('');
  const [editCompCode, setEditCompCode] = useState('');
  const [editCompTaxCode, setEditCompTaxCode] = useState('');
  const [editCompContact, setEditCompContact] = useState('');
  const [editCompEmail, setEditCompEmail] = useState('');
  const [editCompLogo, setEditCompLogo] = useState('');
  const [editCompInvoiceLogo, setEditCompInvoiceLogo] = useState('');

  const [newLocName, setNewLocName] = useState('');
  const [newLocCode, setNewLocCode] = useState('');
  const [newLocAddress, setNewLocAddress] = useState('');

  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterCode, setNewCounterCode] = useState('');
  const [selectedLocId, setSelectedLocId] = useState('');
  const [newCounterTypes, setNewCounterTypes] = useState<string[]>([]);

  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCode, setNewZoneCode] = useState('');

  const [newGateName, setNewGateName] = useState('');
  const [newGateIp, setNewGateIp] = useState('192.168.1.100');
  const [newGatePort, setNewGatePort] = useState(8080);
  const [selectedZoneId, setSelectedZoneId] = useState('');

  useEffect(() => {
    if (locations.length > 0 && !selectedLocId) setSelectedLocId(locations[0].id);
  }, [locations, selectedLocId]);

  useEffect(() => {
    if (controlZones.length > 0 && !selectedZoneId) setSelectedZoneId(controlZones[0].id);
  }, [controlZones, selectedZoneId]);

  const handleToggleLocationActive = async (id: string, currentActive: boolean) => {
    const loc = locations.find((l) => l.id === id);
    if (!loc) return;
    const newActive = !currentActive;
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, is_active: newActive, isActive: newActive, active: newActive } : l)));
    try { await salesService.updateSalesLocationStatus(id, newActive); } catch (err) {}
  };

  const handleToggleCounterActive = async (id: string, currentActive: boolean) => {
    const cnt = counters.find((c) => c.id === id);
    if (!cnt) return;
    const newActive = !currentActive;
    setCounters((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: newActive, isActive: newActive, active: newActive } : c)));
    try { await salesService.updateSalesCounterStatus(id, newActive); } catch (err) {}
  };

  const handleToggleZoneActive = async (id: string, currentActive: boolean) => {
    const zone = controlZones.find((z) => z.id === id);
    if (!zone) return;
    const newActive = !currentActive;
    setControlZones((prev) => prev.map((z) => (z.id === id ? { ...z, is_active: newActive, isActive: newActive, active: newActive } : z)));
    try { await ticketingService.updateControlZoneStatus(id, newActive); } catch (err) {}
  };

  const handleToggleGateActive = async (id: string, currentActive: boolean) => {
    const gate = controlGates.find((g) => g.id === id);
    if (!gate) return;
    const newActive = !currentActive;
    setControlGates((prev) => prev.map((g) => (g.id === id ? { ...g, is_active: newActive, isActive: newActive, active: newActive } : g)));
    try { await ticketingService.updateControlGateStatus(id, newActive); } catch (err) {}
  };

  const handleAddLocation = async () => {
    if (!newLocName || !newLocCode) return;
    if (editingLocId) {
      const target = locations.find((l) => l.id === editingLocId);
      if (target) await salesService.updateSalesLocation(editingLocId, { ...target, code: newLocCode.toUpperCase(), name: newLocName, address: newLocAddress });
    } else {
      const item: SalesLocation = {
        id: `loc-${Date.now()}`, code: newLocCode.toUpperCase(), name: newLocName, address: newLocAddress,
        is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 'admin', updated_by: 'admin',
      };
      await salesService.createSalesLocation(item);
    }
    try {
      const locRes = await salesService.fetchSalesLocations();
      if (locRes.data && locRes.data.length > 0) setLocations(locRes.data);
    } catch (err) {}
    setNewLocName(''); setNewLocCode(''); setNewLocAddress('');
    setEditingLocId(null); setShowLocationModal(false);
  };

  const handleAddCounter = async () => {
    if (!newCounterName || !newCounterCode) return;
    if (editingCounterId) {
      const target = counters.find((c) => c.id === editingCounterId);
      if (target) await salesService.updateSalesCounter(editingCounterId, { ...target, code: newCounterCode.toUpperCase(), name: newCounterName, sales_location_id: selectedLocId, supportedTypes: newCounterTypes as any });
    } else {
      const item: SalesCounter = {
        id: `cnt-${Date.now()}`, code: newCounterCode.toUpperCase(), name: newCounterName, sales_location_id: selectedLocId, supportedTypes: newCounterTypes as any,
        is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 'admin', updated_by: 'admin',
      };
      await salesService.createSalesCounter(item);
    }
    try {
      const cntRes = await salesService.fetchSalesCounters();
      if (cntRes.data && cntRes.data.length > 0) setCounters(cntRes.data);
    } catch (err) {}
    setNewCounterName(''); setNewCounterCode(''); setNewCounterTypes([]);
    setEditingCounterId(null); setShowCounterModal(false);
  };

  const handleAddZone = async () => {
    if (!newZoneName || !newZoneCode) return;
    if (editingZoneId) {
      const target = controlZones.find((z) => z.id === editingZoneId);
      if (target) await ticketingService.updateControlZone(editingZoneId, { ...target, code: newZoneCode.toUpperCase(), name: newZoneName });
    } else {
      const item: ControlZone = {
        id: `czone-${Date.now()}`, code: newZoneCode.toUpperCase(), name: newZoneName,
        is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 'admin', updated_by: 'admin',
      };
      await ticketingService.createControlZone(item);
    }
    try {
      const zoneRes = await ticketingService.fetchControlZones();
      if (zoneRes.data && zoneRes.data.length > 0) setControlZones(zoneRes.data);
    } catch (err) {}
    setNewZoneName(''); setNewZoneCode('');
    setEditingZoneId(null); setShowZoneModal(false);
  };

  const handleAddGate = async () => {
    if (!newGateName) return;
    if (editingGateId) {
      const target = controlGates.find((g) => g.id === editingGateId);
      if (target) await ticketingService.updateControlGate(editingGateId, { ...target, device_name: newGateName, ip_address: newGateIp, device_port: newGatePort, control_zone_id: selectedZoneId });
    } else {
      const item: ControlGate = {
        id: `gate-${Date.now()}`, device_name: newGateName, ip_address: newGateIp, device_port: newGatePort, control_zone_id: selectedZoneId,
        is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 'admin', updated_by: 'admin',
      };
      await ticketingService.createControlGate(item);
    }
    try {
      const gateRes = await ticketingService.fetchControlGates();
      if (gateRes.data && gateRes.data.length > 0) setControlGates(gateRes.data);
    } catch (err) {}
    setNewGateName('');
    setEditingGateId(null); setShowGateModal(false);
  };

  const handleOpenCompanyModal = () => {
    if (company) {
      setEditCompName(company.name || '');
      setEditCompAddress(company.address || '');
      setEditCompPhone(company.phone || '');
      setEditCompFax(company.fax || '');
      setEditCompCode(company.code || '');
      setEditCompTaxCode(company.tax_code || '');
      setEditCompContact(company.contact_person || '');
      setEditCompEmail(company.email || '');
      setEditCompLogo(company.web_logo_url || '');
      setEditCompInvoiceLogo(company.invoice_logo_url || '');
    }
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async () => {
    const updated: any = {
      name: editCompName, address: editCompAddress, phone: editCompPhone, fax: editCompFax,
      code: editCompCode, tax_code: editCompTaxCode, contact_person: editCompContact, email: editCompEmail,
      web_logo_url: editCompLogo,
      invoice_logo_url: editCompInvoiceLogo
    };
    try {
      if (company?.id) {
        const res = await marketingService.updateCompany(company.id, updated);
        if (res.data) setCompany(res.data);
      } else {
        const res = await marketingService.createCompany({ ...updated, is_active: true });
        if (res.data) setCompany(res.data);
        else {
          const compRes = await marketingService.fetchCompanies();
          if (compRes.data && compRes.data.length > 0) setCompany(compRes.data[0]);
        }
      }
    } catch(err: any) { toast.error(err.message || 'Lỗi lưu thông tin công ty'); console.error(err); }
    setShowCompanyModal(false);
  };

  const handleDeleteLocations = async (ids: string[]) => {
    for (const id of ids) { await salesService.deleteSalesLocation(String(id)); }
    setLocations((prev) => prev.filter((l) => !ids.includes(l.id)));
  };

  const handleDeleteCounters = async (ids: string[]) => {
    for (const id of ids) { await salesService.deleteSalesCounter(String(id)); }
    setCounters((prev) => prev.filter((c) => !ids.includes(c.id)));
  };

  const handleDeleteZones = async (ids: string[]) => {
    for (const id of ids) { await ticketingService.deleteControlZone(String(id)); }
    setControlZones((prev) => prev.filter((z) => !ids.includes(z.id)));
  };

  const handleDeleteGates = async (ids: string[]) => {
    for (const id of ids) { await ticketingService.deleteControlGate(String(id)); }
    setControlGates((prev) => prev.filter((g) => !ids.includes(g.id)));
  };

  return {
    activeSubTab, setActiveSubTab,
    company, locations, counters, controlZones, controlGates,
    isItemActive,

    showCompanyModal, setShowCompanyModal,
    showLocationModal, setShowLocationModal,
    showCounterModal, setShowCounterModal,
    showZoneModal, setShowZoneModal,
    showGateModal, setShowGateModal,

    editingLocId, setEditingLocId,
    editingCounterId, setEditingCounterId,
    editingZoneId, setEditingZoneId,
    editingGateId, setEditingGateId,

    editCompName, setEditCompName,
    editCompAddress, setEditCompAddress,
    editCompPhone, setEditCompPhone,
    editCompFax, setEditCompFax,
    editCompCode, setEditCompCode,
    editCompTaxCode, setEditCompTaxCode,
    editCompContact, setEditCompContact,
    editCompEmail, setEditCompEmail,
    editCompLogo, setEditCompLogo,
    editCompInvoiceLogo, setEditCompInvoiceLogo,

    newLocName, setNewLocName,
    newLocCode, setNewLocCode,
    newLocAddress, setNewLocAddress,

    newCounterName, setNewCounterName,
    newCounterCode, setNewCounterCode,
    selectedLocId, setSelectedLocId,
    newCounterTypes, setNewCounterTypes,

    newZoneName, setNewZoneName,
    newZoneCode, setNewZoneCode,

    newGateName, setNewGateName,
    newGateIp, setNewGateIp,
    newGatePort, setNewGatePort,
    selectedZoneId, setSelectedZoneId,

    handleToggleLocationActive, handleToggleCounterActive, handleToggleZoneActive, handleToggleGateActive,
    handleAddLocation, handleAddCounter, handleAddZone, handleAddGate,
    handleOpenCompanyModal, handleSaveCompany,
    handleDeleteLocations, handleDeleteCounters, handleDeleteZones, handleDeleteGates
  };
};
