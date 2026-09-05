import React from 'react';
import { MapPin } from 'lucide-react';

interface LocationModalProps {
  editingLocId: string | null;
  newLocCode: string; setNewLocCode: (v: string) => void;
  newLocName: string; setNewLocName: (v: string) => void;
  newLocAddress: string; setNewLocAddress: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  editingLocId, newLocCode, setNewLocCode, newLocName, setNewLocName,
  newLocAddress, setNewLocAddress, onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <MapPin className="w-5 h-5 text-amber-600" /> {editingLocId ? 'Sửa Điểm Bán Vé' : 'Thêm Điểm Bán Vé Mới'}
      </h3>
      <div className="space-y-3 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Mã Điểm Bán:</label>
          <input type="text" value={newLocCode} onChange={(e) => setNewLocCode(e.target.value)} placeholder="e.g. LOC-EAST" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tên Điểm Bán Vé:</label>
          <input type="text" value={newLocName} onChange={(e) => setNewLocName(e.target.value)} placeholder="e.g. Quầy Vé Cổng Đông Lễ Hội" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-amber-500 font-medium" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Điểm Bán:</label>
          <input type="text" value={newLocAddress} onChange={(e) => setNewLocAddress(e.target.value)} placeholder="e.g. Khu vực cửa nam công viên..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-amber-500" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button type="submit" className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Khai Báo</button>
      </div>
    </form>
  </div>
);
