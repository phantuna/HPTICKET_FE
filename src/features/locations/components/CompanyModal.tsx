import React from 'react';
import { Building2 } from 'lucide-react';

const compressImage = (file: File, callback: (base64: string) => void) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 400; // Giới hạn kích thước siêu nhỏ (vì chỉ dùng làm logo)
      const MAX_HEIGHT = 400;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Nền trắng cho ảnh trong suốt (png)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        // Nén thành dạng JPEG chất lượng trung bình để lấy size cực nhỏ
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(dataUrl);
      } else {
        callback(img.src);
      }
    };
  };
};

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
        <div className="col-span-2 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Upload Ảnh Logo Web (Sẽ được nén tự động):</label>
            <div className="flex flex-col gap-2">
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    compressImage(file, (base64) => {
                      setEditCompLogo(base64);
                    });
                  }
                }} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-emerald-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
              />
              {editCompLogo && (
                <div className="h-12 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center p-1 relative group">
                  <img src={editCompLogo} alt="Preview Web" className="h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                    {(editCompLogo.length / 1024).toFixed(1)} KB
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Upload Ảnh Logo Hóa Đơn (Sẽ được nén tự động):</label>
            <div className="flex flex-col gap-2">
              <input 
                type="file" 
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    compressImage(file, (base64) => {
                      setEditCompInvoiceLogo(base64);
                    });
                  }
                }} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-900 text-sm outline-none focus:ring-1 focus:ring-emerald-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
              />
              {editCompInvoiceLogo && (
                <div className="h-12 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center p-1 relative group">
                  <img src={editCompInvoiceLogo} alt="Preview Hóa Đơn" className="h-full object-contain" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px]">
                    {(editCompInvoiceLogo.length / 1024).toFixed(1)} KB
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
        <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">Hủy</button>
        <button onClick={onSubmit} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs">Lưu Công Ty</button>
      </div>
    </div>
  </div>
);
