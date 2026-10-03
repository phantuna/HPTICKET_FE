import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Phone, Mail, Building2, CreditCard, FileText, Ticket, Percent, Users, Tag, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { toast } from '../../../shared/utils/toast';
import { Booking } from '../../../shared/types/hpticket';
import { Modal, Button, VNDateInput } from '../../../shared/components/ui';

interface CreateBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export const CreateBookingModal: React.FC<CreateBookingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [note, setNote] = useState('');

  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    ticket_type_id: string;
    template_name: string;
    price: number;
    count: number;
    is_group_ticket: boolean;
  }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load ticket templates, customer groups và promotions an toàn từ DB
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          let list: any[] = [];
          try {
            const res = await salesService.getPublicTicketTemplates();
            const data = (res as any)?.data;
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.content)) list = data.content;
            else if (Array.isArray(res)) list = res;
          } catch {
            // Fallback sang TICKETING.TEMPLATES
          }

          if (list.length === 0) {
            const res = await apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES);
            if (Array.isArray(res)) list = res;
            else if (Array.isArray(res?.data)) list = res.data;
            else if (Array.isArray(res?.data?.content)) list = res.data.content;
            else if (Array.isArray(res?.content)) list = res.content;
          }

          const activeList = list.filter((t: any) => {
            if (t.is_active === false) return false;
            if (t.ticket_type === 'UNLIMITED') return false;
            const code = (t.code || '').toUpperCase();
            const name = (t.name || '').toUpperCase();
            return !code.includes('MONTH') && !code.includes('THANG') && !name.includes('THÁNG') && !code.includes('FAMILY');
          });

          setAvailableTemplates(activeList);

          // Tự động thêm dòng loại vé đầu tiên nếu chưa có
          if (activeList.length > 0 && selectedItems.length === 0) {
            setSelectedItems([{
              ticket_type_id: activeList[0].id,
              template_name: activeList[0].name || activeList[0].ticket_name,
              price: Number(activeList[0].price) || 0,
              count: 1,
              is_group_ticket: false
            }]);
          }

          // Tải Customer Groups & Promotions từ DB
          try {
            const masterRes = await salesService.getMasterData();
            if (masterRes?.data?.customerGroups) {
              const rawGrps: any = masterRes.data.customerGroups;
              const grps = Array.isArray(rawGrps) ? rawGrps : (rawGrps?.content || []);
              setCustomerGroups(grps);
            }
            if (masterRes?.data?.promotions) {
              const rawProms: any = masterRes.data.promotions;
              const proms = Array.isArray(rawProms) ? rawProms : (rawProms?.content || []);
              setPromotions(proms.filter((p: any) => p.is_active !== false && !p.deleted_at));
            }
          } catch {
            try {
              const grpRes = await apiClient.get<any>(API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS_ACTIVE || API_ENDPOINTS.MARKETING.CUSTOMER_GROUPS, { silent: true });
              const grpList = Array.isArray(grpRes) ? grpRes : (grpRes?.data?.content || grpRes?.data || []);
              setCustomerGroups(grpList);
              const pRes = await apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS_ACTIVE || API_ENDPOINTS.MARKETING.PROMOTIONS, { silent: true });
              const pList = Array.isArray(pRes) ? pRes : (pRes?.data?.content || pRes?.data || []);
              setPromotions(pList.filter((p: any) => p.is_active !== false && !p.deleted_at));
            } catch (e) {
              console.warn('Lỗi tải nhóm khách và khuyến mãi:', e);
            }
          }
        } catch (err: any) {
          console.error('Lỗi nạp dữ liệu đặt vé:', err);
          toast.error('Không thể tải danh sách mẫu vé');
        }
      };

      fetchData();
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (availableTemplates.length === 0) {
      toast.error('Chưa có danh sách mẫu vé khả dụng');
      return;
    }
    const tpl = availableTemplates[0];
    setSelectedItems(prev => [
      ...prev,
      {
        ticket_type_id: tpl.id,
        template_name: tpl.name || tpl.ticket_name,
        price: Number(tpl.price) || 0,
        count: 1,
        is_group_ticket: false
      }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setSelectedItems(prev => {
      const copy = [...prev];
      if (field === 'ticket_type_id') {
        const found = availableTemplates.find(t => t.id === value);
        if (found) {
          copy[index] = {
            ...copy[index],
            ticket_type_id: found.id,
            template_name: found.name || found.ticket_name,
            price: Number(found.price) || 0,
          };
        }
      } else if (field === 'count') {
        const val = Math.max(1, parseInt(value) || 1);
        copy[index] = {
          ...copy[index],
          count: val,
          // Logic chuẩn POS: > 1 người của cùng loại vé tự động gom thành Vé đoàn (1 vé N lượt), 1 người là vé lẻ
          is_group_ticket: val > 1,
        };
      } else if (field === 'is_group_ticket') {
        copy[index] = { ...copy[index], is_group_ticket: Boolean(value) };
      } else {
        copy[index] = { ...copy[index], [field]: value };
      }
      return copy;
    });
  };

  const totalPeople = selectedItems.reduce((acc, it) => acc + (Number(it.count) || 0), 0);
  const subtotal = selectedItems.reduce((acc, it) => acc + (it.price * (Number(it.count) || 0)), 0);

  const isGroupBooking = selectedItems.some(it => it.is_group_ticket) || Boolean(companyName.trim());

  // 1. Nhóm khách hàng từ DB
  const matchedCustomerGroup = isGroupBooking
    ? (customerGroups.find(g => (g.code && g.code.toUpperCase().includes('DOAN')) || (g.name && g.name.toLowerCase().includes('đoàn'))) || customerGroups[0])
    : (customerGroups.find(g => (g.code && g.code.toUpperCase().includes('LE')) || (g.name && g.name.toLowerCase().includes('lẻ'))) || customerGroups[0]);

  const groupDiscountPercent = Number(matchedCustomerGroup?.discount_percent) || 0;
  const groupDiscountAmount = Math.round((subtotal * groupDiscountPercent) / 100);

  // Lọc chỉ các CTKM có hiệu lực theo ngày tham quan và còn lượt dùng
  const validPromotions = promotions.filter(p => {
    if (p.is_active === false || p.deleted_at) return false;
    const targetDateStr = visitDate || new Date().toISOString().split('T')[0];
    if (p.start_date) {
      const s = typeof p.start_date === 'string' ? p.start_date.substring(0, 10) : new Date(p.start_date).toISOString().split('T')[0];
      if (targetDateStr < s) return false;
    }
    if (p.end_date) {
      const e = typeof p.end_date === 'string' ? p.end_date.substring(0, 10) : new Date(p.end_date).toISOString().split('T')[0];
      if (targetDateStr > e) return false;
    }
    const maxQty = p.quantity || p.max_usage;
    const used = p.used_count || p.current_usage;
    if (maxQty && used && Number(used) >= Number(maxQty)) return false;
    return true;
  });

  // Tự động hủy chọn CTKM nếu ngày tham quan thay đổi và không còn áp dụng
  useEffect(() => {
    if (selectedPromotionId && !validPromotions.some(p => p.id === selectedPromotionId)) {
      setSelectedPromotionId('');
    }
  }, [visitDate, promotions]);

  // 2. Chương trình khuyến mại từ DB
  const activePromo = validPromotions.find(p => p.id === selectedPromotionId);
  let promoDiscountAmount = 0;
  let promoDiscountPercent = 0;
  if (activePromo) {
    if (activePromo.discount_percent && activePromo.discount_percent > 0) {
      promoDiscountPercent = Number(activePromo.discount_percent);
      promoDiscountAmount = Math.round((subtotal * promoDiscountPercent) / 100);
    } else if (activePromo.discount_value && activePromo.discount_value > 0) {
      promoDiscountAmount = Number(activePromo.discount_value);
    }
  }

  // 3. Quy tắc MAX chuẩn Order (Lấy mức giảm giá cao nhất, chống thất thoát doanh thu)
  const isPromoHigher = promoDiscountAmount > groupDiscountAmount;
  const effectiveDiscount = Math.min(subtotal, Math.max(groupDiscountAmount, promoDiscountAmount));
  const effectiveDiscountPercent = isPromoHigher ? promoDiscountPercent : groupDiscountPercent;

  const totalAmount = Math.max(0, subtotal - effectiveDiscount);
  const remainingAmount = Math.max(0, totalAmount - (Number(depositAmount) || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() && !companyName.trim()) {
      toast.error('Vui lòng nhập tên khách hàng hoặc tên công ty/đoàn');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 loại vé');
      return;
    }

    setIsSubmitting(true);
    try {
      // Logic chuẩn POS: 1 vé là vé lẻ, > 1 vé cùng loại tự động gom thành vé đoàn (1 vé N lượt)
      const items = selectedItems.map(it => {
        const count = Math.max(1, Number(it.count) || 1);
        const isGroup = it.is_group_ticket ?? (count > 1);
        return {
          ticket_type_id: it.ticket_type_id,
          template_name: it.template_name,
          quantity: isGroup ? 1 : count,
          allowed_passes: isGroup ? count : 1,
          is_group_ticket: isGroup,
        };
      });

      const hasGroup = items.some(it => it.is_group_ticket);

      const payload = {
        customer_name: customerName.trim() || companyName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        company_name: companyName.trim() || null,
        contact_name: contactName.trim() || null,
        visit_date: visitDate,
        customer_group_code: matchedCustomerGroup?.code || (isGroupBooking ? 'KHACH_DOAN' : 'KHACH_LE'),
        promotion_id: activePromo?.id || null,
        promotion_code: activePromo?.code || null,
        discount_percent: effectiveDiscountPercent,
        discount_amount: effectiveDiscount,
        deposit_amount: Number(depositAmount) || 0,
        note: note.trim() || null,
        is_group_ticket: hasGroup,
        items
      };

      const res = await salesService.createBooking(payload);
      if (res.data) {
        toast.success(`✓ Đã tạo thành công Booking: ${res.data.booking_code}`);
        onSuccess(res.data);
        onClose();
      }
    } catch (err: any) {
      toast.error('Tạo mã đặt chỗ thất bại: ' + (err.message || 'Lỗi server'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo Đặt Chỗ Mới (Booking / Pre-sale)"
      subtitle="Dành cho khách đoàn, Tour Agency hoặc khách đặt vé trước"
      icon={<Ticket className="w-5 h-5 text-emerald-600" />}
      maxWidth="5xl"
      onSubmit={handleSubmit}
      confirmText={isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo Booking'}
      confirmVariant="primary"
      cancelText="Hủy bỏ"
      isSubmitting={isSubmitting}
      isConfirmDisabled={isSubmitting || selectedItems.length === 0}
    >
      <div className="max-h-[82vh] overflow-y-auto pr-0.5 text-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* CỘT TRÁI (7 cols): Khách hàng + Danh sách vé */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* 1. Thông tin đoàn & người đặt */}
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 shadow-2xs">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> 1. Thông tin khách hàng & Đơn vị lữ hành
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="customerName" className="block font-semibold text-slate-700 mb-1">
                    Tên người đặt / Trưởng đoàn <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="customerName"
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn A"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customerPhone" className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="0901234567"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName" className="block font-semibold text-slate-700 mb-1">
                    Công ty / Tour Agency <span className="text-slate-400 font-normal">(nếu có)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="VD: Vietravel, Saigontourist..."
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="customerEmail" className="block font-semibold text-slate-700 mb-1">
                    Email nhận xác nhận
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="booking@agency.com"
                      className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Ngày đến & Danh sách loại vé */}
            <div className="border border-slate-200/90 rounded-xl p-3 bg-white shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Ticket className="w-3.5 h-3.5 text-emerald-600" /> 2. Ngày đến & Danh sách loại vé
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-600 text-xs">Ngày tham quan:</span>
                  <VNDateInput
                    value={visitDate}
                    onChange={setVisitDate}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-36 py-1 px-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2 px-2.5">Loại vé</th>
                      <th className="py-2 px-2 text-right">Đơn giá</th>
                      <th className="py-2 px-2 text-center w-24">Số lượng</th>
                      <th className="py-2 px-2 text-center w-36">Hình thức vé</th>
                      <th className="py-2 px-2.5 text-right">Thành tiền</th>
                      <th className="py-2 px-1 text-center w-8" aria-label="Hành động"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          Chưa có loại vé nào. Bấm "+ Thêm loại vé" bên dưới.
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60 transition">
                          <td className="py-1.5 px-2.5">
                            <select
                              aria-label="Chọn loại vé"
                              value={item.ticket_type_id}
                              onChange={e => handleItemChange(idx, 'ticket_type_id', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:border-emerald-500"
                            >
                              {availableTemplates.map(t => (
                                <option key={t.id} value={t.id}>
                                  {t.name || t.ticket_name} ({Number(t.price).toLocaleString('vi-VN')} đ)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-1.5 px-2 text-right font-mono font-medium text-slate-700 whitespace-nowrap text-xs">
                            {item.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <div className="inline-flex items-center justify-center border border-slate-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                aria-label="Giảm 1 vé"
                                onClick={() => handleItemChange(idx, 'count', Math.max(1, item.count - 1))}
                                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                aria-label="Số lượng vé"
                                min="1"
                                value={item.count}
                                onChange={e => handleItemChange(idx, 'count', e.target.value)}
                                className="w-10 py-0.5 text-center font-bold text-slate-900 border-x border-slate-200 focus:outline-none focus:bg-emerald-50/50 text-xs"
                              />
                              <button
                                type="button"
                                aria-label="Tăng 1 vé"
                                onClick={() => handleItemChange(idx, 'count', item.count + 1)}
                                className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            {item.count > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleItemChange(idx, 'is_group_ticket', !item.is_group_ticket)}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition border ${
                                  item.is_group_ticket
                                    ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200 shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                                }`}
                                title="Bấm để chuyển đổi giữa Vé đoàn (1 vé N lượt) và Vé lẻ (N vé rời)"
                              >
                                {item.is_group_ticket ? (
                                  <>
                                    <Users className="w-3 h-3 text-purple-700" />
                                    <span>Vé đoàn ({item.count} lượt)</span>
                                  </>
                                ) : (
                                  <>
                                    <Ticket className="w-3 h-3 text-slate-500" />
                                    <span>Vé lẻ ({item.count} vé)</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Ticket className="w-3 h-3 text-slate-400" />
                                <span>Vé lẻ (1 lượt)</span>
                              </span>
                            )}
                          </td>
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap text-xs">
                            {(item.price * item.count).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 transition"
                              title="Xóa dòng vé này"
                              aria-label="Xóa dòng vé"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="p-2 bg-slate-50/90 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    icon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
                    className="py-1 text-xs"
                  >
                    Thêm loại vé
                  </Button>
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="text-slate-600">
                      Tổng khách: <b className="text-slate-900 font-bold">{totalPeople} người</b>
                    </span>
                    {selectedItems.some(it => it.is_group_ticket) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                        <Users className="w-3 h-3" /> Booking vé đoàn
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): Khuyến mãi/Chiết khấu + Thanh toán/Cọc + Ghi chú */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* 3. Chiết khấu & Ưu đãi tự động từ DB */}
            <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> 3. Ưu đãi & Chiết khấu (DB)
                </h4>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Quy tắc MAX chuẩn Order
                </span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-lg p-2.5 space-y-2 text-xs">
                {/* Nhóm khách hàng DB */}
                <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="font-semibold text-slate-700">Nhóm KH:</span>
                    <span className="font-bold text-[11px] text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                      {matchedCustomerGroup?.name || (isGroupBooking ? 'Khách đoàn' : 'Khách lẻ')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (-<b className="text-purple-700">{groupDiscountPercent}%</b>)
                    </span>
                  </div>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    - {groupDiscountAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                {/* Chương trình Khuyến mại (Promotions) DB */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <label htmlFor="promoSelect" className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-600" /> Mã khuyến mại:
                    </label>
                    {activePromo && (
                      <span className="font-mono font-bold text-amber-700 text-xs">
                        - {promoDiscountAmount.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                  <select
                    id="promoSelect"
                    value={selectedPromotionId}
                    onChange={e => setSelectedPromotionId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Không áp dụng CTKM --</option>
                    {validPromotions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.discount_percent ? `Giảm ${p.discount_percent}%` : `Giảm ${Number(p.discount_value).toLocaleString('vi-VN')}đ`})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dòng áp dụng mức giảm tối ưu */}
                {effectiveDiscount > 0 ? (
                  <div className="pt-1.5 border-t border-dashed border-emerald-200 flex items-center justify-between text-emerald-800 font-bold">
                    <span className="flex items-center gap-1 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Giảm tối đa ({isPromoHigher ? 'CTKM' : 'Nhóm KH'}):
                    </span>
                    <span className="font-mono font-extrabold text-emerald-700 text-xs">
                      - {effectiveDiscount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                ) : (
                  <div className="pt-0.5 text-[10px] text-slate-400 italic">
                    * Chưa có mức chiết khấu nào áp dụng cho đơn này.
                  </div>
                )}
              </div>
            </div>

            {/* 4. Tổng kết tài chính & Tiền đặt cọc */}
            <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
              <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> 4. Thanh toán & Đặt cọc
              </h4>

              <div className="space-y-1.5 text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tiền vé gốc:</span>
                  <span className="font-mono font-semibold text-slate-800">{subtotal.toLocaleString('vi-VN')} đ</span>
                </div>
                {effectiveDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-medium">
                    <span>Chiết khấu ({effectiveDiscountPercent}%):</span>
                    <span className="font-mono font-bold">- {effectiveDiscount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-bold text-slate-900">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-mono text-sm text-slate-900">{totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              {/* Ô nhập tiền cọc và các nút chọn nhanh % cọc */}
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="depositAmount" className="text-slate-800 font-bold text-xs">
                    Tiền đặt cọc trước (VNĐ):
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDepositAmount(0)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                      title="Không đặt cọc"
                    >
                      0đ
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositAmount(Math.round(totalAmount * 0.3))}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                      title="Cọc 30%"
                    >
                      30%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositAmount(Math.round(totalAmount * 0.5))}
                      className="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                      title="Cọc 50%"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDepositAmount(totalAmount)}
                      className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded transition"
                      title="Cọc đủ 100%"
                    >
                      100%
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="depositAmount"
                    type="number"
                    min="0"
                    max={totalAmount}
                    step="50000"
                    value={depositAmount || ''}
                    onChange={e => setDepositAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-emerald-700 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                    placeholder="0"
                  />
                  <span className="absolute left-2.5 top-2 text-[11px] text-slate-400 font-semibold pointer-events-none">
                    VNĐ
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="font-semibold text-slate-600">Còn phải thu tại POS:</span>
                  <span className={`font-mono font-extrabold text-sm ${remainingAmount === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {remainingAmount === 0 ? '✓ Đã cọc đủ 100%' : `${remainingAmount.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Ghi chú nghiệp vụ */}
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-2xs">
              <label htmlFor="bookingNote" className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Ghi chú nghiệp vụ
              </label>
              <textarea
                id="bookingNote"
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="VD: Khách đoàn cần hướng dẫn viên, cọc tiền mặt..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
