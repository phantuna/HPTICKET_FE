import React, { useState } from 'react';
import { AlertTriangle, UploadCloud } from 'lucide-react';
import { BackupFile, systemService } from '../../../api/systemService';
import { toast } from '../../../shared/utils/toast';
import { ConfirmModal } from '../../../shared/components/ConfirmModal';

interface RestoreDatabaseProps {
  files: BackupFile[];
  onRefresh: () => void;
}

const RestoreDatabase: React.FC<RestoreDatabaseProps> = ({ files, onRefresh }) => {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{isOpen: boolean, type: 'list' | 'upload', fileName?: string}>({isOpen: false, type: 'list'});

  const executeRestore = async () => {
    try {
      if (confirmRestore.type === 'list' && confirmRestore.fileName) {
        await systemService.restoreBackup(confirmRestore.fileName);
        toast.success('Khôi phục CSDL thành công!');
      } else if (confirmRestore.type === 'upload' && uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        await systemService.uploadAndRestore(formData);
        toast.success('Upload và khôi phục thành công!');
        onRefresh();
        setUploadFile(null);
      }
    } catch (error) {
      toast.error('Khôi phục CSDL thất bại!');
    } finally {
      setConfirmRestore({isOpen: false, type: 'list'});
    }
  };

  const handleRestore = (fileName: string) => {
    setConfirmRestore({isOpen: true, type: 'list', fileName});
  };

  const handleUploadAndRestore = () => {
    if (!uploadFile) {
      toast.error('Vui lòng chọn file trước!');
      return;
    }
    setConfirmRestore({isOpen: true, type: 'upload'});
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
        Khôi phục CSDL
      </h2>
      
      <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
        <p className="text-sm text-orange-800 font-medium">
          CẢNH BÁO: Quá trình khôi phục sẽ xóa sạch toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu trong file bạn chọn!
        </p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
          <input 
            type="file" 
            id="fileUpload" 
            className="hidden" 
            accept=".sql"
            onChange={e => setUploadFile(e.target.files ? e.target.files[0] : null)}
          />
          <label htmlFor="fileUpload" className="cursor-pointer">
            <UploadCloud className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <span className="block text-sm font-medium text-gray-700">
              {uploadFile ? uploadFile.name : "Tải lên file .sql từ máy tính"}
            </span>
          </label>
        </div>
        
        <button 
          onClick={handleUploadAndRestore}
          disabled={!uploadFile}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-lg font-bold shadow-sm transition-colors"
        >
          Khôi phục từ File tải lên
        </button>
      </div>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-3 text-sm text-gray-400">HOẶC</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Khôi phục nhanh từ danh sách bên:</p>
        {files.slice(0, 3).map(f => (
          <button 
            key={f.fileName}
            onClick={() => handleRestore(f.fileName)}
            className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-orange-50 border border-gray-100 rounded-lg text-sm transition-colors flex justify-between items-center"
          >
            <span className="font-medium text-gray-700 truncate mr-2">{f.fileName}</span>
            <span className="text-orange-600 font-semibold shrink-0">Restore</span>
          </button>
        ))}
      </div>

      <ConfirmModal
        isOpen={confirmRestore.isOpen}
        onClose={() => setConfirmRestore({isOpen: false, type: 'list'})}
        onConfirm={executeRestore}
        title="CẢNH BÁO NGUY HIỂM"
        message="Quá trình khôi phục sẽ xóa sạch toàn bộ dữ liệu hiện tại và thay thế bằng dữ liệu trong file bạn chọn! Bạn có chắc chắn muốn tiếp tục?"
        type="danger"
        confirmText="Vẫn khôi phục"
      />
    </div>
  );
};

export default RestoreDatabase;
