import React from 'react';
import { Receipt, FileText, QrCode, Layers, ChevronRight } from 'lucide-react';
import { QRCodeDisplay } from '../../../shared/components/QRCodeDisplay';
import { Order, IssuedTicket } from '../../../shared/types/hpticket';

interface OrderDetailModalProps {
  selectedOrder: Order | null;
  orderDetail: any;
  issuedTickets: IssuedTicket[];
  selectedTicket: IssuedTicket | null;
  setSelectedOrder: (order: Order | null) => void;
  setSelectedTicket: (ticket: IssuedTicket | null) => void;
}

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString('vi-VN');
};

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  selectedOrder,
  orderDetail,
  issuedTickets,
  selectedTicket,
  setSelectedOrder,
  setSelectedTicket
}) => {
  if (!selectedOrder) return null;

  const orderId = (selectedOrder as any).order_id || selectedOrder.id;
  const orderTickets = issuedTickets.filter(
    (t: any) => t.order_id === orderId || t.order_id === (selectedOrder as any).id || t.order_id === (selectedOrder as any).order_id
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl text-slate-800 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Chi Tiết Đơn Hàng {(selectedOrder as any).order_code}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate((selectedOrder as any).created_at)} · {(selectedOrder as any).payment_method}
            </p>
          </div>
          <button
            onClick={() => setSelectedOrder(null)}
            className="text-slate-500 hover:text-slate-900 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            Đóng
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4 text-xs">
          {/* Order info */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div>
              <p className="text-slate-500 mb-0.5">Hóa đơn điện tử</p>
              <div className="flex flex-col">
                <span className="font-mono font-semibold text-emerald-700">
                  {(selectedOrder as any).invoice_number || <span className="text-amber-600">Đang tạo</span>}
                </span>
                {(selectedOrder as any).invoice_lookup_code && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Tra cứu: {(selectedOrder as any).invoice_lookup_code}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-slate-500 mb-0.5">Thanh toán</p>
              <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                {(selectedOrder as any).payment_method}
              </span>
            </div>
            {(selectedOrder as any).booker_name && (
              <div>
                <p className="text-slate-500 mb-0.5">Người đặt</p>
                <p className="font-semibold text-slate-800">{(selectedOrder as any).booker_name}</p>
              </div>
            )}
            {(selectedOrder as any).use_date && (
              <div>
                <p className="text-slate-500 mb-0.5">Ngày sử dụng</p>
                <p className="font-semibold text-slate-800">{(selectedOrder as any).use_date}</p>
              </div>
            )}
          </div>

          {/* Danh sách mặt hàng */}
          {orderDetail && (orderDetail.items || orderDetail.details) && (
            <div>
              <p className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Chi tiết sản phẩm / vé đã mua
                <span className="ml-1 bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {(orderDetail.items || orderDetail.details).length}
                </span>
              </p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3">Tên mục</th>
                      <th className="p-3 text-center">SL</th>
                      <th className="p-3 text-right">Đơn giá</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(orderDetail.items || orderDetail.details).map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-3">
                          <span className={`inline-block mr-2 text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${item.item_type === 'PRODUCT' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                            {item.item_type === 'PRODUCT' ? 'SP' : 'VÉ'}
                          </span>
                          <span className="font-semibold text-slate-700">{item.item_name}</span>
                        </td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right text-slate-500 font-mono">
                          {Number(item.unit_price).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 font-mono">
                          {Number(item.total_price).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Vé QR */}
          <div>
            <p className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-emerald-600" />
              Vé QR thuộc đơn hàng này
              <span className="ml-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {orderTickets.length}
              </span>
            </p>

            {orderTickets.length === 0 ? (
              <div className="text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Chưa tìm thấy vé QR – thử làm mới trang
              </div>
            ) : (
              <div className="space-y-2">
                {orderTickets.map((tkt: any, idx: number) => {
                  const isExpanded = selectedTicket?.id === tkt.id || selectedTicket?.qr_code_string === tkt.qr_code_string;
                  const statusColor =
                    tkt.status === 'USED' ? 'text-rose-600 bg-rose-50 border-rose-200'
                      : tkt.status === 'PARTIAL_USED' ? 'text-amber-600 bg-amber-50 border-amber-200'
                        : 'text-emerald-600 bg-emerald-50 border-emerald-200';
                  const isUnlim = tkt.allowed_passes === 999999 || tkt.ticket_type === 'UNLIMITED';
                  const statusLabel =
                    tkt.status === 'USED' ? 'Đã dùng hết'
                      : tkt.status === 'PARTIAL_USED' ? (isUnlim ? `Vé Tháng (Đã quét ${tkt.used_passes})` : `Đã quét ${tkt.used_passes}/${tkt.allowed_passes}`)
                        : 'Chưa sử dụng';

                  return (
                    <div key={`${tkt.id}-${idx}`} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setSelectedTicket(isExpanded ? null : tkt)}
                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
                            {statusLabel}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{tkt.ticket_template_name || 'Vé tham quan'}</p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">{tkt.qr_code_string}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-[10px] text-slate-500 font-mono">Hạn: {tkt.valid_date}</span>
                          <QrCode className={`w-4 h-4 transition ${isExpanded ? 'text-emerald-600' : 'text-slate-400'}`} />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 flex flex-col items-center gap-3">
                          <QRCodeDisplay value={tkt.qr_display || tkt.qr_code_string} size={160} />
                          <p className="text-[10px] font-mono text-slate-500 text-center break-all">{tkt.qr_code_string}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <Layers className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-slate-600">Lượt quét:</span>
                            <span className="font-bold text-amber-700 font-mono">{tkt.used_passes ?? 0} / {isUnlim ? 'Vô Hạn (30 Ngày)' : (tkt.allowed_passes ?? 1)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Financial Summary */}
        {(() => {
          const orderData = orderDetail || selectedOrder;
          const totalAmount = Number((orderData as any).total_amount || 0);
          const discount = Number((orderData as any).applied_discount_amount || (orderData as any).discount_amount || 0);
          const finalAmount = Number((orderData as any).final_amount || 0);
          
          const beforeVatAmount = (orderData as any).total_pre_tax_amount != null 
              ? Math.round(Number((orderData as any).total_pre_tax_amount)) 
              : Math.round(finalAmount / 1.08);
          const vatAmount = (orderData as any).total_tax_amount != null 
              ? Math.round(Number((orderData as any).total_tax_amount)) 
              : finalAmount - beforeVatAmount;

          return (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex flex-col items-end gap-1.5 rounded-b-2xl">
              {discount > 0 && (
                 <div className="flex justify-between items-center w-full max-w-[280px] text-xs text-slate-500">
                   <span>Cộng tiền hàng:</span>
                   <span className="font-mono">{totalAmount.toLocaleString('vi-VN')} đ</span>
                 </div>
              )}
              {discount > 0 && (
                 <div className="flex justify-between items-center w-full max-w-[280px] text-xs text-amber-600">
                   <span>Chiết khấu / Khuyến mãi:</span>
                   <span className="font-mono">- {discount.toLocaleString('vi-VN')} đ</span>
                 </div>
              )}
              <div className="flex justify-between items-center w-full max-w-[280px] text-xs text-slate-500 italic mt-1">
                <span>- Giá trị trước thuế (VAT):</span>
                <span className="font-mono">{beforeVatAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between items-center w-full max-w-[280px] text-xs text-slate-500 italic pb-2 border-b border-slate-200">
                <span>- Thuế VAT:</span>
                <span className="font-mono">{vatAmount.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between items-center w-full max-w-[280px] pt-1">
                <span className="text-sm font-bold text-slate-900">Tổng thanh toán:</span>
                <span className="font-mono font-extrabold text-lg text-emerald-700">
                  {finalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
