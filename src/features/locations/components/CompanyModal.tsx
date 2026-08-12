import React from 'react';
import { Building2 } from 'lucide-react';

interface CompanyModalProps {
  editCompCode: string; setEditCompCode: (v: string) => void;
  editCompName: string; setEditCompName: (v: string) => void;
  editCompAddress: string; setEditCompAddress: (v: string) => void;
  editCompPhone: string; setEditCompPhone: (v: string) => void;
  editCompFax: string; setEditCompFax: (v: string) => void;
  editCompTaxCode: string; setEditCompTaxCode: (v: string) => void;
  editCompEmail: string; setEditCompEmail: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  editCompCode, setEditCompCode, editCompName, setEditCompName,
  editCompAddress, setEditCompAddress, editCompPhone, setEditCompPhone,
  editCompFax, setEditCompFax, editCompTaxCode, setEditCompTaxCode,
  editCompEmail, setEditCompEmail, onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-900">
      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
        <Building2 className="w-5 h-5 text-emerald-600" /> Sửa Thông Tin Công Ty
      </h3>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Mã Công Ty:</label>
          <input type="text" value={editCompCode} onChange={(e) => setEditCompCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tên Công Ty:</label>
          <input type="text" value={editCompName} onChange={(e) => setEditCompName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium" />
        </div>
        <div className="col-span-2">
          <label className="block text-slate-700 font-semibold mb-1">Địa chỉ trụ sở:</label>
          <input type="text" value={editCompAddress} onChange={(e) => setEditCompAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Số điện thoại:</label>
          <input type="text" value={editCompPhone} onChange={(e) => setEditCompPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Fax:</label>
          <input type="text" value={editCompFax} onChange={(e) => setEditCompFax(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Mã Số Thuế:</label>
          <input type="text" value={editCompTaxCode} onChange={(e) => setEditCompTaxCode(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1">Email:</label>
          <input type="text" value={editCompEmail} onChange={(e) => setEditCompEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button onClick={onSubmit} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Công Ty</button>
      </div>
    </div>
  </div>
);
