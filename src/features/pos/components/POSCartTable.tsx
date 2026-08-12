import React from 'react';
import { Trash2 } from 'lucide-react';
import { ItemType, PaymentMethod } from '../../../shared/types/hpticket';

interface POSCartTableProps {
  lineItems: any[];
  setLineItems: React.Dispatch<React.SetStateAction<any[]>>;
  updateLineItem: (index: number, field: string, value: any) => void;
  selectedGroupCode: string;
  effectiveExtraDiscount: number;
  handleCheckout: (extraDiscount: number) => void;
  subtotalAfterLineDiscounts: number;
  depositAmount: number; setDepositAmount: (v: number) => void;
  extraDiscount: number; setExtraDiscount: (v: number) => void;
  selectedPromotionId: string; setSelectedPromotionId: (v: string) => void;
  remainingPayable: number;
  paymentMethod: PaymentMethod; setPaymentMethod: (v: PaymentMethod) => void;
  totalSubtotalBeforeDiscount: number;
  grandTotal: number;
}

export const POSCartTable: React.FC<POSCartTableProps> = ({
  lineItems, setLineItems, updateLineItem, selectedGroupCode, effectiveExtraDiscount,
  handleCheckout, subtotalAfterLineDiscounts, depositAmount, setDepositAmount,
  extraDiscount, setExtraDiscount, selectedPromotionId, setSelectedPromotionId,
  remainingPayable, paymentMethod, setPaymentMethod, totalSubtotalBeforeDiscount, grandTotal
}) => (
  <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-6">
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200 text-slate-600 font-bold bg-slate-50">
            <th className="py-2.5 px-3">Loại vé / SP</th>
            <th className="py-2.5 px-3 text-center">Số lượt</th>
            <th className="py-2.5 px-3 text-center">Số lượng</th>
            <th className="py-2.5 px-3 text-right">Đơn giá</th>
            <th className="py-2.5 px-3 text-center">Giảm giá %</th>
            <th className="py-2.5 px-3 text-right">Trước thuế</th>
            <th className="py-2.5 px-3 text-right">Thuế VAT</th>
            <th className="py-2.5 px-3 text-right">Thành tiền</th>
            <th className="py-2.5 px-3 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {lineItems.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-8 text-center text-slate-500 italic">Chưa chọn loại vé nào. Vui lòng tick chọn danh sách vé ở cột bên phải.</td>
            </tr>
          ) : (
            lineItems.map((item, index) => {
              const qty = Number(item.quantity) || 0;
              const lineTotal = Math.round(item.unit_price * qty * (1 - item.discount_percent / 100));
              const taxPercent = item.tax_percent !== undefined ? item.tax_percent : (item.item_type === ItemType.PRODUCT ? 10 : 8);
              const taxMultiplier = 1 + (taxPercent / 100);
              const lineBeforeVat = Math.round(lineTotal / taxMultiplier);
              const lineVat = lineTotal - lineBeforeVat;
              
              return (
                <tr key={item.item_id} className="hover:bg-slate-50 transition border-b border-slate-50 last:border-0">
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 max-w-[150px] truncate" title={item.name}>
                      {item.name}
                      {item.item_type === ItemType.PRODUCT && <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">SP</span>}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    {item.item_type === ItemType.TICKET ? (
                      <input
                        type="number" min={1} value={item.allowed_passes_per_unit === '' ? '' : (item.allowed_passes_per_unit || 1)}
                        disabled={selectedGroupCode === 'RETAIL' || selectedGroupCode === 'KHACH_LE'}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newPasses = val === '' ? '' : parseInt(val);
                          setLineItems((prev) => {
                            const updated = [...prev];
                            updated[index].allowed_passes_per_unit = newPasses;
                            if (updated[index].base_price_per_pass && typeof newPasses === 'number') {
                              updated[index].unit_price = newPasses * updated[index].base_price_per_pass!;
                            }
                            return updated;
                          });
                        }}
                        onBlur={() => {
                          if (!item.allowed_passes_per_unit || item.allowed_passes_per_unit < 1) {
                            setLineItems((prev) => {
                              const updated = [...prev];
                              updated[index].allowed_passes_per_unit = 1;
                              if (updated[index].base_price_per_pass) {
                                updated[index].unit_price = updated[index].base_price_per_pass!;
                              }
                              return updated;
                            });
                          }
                        }}
                        className={`w-14 h-8 text-[13px] font-bold text-center border-slate-300 rounded-lg shadow-2xs transition-colors ${
                          (selectedGroupCode === 'RETAIL' || selectedGroupCode === 'KHACH_LE') ? 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-70' : 'focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900'
                        }`}
                      />
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="py-2.5 px-3 text-center align-middle">
                    <div className="inline-flex items-center justify-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                      <button type="button" onClick={() => updateLineItem(index, 'quantity', Math.max(1, (Number(item.quantity) || 0) - 1))} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition">-</button>
                      <input 
                        type="number" 
                        value={item.quantity === '' ? '' : item.quantity} 
                        min={1} 
                        onChange={(e) => {
                          const val = e.target.value;
                          updateLineItem(index, 'quantity', val === '' ? '' : parseInt(val));
                        }} 
                        onBlur={() => {
                          if (!item.quantity || item.quantity < 1) updateLineItem(index, 'quantity', 1);
                        }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCheckout(effectiveExtraDiscount); } }} 
                        className="w-10 py-1 text-center font-mono font-bold text-slate-900 border-x border-slate-200 focus:outline-none focus:bg-emerald-50/50 text-[11px]" 
                      />
                      <button type="button" onClick={() => updateLineItem(index, 'quantity', (Number(item.quantity) || 0) + 1)} className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition">+</button>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{item.unit_price.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-center font-mono">
                    <div className="inline-flex items-center justify-center">
                      <input type="number" value={item.discount_percent} min={0} max={100} onChange={(e) => updateLineItem(index, 'discount_percent', parseFloat(e.target.value) || 0)} className="w-12 bg-white border border-slate-200 rounded px-1 py-1 text-center text-amber-600 font-semibold text-[11px]" />
                      <span className="ml-0.5 text-amber-600 font-bold">%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{lineBeforeVat.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">{lineVat.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{lineTotal.toLocaleString('vi-VN')}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => setLineItems((prev) => prev.filter((_, idx) => idx !== index))} className="text-rose-600 hover:text-rose-800 transition p-1" title="Xóa vé">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    <div className="border-t border-slate-100 pt-5 max-w-md mx-auto space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-slate-700 font-semibold">Thành tiền :</span>
        <span className="font-mono font-bold text-base text-rose-600">{subtotalAfterLineDiscounts.toLocaleString('vi-VN')} đ</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-700 font-semibold">Đặt cọc :</span>
        <input type="number" value={depositAmount || ''} onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)} placeholder="0" className="w-36 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-right font-mono text-slate-900 focus:outline-none focus:border-emerald-500 shadow-xs" />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-slate-700 font-semibold">Giảm giá thêm (KM) :</span>
        <input type="number" value={effectiveExtraDiscount || ''} onChange={(e) => { setExtraDiscount(parseFloat(e.target.value) || 0); if (selectedPromotionId) setSelectedPromotionId(''); }} placeholder="0" className="w-36 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-right font-mono text-amber-600 font-semibold focus:outline-none focus:border-emerald-500 shadow-xs" />
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
        <span className="text-slate-900 font-bold">Còn phải thanh toán :</span>
        <span className="font-mono font-extrabold text-base text-blue-600">{remainingPayable.toLocaleString('vi-VN')} đ</span>
      </div>

      {(() => {
        let orderTotalPreTax = 0, orderTotalTax = 0;
        const totalDiscountToDistribute = Math.max(0, totalSubtotalBeforeDiscount - grandTotal);
        const ticketTotalGross = lineItems.filter(i => i.item_type === ItemType.TICKET).reduce((acc, i) => acc + (i.unit_price * (Number(i.quantity) || 0)), 0);

        lineItems.forEach(item => {
           const itemGross = item.unit_price * (Number(item.quantity) || 0);
           let itemNet = itemGross;
           const taxPercent = item.tax_percent !== undefined ? item.tax_percent : (item.item_type === ItemType.PRODUCT ? 10 : 8);

           if (item.item_type === ItemType.TICKET && ticketTotalGross > 0) {
               const itemDiscountShare = (itemGross * totalDiscountToDistribute) / ticketTotalGross;
               itemNet = itemGross - itemDiscountShare;
           }

           const taxMultiplier = 1 + (taxPercent / 100);
           const preTaxTotal = itemNet / taxMultiplier;
           const taxTotal = itemNet - preTaxTotal;

           orderTotalPreTax += preTaxTotal;
           orderTotalTax += taxTotal;
        });

        return (
          <div className="pt-1 pb-1 space-y-1 border-t border-slate-100 mt-2">
            <div className="flex items-center justify-between text-slate-500 text-[11px]"><span className="italic">- Giá trị trước thuế (VAT):</span><span className="font-mono">{Math.round(orderTotalPreTax).toLocaleString('vi-VN')} đ</span></div>
            <div className="flex items-center justify-between text-slate-500 text-[11px]"><span className="italic">- Thuế VAT:</span><span className="font-mono">{Math.round(orderTotalTax).toLocaleString('vi-VN')} đ</span></div>
          </div>
        );
      })()}

      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-slate-700 font-semibold">Hình thức :</span>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-36 bg-slate-50 border border-slate-200 text-rose-600 font-bold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-rose-500 shadow-xs">
          <option value={PaymentMethod.CASH}>Tiền mặt (CASH)</option>
          <option value={PaymentMethod.BANK_TRANSFER}>Chuyển khoản / QR Code</option>
          <option value={PaymentMethod.CREDIT_CARD}>Thẻ tín dụng</option>
        </select>
      </div>
    </div>
  </div>
);
