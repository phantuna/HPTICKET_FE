import React from 'react';
import { Edit } from 'lucide-react';
import { EmailTemplate } from './EmailTemplateList';

interface EmailTemplateEditorProps {
  editingTemplate: EmailTemplate;
  setEditingTemplate: React.Dispatch<React.SetStateAction<EmailTemplate | null>>;
  onSave: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  editingTemplate,
  setEditingTemplate,
  onSave
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-500" />
          {editingTemplate.id ? 'Chỉnh Sửa Mẫu' : 'Tạo Mẫu Mới'}
        </h3>
        <button onClick={() => setEditingTemplate(null)} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mã mẫu (VD: EXPIRE_WARN)</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 rounded-lg border border-gray-200" 
            value={editingTemplate.template_code} 
            onChange={e => setEditingTemplate({...editingTemplate, template_code: e.target.value})} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên mẫu</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 rounded-lg border border-gray-200" 
            value={editingTemplate.template_name} 
            onChange={e => setEditingTemplate({...editingTemplate, template_name: e.target.value})} 
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề Email (Subject)</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 rounded-lg border border-gray-200" 
            value={editingTemplate.subject} 
            onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} 
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Ảnh Banner (Link ảnh ưu đãi, chúc mừng...)</label>
          <input 
            type="text" 
            className="w-full px-3 py-2 rounded-lg border border-gray-200" 
            placeholder="https://example.com/banner.jpg" 
            value={editingTemplate.banner_url || ''} 
            onChange={e => setEditingTemplate({...editingTemplate, banner_url: e.target.value})} 
          />
        </div>
        <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung HTML (Code)</label>
            <textarea 
              className="w-full h-80 px-3 py-2 rounded-lg border border-gray-200 font-mono text-sm resize-none" 
              value={editingTemplate.body_html || ''} 
              onChange={e => setEditingTemplate({...editingTemplate, body_html: e.target.value})}
              placeholder="<h1>Xin chào {customer_name},</h1>..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Xem trước (Live Preview)</label>
            <div className="w-full h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 p-2">
              <iframe 
                className="w-full h-full bg-white rounded border border-gray-100" 
                srcDoc={editingTemplate.body_html || '<div style="color: #999; padding: 20px; font-family: sans-serif;">Giao diện hiển thị ở đây...</div>'} 
                title="preview"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50" onClick={() => setEditingTemplate(null)}>Hủy</button>
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={onSave}>Lưu Mẫu</button>
      </div>
    </div>
  );
};

export default EmailTemplateEditor;
