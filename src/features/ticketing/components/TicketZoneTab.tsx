import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { ControlZone, TicketTemplate } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';
import { toast } from '../../../shared/utils/toast';

interface TicketZoneTabProps {
  controlZones: ControlZone[];
  ticketTemplates: TicketTemplate[];
  refreshData: () => void;
}

export const TicketZoneTab: React.FC<TicketZoneTabProps> = ({ controlZones, ticketTemplates, refreshData }) => {
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
        onEdit={(item: any) => {
          setEditingTemplate(item);
          setSelectedControlZoneIds(item.control_zone_ids || []);
          setShowModal(true);
        }}
        hideAddButton={true}
        hideDeleteButton={true}
        onDelete={async () => {}}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-purple-600" /> Sửa Khu Vực Kiểm Soát Cho Vé
            </h3>
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
                          if (e.target.checked) setSelectedControlZoneIds(prev => [...prev, cz.id]);
                          else setSelectedControlZoneIds(prev => prev.filter(id => id !== cz.id));
                        }}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span className="font-medium text-slate-800">{cz.name}</span>
                    </label>
                  ))}
                  {controlZones.length === 0 && <p className="text-slate-500 text-center py-2">Chưa có khu kiểm soát nào</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
                Hủy
              </button>
              <button onClick={handleSave} className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
