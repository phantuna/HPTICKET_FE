import React from 'react';
import { Shield } from 'lucide-react';

interface RoleModalProps {
  editingRoleId: string | null;
  roleCode: string; setRoleCode: (v: string) => void;
  roleName: string; setRoleName: (v: string) => void;
  rolePermissions: string[]; setRolePermissions: (v: string[]) => void;
  allPermissions: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MODULE_LABELS: Record<string, string> = {
  IAM: 'Tài khoản & Phân quyền',
  SALES: 'Bán hàng & POS',
  TICKETING: 'Soát vé & Cổng',
  MARKETING: 'Marketing & Khuyến mãi',
  VINVOICE: 'Hóa đơn điện tử',
  SYSTEM: 'Hệ thống',
  LOCATION: 'Địa điểm & Quầy vé',
  INVENTORY: 'Kho hàng',
  REPORT: 'Báo cáo',
  KHÁC: 'Khác',
};

const SORT_ORDER = ['MANAGE', 'VIEW', 'CREATE', 'UPDATE', 'DELETE'];

export const RoleModal: React.FC<RoleModalProps> = ({
  editingRoleId, roleCode, setRoleCode, roleName, setRoleName,
  rolePermissions, setRolePermissions, allPermissions,
  onClose, onSubmit
}) => {
  const handleTogglePermission = (code: string) => {
    setRolePermissions(
      rolePermissions.includes(code)
        ? rolePermissions.filter(p => p !== code)
        : [...rolePermissions, code]
    );
  };

  // Group permissions by module
  const grouped: Record<string, any[]> = allPermissions.reduce((acc: any, perm: any) => {
    let mod = perm.module;
    if (!mod) {
      const n = (perm.name || '').toLowerCase();
      const c = (perm.code || '').toUpperCase();
      if (c.includes('IAM') || c.includes('USER') || c.includes('ROLE') || c.includes('PERMISSION') || n.includes('tài khoản') || n.includes('phân quyền')) mod = 'IAM';
      else if (c.includes('SALE') || c.includes('ORDER') || c.includes('POS') || n.includes('bán vé') || n.includes('doanh thu')) mod = 'SALES';
      else if (c.includes('MARKETING') || c.includes('PROMOTION') || c.includes('SOURCE') || c.includes('GROUP') || n.includes('nhóm khách') || n.includes('khuyến mãi')) mod = 'MARKETING';
      else if (c.includes('GATE') || c.includes('TICKET') || c.includes('SCAN') || n.includes('cổng') || n.includes('quét vé')) mod = 'TICKETING';
      else if (c.includes('INVOICE') || c.includes('EINVOICE') || n.includes('hóa đơn')) mod = 'VINVOICE';
      else if (c.includes('LOCATION') || c.includes('COUNTER') || c.includes('ZONE') || n.includes('địa điểm') || n.includes('quầy')) mod = 'LOCATION';
      else if (c.includes('INVENTORY') || c.includes('PRODUCT') || c.includes('STOCK') || n.includes('kho')) mod = 'INVENTORY';
      else if (c.includes('REPORT') || n.includes('báo cáo')) mod = 'REPORT';
      else if (c.includes('SYSTEM') || n.includes('hệ thống') || n.includes('cấu hình')) mod = 'SYSTEM';
      else mod = 'KHÁC';
    }
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {});

  const sortPerms = (perms: any[]) =>
    [...perms].sort((a, b) => {
      const getIdx = (p: any) => {
        const str = (p.name || p.code || '').toUpperCase();
        const idx = SORT_ORDER.findIndex(action => str.startsWith(action));
        return idx === -1 ? 99 : idx;
      };
      const diff = getIdx(a) - getIdx(b);
      return diff !== 0 ? diff : (a.name || a.code || '').localeCompare(b.name || b.code || '');
    });

  const moduleEntries = Object.entries(grouped);
  const checkedCount = rolePermissions.length;
  const totalCount = allPermissions.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl my-6 shadow-2xl text-slate-900"
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingRoleId ? 'Sửa nhóm quyền' : 'Thêm mới nhóm quyền'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Đang chọn{' '}
                <span className="font-bold text-emerald-600">{checkedCount}</span>
                /{totalCount} quyền
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-sm flex items-center gap-1.5 text-sm"
            >
              Lưu
            </button>
          </div>
        </div>

        <div className="px-7 py-5 space-y-6">
          {/* Mã nhóm + Tên nhóm — nằm ngang */}
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="flex items-center gap-4">
              <label className="w-24 shrink-0 text-slate-700 font-medium">
                <span className="text-red-500 mr-1">*</span>Mã nhóm
              </label>
              <div className="flex-1 border-b-2 border-slate-300 focus-within:border-emerald-500 transition-colors">
                <input
                  type="text"
                  required
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  className="w-full bg-transparent py-1.5 outline-none uppercase font-mono text-sm"
                  placeholder="VD: ROLE_MANAGER"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-24 shrink-0 text-slate-700 font-medium">
                <span className="text-red-500 mr-1">*</span>Tên nhóm
              </label>
              <div className="flex-1 border-b-2 border-slate-300 focus-within:border-emerald-500 transition-colors">
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full bg-transparent py-1.5 outline-none text-sm"
                  placeholder="VD: Quản lý chi nhánh"
                />
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-700">
                Danh mục quyền gán (Chi tiết)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRolePermissions(allPermissions.map(p => p.name || p.code))}
                  className="text-xs px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-semibold transition"
                >
                  Chọn tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setRolePermissions([])}
                  className="text-xs px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg font-semibold transition"
                >
                  ☐ Bỏ chọn tất cả
                </button>
              </div>
            </div>

            {allPermissions.length === 0 ? (
              <div className="text-center text-slate-400 text-sm italic py-10 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                Chưa có dữ liệu phân quyền. Vui lòng kiểm tra lại CSDL.
              </div>
            ) : (
              /* Các module nằm ngang theo grid — KHÔNG có inner scroll */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {moduleEntries.map(([mod, perms]) => {
                  const label = MODULE_LABELS[mod] || mod;
                  const sorted = sortPerms(perms);
                  const modChecked = sorted.filter(p => rolePermissions.includes(p.name || p.code)).length;

                  return (
                    <div key={mod} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      {/* Module header */}
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                        <h3 className="font-bold text-[11px] uppercase tracking-wide leading-none text-emerald-700">
                          {label}
                        </h3>
                        <span className="text-[10px] font-bold font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                          {modChecked}/{sorted.length}
                        </span>
                      </div>
                      {/* Permissions — 2 cột trong mỗi module card */}
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                        {sorted.map((perm: any) => {
                          const key = perm.name || perm.code;
                          const checked = rolePermissions.includes(key);
                          return (
                            <label
                              key={perm.id || key}
                              title={perm.description || key}
                              className={`flex items-start gap-1.5 cursor-pointer rounded-lg px-1.5 py-1 transition-colors ${checked ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleTogglePermission(key)}
                                className="w-3.5 h-3.5 mt-[3px] shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold leading-tight truncate">
                                  {key}
                                </div>
                                {perm.description && (
                                  <div className="text-[10px] opacity-60 leading-tight truncate">
                                    {perm.description}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
