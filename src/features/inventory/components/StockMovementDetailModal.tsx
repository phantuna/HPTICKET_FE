import React, { useEffect } from 'react';
import {
  X,
  History,
  Package,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  FileText,
  User,
  Clock,
  Layers,
  CheckCircle2,
  DollarSign,
  Barcode,
} from 'lucide-react';
import { StockMovementLog, StockMovementType } from '../../../shared/types/hpticket';

interface StockMovementDetailModalProps {
  log: StockMovementLog;
  onClose: () => void;
}

export const StockMovementDetailModal: React.FC<StockMovementDetailModalProps> = ({ log, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const getTypeMeta = (type: StockMovementType) => {
    switch (type) {
      case 'OPENING_BALANCE':
        return {
          label: 'TỒN ĐẦU KỲ',
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          icon: <Layers className="w-4 h-4 text-indigo-600" />,
          operator: '+',
          color: 'text-indigo-700',
        };
      case 'IMPORT':
        return {
          label: 'NHẬP KHO',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <TrendingUp className="w-4 h-4 text-emerald-600" />,
          operator: '+',
          color: 'text-emerald-700',
        };
      case 'EXPORT':
        return {
          label: 'XUẤT KHO',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <TrendingDown className="w-4 h-4 text-amber-600" />,
          operator: '-',
          color: 'text-amber-700',
        };
      case 'POS_SALE':
        return {
          label: 'BÁN LẺ POS',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: <TrendingDown className="w-4 h-4 text-blue-600" />,
          operator: '-',
          color: 'text-blue-700',
        };
      case 'ADJUST':
        return {
          label: 'ĐIỀU CHỈNH KIỂM KÊ',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: <RefreshCw className="w-4 h-4 text-purple-600" />,
          operator: (log.after_quantity ?? 0) >= (log.before_quantity ?? 0) ? '+' : '-',
          color: 'text-purple-700',
        };
      default:
        return {
          label: type,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          icon: <History className="w-4 h-4 text-slate-600" />,
          operator: '',
          color: 'text-slate-700',
        };
    }
  };

  const meta = getTypeMeta(log.type);
  const beforeVal = log.before_quantity !== undefined ? log.before_quantity : (log as any).beforeQuantity;
  const afterVal  = log.after_quantity  !== undefined ? log.after_quantity  : (log as any).afterQuantity;
  const beforeQty = beforeVal !== undefined ? beforeVal : '—';
  const afterQty  = afterVal  !== undefined ? afterVal  : '—';
  const unit        = log.unit        || 'Cái';
  const productName = log.product_name || (log as any).productName || '—';
  const productCode = log.product_code || (log as any).productCode || 'PRD';
  const refType     = log.reference_type  || (log as any).referenceType;
  const refCode     = log.reference_code  || (log as any).referenceCode;
  const counterName = log.sales_counter_name || (log as any).salesCounterName;
  const counterId   = log.sales_counter_id   || (log as any).salesCounterId;
  const performedBy = log.performed_by || (log as any).performedBy || 'admin';
  const unitPrice   = Number(log.unit_price  ?? (log as any).unitPrice  ?? 0);
  const totalValue  = Number(log.total_value ?? (log as any).totalValue ?? 0);
  const absQty      = Math.abs(log.quantity ?? 0);

  const dateStr = log.created_at || (log as any).createdAt;
  const formattedDate = dateStr && !isNaN(new Date(dateStr).getTime())
    ? new Date(dateStr).toLocaleString('vi-VN')
    : '—';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-slate-900 animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Chi Tiết Biến Động Kho</h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${meta.badgeClass}`}>
                  {meta.icon}
                  <span>{meta.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Mã log: #{log.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Product Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-900 text-sm">{productName}</span>
              </div>
              <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                  {productCode}
                </span>
                <span>•</span>
                <span>Đơn vị tính: <strong className="text-slate-800">{unit}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Thời gian ghi nhận</span>
              <span className="text-xs font-mono font-semibold text-slate-800">{formattedDate}</span>
            </div>
          </div>

          {/* Stock Flow Diagram */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Biến Động Tồn Kho Thực Tế</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center text-center">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium mb-1">Tồn Trước</span>
                <span className="text-base sm:text-lg font-mono font-bold text-slate-700">
                  {typeof beforeQty === 'number' ? beforeQty.toLocaleString('vi-VN') : beforeQty}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{unit}</span>
              </div>
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[11px] font-semibold text-slate-500 mb-1">Biến động</span>
                <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-sm sm:text-base flex items-center gap-1 shadow-2xs ${meta.badgeClass}`}>
                  <span>{meta.operator}{absQty.toLocaleString('vi-VN')}</span>
                  <span className="text-xs font-normal">{unit}</span>
                </div>
                <div className="flex items-center justify-center text-slate-400 mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium mb-1">Tồn Sau</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-700">
                  {typeof afterQty === 'number' ? afterQty.toLocaleString('vi-VN') : afterQty}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{unit}</span>
              </div>
            </div>
          </div>

          {/* Reference & Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Reference info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-slate-500" />
                <span>Chứng Từ / Tham Chiếu</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Loại chứng từ:</span>
                  <span className="font-bold text-slate-800">
                    {refType === 'POS_ORDER'
                      ? 'Hóa đơn bán lẻ POS'
                      : refType === 'INVENTORY_ADJUSTMENT'
                      ? 'Biên bản kiểm kê kho'
                      : refType === 'OPENING_BALANCE'
                      ? 'Số dư tồn kho đầu kỳ'
                      : 'Phiếu kho thủ công'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Mã chứng từ:</span>
                  <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {refCode || 'N/A'}
                  </span>
                </div>
                {(counterName || counterId) && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Quầy bán hàng:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {counterName || `Quầy #${counterId}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Người thực hiện:</span>
                  <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{performedBy}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Financial info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giá Trị Giao Dịch</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Đơn giá áp dụng:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {unitPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng giá trị:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {totalValue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Phương thức:</span>
                  <span className="font-semibold text-slate-700">Ghi nhận tức thời</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Note / Reason */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Ghi Chú &amp; Lý Do Kiểm Toán</span>
            </div>
            <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pl-5">
              {log.note || log.reason || 'Không có ghi chú bổ sung.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
export default StockMovementDetailModal;

  const beforeQty = beforeVal !== undefined ? beforeVal : '—';
  const afterQty = afterVal !== undefined ? afterVal : '—';
  const unit = log.unit || 'Cái';
  const productName = log.product_name || (log as any).productName || '—';
  const productCode = log.product_code || (log as any).productCode || 'PRD';
  const refType = log.reference_type || (log as any).referenceType;
  const refCode = log.reference_code || (log as any).referenceCode;
  const counterName = log.sales_counter_name || (log as any).salesCounterName;
  const counterId = log.sales_counter_id || (log as any).salesCounterId;
  const performedBy = log.performed_by || (log as any).performedBy || 'admin';
  const unitPrice = Number(log.unit_price ?? (log as any).unitPrice ?? 0);
  const totalValue = Number(log.total_value ?? (log as any).totalValue ?? 0);
  const absQty = Math.abs(log.quantity);

  const dateStr = log.created_at || (log as any).createdAt;
  const formattedDate = dateStr && !isNaN(new Date(dateStr).getTime())
    ? new Date(dateStr).toLocaleString('vi-VN')
    : '—';

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 text-slate-900 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Chi Tiết Biến Động Kho</h2>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${meta.badgeClass}`}>
                  {meta.icon}
                  <span>{meta.label}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">Mã log: #{log.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {/* Product Info Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <span className="font-bold text-slate-900 text-sm">{productName}</span>
              </div>
              <div className="text-xs font-mono text-slate-500 flex items-center gap-2">
                <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-semibold text-slate-700">
                  {productCode}
                </span>
                <span>•</span>
                <span>Đơn vị tính: <strong className="text-slate-800">{unit}</strong></span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Thời gian ghi nhận</span>
              <span className="text-xs font-mono font-semibold text-slate-800">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Stock Flow Diagram */}
          <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Biến Động Tồn Kho Thực Tế</span>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center text-center">
              {/* Before */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium mb-1">Tồn Trước</span>
                <span className="text-base sm:text-lg font-mono font-bold text-slate-700">
                  {typeof beforeQty === 'number' ? beforeQty.toLocaleString('vi-VN') : beforeQty}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{unit}</span>
              </div>

              {/* Movement */}
              <div className="flex flex-col items-center justify-center px-1">
                <span className="text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
                  <span>Biến động</span>
                </span>
                <div className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-sm sm:text-base flex items-center gap-1 shadow-2xs ${meta.badgeClass}`}>
                  <span>{meta.operator}{absQty.toLocaleString('vi-VN')}</span>
                  <span className="text-xs font-normal">{unit}</span>
                </div>
                <div className="flex items-center justify-center text-slate-400 mt-1">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>

              {/* After */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[11px] text-slate-500 block font-medium mb-1">Tồn Sau</span>
                <span className="text-base sm:text-lg font-mono font-bold text-emerald-700">
                  {typeof afterQty === 'number' ? afterQty.toLocaleString('vi-VN') : afterQty}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">{unit}</span>
              </div>
            </div>
          </div>

          {/* Reference & Financial Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Reference info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Barcode className="w-3.5 h-3.5 text-slate-500" />
                <span>Chứng Từ / Tham Chiếu</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Loại chứng từ:</span>
                  <span className="font-bold text-slate-800">
                    {refType === 'POS_ORDER'
                      ? 'Hóa đơn bán lẻ POS'
                      : refType === 'INVENTORY_ADJUSTMENT'
                      ? 'Biên bản kiểm kê kho'
                      : refType === 'OPENING_BALANCE'
                      ? 'Số dư tồn kho đầu kỳ'
                      : 'Phiếu kho thủ công'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Mã chứng từ:</span>
                  <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {refCode || 'N/A'}
                  </span>
                </div>
                {(counterName || counterId) && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Quầy bán hàng:</span>
                    <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {counterName || `Quầy #${counterId}`}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span>Người thực hiện:</span>
                  <span className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>{performedBy}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Financial info */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giá Trị Giao Dịch</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Đơn giá áp dụng:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {unitPrice.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tổng giá trị:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {totalValue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Phương thức:</span>
                  <span className="font-semibold text-slate-700">Ghi nhận tức thời</span>
                </div>
              </div>
            </div>
          </div>ssName="font-semibold text-slate-700">Ghi nhận tức thời</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Note / Reason */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Ghi Chú & Lý Do Kiểm Toán</span>
            </div>
            <p className="text-slate-800 font-medium whitespace-pre-wrap leading-relaxed pl-5">
              {log.note || 'Không có ghi chú bổ sung.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
export default StockMovementDetailModal;
