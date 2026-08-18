import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { CustomerSource, CustomerGroup } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';

interface SourceTabProps {
  sources: CustomerSource[];
  setSources: React.Dispatch<React.SetStateAction<CustomerSource[]>>;
  groups: CustomerGroup[];
  refreshData: () => void;
}

export const SourceTab: React.FC<SourceTabProps> = ({ sources, setSources, groups, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const [newSourceCode, setNewSourceCode] = useState('');
  const [newSourceCompany, setNewSourceCompany] = useState('');
  const [newSourceAddress, setNewSourceAddress] = useState('');
  const [newSourcePhone, setNewSourcePhone] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  const handleSave = async () => {
    if (!newSourceCompany) { toast.error('Vui lòng nhập tên/công ty Nguồn khách!'); return; }
    const payload = {
      code: newSourceCode || `SRC-${Date.now()}`,
      company_name: newSourceCompany,
      address: newSourceAddress || 'Hà Nội',
      phone: newSourcePhone || '0900000000',
      email: 'partner@hpticket.vn',
      customer_group_id: selectedGroupId,
      is_active: true,
    };
    if (editingSourceId) {
      await marketingService.updateCustomerSource(editingSourceId, payload);
    } else {
      await marketingService.createCustomerSource(payload);
    }
    refreshData();
    setShowModal(false);
  };

  const handleDelete = (ids: (string | number)[]) => {
    ids.forEach((id) => marketingService.deleteCustomerSource(String(id)));
    setSources((prev) => prev.filter((s) => !ids.includes(s.id)));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await marketingService.updateCustomerSourceStatus(id, !currentActive);
      if (res.code === 200) {
        setSources((prev) => prev.map((s: any) => s.id === id ? { ...s, is_active: !currentActive, isActive: !currentActive, active: !currentActive } : s));
      }
    } catch (err) { toast.error('Cập nhật thất bại'); }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO NGUỒN KHÁCH"
        data={sources}
        columns={[
          { header: 'ID', accessor: (row: any, idx) => 2001 + idx, className: 'w-24 font-mono' },
          { header: 'Mã nguồn khách', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên công ty / Nguồn khách', accessor: 'company_name', className: 'font-semibold text-slate-900' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingSourceId(null);
          setNewSourceCode('');
          setNewSourceCompany('');
          setNewSourceAddress('');
          setNewSourcePhone('');
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingSourceId(item.id);
          setNewSourceCode(item.code);
          setNewSourceCompany(item.company_name || item.companyName);
          setNewSourceAddress(item.address || '');
          setNewSourcePhone(item.phone || '');
          if (item.customer_group_id || item.customerGroupId) {
            setSelectedGroupId(item.customer_group_id || item.customerGroupId);
          }
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="w-5 h-5 text-blue-600" /> {editingSourceId ? 'Sửa Nguồn Khách' : 'Thêm Nguồn Khách Hàng'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Chọn Nhóm Nguồn Khách:</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {groups.filter(isItemActive).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (Giảm {g.discount_percent}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Công Ty / Đơn Vị:</label>
                <input
                  type="text"
                  value={newSourceCompany}
                  onChange={(e) => setNewSourceCompany(e.target.value)}
                  placeholder="e.g. Công ty Lữ Hành Vietravel"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
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
                Lưu Nguồn Khách
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
