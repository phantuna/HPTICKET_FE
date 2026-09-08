import React from 'react';
import { Save } from 'lucide-react';

interface EmailSettings {
  id?: string;
  service_provider: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  from_address: string;
  from_name: string;
  is_active: boolean;
}

interface SmtpSettingsFormProps {
  settings: EmailSettings;
  setSettings: React.Dispatch<React.SetStateAction<EmailSettings>>;
  onSave: () => void;
  savingSettings: boolean;
}

const SmtpSettingsForm: React.FC<SmtpSettingsFormProps> = ({ 
  settings, 
  setSettings, 
  onSave, 
  savingSettings 
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Thông số cấu hình SMTP</h3>
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Dịch vụ (Provider)</label>
          <select
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.service_provider}
            onChange={e => setSettings({...settings, service_provider: e.target.value})}
          >
            <option value="GMAIL">Gmail SMTP</option>
            <option value="SENDGRID">SendGrid</option>
            <option value="AWS_SES">Amazon SES</option>
            <option value="CUSTOM">Khác (Custom SMTP)</option>
          </select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.host}
            onChange={e => setSettings({...settings, host: e.target.value})}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
          <input
            type="number"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.port}
            onChange={e => setSettings({...settings, port: Number(e.target.value)})}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tên người gửi (From Name)</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.from_name}
            onChange={e => setSettings({...settings, from_name: e.target.value})}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email gửi đi (From Address)</label>
          <input
            type="email"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.from_address}
            onChange={e => setSettings({...settings, from_address: e.target.value})}
          />
        </div>
        <div className="col-span-2 sm:col-span-1"></div>
        
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tài khoản (Username)</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            value={settings.username}
            onChange={e => setSettings({...settings, username: e.target.value})}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu / App Password</label>
          <input
            type="password"
            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            placeholder="Để trống nếu không muốn đổi"
            value={settings.password || ''}
            onChange={e => setSettings({...settings, password: e.target.value})}
          />
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button 
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
          onClick={onSave}
          disabled={savingSettings}
        >
          <Save className="h-4 w-4" />
          {savingSettings ? 'Đang lưu...' : 'Lưu Cấu Hình'}
        </button>
      </div>
    </div>
  );
};

export default SmtpSettingsForm;
