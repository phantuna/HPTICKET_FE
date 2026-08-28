import React from 'react';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';

const UnregisteredCardPicker: React.FC<{ onSelect: (code: string) => void }> = ({ onSelect }) => {
  const [show, setShow] = React.useState(false);
  const [cards, setCards] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchCards = async () => {
    setLoading(true);
    setShow(true);
    try {
      const res = await apiClient.get<any>(API_ENDPOINTS.TICKETING.UNREGISTERED_CARDS);
      if (res.code === 200) {
        setCards(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={fetchCards}
        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition whitespace-nowrap"
      >
        💳 Lấy thẻ vừa quét
      </button>

      {show && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex justify-between items-center bg-slate-50 px-3 py-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-600">Thẻ vô danh gần đây</span>
            <button type="button" onClick={() => setShow(false)} className="text-slate-400 hover:text-red-500 text-lg leading-none">&times;</button>
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {loading ? (
              <div className="p-3 text-center text-xs text-slate-500 italic">Đang tải...</div>
            ) : cards.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500 italic">Không có thẻ nào bị từ chối gần đây.</div>
            ) : (
              cards.map((code, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelect(code);
                    setShow(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-emerald-50 rounded-lg transition group flex items-center gap-2"
                >
                  <span className="text-lg"></span>
                  <div>
                    <div className="text-sm font-mono font-bold text-emerald-700 group-hover:text-emerald-800">{code}</div>
                    <div className="text-[10px] text-slate-400">Vừa quét ở cổng</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface UserModalProps {
  editingUserId: string | null;
  fullname: string; setFullname: (v: string) => void;
  username: string; setUsername: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  qrCode: string; setQrCode: (v: string) => void;
  roleId: string; setRoleId: (v: string) => void;
  roles: any[];
  salesCounters: any[];
  selectedCounterIds: string[];
  setSelectedCounterIds: (v: string[]) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  editingUserId, fullname, setFullname, username, setUsername,
  password, setPassword, phone, setPhone, qrCode, setQrCode, roleId, setRoleId, roles,
  salesCounters, selectedCounterIds, setSelectedCounterIds,
  onClose, onSubmit
}) => {
  const toggleCounter = (id: string) => {
    setSelectedCounterIds(
      selectedCounterIds.includes(id)
        ? selectedCounterIds.filter(c => c !== id)
        : [...selectedCounterIds, id]
    );
  };

  return (
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
              Mã Thẻ / QR NV
            </label>
            <div className="flex-1 border-b border-slate-400 focus-within:border-emerald-500 transition-colors flex items-center gap-2">
              <input
                type="text"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                placeholder="VD: 13181773 hoặc EMP-ADMIN"
                className="w-full bg-transparent py-1 outline-none font-mono font-bold text-emerald-700"
              />
              <UnregisteredCardPicker onSelect={setQrCode} />
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

          {/* Quầy được gán */}
          <div className="flex items-start gap-4">
            <label className="w-32 shrink-0 text-slate-700 font-medium pt-1">
              Quầy được gán
            </label>
            <div className="flex-1">
              {salesCounters.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Chưa có quầy nào trong hệ thống</span>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {salesCounters.map((c: any) => {
                    const checked = selectedCounterIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCounter(c.id)}
                        className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${checked
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-violet-400'
                          }`}
                      >
                        {c.name || c.code}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedCounterIds.length > 0 && (
                <p className="text-[10px] text-violet-600 mt-1.5">
                  ✓ Đã chọn {selectedCounterIds.length} quầy
                </p>
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
