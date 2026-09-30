import React, { useState } from 'react';
import { RefreshCw, FileText, X } from 'lucide-react';
import { toast } from '../../../shared/utils/toast';
import { VNDateInput } from '../../../shared/components/ui';
import { invoiceService } from '../services/invoiceService';

interface InvoiceRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const InvoiceRecoveryModal: React.FC<InvoiceRecoveryModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mặc định ngày hôm qua và hôm nay
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const [fromDate, setFromDate] = useState<string>(yesterday.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(today.toISOString().split('T')[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.info('Vui lòng chọn Từ ngày và Đến ngày.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await invoiceService.issueRecovery(fromDate, toDate);
      if (res?.data?.status === 'SUCCESS') {
        toast.success(`Xuất bù thành công! Khớp ${res.data.invoiceNumber || ''}`);
        onSuccess();
        onClose();
      } else {
        toast.info(res?.message || 'Không có đơn nào cần xuất bù hoặc lỗi xảy ra.');
      }
    } catch (err: any) {
      toast.error('Lỗi khi xuất bù hóa đơn: ' + (err?.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-orange-500" />
            Xuất Bù Hóa Đơn Khách Lẻ
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-3 rounded-lg flex gap-2 items-start">
            <div className="font-medium">Lưu ý:</div>
            <div>Hệ thống sẽ tìm các giao dịch đã thanh toán nhưng chưa hoàn tất việc phát hành hóa đơn và thực hiện xử lý khôi phục theo từng giao dịch/ngày nghiệp vụ (không gộp các ngày khác nhau).</div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Từ ngày</label>
              <VNDateInput
                value={fromDate}
                onChange={setFromDate}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đến ngày</label>
              <VNDateInput
                value={toDate}
                onChange={setToDate}
                className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition"
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Xác nhận xuất bù
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
