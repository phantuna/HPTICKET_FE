import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { TicketZone, ControlZone, TicketTemplate } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';
import { toast } from '../../../shared/utils/toast';

interface TicketZoneTabProps {
  ticketZones: TicketZone[];
  setTicketZones: React.Dispatch<React.SetStateAction<TicketZone[]>>;
  controlZones: ControlZone[];
  ticketTemplates: TicketTemplate[];
  refreshData: () => void;
}

export const TicketZoneTab: React.FC<TicketZoneTabProps> = ({ ticketZones, setTicketZones, controlZones, ticketTemplates, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<TicketZone | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [selectedControlZoneIds, setSelectedControlZoneIds] = useState<string[]>([]);

  const handleSave = async () => {
    if (!zoneName.trim()) { toast.error('Vui lòng nhập tên nhóm vé!'); return; }

    if (editingZone) {
      const updatedItem: any = { 
        ...editingZone, 
        name: zoneName, 
        zone_ids: selectedControlZoneIds,
      };
      await ticketingService.updateTicketZone(editingZone.id, updatedItem);
    } else {
      const item: any = {
        id: `tz-${Date.now()}`,
        name: zoneName,
        zone_ids: selectedControlZoneIds,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin',
      };
      await ticketingService.createTicketZone(item);
    }
    
    refreshData();
    setShowModal(false);
  };

  const handleDelete = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await ticketingService.deleteTicketZone(String(id));
    }
    setTicketZones(prev => prev.filter(t => !ids.includes(t.id)));
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CÁC LOẠI VÉ THEO KHU VỰC KIỂM SOÁT"
        data={ticketZones}
        columns={[
          { header: 'STT', accessor: (row: any, idx) => idx + 1, className: 'w-16 font-mono text-center' },
          { header: 'Tên nhóm vé áp dụng', accessor: 'name', className: 'font-bold text-slate-900 w-1/3' },
          {
            header: 'Tên khu vực kiểm soát',
            accessor: (row: any) => {
              const zoneIds = row.zone_ids || [row.zone_id || row.control_zone_id].filter(Boolean);
              const czs = zoneIds.map((id: string) => controlZones.find(z => z.id === id || (z as any).zone_id === id)).filter(Boolean);
              return (
                <ul className="list-disc list-inside space-y-1 text-slate-800 font-medium">
                  {czs.length > 0 ? (
                    czs.map((cz: any, index: number) => <li key={index}>{cz.name}</li>)
                  ) : (
                    <li>Chưa gán khu vực</li>
                  )}
                </ul>
              );
            },
            className: 'py-2',
          },
        ]}
        onAddNew={() => {
          setEditingZone(null);
          setZoneName('');
          setSelectedControlZoneIds([]);
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingZone(item);
          setZoneName(item.name || '');
          setSelectedControlZoneIds(item.zone_ids || [item.zone_id || item.control_zone_id].filter(Boolean));
          setShowModal(true);
        }}
        onDelete={handleDelete}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-5 h-5 text-purple-600" /> {editingZone ? 'Sửa Nhóm Vé' : 'Thêm Nhóm Vé'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Nhóm Vé (Khu Vực):</label>
                <input
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Ví dụ: Nhóm vé Tham Quan, Cáp Treo..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
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
