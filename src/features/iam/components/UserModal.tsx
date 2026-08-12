import React from 'react';

interface UserModalProps {
  editingUserId: string | null;
  fullname: string; setFullname: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  roleId: string; setRoleId: (v: string) => void;
  roles: any[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  editingUserId, fullname, setFullname, username, setUsername,
  password, setPassword, phone, setPhone, roleId, setRoleId, roles,
  onClose, onSubmit
}) => (
  <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
    <form
      onSubmit={onSubmit}
      className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-slate-900"
    >
      <div className="space-y-6 text-sm">
        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            <span className="text-red-500 mr-1">*</span> Tên đăng nhập
          </label>
          <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-transparent py-1 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            <span className="text-red-500 mr-1">*</span> Mật khẩu
          </label>
          <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
            <input
              type="password"
              required={!editingUserId}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent py-1 outline-none"
              placeholder={editingUserId ? '(Bỏ trống nếu không đổi)' : ''}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            <span className="text-red-500 mr-1">*</span> Tên nhân viên
          </label>
          <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
            <input
              type="text"
              required
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full bg-transparent py-1 outline-none"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            Số điện thoại
          </label>
          <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent py-1 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            <span className="text-red-500 mr-1">*</span> Nhóm quyền
          </label>
          <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors">
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full bg-transparent py-1 outline-none"
            >
              <option value="">Không chọn</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="w-32 shrink-0 text-slate-700 font-medium">
            <span className="text-red-500 mr-1">*</span> Sử dụng
          </label>
          <div className="flex-1">
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span>Sử dụng</span>
            </label>
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
