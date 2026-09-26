import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { Holiday } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';
import { usePermission } from '../../../shared/hooks/usePermission';

interface HolidayTabProps {
  holidays: Holiday[];
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  refreshData: (force?: boolean) => void;
}

export const HolidayTab: React.FC<HolidayTabProps> = ({ holidays, setHolidays, refreshData }) => {
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);

  const [newHolidayCode, setNewHolidayCode] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayStart, setNewHolidayStart] = useState('');
  const [newHolidayEnd, setNewHolidayEnd] = useState('');
  const [newHolidayDescription, setNewHolidayDescription] = useState('');

  const formatDate = (d: string) => {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('vi-VN');
    } catch {
      return d;
    }
  };

  const handleSave = async () => {
    if (!newHolidayName) { toast.error('Vui lòng nhập Tên Ngày Lễ!'); return; }
    if (!newHolidayStart || !newHolidayEnd) { toast.error('Vui lòng chọn Từ Ngày và Đến Ngày!'); return; }
    if (newHolidayStart > newHolidayEnd) {
      toast.error('Ngày bắt đầu không được lớn hơn ngày kết thúc!');
      return;
    }

    const payload = {
      code: newHolidayCode.trim() || undefined,
      name: newHolidayName.trim(),
      start_date: newHolidayStart,
      end_date: newHolidayEnd,
      description: newHolidayDescription.trim() || undefined,
      is_active: true,
    };

    try {
      if (editingHolidayId) {
        await marketingService.updateHoliday(editingHolidayId, payload);
        toast.success('Cập nhật ngày lễ thành công!');
      } else {
        await marketingService.createHoliday(payload);
        toast.success('Tạo ngày lễ mới thành công!');
      }
      refreshData(true);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu ngày lễ. Vui lòng kiểm tra lại!');
    }
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
    } catch (err) { toast.error('Cập nhật thất bại'); }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CÁC NGÀY LỄ & ĐỈNH ĐIỂM"
        data={holidays}
        columns={[
          { header: 'ID', accessor: (row: any, idx) => idx + 1, className: 'w-12 font-mono text-center' },
          { header: 'Mã', accessor: (row: any) => row.code ? <span className="font-mono text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">{row.code}</span> : '-', className: 'w-24' },
          { header: 'Tên ngày lễ', accessor: (row: any) => (
            <div>
              <div className="font-semibold text-slate-900">{row.name}</div>
              {row.description && <div className="text-xs text-slate-500 line-clamp-1">{row.description}</div>}
            </div>
          ), className: 'font-semibold text-slate-900' },
          { header: 'Từ ngày', accessor: (row: any) => formatDate(row.start_date || row.startDate), className: 'font-mono text-slate-800' },
          { header: 'Đến ngày', accessor: (row: any) => formatDate(row.end_date || row.endDate), className: 'font-mono text-slate-800' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingHolidayId(null);
          setNewHolidayCode('');
          setNewHolidayName('');
          setNewHolidayStart('');
          setNewHolidayEnd('');
          setNewHolidayDescription('');
          setShowModal(true);
        }}
        onEdit={can('UPDATE_HOLIDAY') ? ((item: any) => {
          setEditingHolidayId(item.id);
          setNewHolidayCode(item.code || '');
          setNewHolidayName(item.name || '');
          const sDate = item.start_date || item.startDate;
          const eDate = item.end_date || item.endDate;
          setNewHolidayStart(sDate ? sDate.substring(0, 10) : '');
          setNewHolidayEnd(eDate ? eDate.substring(0, 10) : '');
          setNewHolidayDescription(item.description || '');
          setShowModal(true);
        }) : undefined}
        onDelete={can('DELETE_HOLIDAY') ? handleDelete : undefined}
        onToggleActive={can('UPDATE_HOLIDAY') ? handleToggleActive : undefined}
        hideAddButton={!can('CREATE_HOLIDAY')}
        hideDeleteButton={!can('DELETE_HOLIDAY')}
      />

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowModal(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-rose-600" /> {editingHolidayId ? 'Sửa Ngày Lễ' : 'Thêm Ngày Lễ Cụ Thể'}
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-slate-700 font-semibold mb-1">Mã Lễ:</label>
                  <input
                    type="text"
                    value={newHolidayCode}
                    onChange={(e) => setNewHolidayCode(e.target.value)}
                    placeholder="e.g. TET_2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-purple-500 uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Tên Ngày Lễ *:</label>
                  <input
                    type="text"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    placeholder="e.g. Tết Nguyên Đán 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Từ Ngày *:</label>
                  <input
                    type="date"
                    value={newHolidayStart}
                    onChange={(e) => setNewHolidayStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Đến Ngày *:</label>
                  <input
                    type="date"
                    value={newHolidayEnd}
                    onChange={(e) => setNewHolidayEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mô tả / Ghi chú:</label>
                <textarea
                  rows={2}
                  value={newHolidayDescription}
                  onChange={(e) => setNewHolidayDescription(e.target.value)}
                  placeholder="Ghi chú thêm về ngày lễ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Ngày Lễ
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
