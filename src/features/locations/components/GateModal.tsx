import React from 'react';
import { Server } from 'lucide-react';

interface GateModalProps {
  editingGateId: string | null;
  selectedZoneId: string; setSelectedZoneId: (v: string) => void;
  newGateName: string; setNewGateName: (v: string) => void;
  newGateIp: string; setNewGateIp: (v: string) => void;
  newGatePort: number; setNewGatePort: (v: number) => void;
  controlZones: any[];
  isItemActive: (item: any) => boolean;
  onSubmit: () => void;
  onClose: () => void;
}

export const GateModal: React.FC<GateModalProps> = ({
  editingGateId, selectedZoneId, setSelectedZoneId,
  newGateName, setNewGateName, newGateIp, setNewGateIp,
  newGatePort, setNewGatePort, controlZones, isItemActive,
  onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Server className="w-5 h-5 text-teal-600" /> {editingGateId ? 'Sửa Thiết Bị Cổng Soát' : 'Thêm Thiết Bị Cổng Soát'}
      </h3>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Khu Kiểm Soát Trực Thuộc:</label>
          <select value={selectedZoneId} onChange={(e) => setSelectedZoneId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 font-medium">
            {controlZones.filter(isItemActive).map((z) => (
              <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tên Cổng / Thiết Bị Tay Xoay:</label>
          <input type="text" value={newGateName} onChange={(e) => setNewGateName(e.target.value)} placeholder="e.g. Cổng Xoay A3 - Lối Vào VIP" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-teal-500 font-medium" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ IP:</label>
            <input type="text" value={newGateIp} onChange={(e) => setNewGateIp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Port Connection:</label>
            <input type="number" value={newGatePort} onChange={(e) => setNewGatePort(parseInt(e.target.value) || 8080)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-teal-500" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button onClick={onSubmit} className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Thiết Bị Cổng</button>
      </div>
    </div>
  </div>
);
