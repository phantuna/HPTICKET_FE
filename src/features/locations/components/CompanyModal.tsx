import React from 'react';
import { Building2 } from 'lucide-react';

import { systemService } from '../../../api/systemService';
import { API_BASE_URL } from '../../../api/apiConfig';

interface CompanyModalProps {
  editCompCode: string; setEditCompCode: (v: string) => void;
  editCompName: string; setEditCompName: (v: string) => void;
  editCompAddress: string; setEditCompAddress: (v: string) => void;
  editCompPhone: string; setEditCompPhone: (v: string) => void;
  editCompFax: string; setEditCompFax: (v: string) => void;
  editCompTaxCode: string; setEditCompTaxCode: (v: string) => void;
  editCompContact: string; setEditCompContact: (v: string) => void;
  editCompEmail: string; setEditCompEmail: (v: string) => void;
  editCompLogo: string; setEditCompLogo: (v: string) => void;
  editCompInvoiceLogo: string; setEditCompInvoiceLogo: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  editCompCode, setEditCompCode, editCompName, setEditCompName,
  editCompAddress, setEditCompAddress, editCompPhone, setEditCompPhone,
  editCompFax, setEditCompFax, editCompTaxCode, setEditCompTaxCode,
  editCompContact, setEditCompContact, editCompEmail, setEditCompEmail, editCompLogo, setEditCompLogo,
  editCompInvoiceLogo, setEditCompInvoiceLogo,
  onSubmit, onClose
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-900">
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
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Upload Ảnh Logo Web (Sẽ được nén tự động trên Server):</label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Preview immediately
                    setEditCompLogo(URL.createObjectURL(file));
                    // Upload to backend
                    try {
                      // Extract old filename from URL if it's already a backend URL
                      let oldFilename = undefined;
                      if (editCompLogo && editCompLogo.includes('/system/files/logos/')) {
                         oldFilename = editCompLogo.split('/').pop();
                      }
                      const res = await systemService.uploadLogo(file, 'web_logo', oldFilename);
                      if (res && res.code === 200 && res.data) {
                        setEditCompLogo(API_BASE_URL + res.data.url);
                      }
                    } catch (err) {
                      console.error("Upload failed", err);
                    }
                  }
                }}
                className="text-sm border border-slate-200 rounded p-1 w-full"
              />
              {editCompLogo && (
                <div className="h-12 flex items-center gap-2">
                  <img src={editCompLogo === '/logo.png' ? editCompLogo : (editCompLogo.startsWith('http') ? editCompLogo : (editCompLogo.startsWith('blob:') || editCompLogo.startsWith('data:') ? editCompLogo : API_BASE_URL + editCompLogo))} alt="Preview Web" className="h-full object-contain" />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Upload Ảnh Logo Hóa Đơn (Sẽ được nén tự động trên Server):</label>
            <div className="flex gap-4 items-center">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Preview immediately
                    setEditCompInvoiceLogo(URL.createObjectURL(file));
                    // Upload to backend
                    try {
                      let oldFilename = undefined;
                      if (editCompInvoiceLogo && editCompInvoiceLogo.includes('/system/files/logos/')) {
                         oldFilename = editCompInvoiceLogo.split('/').pop();
                      }
                      const res = await systemService.uploadLogo(file, 'invoice_logo', oldFilename);
                      if (res && res.code === 200 && res.data) {
                        setEditCompInvoiceLogo(API_BASE_URL + res.data.url);
                      }
                    } catch (err) {
                      console.error("Upload failed", err);
                    }
                  }
                }}
                className="text-sm border border-slate-200 rounded p-1 w-full"
              />
              {editCompInvoiceLogo && (
                <div className="h-12 flex items-center gap-2">
                  <img src={editCompInvoiceLogo === '/logo.png' ? editCompInvoiceLogo : (editCompInvoiceLogo.startsWith('http') ? editCompInvoiceLogo : (editCompInvoiceLogo.startsWith('blob:') || editCompInvoiceLogo.startsWith('data:') ? editCompInvoiceLogo : API_BASE_URL + editCompInvoiceLogo))} alt="Preview Hóa Đơn" className="h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button type="submit" className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Công Ty</button>
      </div>
    </form>
  </div>
);
