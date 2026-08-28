import React from 'react';

interface RoleModalProps {
  editingRoleId: string | null;
  roleCode: string; setRoleCode: (v: string) => void;
  roleName: string; setRoleName: (v: string) => void;
  rolePermissions: string[]; setRolePermissions: (v: string[]) => void;
  allPermissions: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  editingRoleId, roleCode, setRoleCode, roleName, setRoleName,
  rolePermissions, setRolePermissions, allPermissions,
  onClose, onSubmit
}) => {
  const handleTogglePermission = (code: string) => {
    if (rolePermissions.includes(code)) {
      setRolePermissions(rolePermissions.filter(p => p !== code));
    } else {
      setRolePermissions([...rolePermissions, code]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-slate-900 max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-6 text-sm">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-200 pb-2">
            {editingRoleId ? 'Sửa nhóm quyền' : 'Thêm mới nhóm quyền'}
          </h2>

          <div className="flex items-center gap-4">
            <label className="w-32 shrink-0 text-slate-700 font-medium">
              <span className="text-red-500 mr-1">*</span> Mã nhóm
            </label>
            <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
              <input
                type="text"
                required
                value={roleCode}
                onChange={(e) => setRoleCode(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                className="w-full bg-transparent py-1 outline-none uppercase font-mono"
                placeholder="VD: ROLE_MANAGER"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-32 shrink-0 text-slate-700 font-medium">
              <span className="text-red-500 mr-1">*</span> Tên nhóm
            </label>
            <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
              <input
                type="text"
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full bg-transparent py-1 outline-none"
                placeholder="VD: Quản lý chi nhánh"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-slate-700 font-medium block">
              Danh mục quyền gán (Chi tiết)
            </label>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 max-h-[400px] overflow-y-auto space-y-6">
              {Object.entries(
                allPermissions.reduce((acc: any, perm: any) => {
                  let mod = perm.module;
                  if (!mod) {
                    const n = perm.name || '';
                    if (n.includes('Tài khoản') || n.includes('Phân quyền')) mod = 'IAM';
                    else if (n.includes('Bán vé') || n.includes('Doanh thu')) mod = 'SALES';
                    else if (n.includes('Nhóm khách') || n.includes('Khuyến mãi')) mod = 'MARKETING';
                    else if (n.includes('Cổng') || n.includes('Quét vé')) mod = 'TICKETING';
                    else if (n.includes('Hệ thống') || n.includes('Cấu hình')) mod = 'SYSTEM';
                    else mod = 'KHÁC';
                  }
                  if (!acc[mod]) acc[mod] = [];
                  acc[mod].push(perm);
                  return acc;
                }, {})
              ).map(([mod, perms]: [string, any]) => (
                <div key={mod} className="space-y-2">
                  <h3 className="font-bold text-sm text-emerald-700 uppercase border-b border-emerald-100 pb-1">
                    {mod === 'IAM' ? 'Tài khoản & Phân quyền' : 
                     mod === 'SALES' ? 'Bán hàng & POS' : 
                     mod === 'TICKETING' ? 'Soát vé & Cổng' : 
                     mod === 'MARKETING' ? 'Marketing & Khuyến mãi' : 
                     mod === 'VINVOICE' ? 'Hóa đơn điện tử' : 
                     mod === 'SYSTEM' ? 'Hệ thống' : mod}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.sort((a: any, b: any) => {
                      const sortOrder = ['MANAGE', 'VIEW', 'CREATE', 'UPDATE', 'DELETE'];
                      const getAction = (p: any) => sortOrder.findIndex(action => (p.name || p.code || '').toUpperCase().startsWith(action));
                      const idxA = getAction(a);
                      const idxB = getAction(b);
                      
                      if (idxA !== idxB) {
                        return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
                      }
                      return (a.name || a.code || '').localeCompare(b.name || b.code || '');
                    }).map((perm: any) => (
                      <label key={perm.id || perm.name} className="flex items-start gap-2 cursor-pointer hover:bg-emerald-50 p-1.5 rounded-lg transition" title={perm.description || perm.name}>
                        <input
                          type="checkbox"
                          checked={rolePermissions.includes(perm.name || perm.code)}
                          onChange={() => handleTogglePermission(perm.name || perm.code)}
                          className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                        />
                        <div className="flex flex-col">
                          <span className="text-[12px] font-semibold text-slate-800">{perm.name || perm.code}</span>
                          <span className="text-[10px] text-slate-500 leading-tight">{perm.description || ''}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              {allPermissions.length === 0 && (
                <div className="text-center text-slate-400 text-sm italic py-4">
                  Chưa có dữ liệu phân quyền. Vui lòng kiểm tra lại CSDL.
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="flex justify-center gap-4 mt-8">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5 text-sm"
          >
            Lưu 💾
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition text-sm"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};
