import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { AdminConfigCard } from '../../iam/components/AdminConfigCard';
import { CustomerSource, CustomerGroup } from '../../../shared/types/hpticket';
import { marketingService } from '../../../api/marketingService';
import { toast } from '../../../shared/utils/toast';
import { usePermission } from '../../../shared/hooks/usePermission';
import { Modal } from '../../../shared/components/ui';

interface SourceTabProps {
  sources: CustomerSource[];
  setSources: React.Dispatch<React.SetStateAction<CustomerSource[]>>;
  groups: CustomerGroup[];
  refreshData: (force?: boolean) => void;
}

export const SourceTab: React.FC<SourceTabProps> = ({ sources, setSources, groups, refreshData }) => {
  const { can } = usePermission();
  const [showModal, setShowModal] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  const [newSourceCode, setNewSourceCode] = useState('');
  const [newSourceCompany, setNewSourceCompany] = useState('');
  const [newSourceTaxCode, setNewSourceTaxCode] = useState('');
  const [newSourceAddress, setNewSourceAddress] = useState('');
  const [newSourcePhone, setNewSourcePhone] = useState('');
  const [newSourceEmail, setNewSourceEmail] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isItemActive = (item: any) => {
    const val = item?.is_active ?? item?.isActive ?? item?.active ?? item?.status;
    return val !== false && val !== 'INACTIVE';
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!newSourceCompany.trim()) { toast.error('Vui lòng nhập tên công ty / nguồn khách!'); return; }
    
    setIsSubmitting(true);
    try {
      const payload = {
        code: newSourceCode.trim() || `SRC-${Date.now()}`,
        company_name: newSourceCompany.trim(),
        tax_code: newSourceTaxCode.trim(),
        address: newSourceAddress.trim() || 'Hà Nội',
        phone: newSourcePhone.trim() || '0900000000',
        email: newSourceEmail.trim() || 'partner@hpticket.vn',
        customer_group_id: selectedGroupId,
        is_active: true,
      };
      if (editingSourceId) {
        await marketingService.updateCustomerSource(editingSourceId, payload);
      } else {
        await marketingService.createCustomerSource(payload);
      }
      refreshData(true);
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu nguồn khách');
    } finally {
      setIsSubmitting(false);
    }
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
          { header: 'ID', accessor: (row: any, idx) => idx + 1, className: 'w-16 font-mono text-center' },
          { header: 'Mã nguồn khách', accessor: 'code', className: 'font-mono font-bold text-slate-800' },
          { header: 'Tên công ty / Nguồn khách', accessor: 'company_name', className: 'font-semibold text-slate-900' },
          { header: 'Mã số thuế', accessor: (row: any) => row.tax_code || row.taxCode || '—', className: 'font-mono text-slate-700' },
          { header: 'Điện thoại', accessor: (row: any) => row.phone || '—', className: 'font-mono text-slate-700' },
          { header: 'Email', accessor: (row: any) => row.email || '—', className: 'text-slate-600' },
          { header: 'Sử dụng', accessor: 'is_active', className: 'text-center w-24' },
        ]}
        onAddNew={() => {
          setEditingSourceId(null);
          setNewSourceCode('');
          setNewSourceCompany('');
          setNewSourceTaxCode('');
          setNewSourceAddress('');
          setNewSourcePhone('');
          setNewSourceEmail('');
          setSelectedGroupId(groups[0]?.id || '');
          setShowModal(true);
        }}
        onEdit={can('UPDATE_CUSTOMER_SOURCE') ? ((item: any) => {
          setEditingSourceId(item.id);
          setNewSourceCode(item.code || '');
          setNewSourceCompany(item.company_name || item.companyName || '');
          setNewSourceTaxCode(item.tax_code || item.taxCode || '');
          setNewSourceAddress(item.address || '');
          setNewSourcePhone(item.phone || '');
          setNewSourceEmail(item.email || '');
          if (item.customer_group_id || item.customerGroupId) {
            setSelectedGroupId(item.customer_group_id || item.customerGroupId);
          }
          setShowModal(true);
        }) : undefined}
        onDelete={can('DELETE_CUSTOMER_SOURCE') ? handleDelete : undefined}
        onToggleActive={can('UPDATE_CUSTOMER_SOURCE') ? handleToggleActive : undefined}
        hideAddButton={!can('CREATE_CUSTOMER_SOURCE')}
        hideDeleteButton={!can('DELETE_CUSTOMER_SOURCE')}
      />

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingSourceId ? 'Sửa Nguồn Khách' : 'Thêm Nguồn Khách Hàng'}
        icon={<Building2 className="w-5 h-5 text-emerald-600" />}
        isSubmitting={isSubmitting}
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        confirmText="Lưu Nguồn Khách"
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mã nguồn khách:</label>
              <input
                type="text"
                value={newSourceCode}
                onChange={(e) => setNewSourceCode(e.target.value)}
                placeholder="VD: CTY_VIETRAVEL (để trống tự sinh)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nhóm Nguồn Khách (*):</label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                {groups.filter(isItemActive).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} (Giảm {g.discount_percent}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Tên Công Ty / Đơn Vị (*):</label>
              <input
                type="text"
                value={newSourceCompany}
                onChange={(e) => setNewSourceCompany(e.target.value)}
                placeholder="VD: Công ty Cổ phần Du lịch ABC"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mã Số Thuế:</label>
              <input
                type="text"
                value={newSourceTaxCode}
                onChange={(e) => setNewSourceTaxCode(e.target.value)}
                placeholder="VD: 0108889999"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số điện thoại:</label>
              <input
                type="text"
                value={newSourcePhone}
                onChange={(e) => setNewSourcePhone(e.target.value)}
                placeholder="VD: 0988123456"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email:</label>
              <input
                type="email"
                value={newSourceEmail}
                onChange={(e) => setNewSourceEmail(e.target.value)}
                placeholder="VD: hoadon@congtyabc.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Địa chỉ trụ sở:</label>
            <input
              type="text"
              value={newSourceAddress}
              onChange={(e) => setNewSourceAddress(e.target.value)}
              placeholder="VD: Số 123 Đường Lê Lợi, TP. Hà Nội"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};
