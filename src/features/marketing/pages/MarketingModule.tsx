import React, { useState } from 'react';
import { Users, Building2, Calendar, Gift } from 'lucide-react';
import { useMarketing } from '../hooks/useMarketing';
import { GroupTab } from '../components/GroupTab';
import { SourceTab } from '../components/SourceTab';
import { HolidayTab } from '../components/HolidayTab';
import { PromotionTab } from '../components/PromotionTab';

interface MarketingModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const MarketingModule: React.FC<MarketingModuleProps> = ({ subTab = 'khaibaoNhomNguonKhach', onSelectSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<string>(subTab);

  const currentTab = onSelectSubTab ? subTab : activeSubTab;

  const {
    groups, setGroups,
    sources, setSources,
    holidays, setHolidays,
    promotions, setPromotions,
    ticketTemplates,
    loading,
    refreshData
  } = useMarketing();

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
      {/* 1. KHAI BÁO NHÓM NGUỒN KHÁCH (/khaibaoNhomNguonKhach) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'khaibaoNhomNguonKhach' && (
        <GroupTab groups={groups} setGroups={setGroups} refreshData={refreshData} />
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. KHAI BÁO NGUỒN KHÁCH (/KhaiBaoNguonKhach) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaiBaoNguonKhach' && (
        <SourceTab sources={sources} setSources={setSources} groups={groups} refreshData={refreshData} />
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. KHAI BÁO CÁC NGÀY LỄ (/Hoiday) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'Hoiday' && (
        <HolidayTab holidays={holidays} setHolidays={setHolidays} refreshData={refreshData} />
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. KHAI BÁO KHUYẾN MẠI (/KhaiBaoKhuyenMai) */}
      {/* ---------------------------------------------------- */}
      {currentTab === 'KhaiBaoKhuyenMai' && (
        <PromotionTab 
          promotions={promotions} 
          setPromotions={setPromotions} 
          ticketTemplates={ticketTemplates} 
          refreshData={refreshData} 
        />
      )}
    </div>
  );
};
