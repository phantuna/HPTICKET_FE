import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { ControlZone } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';

interface ControlZoneTabProps {
  controlZones: ControlZone[];
  setControlZones: React.Dispatch<React.SetStateAction<ControlZone[]>>;
  refreshData: () => void;
}

export const ControlZoneTab: React.FC<ControlZoneTabProps> = ({ controlZones, setControlZones, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingControlZone, setEditingControlZone] = useState<ControlZone | null>(null);
  const [newControlZoneCode, setNewControlZoneCode] = useState('');
  const [newControlZoneName, setNewControlZoneName] = useState('');

  const handleSave = async () => {
    if (!newControlZoneCode || !newControlZoneName) return;
    const payload: any = {
      code: newControlZoneCode.toUpperCase(),
      name: newControlZoneName,
      is_active: true,
    };
    if (editingControlZone) {
      await ticketingService.updateControlZone(editingControlZone.id, payload);
    } else {
      const item = { ...payload, id: `cz-${Date.now()}` };
      await ticketingService.createControlZone(item);
    }
    refreshData();
    setShowModal(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setControlZones(prev => prev.map(cz => cz.id === id ? { ...cz, is_active: newActive, isActive: newActive, active: newActive } : cz));
    try {
      await ticketingService.updateControlZoneStatus(id, newActive);
    } catch (err) {}
  };

  const handleDelete = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await ticketingService.deleteControlZone(String(id));
    }
    setControlZones(prev => prev.filter(cz => !ids.includes(cz.id)));
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO KHU KIỂM SOÁT"
        data={controlZones}
        columns={[
          { header: 'ID', accessor: (row: any, idx) => row.id || idx + 1, className: 'w-20 font-mono' },
          { header: 'Mã khu kiểm soát', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên khu kiểm soát', accessor: 'name', className: 'font-semibold text-slate-900' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingControlZone(null);
          setNewControlZoneCode('');
          setNewControlZoneName('');
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingControlZone(item);
          setNewControlZoneCode(item.code);
          setNewControlZoneName(item.name);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> {editingControlZone ? 'Sửa Khu Kiểm Soát' : 'Thêm Khu Kiểm Soát'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Khu Kiểm Soát:</label>
                <input
                  type="text"
                  value={newControlZoneCode}
                  onChange={(e) => setNewControlZoneCode(e.target.value)}
                  placeholder="e.g. GATE-A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Khu Kiểm Soát:</label>
                <input
                  type="text"
                  value={newControlZoneName}
                  onChange={(e) => setNewControlZoneName(e.target.value)}
                  placeholder="e.g. Cổng chính A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => setShowModal(false)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
                Hủy
              </button>
              <button onClick={handleSave} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs">
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
