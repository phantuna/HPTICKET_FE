import React from 'react';
import { Store } from 'lucide-react';
import { Modal } from '../../../shared/components/ui';

interface CounterModalProps {
  editingCounterId: string | null;
  selectedLocId: string;
  setSelectedLocId: (v: string) => void;
  newCounterCode: string;
  setNewCounterCode: (v: string) => void;
  newCounterName: string;
  setNewCounterName: (v: string) => void;
  newCounterTypes: string[];
  setNewCounterTypes: (v: string[]) => void;
  locations: any[];
  isItemActive: (item: any) => boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export const CounterModal: React.FC<CounterModalProps> = ({
  editingCounterId,
  selectedLocId,
  setSelectedLocId,
  newCounterCode,
  setNewCounterCode,
  newCounterName,
  setNewCounterName,
  newCounterTypes,
  setNewCounterTypes,
  locations,
  isItemActive,
  onSubmit,
  onClose,
}) => {
  const handleToggleType = (type: string) => {
    if (newCounterTypes.includes(type)) {
      setNewCounterTypes(newCounterTypes.filter((t) => t !== type));
    } else {
      setNewCounterTypes([...newCounterTypes, type]);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={editingCounterId ? 'Sửa Quầy Bán Vé' : 'Thêm Quầy Bán Vé Mới'}
      icon={<Store className="w-5 h-5 text-emerald-600" />}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      confirmText="Lưu Khai Báo Quầy"
      maxWidth="md"
    >
      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Điểm Bán Trực Thuộc:</label>
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          >
            {locations.filter(isItemActive).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Mã Quầy POS:</label>
          <input
            type="text"
            value={newCounterCode}
            onChange={(e) => setNewCounterCode(e.target.value)}
            placeholder="e.g. POS-03"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tên Quầy POS:</label>
          <input
            type="text"
            value={newCounterName}
            onChange={(e) => setNewCounterName(e.target.value)}
            placeholder="e.g. Quầy POS Số 03 - Phụ Trách VIP"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-2">
            Chức năng quầy (Cho phép bán):
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-emerald-700 transition">
              <input
                type="checkbox"
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                checked={newCounterTypes.includes('TICKET')}
                onChange={() => handleToggleType('TICKET')}
              />
              <span>Bán Vé</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium hover:text-emerald-700 transition">
              <input
                type="checkbox"
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-600"
                checked={newCounterTypes.includes('DRINK')}
                onChange={() => handleToggleType('DRINK')}
              />
              <span>Bán Đồ ăn / Thức uống</span>
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
};
