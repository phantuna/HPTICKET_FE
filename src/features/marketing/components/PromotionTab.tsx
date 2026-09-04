import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { Promotion } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';

interface PromotionTabProps {
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  ticketTemplates: any[];
  refreshData: (force?: boolean) => void;
}

export const PromotionTab: React.FC<PromotionTabProps> = ({ promotions, setPromotions, ticketTemplates, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoStart, setNewPromoStart] = useState('2026-07-27');
  const [newPromoEnd, setNewPromoEnd] = useState('2026-07-28');
  const [newPromoTickets, setNewPromoTickets] = useState<string[]>([]);
  const [newPromoQty, setNewPromoQty] = useState<number | ''>(1);
  const [newPromoValue, setNewPromoValue] = useState<number | ''>(10);

  const handleSave = async () => {
    if (!newPromoName) { toast.error('Vui lòng nhập Tên Khuyến mãi!'); return; }
    const payload = {
      code: `KM-${Date.now()}`,
      name: newPromoName,
      discount_type: 'PERCENTAGE',
      discount_value: 0,
      discount_percent: newPromoValue,
      start_date: newPromoStart,
      end_date: newPromoEnd,
      applicable_tickets: newPromoTickets,
      quantity: newPromoQty,
      is_active: true,
    };
    if (editingPromoId) {
      await marketingService.updatePromotion(editingPromoId, payload);
    } else {
      await marketingService.createPromotion(payload);
    }
    refreshData(true);
    setShowModal(false);
  };

  const handleDelete = (ids: (string | number)[]) => {
    ids.forEach((id) => marketingService.deletePromotion(String(id)));
    setPromotions((prev) => prev.filter((p) => !ids.includes(p.id)));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await marketingService.updatePromotionStatus(id, !currentActive);
      if (res.code === 200) {
        setPromotions((prev) => prev.map((p: any) => p.id === id ? { ...p, is_active: !currentActive, isActive: !currentActive, active: !currentActive } : p));
      }
    } catch (err) { toast.error('Cập nhật thất bại'); }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CHƯƠNG TRÌNH KHUYẾN MẠI"
        data={promotions}
        columns={[
          { header: 'Mã / ID', accessor: (row: any, idx) => row.code || row.id || idx + 1, className: 'w-20 font-mono' },
          { header: 'Chương trình', accessor: 'name', className: 'font-semibold text-slate-900' },
          {
            header: 'Từ ngày',
            accessor: (row: any) => {
              if (!row.start_date) return '';
              const d = new Date(row.start_date);
              if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return row.start_date;
            },
            className: 'text-slate-700',
          },
          {
            header: 'Đến ngày',
            accessor: (row: any) => {
              if (!row.end_date) return '';
              const d = new Date(row.end_date);
              if (!isNaN(d.getTime())) return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
              return row.end_date;
            },
            className: 'text-slate-700',
          },
          {
            header: 'Tên vé',
            accessor: (row: any) => {
              if (!row.applicable_tickets || row.applicable_tickets.length === 0) return 'Tất cả';
              return (
                <div className="flex flex-col gap-1.5 py-1">
                  {row.applicable_tickets.map((id: string, i: number) => {
                    const t = ticketTemplates.find((tpl: any) => tpl.id === id || tpl.code === id);
                    const name = t ? t.name : id;
                    return (
                      <span key={i} className="text-xs text-slate-700 font-medium leading-relaxed" title={name}>
                        • {name}
                      </span>
                    );
                  })}
                </div>
              );
            },
            className: 'text-slate-700',
          },
          { header: 'Số lượng', accessor: (row: any) => row.quantity || '∞', className: 'text-slate-700' },
          { header: 'Giảm giá', accessor: (row: any) => row.discount_percent || row.discount_value || 10, className: 'font-mono font-semibold text-emerald-700' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingPromoId(null);
          setNewPromoName('');
          setNewPromoStart(new Date().toISOString().split('T')[0]);
          setNewPromoEnd(new Date().toISOString().split('T')[0]);
          setNewPromoTickets([]);
          setNewPromoQty(1);
          setNewPromoValue(10);
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingPromoId(item.id);
          setNewPromoName(item.name);
          setNewPromoStart(item.start_date ? String(item.start_date).split('T')[0] : new Date().toISOString().split('T')[0]);
          setNewPromoEnd(item.end_date ? String(item.end_date).split('T')[0] : new Date().toISOString().split('T')[0]);
          setNewPromoTickets(item.applicable_tickets || []);
          setNewPromoQty(item.quantity || 1);
          setNewPromoValue(item.discount_percent > 0 ? item.discount_percent : (item.discount_value || 10));
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Gift className="w-5 h-5 text-emerald-600" /> {editingPromoId ? 'Sửa Khuyến Mại' : 'Thêm Chương Trình Khuyến Mại'}
            </h3>
            <div className="space-y-4 text-sm text-slate-800">
              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Tên chương trình
                </label>
                <input
                  type="text"
                  value={newPromoName}
                  onChange={(e) => setNewPromoName(e.target.value)}
                  className="flex-1 bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Từ ngày
                </label>
                <input
                  type="date"
                  value={newPromoStart}
                  onChange={(e) => setNewPromoStart(e.target.value)}
                  className="flex-1 bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Đến ngày
                </label>
                <input
                  type="date"
                  value={newPromoEnd}
                  onChange={(e) => setNewPromoEnd(e.target.value)}
                  className="flex-1 bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <div className="flex items-start gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700 mt-1">
                  <span className="text-red-500 mr-1">*</span>Vé áp dụng
                </label>
                <div className="flex-1 flex flex-wrap gap-x-5 gap-y-3 max-h-40 overflow-y-auto p-1">
                  {ticketTemplates.map((t) => {
                    const isChecked = newPromoTickets.includes(t.id || t.code);
                    return (
                      <label key={t.id} className="flex items-center gap-2 cursor-pointer bg-white border border-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:opacity-80 transition-all shadow-sm">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const val = t.id || t.code;
                            if (e.target.checked) setNewPromoTickets(prev => [...prev, val]);
                            else setNewPromoTickets(prev => prev.filter(v => v !== val));
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-mono font-semibold text-slate-700 whitespace-nowrap" title={t.name}>{t.code || t.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Số lượng
                </label>
                <input
                  type="number"
                  min={1}
                  value={newPromoQty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewPromoQty(val === '' ? '' : parseInt(val, 10));
                  }}
                  className="flex-1 bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Giảm giá
                </label>
                <div className="flex-1 flex items-center border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
                  <input
                    type="number"
                    value={newPromoValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewPromoValue(val === '' ? '' : parseFloat(val));
                    }}
                    className="flex-1 bg-transparent py-1 outline-none font-mono"
                  />
                  <span className="text-slate-500 px-2">%</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Khuyến Mại
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
