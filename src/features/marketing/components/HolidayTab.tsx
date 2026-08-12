import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { Holiday } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';

interface HolidayTabProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  refreshData: () => void;
}

export const HolidayTab: React.FC<HolidayTabProps> = ({ holidays, setHolidays, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayStart, setNewHolidayStart] = useState('2026-09-02');
  const [newHolidayEnd, setNewHolidayEnd] = useState('2026-09-02');

  const handleSave = async () => {
    if (!newHolidayName) return;
    const payload = {
      name: newHolidayName,
      start_date: newHolidayStart,
      end_date: newHolidayEnd,
      is_active: true,
    };
    if (editingHolidayId) {
      await marketingService.updateHoliday(editingHolidayId, payload);
    } else {
      await marketingService.createHoliday(payload);
    }
    refreshData();
    setShowModal(false);
  };

  const handleDelete = (ids: (string | number)[]) => {
    ids.forEach((id) => marketingService.deleteHoliday(String(id)));
    setHolidays((prev) => prev.filter((h) => !ids.includes(h.id)));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await marketingService.updateHolidayStatus(id, !currentActive);
      if (res.code === 200) {
        setHolidays((prev) => prev.map((h: any) => h.id === id ? { ...h, is_active: !currentActive, isActive: !currentActive, active: !currentActive } : h));
      }
    } catch (err) { alert('Cập nhật thất bại'); }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CÁC NGÀY LỄ"
        data={holidays}
        columns={[
          { header: 'ID', accessor: (row: any, idx) => idx + 1, className: 'w-20 font-mono' },
          { header: 'Mã ngày lễ', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên ngày lễ', accessor: 'name', className: 'font-semibold text-slate-900' },
          { header: 'Từ ngày', accessor: 'start_date', className: 'font-mono text-slate-800' },
          { header: 'Đến ngày', accessor: 'end_date', className: 'font-mono text-slate-800' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingHolidayId(null);
          setNewHolidayName('');
          setNewHolidayStart('2026-09-02');
          setNewHolidayEnd('2026-09-02');
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingHolidayId(item.id);
          setNewHolidayName(item.name);
          setNewHolidayStart(item.start_date || item.startDate || '2026-09-02');
          setNewHolidayEnd(item.end_date || item.endDate || '2026-09-02');
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-rose-600" /> {editingHolidayId ? 'Sửa Ngày Lễ' : 'Thêm Ngày Lễ Cụ Thể'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Ngày Lễ:</label>
                <input
                  type="text"
                  value={newHolidayName}
                  onChange={(e) => setNewHolidayName(e.target.value)}
                  placeholder="e.g. Giỗ Tổ Hùng Vương"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Từ Ngày:</label>
                  <input
                    type="date"
                    value={newHolidayStart}
                    onChange={(e) => setNewHolidayStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đến Ngày:</label>
                  <input
                    type="date"
                    value={newHolidayEnd}
                    onChange={(e) => setNewHolidayEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
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
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Ngày Lễ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
