import React, { useState, useEffect } from 'react';
import {
  X, User, Phone, Shield, Calendar, CheckCircle2, XCircle,
  BadgeCheck, Clock, CreditCard, Hash, Edit2, Save
} from 'lucide-react';
import { iamService } from '../../../api/iamService';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProfileData {
  id: string;
  username: string;
  fullname: string;
  phone?: string;
  qr_code?: string;
  isActive?: boolean;
  created_at?: string;
  updated_at?: string;
  role_id?: string;
  assigned_counters?: Array<{ id: string; code: string; name: string }>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ fullname: '', phone: '', username: '' });

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    iamService
      .getCurrentUser()
      .then((res) => {
        if (res?.data) setProfile(res.data as unknown as ProfileData);
        else setError('Không thể tải thông tin hồ sơ.');
      })
      .catch(() => {
        // Fallback từ localStorage nếu API lỗi
        const username = localStorage.getItem('hpticket_username') || '—';
        const fullname = localStorage.getItem('hpticket_fullname') || username;
        const role    = localStorage.getItem('hpticket_role') || '—';
        setProfile({ id: '—', username, fullname, role_id: role } as any);
      })
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const username = profile?.username || localStorage.getItem('hpticket_username') || 'user';
  const avatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${username}&backgroundColor=3f72af`;

  const handleEditClick = () => {
    setEditForm({
      fullname: profile?.fullname || '',
      phone: profile?.phone || '',
      username: profile?.username || '',
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    try {
      const res = await iamService.updateUser(profile.id, {
        username: editForm.username,
        role_id: profile.role_id,
        qr_code: profile.qr_code,
        assigned_counter_ids: profile.assigned_counters?.map(c => c.id) || [],
        fullname: editForm.fullname,
        phone: editForm.phone,
      });
      if (res.code === 200 || res.code === 201 || res.data) {
        setProfile({ ...profile, ...editForm });
        setIsEditing(false);
      } else {
        setError(res.message || 'Không thể lưu thay đổi.');
      }
    } catch (e: any) {
      setError(e.message || 'Lỗi kết nối khi lưu dữ liệu.');
    } finally {
      setSaving(false);
    }
  };

  const InfoRow = ({
    icon: Icon,
    label,
    value,
    mono = false,
  }: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
    mono?: boolean;
  }) => (
    <div className="flex items-start gap-3 py-2">
      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-medium text-slate-800 mt-0.5 break-words ${mono ? 'font-mono' : ''}`}>
          {value || '—'}
        </p>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col md:flex-row animate-[slideIn_0.2s_ease-out]">
        
        {/* Left Panel - Avatar & QR */}
        <div className="relative w-full md:w-2/5 shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-indigo-600 p-8 flex flex-col items-center justify-center text-center">
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="relative mb-4">
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-2xl border-4 border-white/20 shadow-xl bg-emerald-50"
            />
            {profile?.isActive !== false && (
              <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-2 border-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            )}
          </div>
          
          <h3 className="text-xl font-black text-white px-2">{profile?.fullname || '—'}</h3>
          <p className="text-emerald-100 text-sm font-mono mt-0.5">@{profile?.username}</p>

          <div className="mt-3 mb-6">
            {profile?.isActive !== false ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-400 px-3 py-1 rounded-full shadow-sm">
                <CheckCircle2 className="w-3 h-3" /> ĐANG HOẠT ĐỘNG
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-500 px-3 py-1 rounded-full shadow-sm">
                <XCircle className="w-3 h-3" /> ĐÃ BỊ KHÓA
              </span>
            )}
          </div>

          {/* QR Code */}
          {profile?.qr_code && (
            <div className="mt-auto bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner flex flex-col items-center">
              <div className="bg-white p-2 rounded-xl">
                <QRCodeDisplay value={profile.qr_code} size={110} showText={false} className="!p-0 !border-0 !shadow-none" />
              </div>
              <p className="mt-3 text-[11px] font-mono font-bold text-emerald-50 break-all bg-black/20 px-3 py-1 rounded-full">
                {profile.qr_code}
              </p>
            </div>
          )}
        </div>

        {/* Right Panel - Detailed Info */}
        <div className="w-full md:w-3/5 p-8 bg-white relative">
          <button
            onClick={onClose}
            className="hidden md:block absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex justify-between items-start mb-4 gap-2">
            <div>
              <h2 className="text-xl font-black text-slate-800">Thông Tin Chi Tiết</h2>
              <p className="text-xs text-slate-500 mt-1">Dữ liệu hồ sơ cá nhân và phân quyền hệ thống</p>
            </div>
            {!loading && profile && (
              !isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="mr-6 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition shrink-0"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Sửa
                </button>
              ) : (
                <div className="mr-6 flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setIsEditing(false); setError(null); }}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
                  >
                    {saving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Lưu
                  </button>
                </div>
              )
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 rounded-xl p-3 text-sm border border-rose-100 mb-4 animate-[slideIn_0.2s_ease-out]">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400 h-64">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Đang tải thông tin...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {!isEditing ? (
                <>
                  <InfoRow icon={User}      label="Họ và Tên"    value={profile?.fullname} />
                  <InfoRow icon={Hash}      label="Tên đăng nhập" value={profile?.username} mono />
                  <InfoRow icon={Phone}     label="Số điện thoại" value={profile?.phone} />
                </>
              ) : (
                <div className="col-span-1 sm:col-span-2 space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Họ và Tên</label>
                    <input
                      type="text"
                      value={editForm.fullname}
                      onChange={(e) => setEditForm({ ...editForm, fullname: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-medium border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="pt-2 mt-4 border-t border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tên đăng nhập (Username)</label>
                    <input
                      type="text"
                      value={editForm.username}
                      onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm font-medium font-mono text-slate-700 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    />
                    <p className="text-[10px] text-amber-600 font-bold mt-1.5">Cảnh báo: Đổi tên đăng nhập có thể yêu cầu bạn phải đăng nhập lại.</p>
                  </div>
                </div>
              )}
              
              {profile?.assigned_counters && profile.assigned_counters.length > 0 && (
                <div className="sm:col-span-2 mt-2 pt-4 border-t border-slate-100">
                  <InfoRow
                    icon={CreditCard}
                    label="Quầy bán phụ trách"
                    value={profile.assigned_counters.map((c) => c.name).join(', ')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
