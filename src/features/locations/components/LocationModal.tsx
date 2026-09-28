import React from 'react';
import { MapPin } from 'lucide-react';
import { Modal } from '../../../shared/components/ui';

interface LocationModalProps {
  editingLocId: string | null;
  newLocCode: string;
  setNewLocCode: (v: string) => void;
  newLocName: string;
  setNewLocName: (v: string) => void;
  newLocAddress: string;
  setNewLocAddress: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  editingLocId,
  newLocCode,
  setNewLocCode,
  newLocName,
  setNewLocName,
  newLocAddress,
  setNewLocAddress,
  onSubmit,
  onClose,
}) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={editingLocId ? 'Sửa Điểm Bán Vé' : 'Thêm Điểm Bán Vé Mới'}
    icon={<MapPin className="w-5 h-5 text-emerald-600" />}
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    confirmText="Lưu Khai Báo"
    maxWidth="md"
  >
    <div className="space-y-3 text-xs">
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Mã Điểm Bán:</label>
        <input
          type="text"
          value={newLocCode}
          onChange={(e) => setNewLocCode(e.target.value)}
          placeholder="e.g. LOC-EAST"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Tên Điểm Bán Vé:</label>
        <input
          type="text"
          value={newLocName}
          onChange={(e) => setNewLocName(e.target.value)}
          placeholder="e.g. Quầy Vé Cổng Đông Lễ Hội"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
        />
      </div>
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Điểm Bán:</label>
        <input
          type="text"
          value={newLocAddress}
          onChange={(e) => setNewLocAddress(e.target.value)}
          placeholder="e.g. Khu vực cửa nam công viên..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  </Modal>
);
