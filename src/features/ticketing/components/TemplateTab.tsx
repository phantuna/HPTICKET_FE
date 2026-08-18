import React, { useState } from 'react';
import { Ticket } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { TicketTemplate, AudienceType, TicketZone } from '../../../shared/types/hpticket';
import { ticketingService } from '../../../api/ticketingService';
import { toast } from '../../../shared/utils/toast';

interface TemplateTabProps {
  ticketTemplates: TicketTemplate[];
  setTicketTemplates: React.Dispatch<React.SetStateAction<TicketTemplate[]>>;
  audienceTypes: AudienceType[];
  ticketZones: TicketZone[];
  refreshData: () => void;
}

export const TemplateTab: React.FC<TemplateTabProps> = ({
  ticketTemplates,
  setTicketTemplates,
  audienceTypes,
  ticketZones,
  refreshData
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<TicketTemplate | null>(null);

  const [newTplCode, setNewTplCode] = useState('');
  const [newTplName, setNewTplName] = useState('');
  const [newTplPrice, setNewTplPrice] = useState<number>(100000);
  const [newTplTaxPercent, setNewTplTaxPercent] = useState<number>(8);
  const [selectedAudId, setSelectedAudId] = useState(audienceTypes[0]?.id || '');
  const [selectedTicketZoneId, setSelectedTicketZoneId] = useState(ticketZones[0]?.id || '');
  const [newValidDays, setNewValidDays] = useState<string[]>(['2', '3', '4', '5', '6', '7', '8']);
  const [newIsHoliday, setNewIsHoliday] = useState<boolean>(false);
  const [newIsPromo, setNewIsPromo] = useState<boolean>(false);
  const [newTicketType, setNewTicketType] = useState<'SINGLE' | 'MULTI' | 'UNLIMITED'>('SINGLE');
  const [newValidityDays, setNewValidityDays] = useState<number>(1);
  const [newAllowedPasses, setNewAllowedPasses] = useState<number>(1);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  const handleSave = async () => {
    if (!newTplCode || !newTplName) { toast.error('Vui lòng nhập đầy đủ Mã Mẫu Vé và Tên Mẫu Vé!'); return; }

    if (editingTpl) {
      const updatedItem = {
        ...editingTpl,
        code: newTplCode.toUpperCase(),
        name: newTplName,
        price: newTplPrice,
        tax_percent: newTplTaxPercent,
        audience_type_id: selectedAudId,
        ticket_zone_id: selectedTicketZoneId,
        ticket_type: newTicketType,
        validity_days: newValidityDays,
        valid_days: newValidDays.join(','),
        is_holiday_applicable: newIsHoliday,
        is_promotion_applicable: newIsPromo,
        allowed_passes: newAllowedPasses
      };
      await ticketingService.updateTicketTemplate(editingTpl.id, updatedItem);
    } else {
      const item: TicketTemplate = {
        id: `tpl-${Date.now()}`,
        code: newTplCode.toUpperCase(),
        ticket_zone_id: selectedTicketZoneId,
        name: newTplName,
        price: newTplPrice,
        tax_percent: newTplTaxPercent,
        audience_type_id: selectedAudId,
        ticket_type: newTicketType,
        validity_days: newValidityDays,
        valid_days: newValidDays.join(','),
        is_holiday_applicable: newIsHoliday,
        is_promotion_applicable: newIsPromo,
        allowed_passes: newAllowedPasses,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin',
        updated_by: 'admin',
      };
      await ticketingService.createTicketTemplate(item);
    }

    refreshData();
    setShowModal(false);
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive;
    setTicketTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: newActive, isActive: newActive, active: newActive } : t));
    try {
      await ticketingService.updateTicketTemplateStatus(id, newActive);
    } catch (err) {}
  };

  const handleDelete = async (ids: (string | number)[]) => {
    for (const id of ids) {
      await ticketingService.deleteTicketTemplate(String(id));
    }
    setTicketTemplates(prev => prev.filter(t => !ids.includes(t.id)));
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO CÁC LOẠI VÉ"
        data={ticketTemplates}
        columns={[
          { header: 'ID', accessor: (row, idx) => 1007 + idx, className: 'w-20 font-mono' },
          { header: 'Mã vé', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên vé', accessor: 'name', className: 'font-semibold text-slate-900' },
          {
            header: 'Nhóm vé áp dụng',
            accessor: (row: any) => {
              const zone = ticketZones.find((z) => z.id === (row.ticket_zone_id || row.ticket_name_id));
              return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                  {zone ? zone.name : 'Chưa gắn'}
                </span>
              );
            },
            className: 'text-center',
          },
          {
            header: 'Đối tượng',
            accessor: (row: any) => {
              const aud = audienceTypes.find((a) => a.id === row.audience_type_id);
              return aud?.name || row.name;
            },
            className: 'text-slate-800 font-medium',
          },
          { header: 'Gia vé', accessor: (row: any) => `${row.price.toLocaleString('vi-VN')}`, className: 'font-mono font-semibold text-slate-900 text-right pr-4' },
          {
            header: 'VAT',
            accessor: (row: any) => (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                {row.tax_percent !== undefined ? row.tax_percent : 8}%
              </span>
            ),
            className: 'text-center',
          },
          {
            header: 'Loại hình / Hiệu lực',
            accessor: (row: any) => {
              const isUnlimited = row.ticket_type === 'UNLIMITED' || row.code?.includes('FAMILY') || row.validity_days === 30;
              if (isUnlimited) {
                return (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Vé Tháng (30 Ngày) - Vô Hạn Lượt
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                  Vé Lượt ({row.validity_days || 1} ngày)
                  {row.allowed_passes && row.allowed_passes > 1 && ` - ${row.allowed_passes} lượt/vé`}
                </span>
              );
            },
            className: 'text-center',
          },
          {
            header: 'Ngày sử dụng',
            accessor: (row: any) => {
              if (!row.valid_days) return 'Thứ 2 - Chủ nhật';
              const days = row.valid_days.split(',');
              return days.map((d: string) => d === '8' ? 'CN' : `T${d}`).join(', ');
            },
            className: 'font-mono text-center text-[11px] text-slate-700',
          },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-20' },
          {
            header: 'Khuyến mãi',
            accessor: (row: any) => (
              <div className="flex justify-center">
                <input
                  type="checkbox"
                  checked={row.is_promotion_applicable || false}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setTicketTemplates(prev => prev.map(t => t.id === row.id ? { ...t, is_promotion_applicable: val } : t));
                    try {
                      const updated = { ...row, is_promotion_applicable: val };
                      await ticketingService.updateTicketTemplate(row.id, updated);
                    } catch (err) {}
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </div>
            ),
            className: 'text-center w-24',
          },
        ]}
        onAddNew={() => {
          setEditingTpl(null);
          setNewTplCode('');
          setNewTplName('');
          setNewTplPrice(100000);
          setNewTplTaxPercent(8);
          setSelectedAudId(audienceTypes[0]?.id || '');
          setSelectedTicketZoneId(ticketZones[0]?.id || '');
          setNewValidDays(['2', '3', '4', '5', '6', '7', '8']);
          setNewIsHoliday(false);
          setNewIsPromo(false);
          setNewTicketType('SINGLE');
          setNewValidityDays(1);
          setNewAllowedPasses(1);
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingTpl(item);
          setNewTplCode(item.code);
          setNewTplName(item.name);
          setNewTplPrice(item.price);
          setNewTplTaxPercent(item.tax_percent !== undefined ? item.tax_percent : 8);
          setSelectedAudId(item.audience_type_id || audienceTypes[0]?.id || '');
          setSelectedTicketZoneId(item.ticket_zone_id || item.ticket_name_id || ticketZones[0]?.id || '');
          setNewValidDays(item.valid_days ? item.valid_days.split(',') : ['2', '3', '4', '5', '6', '7', '8']);
          setNewIsHoliday(item.is_holiday_applicable || false);
          setNewIsPromo(item.is_promotion_applicable || false);
          setNewTicketType(item.ticket_type || (item.code?.includes('FAMILY') ? 'UNLIMITED' : 'SINGLE'));
          setNewValidityDays(item.validity_days || (item.code?.includes('FAMILY') ? 30 : 1));
          setNewAllowedPasses(item.allowed_passes || (item.code?.includes('FAMILY') ? -1 : 1));
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900 my-8">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Ticket className="w-5 h-5 text-indigo-600" /> {editingTpl ? 'Sửa Mẫu Vé' : 'Tạo Loại Mẫu Vé Mới'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phân Loại Đối Tượng:</label>
                <select
                  value={selectedAudId}
                  onChange={(e) => setSelectedAudId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {audienceTypes.filter(isItemActive).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nhóm Vé Áp Dụng (Khu Vực):</label>
                <select
                  value={selectedTicketZoneId}
                  onChange={(e) => setSelectedTicketZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                >
                  <option value="">-- Chọn Nhóm Vé (Khu vực áp dụng) --</option>
                  {ticketZones.filter(isItemActive).map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Mẫu Vé:</label>
                <input
                  type="text"
                  value={newTplCode}
                  onChange={(e) => setNewTplCode(e.target.value)}
                  placeholder="e.g. TKT-VIP-COMBO"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Mẫu Vé Bán:</label>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="e.g. Vé Trọn Gói VIP All-Access"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Giá Vé Niêm Yết (VND):</label>
                  <input
                    type="number"
                    value={newTplPrice}
                    onChange={(e) => setNewTplPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Thuế VAT (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newTplTaxPercent}
                    onChange={(e) => setNewTplTaxPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Loại Hình Vé:</label>
                  <select
                    value={newTicketType}
                    onChange={(e) => {
                      const val = e.target.value as 'SINGLE' | 'MULTI' | 'UNLIMITED';
                      setNewTicketType(val);
                      if (val === 'UNLIMITED') {
                        setNewValidityDays(30);
                        setNewAllowedPasses(-1);
                      } else if (val === 'SINGLE') {
                        setNewValidityDays(1);
                        setNewAllowedPasses(1);
                      } else if (val === 'MULTI') {
                        setNewAllowedPasses(10);
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="SINGLE">Vé lẻ (1 lượt/vé)</option>
                    <option value="MULTI">Vé đoàn / Đa lượt (Tùy chọn số lượt)</option>
                    <option value="UNLIMITED">Vé tháng (Vô hạn lượt/30 ngày)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Số Ngày Hiệu Lực:</label>
                  <input
                    type="number"
                    value={newValidityDays}
                    onChange={(e) => setNewValidityDays(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>
              {newTicketType === 'MULTI' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-slate-700 font-semibold mb-1">Số Lượt Đi (Số lần qua cổng):</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={newAllowedPasses}
                        onChange={(e) => setNewAllowedPasses(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-indigo-700 pr-24"
                      />
                      <div className="absolute right-3 top-2.5 text-slate-400 font-medium text-xs">lượt/vé</div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Thời gian sử dụng:</label>
                <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                  <div className="font-medium text-slate-700 mb-2">Ngày trong tuần</div>
                  <div className="grid grid-cols-4 gap-2">
                    {['2', '3', '4', '5', '6', '7', '8'].map(day => (
                      <label key={day} className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newValidDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) setNewValidDays([...newValidDays, day].sort());
                            else setNewValidDays(newValidDays.filter(d => d !== day));
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="text-[11px] font-medium text-slate-800">{day === '8' ? 'Chủ nhật' : `Thứ ${day}`}</span>
                      </label>
                    ))}
                  </div>
                  <div className="h-px bg-slate-200 my-2"></div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={newIsHoliday} onChange={e => setNewIsHoliday(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      Áp dụng Ngày lễ
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                      <input type="checkbox" checked={newIsPromo} onChange={e => setNewIsPromo(e.target.checked)} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                      Áp dụng Khuyến mãi
                    </label>
                  </div>
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
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Mẫu Vé
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
