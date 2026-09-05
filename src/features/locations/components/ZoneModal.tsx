import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ZoneModalProps {
  editingZoneId: string | null;
  newZoneCode: string; setNewZoneCode: (v: string) => void;
  newZoneName: string; setNewZoneName: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  editingZoneId, newZoneCode, setNewZoneCode, newZoneName, setNewZoneName,
  onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600" /> {editingZoneId ? 'Sửa Khu Kiểm Soát' : 'Thêm Khu Kiểm Soát Mới'}
      </h3>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Mã Khu Kiểm Soát:</label>
          <input type="text" value={newZoneCode} onChange={(e) => setNewZoneCode(e.target.value)} placeholder="e.g. ZONE_GAME" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tên Khu Kiểm Soát:</label>
          <input type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="e.g. Khu C - Công Viên Trò Chơi Mạo Hiểm" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button type="submit" className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Khu Kiểm Soát</button>
      </div>
    </form>
  </div>
);
