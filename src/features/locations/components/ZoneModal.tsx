import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Modal } from '../../../shared/components/ui';

interface ZoneModalProps {
  editingZoneId: string | null;
  newZoneCode: string;
  setNewZoneCode: (v: string) => void;
  newZoneName: string;
  setNewZoneName: (v: string) => void;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  editingZoneId,
  newZoneCode,
  setNewZoneCode,
  newZoneName,
  setNewZoneName,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={editingZoneId ? 'Sửa Khu Kiểm Soát' : 'Thêm Khu Kiểm Soát Mới'}
    icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
    isSubmitting={isSubmitting}
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    confirmText="Lưu Khu Kiểm Soát"
    maxWidth="md"
  >
    <div className="space-y-3 text-xs">
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Mã Khu Kiểm Soát:</label>
        <input
          type="text"
          value={newZoneCode}
          onChange={(e) => setNewZoneCode(e.target.value)}
          placeholder="e.g. ZONE_GAME"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Tên Khu Kiểm Soát:</label>
        <input
          type="text"
          value={newZoneName}
          onChange={(e) => setNewZoneName(e.target.value)}
          placeholder="e.g. Khu C - Công Viên Trò Chơi Mạo Hiểm"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
        />
      </div>
    </div>
  </Modal>
);
