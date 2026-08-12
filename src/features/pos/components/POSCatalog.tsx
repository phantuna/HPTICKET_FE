import React from 'react';
import { Ticket, Package, Layers } from 'lucide-react';
import { ItemType } from '../../../shared/types/hpticket';

interface POSCatalogProps {
  activeListTab: string; setActiveListTab: (v: string) => void;
  ticketTemplates: any[];
  ticketZones: any[];
  products: any[];
  lineItems: any[];
  handleToggleItem: (item: any, type: ItemType) => void;
}

export const POSCatalog: React.FC<POSCatalogProps> = ({
  activeListTab, setActiveListTab, ticketTemplates, ticketZones, products, lineItems, handleToggleItem
}) => (
  <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col">
    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
      <button onClick={() => setActiveListTab('TICKETS')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${activeListTab === 'TICKETS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}>
        <Ticket className="w-4 h-4 inline-block mr-1.5" /> Vé Tham Quan
      </button>
      <button onClick={() => setActiveListTab('PRODUCTS')} className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${activeListTab === 'PRODUCTS' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'text-slate-500 hover:bg-slate-50'}`}>
        <Package className="w-4 h-4 inline-block mr-1.5" /> Dịch Vụ / Nước
      </button>
    </div>

    <div className="space-y-2 flex-1 overflow-y-auto pr-1 text-xs scrollbar-thin max-h-[460px]">
      {activeListTab === 'TICKETS' ? (
        ticketTemplates.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">Chưa có mẫu vé nào đang kích hoạt.</div>
        ) : (
          (() => {
            const groupedTpls: Record<string, any[]> = {};
            ticketTemplates.forEach((tpl) => {
              const zId = tpl.ticket_zone_id || tpl.ticket_name_id || 'uncategorized';
              if (!groupedTpls[zId]) groupedTpls[zId] = [];
              groupedTpls[zId].push(tpl);
            });

            return Object.entries(groupedTpls).map(([zId, tpls]) => {
              const zone = ticketZones.find((z) => z.id === zId);
              const zoneName = zone ? zone.name : 'Vé Khác (Chưa phân nhóm)';
              
              return (
                <div key={zId} className="mb-4 last:mb-0">
                  <div className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-lg mb-2 text-[11px] flex items-center gap-1.5 border border-emerald-200">
                    <Layers className="w-3.5 h-3.5" /> {zoneName}
                  </div>
                  <div className="space-y-2">
                    {tpls.map((tpl) => {
                      const selectedItem = lineItems.find((item) => item.item_id === tpl.id);
                      const isSelected = Boolean(selectedItem);
                      return (
                        <div key={tpl.id} onClick={() => handleToggleItem(tpl, ItemType.TICKET)} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${isSelected ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'}`}>
                          <input type="checkbox" checked={isSelected} readOnly className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-0 focus:ring-offset-0 cursor-pointer pointer-events-none" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-xs leading-tight">{tpl.name}</p>
                              {isSelected && <span className="ml-2 px-1.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] font-bold">x{selectedItem?.quantity || 1}</span>}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-[10px] font-mono text-slate-500">{tpl.code}</span>
                              <span className="text-xs font-mono font-bold text-emerald-700">{tpl.price.toLocaleString('vi-VN')} đ</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()
        )
      ) : (
        products.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-300">Chưa có hàng hóa nào.</div>
        ) : (
          products.map((p) => {
            const selectedItem = lineItems.find((item) => item.item_id === p.id);
            const isSelected = Boolean(selectedItem);
            return (
              <div key={p.id} onClick={() => handleToggleItem(p, ItemType.PRODUCT)} className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition select-none ${isSelected ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                <input type="checkbox" checked={isSelected} readOnly className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-0 focus:ring-offset-0 cursor-pointer pointer-events-none" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-xs leading-tight">{p.name}</p>
                    {isSelected && <span className="ml-2 px-1.5 py-0.5 bg-amber-600 text-white rounded-full text-[10px] font-bold">x{selectedItem?.quantity || 1}</span>}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-mono text-slate-500">{p.code}</span>
                    <span className="text-xs font-mono font-bold text-amber-700">{p.price.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  </div>
);
