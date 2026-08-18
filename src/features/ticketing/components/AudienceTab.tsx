import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { AudienceType } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';
import { toast } from '../../../shared/utils/toast';

interface AudienceTabProps {
  audienceTypes: AudienceType[];
  setAudienceTypes: React.Dispatch<React.SetStateAction<AudienceType[]>>;
  refreshData: () => void;
}

export const AudienceTab: React.FC<AudienceTabProps> = ({ audienceTypes, setAudienceTypes, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingAud, setEditingAud] = useState<AudienceType | null>(null);
  const [newAudCode, setNewAudCode] = useState('');
  const [newAudName, setNewAudName] = useState('');

  const handleSave = async () => {
    if (!newAudCode || !newAudName) { toast.error('Vui lòng nhập đầy đủ Mã và Tên Đối tượng vé!'); return; }
    
    if (editingAud) {
      const updatedItem = { ...editingAud, code: newAudCode.toUpperCase(), name: newAudName };
      await ticketingService.updateAudienceType(editingAud.id, updatedItem);
    } else {
      const item: AudienceType = {
        id: `aud-${Date.now()}`,
        code: newAudCode.toUpperCase(),
        name: newAudName,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin',
      };
      await ticketingService.createAudienceType(item);
    }
    
    refreshData();
    setShowModal(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setAudienceTypes(prev => prev.map(a => a.id === id ? { ...a, is_active: newActive, isActive: newActive, active: newActive } : a));
    try {
      await ticketingService.updateAudienceTypeStatus(id, newActive);
    } catch (err) {}
  };

  const handleDelete = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await ticketingService.deleteAudienceType(String(id));
    }
    setAudienceTypes(prev => prev.filter(a => !ids.includes(a.id)));
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO ĐỐI TƯỢNG"
        data={audienceTypes}
        columns={[
          { header: 'ID', accessor: (row, idx) => idx + 1, className: 'w-20 font-mono' },
          { header: 'Mã đối tượng', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên đối tượng', accessor: 'name', className: 'font-semibold text-slate-900' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingAud(null);
          setNewAudCode('');
          setNewAudName('');
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingAud(item);
          setNewAudCode(item.code);
          setNewAudName(item.name);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-emerald-600" /> {editingAud ? 'Sửa Đối Tượng' : 'Thêm Phân Loại Đối Tượng'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Đối Tượng:</label>
                <input
                  type="text"
                  value={newAudCode}
                  onChange={(e) => setNewAudCode(e.target.value)}
                  placeholder="e.g. STUDENT"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Đối Tượng:</label>
                <input
                  type="text"
                  value={newAudName}
                  onChange={(e) => setNewAudName(e.target.value)}
                  placeholder="e.g. Học sinh / Sinh viên (Có thẻ)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Đối Tượng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
