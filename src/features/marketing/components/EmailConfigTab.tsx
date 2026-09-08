import React, { useState, useEffect } from 'react';
import { Mail, Settings, LayoutTemplate } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { marketingService } from '../../../api/marketingService';
import SmtpSettingsForm from './SmtpSettingsForm';
import EmailTemplateList, { EmailTemplate } from './EmailTemplateList';
import EmailTemplateEditor from './EmailTemplateEditor';

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

export const EmailConfigTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'settings' | 'templates'>('settings');
  
  // Settings State
  const [settings, setSettings] = useState<EmailSettings>({
    service_provider: 'GMAIL',
    host: 'smtp.gmail.com',
    port: 587,
    username: '',
    password: '',
    from_address: '',
    from_name: '',
    is_active: true
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Templates State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);

  useEffect(() => {
    fetchSettings();
    fetchTemplates();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await marketingService.fetchEmailSettings();
      if (response && response.data && response.data.id) {
        setSettings(response.data as any);
      }
    } catch (error) {
      console.error('Error fetching email settings', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await marketingService.fetchEmailTemplates();
      if (response && response.data) {
        const dataArray = (response.data as any).content || response.data;
        setTemplates(Array.isArray(dataArray) ? dataArray : []);
      }
    } catch (error) {
      console.error('Error fetching templates', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await marketingService.saveEmailSettings(settings);
      toast.success('Đã lưu cấu hình Email thành công!');
    } catch (error) {
      console.error('Error saving settings', error);
      // Let the apiClient handle the toast if we want, or keep this
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;
    try {
      await marketingService.saveEmailTemplate(editingTemplate);
      setEditingTemplate(null);
      fetchTemplates();
      toast.success('Đã lưu mẫu email thành công!');
    } catch (error) {
      console.error('Error saving template', error);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẫu email này?')) return;
    try {
      await marketingService.deleteEmailTemplate(id);
      fetchTemplates();
      toast.success('Đã xóa mẫu email!');
    } catch (error) {
      console.error('Error deleting template', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Mail className="h-6 w-6 text-blue-500" />
            Cấu Hình Email & Mẫu Gửi
          </h2>
          <p className="text-gray-500 mt-1">Thiết lập máy chủ gửi mail tự động và thiết kế các mẫu email gửi cho khách hàng</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4" />
          Máy Chủ Gửi Mail (SMTP)
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 ${activeTab === 'templates' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('templates')}
        >
          <LayoutTemplate className="h-4 w-4" />
          Quản Lý Mẫu Email
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SmtpSettingsForm 
          settings={settings}
          setSettings={setSettings}
          onSave={handleSaveSettings}
          savingSettings={savingSettings}
        />
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-12 gap-6">
          {/* List Templates */}
          <div className={`${editingTemplate ? 'col-span-4' : 'col-span-12'} transition-all duration-300`}>
            <EmailTemplateList 
              templates={templates}
              editingTemplate={editingTemplate}
              setEditingTemplate={setEditingTemplate}
              onDeleteTemplate={handleDeleteTemplate}
            />
          </div>

          {/* Editor */}
          {editingTemplate && (
            <div className="col-span-8">
              <EmailTemplateEditor 
                editingTemplate={editingTemplate}
                setEditingTemplate={setEditingTemplate}
                onSave={handleSaveTemplate}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
