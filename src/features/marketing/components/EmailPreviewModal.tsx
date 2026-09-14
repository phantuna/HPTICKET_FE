import React from 'react';
import { X, Send } from 'lucide-react';

interface TicketInfo {
  index: number;
  seatInfo: string;
  price: string;
  ticketCode: string;
  qrCodeBase64: string;
}

export interface EmailPreviewData {
  emailTo: string;
  subject: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  eventName: string;
  startTime: string;
  location: string;
  tickets: TicketInfo[];
  totalPayment: string;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EmailPreviewData;
  onSendTestEmail?: () => void;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({ isOpen, onClose, data, onSendTestEmail }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="font-bold text-lg text-gray-800">Chi tiết gửi thông báo qua email</h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-white text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
          {/* Header Info */}
          <div className="space-y-4 mb-6 text-sm">
            <div>
              <div className="font-bold text-gray-600 mb-1">Email</div>
              <div>{data.emailTo}</div>
            </div>
            <div>
              <div className="font-bold text-gray-600 mb-1">Tiêu đề</div>
              <div>{data.subject}</div>
            </div>
            <div>
              <div className="font-bold text-gray-600 mb-2">Nội dung</div>
              
              {/* Box Customer Info */}
              <div className="border border-gray-400 p-4 mb-0">
                <p className="mb-1">Họ và tên: {data.customerName}</p>
                <p className="mb-1">Số điện thoại: {data.customerPhone}</p>
                <p className="mb-0">Email: {data.customerEmail}</p>
              </div>

              {/* Event Info Table */}
              <div className="border border-gray-400 border-t-0 p-2 font-bold uppercase bg-gray-50 text-xs">
                THÔNG TIN SỰ KIỆN
              </div>
              <table className="w-full border-collapse text-sm text-center">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 p-2 font-bold">Sự kiện</th>
                    <th className="border border-gray-400 p-2 font-bold">Thời gian bắt đầu</th>
                    <th className="border border-gray-400 p-2 font-bold">Địa điểm</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2">{data.eventName}</td>
                    <td className="border border-gray-400 p-2">{data.startTime}</td>
                    <td className="border border-gray-400 p-2">{data.location}</td>
                  </tr>
                </tbody>
              </table>

              {/* Ticket Info Table */}
              <div className="border border-gray-400 border-t-0 p-2 font-bold uppercase bg-gray-50 text-xs mt-0">
                THÔNG TIN VÉ
              </div>
              <table className="w-full border-collapse text-sm text-center">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-400 p-2 font-bold">STT</th>
                    <th className="border border-gray-400 p-2 font-bold">Số ghế</th>
                    <th className="border border-gray-400 p-2 font-bold">Giá vé (VND)</th>
                    <th className="border border-gray-400 p-2 font-bold">Mã vé</th>
                    <th className="border border-gray-400 p-2 font-bold">Mã Checkin</th>
                  </tr>
                </thead>
                <tbody>
                  {data.tickets.map((t, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-400 p-2">{t.index}</td>
                      <td className="border border-gray-400 p-2">{t.seatInfo}</td>
                      <td className="border border-gray-400 p-2">{t.price}</td>
                      <td className="border border-gray-400 p-2">{t.ticketCode}</td>
                      <td className="border border-gray-400 p-2">
                        {t.qrCodeBase64 ? (
                          <img src={t.qrCodeBase64} alt="QR Code" className="w-20 h-20 mx-auto" />
                        ) : (
                          <div className="w-20 h-20 border border-gray-200 bg-gray-50 flex items-center justify-center mx-auto text-[10px] text-gray-400">
                            No QR
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="border border-gray-400 p-3 font-bold text-center">Tổng tiền thanh toán</td>
                    <td colSpan={3} className="border border-gray-400 p-3 font-bold text-center">{data.totalPayment}</td>
                  </tr>
                </tbody>
              </table>

              {/* Notes */}
              <div className="mt-8 ml-4">
                <div className="font-bold flex items-center gap-1 italic">
                  <span>❖</span> LƯU Ý
                </div>
                <ul className="list-disc pl-6 mt-2 space-y-2 text-sm italic text-gray-700">
                  <li>Quý khách vui lòng có mặt trước giờ biểu diễn/sự kiện 15 phút để làm thủ tục và ổn định chỗ ngồi.</li>
                  <li>
                    Nhà hát sẽ đóng cửa ra vào sau khi chương trình biểu diễn bắt đầu 15 phút. 
                    Quý khách tới trễ sẽ được sắp xếp chỗ ngồi tại khu vực phù hợp để tránh ảnh hưởng 
                    tới khán giả và nghệ sĩ. Do các yếu tố kỹ thuật và an toàn của Nhà hát, chúng tôi xin lỗi không thể đưa...
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            Đóng
          </button>
          {onSendTestEmail && (
            <button 
              onClick={onSendTestEmail}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Gửi Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
