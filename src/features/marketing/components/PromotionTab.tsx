import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { Promotion, HolidayPolicy, Holiday } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';
import { usePermission } from '../../../shared/hooks/usePermission';
import { DetailsModal } from '../../../shared/components/DetailsModal';
import { VNDateInput } from '../../../shared/components/ui';

interface PromotionTabProps {
  promotions: Promotion[];
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  ticketTemplates: any[];
  holidays?: Holiday[];
  refreshData: (force?: boolean) => void;
}

export const PromotionTab: React.FC<PromotionTabProps> = ({ promotions, setPromotions, ticketTemplates, holidays = [], refreshData }) => {
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotionForDetails, setSelectedPromotionForDetails] = useState<any>(null);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  const [newPromoName, setNewPromoName] = useState('');
  const [newPromoStart, setNewPromoStart] = useState('2026-07-27');
  const [newPromoEnd, setNewPromoEnd] = useState('2026-07-28');
  const [newPromoTickets, setNewPromoTickets] = useState<string[]>([]);
  const [newPromoQty, setNewPromoQty] = useState<number | ''>(1);
  const [newPromoValue, setNewPromoValue] = useState<number | ''>(10);
  const [newHolidayPolicy, setNewHolidayPolicy] = useState<HolidayPolicy>('ALL_DAYS');
  const [newPromoHolidayId, setNewPromoHolidayId] = useState<string>('');

  const handleSave = async () => {
    if (!newPromoName) { toast.error('Vui lòng nhập Tên Khuyến mãi!'); return; }
    const payload = {
      code: `KM-${Date.now()}`,
      name: newPromoName.trim(),
      discount_type: 'PERCENTAGE',
      discount_value: 0,
      discount_percent: newPromoValue,
      start_date: newPromoStart,
      end_date: newPromoEnd,
      applicable_tickets: newPromoTickets,
      quantity: newPromoQty,
      holiday_policy: newHolidayPolicy,
      holiday_id: (newHolidayPolicy === 'HOLIDAY_ONLY' && newPromoHolidayId) ? newPromoHolidayId : undefined,
      is_active: true,
    };
    try {
      if (editingPromoId) {
        await marketingService.updatePromotion(editingPromoId, payload);
        toast.success('Cập nhật khuyến mãi thành công!');
      } else {
        await marketingService.createPromotion(payload);
        toast.success('Tạo khuyến mãi mới thành công!');
      }
      refreshData(true);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Không thể lưu chương trình khuyến mãi!');
    }
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
            header: 'Chính sách lễ',
            accessor: (row: any) => {
              const policy = row.holiday_policy || 'ALL_DAYS';
              if (policy === 'NORMAL_ONLY') {
                return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Chỉ ngày thường</span>;
              }
              if (policy === 'HOLIDAY_ONLY') {
                return (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200" title={row.holiday_name || 'Tất cả các ngày lễ'}>
                    🎉 {row.holiday_name ? row.holiday_name : 'Chỉ ngày lễ'}
                  </span>
                );
              }
              return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">Tất cả các ngày</span>;
            },
            className: 'w-36 text-center'
          },
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
          setNewHolidayPolicy('ALL_DAYS');
          setNewPromoHolidayId('');
          setShowModal(true);
        }}
        onEdit={can('UPDATE_PROMOTION') ? ((item: any) => {
          setEditingPromoId(item.id);
          setNewPromoName(item.name);
          setNewPromoStart(item.start_date ? String(item.start_date).split('T')[0] : new Date().toISOString().split('T')[0]);
          setNewPromoEnd(item.end_date ? String(item.end_date).split('T')[0] : new Date().toISOString().split('T')[0]);
          setNewPromoTickets(item.applicable_tickets || []);
          setNewPromoQty(item.quantity || 1);
          setNewPromoValue(item.discount_percent > 0 ? item.discount_percent : (item.discount_value || 10));
          setNewHolidayPolicy(item.holiday_policy || 'ALL_DAYS');
          setNewPromoHolidayId(item.holiday_id || '');
          setShowModal(true);
        }) : undefined}
        onDelete={can('DELETE_PROMOTION') ? handleDelete : undefined}
        onToggleActive={can('UPDATE_PROMOTION') ? handleToggleActive : undefined}
        onViewDetails={(item: any) => setSelectedPromotionForDetails(item)}
        hideAddButton={!can('CREATE_PROMOTION')}
        hideDeleteButton={!can('DELETE_PROMOTION')}
      />

      {selectedPromotionForDetails && (
        <DetailsModal
          title="Chi tiết Chương trình Khuyến mại"
          fields={[
            { label: 'Mã chương trình', value: selectedPromotionForDetails.code || selectedPromotionForDetails.id },
            { label: 'Tên chương trình', value: selectedPromotionForDetails.name },
            {
              label: 'Thời gian áp dụng',
              value: `${selectedPromotionForDetails.start_date ? String(selectedPromotionForDetails.start_date).split('T')[0] : 'N/A'} đến ${selectedPromotionForDetails.end_date ? String(selectedPromotionForDetails.end_date).split('T')[0] : 'N/A'}`
            },
            { label: 'Giảm giá', value: `${selectedPromotionForDetails.discount_percent || selectedPromotionForDetails.discount_value || 10}%` },
            { label: 'Số lượng', value: selectedPromotionForDetails.quantity || 'Không giới hạn' },
            {
              label: 'Trạng thái',
              value: (selectedPromotionForDetails.is_active ?? selectedPromotionForDetails.isActive ?? selectedPromotionForDetails.active) ? 'Đang kích hoạt' : 'Đã khóa'
            },
            {
              label: 'Chính sách ngày lễ',
              value: selectedPromotionForDetails.holiday_policy === 'HOLIDAY_ONLY'
                ? `Chỉ áp dụng ngày lễ (${selectedPromotionForDetails.holiday_name || 'Tất cả các ngày lễ'})`
                : selectedPromotionForDetails.holiday_policy === 'NORMAL_ONLY'
                  ? 'Chỉ áp dụng ngày thường (Không áp dụng ngày lễ)'
                  : 'Áp dụng tất cả các ngày (Cả ngày thường & ngày lễ)'
            },
            {
              label: 'Danh sách vé áp dụng',
              value: (
                <div className="flex flex-col gap-1 mt-1">
                  {(!selectedPromotionForDetails.applicable_tickets || selectedPromotionForDetails.applicable_tickets.length === 0)
                    ? 'Tất cả các loại vé'
                    : selectedPromotionForDetails.applicable_tickets.map((id: string, i: number) => {
                      const t = ticketTemplates.find((tpl: any) => tpl.id === id || tpl.code === id);
                      return <span key={i}>• {t ? t.name : id}</span>;
                    })
                  }
                </div>
              ),
              isFullWidth: true
            }
          ]}
          onClose={() => setSelectedPromotionForDetails(null)}
        />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setShowModal(false);
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl text-slate-900"
          >
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
                <div className="flex-1">
                  <VNDateInput
                    value={newPromoStart}
                    onChange={setNewPromoStart}
                    className="w-full bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="w-32 shrink-0 font-medium text-slate-700">
                  <span className="text-red-500 mr-1">*</span>Đến ngày
                </label>
                <div className="flex-1">
                  <VNDateInput
                    value={newPromoEnd}
                    onChange={setNewPromoEnd}
                    className="w-full bg-transparent border-b border-slate-400 py-1 outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>
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
                  <span className="text-red-500 mr-1">*</span>Chính sách ngày lễ
                </label>
                <select
                  value={newHolidayPolicy}
                  onChange={(e) => {
                    const val = e.target.value as HolidayPolicy;
                    setNewHolidayPolicy(val);
                    if (val !== 'HOLIDAY_ONLY') setNewPromoHolidayId('');
                  }}
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-xs font-semibold"
                >
                  <option value="ALL_DAYS">Tất cả các ngày (Cả ngày thường & ngày lễ)</option>
                  <option value="NORMAL_ONLY">Chỉ ngày thường (Không áp dụng ngày lễ)</option>
                  <option value="HOLIDAY_ONLY">Chỉ áp dụng vào ngày lễ</option>
                </select>
              </div>

              {newHolidayPolicy === 'HOLIDAY_ONLY' && (
                <div className="flex items-center gap-4 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                  <label className="w-32 shrink-0 font-semibold text-amber-900 text-xs">
                    Ngày lễ áp dụng:
                  </label>
                  <select
                    value={newPromoHolidayId}
                    onChange={(e) => setNewPromoHolidayId(e.target.value)}
                    className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-1.5 outline-none focus:border-amber-500 text-xs font-medium"
                  >
                    <option value="">-- Áp dụng cho TẤT CẢ các ngày lễ --</option>
                    {(holidays || []).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code || 'Lễ'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Khuyến Mại
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
