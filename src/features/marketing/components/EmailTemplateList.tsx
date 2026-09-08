import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface EmailTemplate {
  id: string;
  template_code: string;
  template_name: string;
  subject: string;
  body_html: string;
  banner_url: string;
  is_active: boolean;
}

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  editingTemplate: EmailTemplate | null;
  setEditingTemplate: React.Dispatch<React.SetStateAction<EmailTemplate | null>>;
  onDeleteTemplate: (id: string) => void;
}

const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  templates,
  editingTemplate,
  setEditingTemplate,
  onDeleteTemplate
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h3 className="font-semibold text-gray-800">Danh Sách Mẫu</h3>
        <button 
          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          onClick={() => setEditingTemplate({
            id: '', template_code: '', template_name: '', subject: '', body_html: '', banner_url: '', is_active: true
          })}
          title="Thêm mới"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-gray-100">
        {templates.map(t => (
          <li 
            key={t.id} 
            className={`p-4 hover:bg-gray-50 flex items-center justify-between cursor-pointer ${editingTemplate?.id === t.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
            onClick={() => setEditingTemplate(t)}
          >
            <div>
              <p className="font-medium text-gray-800">{t.template_name}</p>
              <p className="text-xs text-gray-500 mt-1">{t.template_code}</p>
            </div>
            <button className="text-gray-400 hover:text-red-500 p-1" onClick={(e) => { e.stopPropagation(); onDeleteTemplate(t.id); }}>
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {templates.length === 0 && (
          <li className="p-8 text-center text-gray-400 text-sm">Chưa có mẫu email nào.</li>
        )}
      </ul>
    </div>
  );
};

export default EmailTemplateList;
