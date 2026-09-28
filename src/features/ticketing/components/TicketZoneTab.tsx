import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { ControlZone, TicketTemplate } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';
import { toast } from '../../../shared/utils/toast';
import { usePermission } from '../../../shared/hooks/usePermission';
import { Modal } from '../../../shared/components/ui';

interface TicketZoneTabProps {
  controlZones: ControlZone[];
  ticketTemplates: TicketTemplate[];
  refreshData: () => void;
}

export const TicketZoneTab: React.FC<TicketZoneTabProps> = ({ controlZones, ticketTemplates, refreshData }) => {
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null);
  const [selectedControlZoneIds, setSelectedControlZoneIds] = useState<string[]>([]);

  const handleSave = async () => {
    if (editingTemplate) {
      const updatedItem: any = { 
        ...editingTemplate, 
        control_zone_ids: selectedControlZoneIds,
      };
      await ticketingService.updateTicketTemplate(editingTemplate.id, updatedItem);
      refreshData();
      setShowModal(false);
      toast.success('Đã cập nhật khu vực kiểm soát cho vé!');
    }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CÁC LOẠI VÉ THEO KHU VỰC KIỂM SOÁT"
        data={ticketTemplates}
        columns={[
          { header: 'STT', accessor: (row: any, idx) => idx + 1, className: 'w-16 font-mono text-center' },
          { header: 'Tên vé', accessor: 'name', className: 'font-bold text-slate-900 w-1/3' },
          {
            header: 'Tên khu vực kiểm soát',
            accessor: (row: any) => {
              const zoneIds = row.control_zone_ids || [];
              const czs = zoneIds.map((id: string) => controlZones.find(z => z.id === id)).filter(Boolean);
              return (
                <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium">
                  {czs.length > 0 ? (
                    czs.map((cz: any, index: number) => <li key={index}>* {cz.name}</li>)
                  ) : (
                    <li className="text-slate-400 italic">Chưa gán khu vực</li>
                  )}
                </ul>
              );
            },
            className: 'py-2',
          },
        ]}
        onEdit={can('UPDATE_TICKET_ZONE') ? ((item: any) => {
          setEditingTemplate(item);
          setSelectedControlZoneIds(item.control_zone_ids || []);
          setShowModal(true);
        }) : undefined}
        hideAddButton={true}
        hideDeleteButton={true}
        onDelete={async () => {}}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Sửa Khu Vực Kiểm Soát Cho Vé"
        icon={<Layers className="w-5 h-5 text-emerald-600" />}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        confirmText="Lưu Thay Đổi"
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tên Vé:</label>
            <div className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 font-medium cursor-not-allowed">
              {editingTemplate?.name}
            </div>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Khu Vực Kiểm Soát:</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
              {controlZones.map((cz) => (
                <label key={cz.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedControlZoneIds.includes(cz.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedControlZoneIds((prev) => [...prev, cz.id]);
                      else setSelectedControlZoneIds((prev) => prev.filter((id) => id !== cz.id));
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-medium text-slate-800">{cz.name}</span>
                </label>
              ))}
              {controlZones.length === 0 && (
                <p className="text-slate-500 text-center py-2">Chưa có khu kiểm soát nào</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
