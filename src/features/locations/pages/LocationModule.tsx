import React, { useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { useLocations } from '../hooks/useLocations';
import { LocationModal } from '../components/LocationModal';
import { CounterModal } from '../components/CounterModal';
import { ZoneModal } from '../components/ZoneModal';
import { GateModal } from '../components/GateModal';
import { CompanyModal } from '../components/CompanyModal';

interface LocationModuleProps {
  subTab?: string;
  onSelectSubTab?: (tab: string) => void;
}

export const LocationModule: React.FC<LocationModuleProps> = ({ subTab = 'khaibaocongty', onSelectSubTab }) => {
  const locState = useLocations(subTab);

  const {
    activeSubTab, setActiveSubTab, company, locations, counters, controlZones, controlGates, isItemActive,
    showCompanyModal, setShowCompanyModal, showLocationModal, setShowLocationModal,
    showCounterModal, setShowCounterModal, showZoneModal, setShowZoneModal, showGateModal, setShowGateModal,
    editingLocId, setEditingLocId, editingCounterId, setEditingCounterId,
    editingZoneId, setEditingZoneId, editingGateId, setEditingGateId,
    editCompName, setEditCompName, editCompAddress, setEditCompAddress,
    editCompPhone, setEditCompPhone, editCompFax, setEditCompFax,
    editCompCode, setEditCompCode, editCompTaxCode, setEditCompTaxCode,
    editCompContact, setEditCompContact, editCompEmail, setEditCompEmail,
    editCompLogo, setEditCompLogo, editCompInvoiceLogo, setEditCompInvoiceLogo,
    newLocName, setNewLocName, newLocCode, setNewLocCode, newLocAddress, setNewLocAddress,
    newCounterName, setNewCounterName, newCounterCode, setNewCounterCode, selectedLocId, setSelectedLocId,
    newCounterTypes, setNewCounterTypes,
    newZoneName, setNewZoneName, newZoneCode, setNewZoneCode,
    newGateName, setNewGateName, newGateIp, setNewGateIp, newGatePort, setNewGatePort, selectedZoneId, setSelectedZoneId,
    handleToggleLocationActive, handleToggleCounterActive, handleToggleZoneActive, handleToggleGateActive,
    handleAddLocation, handleAddCounter, handleAddZone, handleAddGate,
    handleOpenCompanyModal, handleSaveCompany,
    handleDeleteLocations, handleDeleteCounters, handleDeleteZones, handleDeleteGates
  } = locState;

  const currentTab = onSelectSubTab ? subTab : activeSubTab;

  useEffect(() => {
    if (onSelectSubTab) setActiveSubTab(subTab);
  }, [subTab, onSelectSubTab, setActiveSubTab]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {currentTab === 'khaibaocongty' && (
        <div className="bg-white text-slate-900 rounded-xl p-6 shadow-md border border-slate-200 space-y-5 my-2">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base sm:text-lg font-bold tracking-wide uppercase text-slate-800">
              KHAI BÁO THÔNG TIN CÔNG TY
            </h2>
            <button
              onClick={handleOpenCompanyModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-md flex items-center gap-1.5 transition shadow-sm"
            >
              <Edit2 className="w-4 h-4" /> Chỉnh sửa thông tin
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm pt-2">
            <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block text-xs mb-1 font-semibold">Tên đơn vị chủ quản:</span>
                <p className="text-base font-bold text-slate-900">{company?.name || 'Chưa cấu hình'}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs mb-1 font-semibold">Địa chỉ trụ sở:</span>
                <p className="text-slate-800 font-medium">{company?.address || 'Chưa cấu hình'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <span className="text-slate-500 block text-xs font-semibold">Tổng đài hỗ trợ:</span>
                  <p className="text-emerald-700 font-mono font-bold text-sm mt-0.5">{company?.phone || 'Chưa cấu hình'}</p>
                </div>
                <div>
                  <span className="text-slate-500 block text-xs font-semibold">Mã số thuế / Số Fax:</span>
                  <p className="text-slate-800 font-mono font-bold text-sm mt-0.5">{company?.tax_code || company?.fax || 'Chưa cấu hình'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
              <span className="text-slate-800 font-bold block mb-2">Biểu trưng & Logo hiển thị trên vé:</span>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                  {company?.web_logo_url ? (
                    <img src={company.web_logo_url} alt="Logo Web" className="max-h-full max-w-full object-contain rounded" />
                  ) : (
                    <span className="text-[10px] text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-bold text-sm">Logo Website</p>
                  <p className="text-xs text-slate-500 mt-1">Sử dụng trên trang cổng bán vé</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-3 border-t border-slate-200">
                <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center shadow-sm">
                  {company?.invoice_logo_url ? (
                    <img src={company.invoice_logo_url} alt="Logo Hóa Đơn" className="max-h-full max-w-full object-contain rounded" />
                  ) : (
                    <span className="text-[10px] text-slate-400">No Logo</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-bold text-sm">Logo Hóa Đơn Điện Tử</p>
                  <p className="text-xs text-slate-500 mt-1">Đã đồng bộ FPT e-Invoice / Viettel S-Invoice</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentTab === 'KhaiBaoDiemBanVe' && (
        <AdminConfigCard
          title="KHAI BÁO ĐIỂM BÁN VÉ"
          data={locations}
          columns={[
            { header: 'ID', accessor: (row, idx) => idx + 1, className: 'w-16 font-mono text-center' },
            { header: 'Mã điểm bán vé', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
            { header: 'Tên điểm bán vé', accessor: 'name', className: 'font-semibold text-slate-900' },
            { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
          ]}
          onAddNew={() => {
            setEditingLocId(null); setNewLocCode(''); setNewLocName(''); setNewLocAddress(''); setShowLocationModal(true);
          }}
          onEdit={(item: any) => {
            setEditingLocId(item.id); setNewLocCode(item.code); setNewLocName(item.name); setNewLocAddress(item.address || ''); setShowLocationModal(true);
          }}
          onDelete={handleDeleteLocations}
          onToggleActive={(id, currentActive) => handleToggleLocationActive(String(id), currentActive)}
        />
      )}

      {currentTab === 'KhaiBaoQuayVe' && (
        <AdminConfigCard
          title="KHAI BÁO QUẦY BÁN VÉ"
          data={counters}
          columns={[
            { header: 'STT', accessor: (row, idx) => idx + 1, className: 'w-16 font-mono text-center' },
            { header: 'Mã quầy', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
            { header: 'Tên quầy', accessor: 'name', className: 'font-semibold text-slate-900' },
            { header: 'Điểm bán vé', accessor: (row: any) => locations.find((l) => l.id === row.sales_location_id)?.name || 'Zipline', className: 'text-slate-800 font-medium' },
            { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
          ]}
          onAddNew={() => {
            setEditingCounterId(null); setNewCounterCode(''); setNewCounterName(''); setNewCounterTypes([]); setShowCounterModal(true);
          }}
          onEdit={(item: any) => {
            setEditingCounterId(item.id); setNewCounterCode(item.code); setNewCounterName(item.name); if (item.sales_location_id) setSelectedLocId(item.sales_location_id); setNewCounterTypes(item.supportedTypes || []); setShowCounterModal(true);
          }}
          onDelete={handleDeleteCounters}
          onToggleActive={(id, currentActive) => handleToggleCounterActive(String(id), currentActive)}
        />
      )}

      {currentTab === 'KhaibaosKhuKiemSoat' && (
        <AdminConfigCard
          title="KHAI BÁO KHU KIỂM SOÁT"
          data={controlZones}
          columns={[
            { header: 'STT', accessor: (row, idx) => idx + 1, className: 'w-16 font-mono text-center' },
            { header: 'Mã khu kiểm soát', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
            { header: 'Tên khu kiểm soát', accessor: 'name', className: 'font-semibold text-slate-900' },
            { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
          ]}
          onAddNew={() => {
            setEditingZoneId(null); setNewZoneCode(''); setNewZoneName(''); setShowZoneModal(true);
          }}
          onEdit={(item: any) => {
            setEditingZoneId(item.id); setNewZoneCode(item.code); setNewZoneName(item.name); setShowZoneModal(true);
          }}
          onDelete={handleDeleteZones}
          onToggleActive={(id, currentActive) => handleToggleZoneActive(String(id), currentActive)}
        />
      )}

      {currentTab === 'KhaiBaoCuaKS' && (
        <AdminConfigCard
          title="KHAI BÁO CỬA KIỂM SOÁT"
          data={controlGates}
          columns={[
            { header: 'STT', accessor: (row, idx) => idx + 1, className: 'w-16 font-mono text-center' },
            { header: 'Tên thiết bị', accessor: 'device_name', className: 'font-semibold text-slate-900' },
            { header: 'Địa chỉ ip', accessor: 'ip_address', className: 'font-mono font-medium text-slate-800' },
            { header: 'Cổng thiết bị', accessor: 'device_port', className: 'font-mono text-center w-28' },
            { header: 'Khu kiểm soát', accessor: (row: any) => controlZones.find((z) => z.id === row.control_zone_id)?.name || 'Cửa thăm quan', className: 'text-slate-800 font-medium' },
            { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
          ]}
          onAddNew={() => {
            setEditingGateId(null); setNewGateName(''); setNewGateIp('192.168.1.100'); setNewGatePort(8080); setShowGateModal(true);
          }}
          onEdit={(item: any) => {
            setEditingGateId(item.id); setNewGateName(item.device_name || item.deviceName || ''); setNewGateIp(item.ip_address || item.ipAddress || '192.168.1.100'); setNewGatePort(item.device_port || item.devicePort || 8080); if (item.control_zone_id || item.controlZoneId) setSelectedZoneId(item.control_zone_id || item.controlZoneId); setShowGateModal(true);
          }}
          onDelete={handleDeleteGates}
          onToggleActive={(id, currentActive) => handleToggleGateActive(String(id), currentActive)}
        />
      )}

      {showLocationModal && (
        <LocationModal
          editingLocId={editingLocId} newLocCode={newLocCode} setNewLocCode={setNewLocCode}
          newLocName={newLocName} setNewLocName={setNewLocName} newLocAddress={newLocAddress} setNewLocAddress={setNewLocAddress}
          onSubmit={handleAddLocation} onClose={() => setShowLocationModal(false)}
        />
      )}

      {showCounterModal && (
        <CounterModal
          editingCounterId={editingCounterId} selectedLocId={selectedLocId} setSelectedLocId={setSelectedLocId}
          newCounterCode={newCounterCode} setNewCounterCode={setNewCounterCode} newCounterName={newCounterName} setNewCounterName={setNewCounterName}
          newCounterTypes={newCounterTypes} setNewCounterTypes={setNewCounterTypes}
          locations={locations} isItemActive={isItemActive} onSubmit={handleAddCounter} onClose={() => setShowCounterModal(false)}
        />
      )}

      {showZoneModal && (
        <ZoneModal
          editingZoneId={editingZoneId} newZoneCode={newZoneCode} setNewZoneCode={setNewZoneCode}
          newZoneName={newZoneName} setNewZoneName={setNewZoneName} onSubmit={handleAddZone} onClose={() => setShowZoneModal(false)}
        />
      )}

      {showGateModal && (
        <GateModal
          editingGateId={editingGateId} selectedZoneId={selectedZoneId} setSelectedZoneId={setSelectedZoneId}
          newGateName={newGateName} setNewGateName={setNewGateName} newGateIp={newGateIp} setNewGateIp={setNewGateIp}
          newGatePort={newGatePort} setNewGatePort={setNewGatePort} controlZones={controlZones} isItemActive={isItemActive}
          onSubmit={handleAddGate} onClose={() => setShowGateModal(false)}
        />
      )}

      {showCompanyModal && (
        <CompanyModal
          editCompCode={editCompCode} setEditCompCode={setEditCompCode} editCompName={editCompName} setEditCompName={setEditCompName}
          editCompAddress={editCompAddress} setEditCompAddress={setEditCompAddress} editCompPhone={editCompPhone} setEditCompPhone={setEditCompPhone}
          editCompFax={editCompFax} setEditCompFax={setEditCompFax} editCompTaxCode={editCompTaxCode} setEditCompTaxCode={setEditCompTaxCode}
          editCompContact={editCompContact} setEditCompContact={setEditCompContact}
          editCompEmail={editCompEmail} setEditCompEmail={setEditCompEmail}
          editCompLogo={editCompLogo} setEditCompLogo={setEditCompLogo}
          editCompInvoiceLogo={editCompInvoiceLogo} setEditCompInvoiceLogo={setEditCompInvoiceLogo}
          onSubmit={handleSaveCompany} onClose={() => setShowCompanyModal(false)}
        />
      )}
    </div>
  );
};
