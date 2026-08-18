import React, { useState } from 'react';
import { Ticket, Users, Layers, ShieldCheck } from 'lucide-react';
import { useTicketing } from '../hooks/useTicketing';
import { AudienceTab } from '../components/AudienceTab';
import { TemplateTab } from '../components/TemplateTab';
import { ControlZoneTab } from '../components/ControlZoneTab';
import { TicketZoneTab } from '../components/TicketZoneTab';

interface TicketingModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const TicketingModule: React.FC<TicketingModuleProps> = ({ subTab = 'KhaiBaoDoiTuong', onSelectSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(subTab);

  const currentTab = onSelectSubTab ? subTab : activeSubTab;

  // Data management is now isolated in the custom hook
  const {
    audienceTypes, setAudienceTypes,
    ticketTemplates, setTicketTemplates,
    ticketZones, setTicketZones,
    controlZones, setControlZones,
    loading,
    refreshData
  } = useTicketing(currentTab);

  const subTabs = [
    { id: 'KhaiBaoDoiTuong', label: 'Khai Báo Đối Tượng Khách', route: '/KhaiBaoDoiTuong', icon: Users },
    { id: 'KhaiBaoVe_KS', label: 'Loại Vé Theo Khu Vực', route: '/KhaiBaoVe_KS', icon: Layers },
    { id: 'KhaibaoVe', label: 'Khai Báo Các Loại Vé', route: '/KhaibaoVe', icon: Ticket },
    { id: 'KhaiBaoKhuKiemSoat', label: 'Khai Báo Khu Kiểm Soát', route: '/KhaiBaoKhuKiemSoat', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="p-12 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* ---------------------------------------------------- */}
      {/* 1. KHAI BÁO ĐỐI TƯỢNG (/KhaiBaoDoiTuong) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaiBaoDoiTuong' && (
        <AudienceTab
          audienceTypes={audienceTypes}
          setAudienceTypes={setAudienceTypes}
          refreshData={refreshData}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. KHAI BÁO CÁC LOẠI VÉ (/KhaibaoVe) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaibaoVe' && (
        <TemplateTab
          ticketTemplates={ticketTemplates}
          setTicketTemplates={setTicketTemplates}
          audienceTypes={audienceTypes}
          ticketZones={ticketZones}
          refreshData={refreshData}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. KHAI BÁO KHU KIỂM SOÁT (/KhaiBaoKhuKiemSoat) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaiBaoKhuKiemSoat' && (
        <ControlZoneTab
          controlZones={controlZones}
          setControlZones={setControlZones}
          refreshData={refreshData}
        />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. KHAI BÁO VÉ THEO KHU VỰC (/KhaiBaoVe_KS) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaiBaoVe_KS' && (
        <TicketZoneTab
          ticketZones={ticketZones}
          setTicketZones={setTicketZones}
          controlZones={controlZones}
          ticketTemplates={ticketTemplates}
          refreshData={refreshData}
        />
      )}
    </div>
  );
};
