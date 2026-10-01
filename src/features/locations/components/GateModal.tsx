import React from 'react';
import { Server } from 'lucide-react';
import { Modal } from '../../../shared/components/ui';

interface GateModalProps {
  editingGateId: string | null;
  selectedZoneId: string;
  setSelectedZoneId: (v: string) => void;
  newGateName: string;
  setNewGateName: (v: string) => void;
  newGateIp: string;
  setNewGateIp: (v: string) => void;
  newGatePort: number;
  setNewGatePort: (v: number) => void;
  controlZones: any[];
  isItemActive: (item: any) => boolean;
  isSubmitting?: boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export const GateModal: React.FC<GateModalProps> = ({
  editingGateId,
  selectedZoneId,
  setSelectedZoneId,
  newGateName,
  setNewGateName,
  newGateIp,
  setNewGateIp,
  newGatePort,
  setNewGatePort,
  controlZones,
  isItemActive,
  isSubmitting = false,
  onSubmit,
  onClose,
}) => (
  <Modal
    isOpen={true}
    onClose={onClose}
    title={editingGateId ? 'Sửa Thiết Bị Cổng Soát' : 'Thêm Thiết Bị Cổng Soát'}
    icon={<Server className="w-5 h-5 text-emerald-600" />}
    isSubmitting={isSubmitting}
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
    confirmText="Lưu Thiết Bị Cổng"
    maxWidth="md"
  >
    <div className="space-y-3 text-xs">
      <div>
        <label className="block text-slate-700 font-semibold mb-1">Khu Kiểm Soát Trực Thuộc:</label>
        <select
          value={selectedZoneId}
          onChange={(e) => setSelectedZoneId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
        >
          {controlZones.filter(isItemActive).map((z) => (
            <option key={z.id} value={z.id}>
              {z.name} ({z.code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Tên Cổng / Thiết Bị Tay Xoay:
        </label>
        <input
          type="text"
          value={newGateName}
          onChange={(e) => setNewGateName(e.target.value)}
          placeholder="e.g. Cổng Xoay A3 - Lối Vào VIP"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ IP:</label>
          <input
            type="text"
            value={newGateIp}
            onChange={(e) => setNewGateIp(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Port Connection:</label>
          <input
            type="number"
            value={newGatePort}
            onChange={(e) => setNewGatePort(parseInt(e.target.value) || 8080)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  </Modal>
);
