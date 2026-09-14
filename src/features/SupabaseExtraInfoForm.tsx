import React, { useState } from 'react';
import { supabase } from '../api/supabaseClient';

interface ExtraInfoFormProps {
  userId: string; // Truyền userId từ hệ thống hiện tại vào đây để link dữ liệu
}

export const SupabaseExtraInfoForm: React.FC<ExtraInfoFormProps> = ({ userId }) => {
  const [cccd, setCccd] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Gọi trực tiếp đến Supabase, lưu ý bạn cần tạo bảng 'user_extra_info' trên giao diện Supabase trước
      const { data, error } = await supabase
        .from('user_extra_info')
        .upsert([
          { 
            user_id: userId, // Khóa ngoại để map với database hệ thống Java
            cccd: cccd,
            dia_chi: address 
          }
        ], { onConflict: 'user_id' }); // Upsert: Nếu trùng user_id thì sẽ update

      if (error) {
        throw error;
      }

      setMessage('Lưu thông tin bổ sung thành công!');
    } catch (err: any) {
      console.error(err);
      setMessage('Lỗi khi lưu dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow border border-gray-200">
      <h3 className="text-lg font-bold mb-4">Cập nhật thông tin bổ sung (Supabase)</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Số CCCD / CMND</label>
          <input 
            type="text" 
            value={cccd}
            onChange={(e) => setCccd(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhập số CCCD"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Địa chỉ thường trú</label>
          <input 
            type="text" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nhập địa chỉ"
          />
        </div>
        
        {message && (
          <div className={`p-2 rounded text-sm ${message.includes('Lỗi') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu thông tin'}
        </button>
      </form>
    </div>
  );
};
