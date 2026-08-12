import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ItemType } from '../../../shared/types/hpticket';

interface POSInvoiceFormProps {
  searchBookingCode: string; setSearchBookingCode: (v: string) => void;
  handleCheckBookingCode: () => void;
  selectedCounterId: string; setSelectedCounterId: (v: string) => void;
  counters: any[];
  invoiceCode: string; setInvoiceCode: (v: string) => void;
  selectedGroupCode: string; setSelectedGroupCode: (v: string) => void;
  customerGroups: any[];
  selectedPromotionId: string; setSelectedPromotionId: (v: string) => void;
  promotions: any[];
  setExtraDiscount: (v: number) => void;
  bookingCode: string; setBookingCode: (v: string) => void;
  selectedSourceId: string; setSelectedSourceId: (v: string) => void;
  customerSources: any[];
  setLineItems: React.Dispatch<React.SetStateAction<any[]>>;
  invoiceStatus: string; setInvoiceStatus: (v: string) => void;
  customerName: string; setCustomerName: (v: string) => void;
  companyTaxCode: string; setCompanyTaxCode: (v: string) => void;
  companyAddress: string; setCompanyAddress: (v: string) => void;
  email: string; setEmail: (v: string) => void;
}

export const POSInvoiceForm: React.FC<POSInvoiceFormProps> = ({
  searchBookingCode, setSearchBookingCode, handleCheckBookingCode,
  selectedCounterId, setSelectedCounterId, counters,
  invoiceCode, setInvoiceCode, selectedGroupCode, setSelectedGroupCode, customerGroups,
  selectedPromotionId, setSelectedPromotionId, promotions, setExtraDiscount,
  bookingCode, setBookingCode, selectedSourceId, setSelectedSourceId, customerSources, setLineItems,
  invoiceStatus, setInvoiceStatus, customerName, setCustomerName, companyTaxCode, setCompanyTaxCode,
  companyAddress, setCompanyAddress, email, setEmail
}) => (
  <div className="space-y-5">
    {/* Top Search Bar */}
    <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
        <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">Mã đặt :</span>
        <input
          type="text"
          value={searchBookingCode}
          onChange={(e) => setSearchBookingCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheckBookingCode()}
          placeholder="Nhập mã đặt giữ chỗ..."
          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono shadow-xs"
        />
        <button
          onClick={handleCheckBookingCode}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" /> Kiểm tra
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 font-medium">Quầy bán hàng:</span>
        <select
          value={selectedCounterId}
          onChange={(e) => setSelectedCounterId(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 shadow-xs"
        >
          {counters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Main Form */}
    <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3.5 text-xs">
        {/* Left */}
        <div className="space-y-3">
          <div className="flex items-center">
            <label className="w-[140px] shrink-0 whitespace-nowrap text-slate-700 font-semibold flex items-center gap-1">
              <span className="text-rose-500 font-bold">*</span> Mã HD
            </label>
            <input
              type="text"
              value={invoiceCode}
              onChange={(e) => setInvoiceCode(e.target.value)}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
          <div className="flex items-center">
            <label className="w-[140px] shrink-0 whitespace-nowrap text-slate-700 font-semibold flex items-center gap-1">Nhóm khách hàng</label>
            <select
              value={selectedGroupCode}
              onChange={(e) => {
                setSelectedGroupCode(e.target.value);
                const grp = customerGroups.find((g) => g.code === e.target.value);
                if (grp) {
                  setLineItems((prev) =>
                    prev.map((item) => ({
                      ...item,
                      discount_percent: item.item_type === ItemType.TICKET ? grp.discount_percent : 0
                    }))
                  );
                }
              }}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              {customerGroups.map((g) => (
                <option key={g.id} value={g.code}>{g.name} ({g.discount_percent}% CK)</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="w-[140px] shrink-0 whitespace-nowrap text-slate-700 font-semibold flex items-center gap-1">Khuyến mại</label>
            <select
              value={selectedPromotionId}
              onChange={(e) => {
                setSelectedPromotionId(e.target.value);
                if (!e.target.value) setExtraDiscount(0);
              }}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="">Không áp dụng</option>
              {promotions.map((p) => {
                const isPercent = p.discount_type === 'PERCENTAGE' || p.discount_percent > 0;
                const val = p.discount_percent || p.discount_value || 0;
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} - Giảm {isPercent ? `${val}%` : `${val.toLocaleString('vi-VN')} đ`}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        {/* Right */}
        <div className="space-y-3">
          <div className="flex items-center">
            <label className="w-[140px] shrink-0 whitespace-nowrap text-slate-700 font-semibold flex items-center gap-1">Mã đặt</label>
            <input
              type="text"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              placeholder="Mã tra cứu đặt giữ chỗ"
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            />
          </div>
          <div className="flex items-center">
            <label className="w-[140px] shrink-0 whitespace-nowrap text-slate-700 font-semibold flex items-center gap-1">Nguồn khách</label>
            <select
              value={selectedSourceId}
              onChange={(e) => {
                const sourceId = e.target.value;
                setSelectedSourceId(sourceId);
                if (sourceId) {
                  const source = customerSources.find((s) => s.id === sourceId);
                  if (source) {
                    const groupId = source.customer_group_id || source.customerGroupId;
                    if (groupId) {
                      const group = customerGroups.find((g) => g.id === groupId);
                      if (group) {
                        setSelectedGroupCode(group.code);
                        const discount = group.discount_percent || group.discountPercent || 0;
                        setLineItems((prev) =>
                          prev.map((item) => ({
                            ...item,
                            discount_percent: item.item_type === ItemType.TICKET ? discount : item.discount_percent
                          }))
                        );
                      }
                    }
                  }
                } else {
                  setSelectedGroupCode('');
                  setLineItems((prev) =>
                    prev.map((item) => ({
                      ...item,
                      discount_percent: item.item_type === ItemType.TICKET ? 0 : item.discount_percent
                    }))
                  );
                }
              }}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 shadow-xs"
            >
              <option value="">Không chọn</option>
              {customerSources.map((s) => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-slate-200 pt-3">
         <label className="flex items-center gap-2 cursor-pointer w-max mb-3 text-slate-800 hover:text-emerald-700 transition">
            <input 
              type="checkbox" 
              checked={invoiceStatus === 'IMMEDIATE'} 
              onChange={(e) => {
                 const isImmediate = e.target.checked;
                 setInvoiceStatus(isImmediate ? 'IMMEDIATE' : 'PENDING');
                 if (!isImmediate) {
                    setCustomerName('Khách lẻ không lấy hóa đơn');
                    setCompanyTaxCode('');
                    setCompanyAddress('');
                    setEmail('');
                 } else {
                    setCustomerName('');
                 }
              }} 
              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
            />
            <span className="font-bold text-[13px]">Xuất hóa đơn điện tử công ty (Lấy mã tra cứu ngay)</span>
         </label>

         {invoiceStatus === 'IMMEDIATE' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
               <div>
                 <label className="block text-[11px] font-semibold text-slate-600 mb-1">Mã số thuế (*)</label>
                 <input type="text" value={companyTaxCode} onChange={e => setCompanyTaxCode(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 shadow-xs" placeholder="010888999" />
               </div>
               <div>
                 <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên khách hàng / Công ty (*)</label>
                 <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 shadow-xs" placeholder="CÔNG TY TNHH ABC" />
               </div>
               <div>
                 <label className="block text-[11px] font-semibold text-slate-600 mb-1">Địa chỉ công ty</label>
                 <input type="text" value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 shadow-xs" placeholder="Số nhà, đường, phường..." />
               </div>
               <div>
                 <label className="block text-[11px] font-semibold text-slate-600 mb-1">Email nhận HĐ</label>
                 <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500 shadow-xs" placeholder="abc@email.com" />
               </div>
            </div>
         )}
      </div>
    </div>
  </div>
);
