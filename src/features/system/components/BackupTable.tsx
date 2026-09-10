import React from 'react';
import { Archive, Download, RefreshCw, Trash2 } from 'lucide-react';
import { BackupFile, systemService } from '../../../api/systemService';
import { API_BASE_URL } from '../../../api/apiConfig';
import { toast } from '../../../shared/utils/toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';
import { PromptModal } from '../../../shared/components/PromptModal';

interface BackupTableProps {
  activeTab: 'SQL' | 'CSV';
  files: BackupFile[];
  onRefresh: () => void;
}

const BackupTable: React.FC<BackupTableProps> = ({ activeTab, files, onRefresh }) => {
  const [deleteConfirm, setDeleteConfirm] = React.useState<{isOpen: boolean, fileName: string}>({isOpen: false, fileName: ''});
  const [archivePrompt, setArchivePrompt] = React.useState(false);

  const handleTriggerBackup = async () => {
    try {
      await systemService.triggerBackup();
      toast.success('Đã tạo sao lưu thành công!');
      onRefresh();
    } catch (error) {
      toast.error('Tạo sao lưu thất bại');
    }
  };

  const handleTriggerArchive = async (months: string) => {
    if (!months) return;
    try {
      await systemService.triggerArchive(months);
      toast.success('Lưu trữ lịch sử thành công!');
      setArchivePrompt(false);
      onRefresh();
    } catch (error) {
      toast.error('Lưu trữ lịch sử thất bại');
    }
  };

  const handleDelete = async () => {
    const fileName = deleteConfirm.fileName;
    if (!fileName) return;
    try {
      await systemService.deleteBackupFile(fileName);
      toast.success('Đã xóa file sao lưu!');
      setDeleteConfirm({isOpen: false, fileName: ''});
      onRefresh();
    } catch (error) {
      toast.error('Lỗi khi xóa file');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          {activeTab === 'SQL' ? 'Danh sách File Sao Lưu' : 'Danh sách File Lưu Trữ Lịch Sử'}
        </h2>
        {activeTab === 'SQL' ? (
          /* Nút Tạo sao lưu đã được ẩn theo yêu cầu do server chưa cài đặt pg_dump */
          null
        ) : (
          <button onClick={() => setArchivePrompt(true)} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors">
            <Archive className="w-4 h-4" /> Thực thi lưu trữ ngay
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm">
              <th className="p-3 font-medium">Tên file</th>
              <th className="p-3 font-medium">Dung lượng</th>
              <th className="p-3 font-medium">Thời gian</th>
              <th className="p-3 font-medium w-32">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {files.map((f) => (
              <tr key={f.fileName} className="hover:bg-gray-50/50">
                <td className="p-3 text-sm text-gray-800 font-medium">{f.fileName}</td>
                <td className="p-3 text-sm text-gray-600">{(f.fileSize / 1024).toFixed(2)} KB</td>
                <td className="p-3 text-sm text-gray-600">{f.createdAt}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <a 
                      href={`${API_BASE_URL}/system/backup/files/${f.fileName}/download`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Tải về"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button 
                      onClick={() => setDeleteConfirm({isOpen: true, fileName: f.fileName})}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {files.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-500">Chưa có file nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({isOpen: false, fileName: ''})}
        onConfirm={handleDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa file sao lưu "${deleteConfirm.fileName}" không? Hành động này không thể hoàn tác.`}
        type="danger"
        confirmText="Xóa file"
      />

      <PromptModal
        isOpen={archivePrompt}
        onClose={() => setArchivePrompt(false)}
        onConfirm={handleTriggerArchive}
        title="Lưu trữ lịch sử (Archive)"
        message="Hệ thống sẽ chuyển các dữ liệu lịch sử quét vé cũ ra file CSV và xóa khỏi CSDL để giảm tải. Vui lòng nhập số tháng cũ hơn để lưu trữ:"
        placeholder="Nhập số tháng (vd: 12)"
        inputType="number"
        type="warning"
        confirmText="Thực thi lưu trữ"
      />
    </div>
  );
};

export default BackupTable;
