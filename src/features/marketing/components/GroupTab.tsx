import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { CustomerGroup } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';

interface GroupTabProps {
  groups: CustomerGroup[];
  setGroups: React.Dispatch<React.SetStateAction<CustomerGroup[]>>;
  refreshData: (force?: boolean) => void;
}

export const GroupTab: React.FC<GroupTabProps> = ({ groups, setGroups, refreshData }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupCode, setNewGroupCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDiscount, setNewGroupDiscount] = useState<number>(10);

  const handleSave = async () => {
    if (!newGroupCode || !newGroupName) { toast.error('Vui lòng nhập đầy đủ Mã và Tên Nhóm khách hàng!'); return; }
    const payload = {
      code: newGroupCode.toUpperCase(),
      name: newGroupName,
      discount_percent: newGroupDiscount,
      is_active: true,
    };
    if (editingGroupId) {
      await marketingService.updateCustomerGroup(editingGroupId, payload);
    } else {
      await marketingService.createCustomerGroup(payload);
    }
    refreshData(true);
    setShowModal(false);
  };

  const handleDelete = (ids: (string | number)[]) => {
    ids.forEach((id) => marketingService.deleteCustomerGroup(String(id)));
    setGroups((prev) => prev.filter((g) => !ids.includes(g.id)));
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await marketingService.updateCustomerGroupStatus(id, !currentActive);
      if (res.code === 200) {
        setGroups((prev) =>
          prev.map((g: any) =>
            g.id === id
              ? { ...g, is_active: !currentActive, isActive: !currentActive, active: !currentActive }
              : g
          )
        );
      }
    } catch (err) {
      toast.error('Cập nhật trạng thái thất bại');
    }
  };

  return (
    <>
      <AdminConfigCard
        title="KHAI BÁO NHÓM NGUỒN KHÁCH"
        data={groups}
        columns={[
          { header: 'STT', accessor: (row, idx) => idx + 1, className: 'w-16 font-mono text-center' },
          { header: 'Mã nhóm nguồn khách', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Nhóm nguồn khách', accessor: 'name', className: 'font-semibold text-slate-900' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingGroupId(null);
          setNewGroupCode('');
          setNewGroupName('');
          setNewGroupDiscount(10);
          setShowModal(true);
        }}
        onEdit={(item: any) => {
          setEditingGroupId(item.id);
          setNewGroupCode(item.code);
          setNewGroupName(item.name);
          setNewGroupDiscount(item.discount_percent || item.discountPercent || 0);
          setShowModal(true);
        }}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-5 h-5 text-amber-600" /> {editingGroupId ? 'Sửa Nhóm Khách Hàng' : 'Thêm Nhóm Khách Hàng'}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mã Nhóm Khách:</label>
                <input
                  type="text"
                  value={newGroupCode}
                  onChange={(e) => setNewGroupCode(e.target.value)}
                  placeholder="e.g. GROUP_VIP"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tên Nhóm Khách Hàng:</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Khách Đoàn Doanh Nghiệp"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mức % Giảm Giá Tùy Chọn:</label>
                <input
                  type="number"
                  value={newGroupDiscount}
                  onChange={(e) => setNewGroupDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-amber-500"
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
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Lưu Khai Báo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
