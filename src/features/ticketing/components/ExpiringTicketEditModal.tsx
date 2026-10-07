import React, { useState, useEffect } from 'react';
import { User, Phone, Mail } from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { IssuedTicket } from '../../../shared/types/hpticket';
import { Modal } from '../../../shared/components/ui';
import { toast } from '../../../shared/utils/toast';

interface ExpiringTicketEditModalProps {
  ticket: IssuedTicket | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExpiringTicketEditModal: React.FC<ExpiringTicketEditModalProps> = ({
  ticket,
  onClose,
  onSuccess,
}) => {
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setCustomerForm({
        name: ticket.customer_name || '',
        phone: ticket.customer_phone || '',
        email: ticket.customer_email || '',
      });
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    try {
      setIsSubmitting(true);
      await salesService.updateCustomerInfo(
        ticket.id,
        customerForm.name,
        customerForm.phone,
        customerForm.email
      );
      toast.success('Cập nhật thông tin khách hàng thành công!');
      onClose();
      onSuccess();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Có lỗi xảy ra khi cập nhật thông tin khách hàng!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={Boolean(ticket)}
      onClose={onClose}
      title="Cập Nhật Thông Tin Khách Hàng"
      icon={<User className="w-5 h-5 text-emerald-600" />}
      onSubmit={handleSubmit}
      confirmText="Lưu Thay Đổi"
      isSubmitting={isSubmitting}
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Mã Vé (QR)</label>
          <input
            type="text"
            disabled
            value={ticket.qr_code_string}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Họ Tên Khách Hàng <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={customerForm.name}
            onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
            placeholder="Nhập họ và tên khách hàng"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Số Điện Thoại</label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={customerForm.phone}
              onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
              placeholder="e.g. 0912 345 678"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Email Thông Báo Gia Hạn</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="email"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium"
              placeholder="e.g. khachhang@gmail.com"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
