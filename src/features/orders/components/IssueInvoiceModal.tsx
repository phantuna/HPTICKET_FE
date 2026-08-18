import React, { useState, useEffect } from 'react';
import { FileText, Send, Users, X } from 'lucide-react';
import { IssueOrderPayload } from '../services/invoiceService';

interface IssueInvoiceModalProps {
  isOpen: boolean;
  selectedCount: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmitCompany: (payload: IssueOrderPayload) => Promise<void>;
}

/**
 * Modal nhập thông tin công ty khi phát hành hóa đơn cho khách đoàn / công ty.
 * Nếu để trống MST → hệ thống sẽ xử lý như khách lẻ (buyerNotGetInvoice=1).
 */
export const IssueInvoiceModal: React.FC<IssueInvoiceModalProps> = ({
  isOpen,
  selectedCount,
  isSubmitting,
  onClose,
  onSubmitCompany,
}) => {
  const [buyerTaxCode, setBuyerTaxCode] = useState('');
  const [buyerLegalName, setBuyerLegalName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Giả lập sự kiện submit form
        handleSubmit(e as any);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, buyerTaxCode, buyerLegalName, buyerAddress, buyerEmail, isSubmitting]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await onSubmitCompany({
        buyer_tax_code: buyerTaxCode || undefined,
        buyer_legal_name: buyerLegalName || undefined,
        buyer_address: buyerAddress || undefined,
        buyer_email: buyerEmail || undefined,
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleClear = () => {
    setBuyerTaxCode('');
    setBuyerLegalName('');
    setBuyerAddress('');
    setBuyerEmail('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Phát Hành Hóa Đơn Điện Tử</h3>
              <p className="text-blue-100 text-xs">{selectedCount} đơn hàng được chọn</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <strong>Lưu ý:</strong> Nếu để trống MST, hệ thống sẽ phát hành HĐ với người mua là <em>"Khách lẻ không lấy hóa đơn"</em>.
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 font-semibold flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <p className="flex-1">{errorMsg}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Mã số thuế (MST)
              </label>
              <input
                type="text"
                value={buyerTaxCode}
                onChange={e => setBuyerTaxCode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e as any); } }}
                placeholder="Ví dụ: 0100109106501"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tên công ty
              </label>
              <input
                type="text"
                value={buyerLegalName}
                onChange={e => setBuyerLegalName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e as any); } }}
                placeholder="Tên đầy đủ theo đăng ký kinh doanh"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                value={buyerAddress}
                onChange={e => setBuyerAddress(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e as any); } }}
                placeholder="Địa chỉ công ty"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Email nhận hóa đơn
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={e => setBuyerEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(e as any); } }}
                placeholder="email@company.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none transition"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Xóa Form
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSubmitting ? 'Đang gửi...' : `Phát hành ${selectedCount} HĐ`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
