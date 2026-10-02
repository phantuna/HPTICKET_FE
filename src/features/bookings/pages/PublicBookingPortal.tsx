import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, User, Phone, Mail, Building2, CheckCircle2,
  ArrowLeft, Plus, Minus, Copy, Check,
  Sparkles, Compass, ShieldCheck, Users, AlertCircle, Tag
} from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { Booking } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';

interface PublicBookingPortalProps {
  onBackToApp?: () => void;
}

export const PublicBookingPortal: React.FC<PublicBookingPortalProps> = ({ onBackToApp }) => {
  // Step State (1: Booking Form, 2: Success Confirmation)
  const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [visitDate, setVisitDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [note, setNote] = useState('');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  // Master data & Promotions từ DB
  const [customerGroups, setCustomerGroups] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');

  // Ticket templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingTemplates(true);
    // Lấy bảng giá vé trực tiếp từ CSDL qua backend API
    salesService.getPublicTicketTemplates()
      .then((res: any) => {
        const list = Array.isArray(res) ? res : (res.data?.content || res.data || []);
        const active = list.filter((t: any) => {
          if (t.is_active === false) return false;
          if (t.ticket_type === 'UNLIMITED') return false;
          const code = (t.code || '').toUpperCase();
          const name = (t.name || '').toUpperCase();
          return !code.includes('MONTH') && !code.includes('THANG') && !name.includes('THÁNG') && !code.includes('FAMILY');
        });
        setTemplates(active);

        if (active.length > 0) {
          setTicketQuantities({ [active[0].id]: 2 });
        }
      })
      .catch((err) => {
        // Dự phòng gọi endpoint ticketing nếu endpoint public chưa cập nhật
        apiClient.get<any>(API_ENDPOINTS.TICKETING.TEMPLATES)
          .then((res: any) => {
            const list = Array.isArray(res) ? res : (res.data?.content || res.data || []);
            const active = list.filter((t: any) => {
              if (t.is_active === false) return false;
              if (t.ticket_type === 'UNLIMITED') return false;
              const code = (t.code || '').toUpperCase();
              const name = (t.name || '').toUpperCase();
              return !code.includes('MONTH') && !code.includes('THANG') && !name.includes('THÁNG') && !code.includes('FAMILY');
            });
            setTemplates(active);
            if (active.length > 0) {
              setTicketQuantities({ [active[0].id]: 2 });
            }
          })
          .catch((e) => {
            console.error('Không thể tải bảng giá vé từ máy chủ:', e);
            setTemplates([]);
            toast.error('Không thể tải bảng giá vé từ máy chủ: ' + (e.message || err.message || 'Lỗi kết nối'));
          });
      })
      .finally(() => {
        setIsLoadingTemplates(false);
      });

    // Tải Nhóm khách hàng & Khuyến mãi từ DB qua master data
    salesService.getMasterData()
      .then(res => {
        if (res.data?.customerGroups) {
          const rawGrps: any = res.data.customerGroups;
          const grps = Array.isArray(rawGrps) ? rawGrps : (rawGrps?.content || []);
          setCustomerGroups(grps);
        }
        if (res.data?.promotions) {
          const rawProms: any = res.data.promotions;
          const proms = Array.isArray(rawProms) ? rawProms : (rawProms?.content || []);
          setPromotions(proms.filter((p: any) => p.is_active !== false && !p.deleted_at));
        }
      })
      .catch(() => {});
  }, []);

  const handleQuantityChange = (templateId: string, delta: number) => {
    setTicketQuantities(prev => {
      const current = prev[templateId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [templateId]: next };
    });
  };

  const totalTickets = Object.values(ticketQuantities).reduce<number>((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);

  const rawSubtotal = templates.reduce((acc, tpl) => {
    const qty = ticketQuantities[tpl.id] || 0;
    return acc + (Number(tpl.price) || 0) * qty;
  }, 0);

  // 1. Nhóm khách hàng tự động từ DB: Nếu > 1 người hoặc có công ty -> Khách đoàn, ngược lại Khách lẻ
  const isGroup = totalTickets > 1 || Boolean(companyName.trim());
  const matchedCustomerGroup = isGroup
    ? (customerGroups.find(g => (g.code && g.code.toUpperCase().includes('DOAN')) || (g.name && g.name.toLowerCase().includes('đoàn'))) || customerGroups[0])
    : (customerGroups.find(g => (g.code && g.code.toUpperCase().includes('LE')) || (g.name && g.name.toLowerCase().includes('lẻ'))) || customerGroups[0]);

  const groupDiscountPercent = Number(matchedCustomerGroup?.discount_percent) || 0;
  const groupDiscountAmount = Math.round((rawSubtotal * groupDiscountPercent) / 100);

  // 2. Khuyến mãi từ DB (qua mã voucher hoặc chọn)
  const activePromo = appliedPromo || promotions.find(p => p.id === selectedPromotionId);
  let promoDiscountAmount = 0;
  let promoDiscountPercent = 0;
  if (activePromo) {
    if (activePromo.discount_percent && activePromo.discount_percent > 0) {
      promoDiscountPercent = Number(activePromo.discount_percent);
      promoDiscountAmount = Math.round((rawSubtotal * promoDiscountPercent) / 100);
    } else if (activePromo.discount_value && activePromo.discount_value > 0) {
      promoDiscountAmount = Number(activePromo.discount_value);
    }
  }

  // 3. Quy tắc MAX chuẩn Order (Lấy mức giảm giá cao nhất từ DB, chống cộng dồn thất thoát)
  const isPromoHigher = promoDiscountAmount > groupDiscountAmount;
  const effectiveDiscount = Math.min(rawSubtotal, Math.max(groupDiscountAmount, promoDiscountAmount));
  const effectiveDiscountPercent = isPromoHigher ? promoDiscountPercent : groupDiscountPercent;
  const totalAmount = Math.max(0, rawSubtotal - effectiveDiscount);

  // Tự động kiểm tra lại tính hợp lệ của mã khuyến mãi nếu ngày tham quan (visitDate) thay đổi
  useEffect(() => {
    if (appliedPromo) {
      const targetDateStr = visitDate;
      const startStr = appliedPromo.start_date
        ? (typeof appliedPromo.start_date === 'string' ? appliedPromo.start_date.substring(0, 10) : new Date(appliedPromo.start_date).toISOString().split('T')[0])
        : null;
      const endStr = appliedPromo.end_date
        ? (typeof appliedPromo.end_date === 'string' ? appliedPromo.end_date.substring(0, 10) : new Date(appliedPromo.end_date).toISOString().split('T')[0])
        : null;

      if ((startStr && targetDateStr < startStr) || (endStr && targetDateStr > endStr)) {
        toast.warning(`Mã [${appliedPromo.code}] không áp dụng cho ngày tham quan ${targetDateStr} nên đã được hủy.`);
        setAppliedPromo(null);
        setSelectedPromotionId('');
      }
    }
  }, [visitDate, appliedPromo]);

  const handleApplyPromoCode = () => {
    if (!promoCodeInput.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return;
    }
    const code = promoCodeInput.trim().toUpperCase();
    const found = promotions.find(p => p.code && p.code.trim().toUpperCase() === code);
    if (!found) {
      toast.error('Mã khuyến mãi không tồn tại hoặc không hợp lệ');
      return;
    }

    if (found.is_active === false || found.deleted_at) {
      toast.error('Mã khuyến mãi này hiện đang ngừng hoạt động');
      return;
    }

    // Kiểm tra thời hạn hiệu lực đối với ngày tham quan đã chọn
    const targetDateStr = visitDate || new Date().toISOString().split('T')[0];
    if (found.start_date) {
      const startStr = typeof found.start_date === 'string'
        ? found.start_date.substring(0, 10)
        : new Date(found.start_date).toISOString().split('T')[0];
      if (targetDateStr < startStr) {
        toast.error(`Mã khuyến mãi chỉ áp dụng từ ngày ${startStr} (Ngày tham quan của bạn: ${targetDateStr})`);
        return;
      }
    }

    if (found.end_date) {
      const endStr = typeof found.end_date === 'string'
        ? found.end_date.substring(0, 10)
        : new Date(found.end_date).toISOString().split('T')[0];
      if (targetDateStr > endStr) {
        toast.error(`Mã khuyến mãi đã hết hạn sử dụng vào ngày ${endStr} (Ngày tham quan của bạn: ${targetDateStr})`);
        return;
      }
    }

    // Kiểm tra số lượt sử dụng
    const maxQty = found.quantity || found.max_usage;
    const used = found.used_count || found.current_usage;
    if (maxQty && used && Number(used) >= Number(maxQty)) {
      toast.error('Mã khuyến mãi đã hết lượt sử dụng');
      return;
    }

    setAppliedPromo(found);
    setSelectedPromotionId(found.id);
    toast.success(`✓ Đã áp dụng mã [${found.code}]: Giảm ${found.discount_percent ? `${found.discount_percent}%` : `${Number(found.discount_value).toLocaleString('vi-VN')} đ`}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalTickets === 0) {
      toast.error('Vui lòng chọn ít nhất 1 vé tham quan');
      return;
    }
    if (!customerName.trim() && !companyName.trim()) {
      toast.error('Vui lòng nhập tên người đặt hoặc tên đơn vị lữ hành');
      return;
    }
    if (!customerPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại để nhận mã đặt chỗ');
      return;
    }

    setIsSubmitting(true);
    try {
      // Logic chuẩn POS: 1 vé là vé lẻ, > 1 vé cùng loại tự động gom thành vé đoàn (1 vé N lượt)
      const items = Object.entries(ticketQuantities)
        .filter(([_, qty]) => (Number(qty) || 0) > 0)
        .map(([id, qty]) => {
          const tpl = templates.find(t => t.id === id);
          const count = Number(qty) || 1;
          const isGrp = count > 1;
          return {
            ticket_type_id: id,
            template_name: tpl?.name || tpl?.ticket_name || 'Vé tham quan',
            quantity: isGrp ? 1 : count,
            allowed_passes: isGrp ? count : 1,
            is_group_ticket: isGrp
          };
        });

      const hasGroup = items.some(it => it.is_group_ticket);

      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim() || null,
        company_name: companyName.trim() || null,
        contact_name: contactName.trim() || customerName.trim(),
        visit_date: visitDate,
        customer_group_code: matchedCustomerGroup?.code || (isGroup ? 'KHACH_DOAN' : 'KHACH_LE'),
        promotion_id: activePromo?.id || null,
        promotion_code: activePromo?.code || null,
        discount_percent: effectiveDiscountPercent,
        discount_amount: effectiveDiscount,
        deposit_amount: depositAmount || 0,
        note: note.trim() || null,
        is_group_ticket: hasGroup,
        items
      };

      const res = await salesService.createPublicBooking(payload);
      if (res.data) {
        setCreatedBooking(res.data);
        setStep('SUCCESS');
        toast.success(`Đặt vé thành công! Mã đặt chỗ: ${res.data.booking_code}`);
      }
    } catch (err: any) {
      toast.error('Đặt vé không thành công: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (createdBooking?.booking_code) {
      navigator.clipboard.writeText(createdBooking.booking_code);
      setCopied(true);
      toast.success('Đã sao chép mã đặt chỗ: ' + createdBooking.booking_code);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Banner Navigation */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white">
              <Compass className="w-5 h-5 font-bold" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest block leading-tight">
                HPTICKET PORTAL
              </span>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Đặt Vé Trực Tuyến • Kỳ Co - Eo Gió Quy Nhơn
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onBackToApp && (
              <button
                type="button"
                onClick={onBackToApp}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-1.5 transition shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4" /> Về trang quản trị
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.hash = '/pos'}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
            >
              Mở quầy POS
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {step === 'FORM' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 cols: Ticket Selection & Customer Info */}
            <form onSubmit={handleSubmit} className="lg:col-span-8 space-y-5">
              {/* Hero Callout Banner */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-900/10">
                <div className="flex items-center gap-1.5 text-emerald-200 text-xs font-bold uppercase tracking-wider mb-1.5">
                  <Sparkles className="w-4 h-4" /> Đặt chỗ trước • Nhận mã ưu tiên tại cổng
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Đăng ký đặt vé đoàn & tour du lịch
                </h2>
                <p className="text-xs sm:text-sm text-emerald-50 mt-1 leading-relaxed">
                  Nhận ngay mã Booking Code có mã QR. Khi đến điểm tham quan, chỉ cần xuất trình mã tại quầy POS để nhận vé vào cổng nhanh chóng mà không cần xếp hàng mua vé lại từ đầu.
                </p>
              </div>

              {/* Step 1: Chọn ngày đến */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" /> 1. Chọn ngày đến tham quan
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                  <span className="text-xs text-slate-500">
                    Mã đặt chỗ sẽ có hiệu lực trong ngày này tại tất cả cổng soát vé.
                  </span>
                </div>
              </div>

              {/* Step 2: Chọn danh sách vé */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-emerald-600" /> 2. Chọn loại vé & số lượng
                  </h3>
                  <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                    Đã chọn: {totalTickets} vé
                  </span>
                </div>

                <div className="space-y-2.5">
                  {isLoadingTemplates ? (
                    <div className="py-6 text-center text-slate-400 text-xs">Đang tải danh sách vé...</div>
                  ) : (
                    templates.map((tpl) => {
                      const qty = ticketQuantities[tpl.id] || 0;
                      return (
                        <div
                          key={tpl.id}
                          className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            qty > 0
                              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{tpl.name || tpl.ticket_name}</h4>
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono rounded">
                                {tpl.code}
                              </span>
                              {qty === 1 && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                  Vé lẻ (1 lượt)
                                </span>
                              )}
                              {qty > 1 && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
                                  <Users className="w-3 h-3" /> Vé đoàn (1 vé • {qty} lượt)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {tpl.description || 'Vé tham quan chính thức theo quy định ban quản lý.'}
                            </p>
                            <span className="text-sm font-bold font-mono text-emerald-700 mt-1 block">
                              {Number(tpl.price).toLocaleString('vi-VN')} đ
                            </span>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tpl.id, -1)}
                              disabled={qty === 0}
                              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 flex items-center justify-center text-slate-700 transition shadow-2xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold font-mono text-base text-slate-900">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(tpl.id, 1)}
                              className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white transition shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Thông báo chuẩn nghiệp vụ POS: 1 vé là vé lẻ, > 1 vé cùng loại tự động gom thành vé đoàn */}
                <div className="mt-3.5 p-3 bg-purple-50/70 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-2.5 shadow-2xs">
                  <Users className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-purple-900">Quy chuẩn phát hành vé tại quầy POS:</p>
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      • Mua <b>1 vé</b>: Phát hành <b>Vé lẻ</b> (1 vé giấy - 1 lượt vào cổng).<br />
                      • Mua <b>từ 2 vé cùng loại trở lên</b>: Tự động chuyển thành <b>Vé đoàn</b> (in đúng <b>1 vé giấy duy nhất</b> chứa toàn bộ số lượt) để cả đoàn quét tuần tự qua cổng mà không in nhiều tờ giấy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Thông tin người đặt / Công ty */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" /> 3. Thông tin người đặt & Đơn vị lữ hành
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Họ và tên người đặt / Trưởng đoàn <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Số điện thoại nhận mã Booking <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                      placeholder="0912345678"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Công ty lữ hành / Tour Agency <span className="text-slate-400 font-normal">(nếu có)</span>
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="VD: Du Lịch Miền Trung"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Email nhận phiếu xác nhận <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                      placeholder="tour@travel.com"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-xs">
                    Ghi chú thêm cho ban quản lý
                  </label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Yêu cầu hỗ trợ xe điện, hướng dẫn viên đoàn..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Submit CTA button (Mobile only) */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={isSubmitting || totalTickets === 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmitting ? 'Đang tạo mã đặt chỗ...' : `Xác Nhận Đặt Vé (${totalAmount.toLocaleString('vi-VN')} đ)`}
                </button>
              </div>
            </form>

            {/* Right 4 cols: Sticky Order Summary & Submit */}
            <div className="lg:col-span-4 sticky top-20 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                  Tóm Tắt Đơn Đặt Trước
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Ngày tham quan:</span>
                    <span className="font-semibold text-slate-900">{visitDate}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Tổng số vé:</span>
                    <span className="font-bold text-emerald-700">{totalTickets} vé</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  {templates
                    .filter(t => (ticketQuantities[t.id] || 0) > 0)
                    .map(t => {
                      const qty = ticketQuantities[t.id];
                      return (
                        <div key={t.id} className="flex justify-between text-xs text-slate-600">
                          <span className="truncate max-w-[170px]">{t.name || t.ticket_name} x{qty}</span>
                          <span className="font-mono text-slate-900 font-semibold">{(t.price * qty).toLocaleString('vi-VN')} đ</span>
                        </div>
                      );
                    })}
                </div>

                {/* Mã khuyến mãi / Voucher từ DB */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Mã khuyến mãi / Voucher
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã KM (VD: TET2026)"
                      className="flex-1 px-2.5 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-2xs"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {appliedPromo && (
                    <div className="flex items-center justify-between bg-emerald-50/90 border border-emerald-300 rounded-lg px-2.5 py-1.5 text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5 truncate">
                        <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          Mã áp dụng: <b className="font-mono font-bold text-emerald-900">{appliedPromo.code}</b> ({appliedPromo.discount_percent ? `Giảm ${appliedPromo.discount_percent}%` : `-${Number(appliedPromo.discount_value).toLocaleString('vi-VN')} đ`})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setSelectedPromotionId('');
                          setPromoCodeInput('');
                          toast.info('Đã hủy áp dụng mã khuyến mãi');
                        }}
                        className="text-slate-400 hover:text-rose-600 font-bold text-[11px] ml-2 shrink-0 cursor-pointer transition"
                      >
                        Gỡ bỏ
                      </button>
                    </div>
                  )}
                </div>

                {/* Chi tiết giảm giá lấy từ DB (Quy tắc MAX chống thất thoát) */}
                {effectiveDiscount > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-800">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        {isPromoHigher ? (
                          <>Khuyến mãi [{activePromo?.code}]</>
                        ) : (
                          <>Ưu đãi {matchedCustomerGroup?.name || (isGroup ? 'Khách đoàn' : 'Khách lẻ')}</>
                        )}
                        {effectiveDiscountPercent > 0 ? ` (${effectiveDiscountPercent}%)` : ''}:
                      </span>
                      <span className="font-mono font-bold text-emerald-700">
                        -{effectiveDiscount.toLocaleString('vi-VN')} đ
                      </span>
                    </div>

                    {isGroup && activePromo && (
                      <p className="text-[10px] text-slate-500 italic">
                        * Tự động áp dụng mức ưu đãi cao nhất giữa Khách đoàn ({groupDiscountPercent}%) và Voucher ({promoDiscountPercent || `${activePromo.discount_value?.toLocaleString()}đ`}).
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500 font-semibold">Tổng chi phí dự kiến:</span>
                    <span className="text-xl font-black font-mono text-emerald-700">
                      {totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                  {effectiveDiscount > 0 && (
                    <div className="text-[11px] text-slate-400 line-through text-right font-mono">
                      Gốc: {rawSubtotal.toLocaleString('vi-VN')} đ
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 leading-tight">
                    * Thanh toán tại quầy POS khi xuất trình mã Booking hoặc thanh toán trước qua chuyển khoản.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || totalTickets === 0}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmitting ? 'Đang tạo mã đặt chỗ...' : 'Xác Nhận Đặt Chỗ Ngay'}
                </button>

                <div className="pt-2 text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Bảo lưu giá vé snapshot không bị tăng giá</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Lối ưu tiên quét mã QR nhận vé tại cổng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: SUCCESS CONFIRMATION SCREEN */
          <div className="max-w-xl mx-auto py-2">
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-8 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest block mb-1">
                  ĐẶT CHỖ THÀNH CÔNG
                </span>
                <h2 className="text-2xl font-black text-slate-900">Mã Đặt Chỗ Của Bạn</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Vui lòng lưu lại mã này hoặc đọc số điện thoại khi đến quầy vé
                </p>
              </div>

              {/* Big Booking Voucher Box (Không tạo mã QR để tránh khách tưởng nhầm quét vào cổng) */}
              <div className="p-6 bg-gradient-to-b from-emerald-50/90 to-slate-50 rounded-2xl border-2 border-emerald-300 flex flex-col items-center shadow-xs">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                  MÃ ĐẶT CHỖ (BOOKING CODE)
                </span>

                <div className="mt-2 flex items-center gap-3 bg-white px-6 py-3.5 rounded-2xl border-2 border-emerald-400 shadow-sm">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-800 tracking-wider">
                    {createdBooking?.booking_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Sao chép mã"
                  >
                    {copied ? <Check className="w-6 h-6 text-emerald-600" /> : <Copy className="w-6 h-6" />}
                  </button>
                </div>

                <div className="text-xs text-slate-600 mt-3 space-y-0.5">
                  <p>Khách hàng: <b className="text-slate-900">{createdBooking?.customer_name}</b></p>
                  <p>Ngày tham quan: <b className="text-emerald-800 font-semibold">{createdBooking?.visit_date}</b></p>
                </div>

                {/* Important notice badge */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-left text-xs text-amber-950 flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <b>Lưu ý quan trọng:</b> Đây là <b>Mã Đặt Chỗ</b> nhận vé tại quầy, <b>chưa phải vé quét vào cổng</b>. Khi đến Khu Du Lịch, quý khách vui lòng đọc mã này hoặc Số điện thoại tại bất kỳ <b>Quầy Thu Ngân / POS</b> nào để nhận vé vào cổng.
                  </p>
                </div>
              </div>

              {/* Summary Details */}
              <div className="bg-slate-50 rounded-xl p-4 text-xs text-left space-y-2 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền dự kiến:</span>
                  <span className="font-mono font-bold text-slate-900">{Number(createdBooking?.total_amount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Trạng thái:</span>
                  <span className="font-bold text-emerald-700 uppercase">{createdBooking?.status}</span>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs text-emerald-950 space-y-1">
                <p className="font-bold text-emerald-900">📌 Hướng dẫn nhận vé tại quầy:</p>
                <p>1. Đến bất kỳ quầy thu ngân POS nào tại Khu Du Lịch.</p>
                <p>2. Đọc mã <b className="text-emerald-900 font-mono">{createdBooking?.booking_code}</b> hoặc Số điện thoại <b className="text-emerald-900 font-mono">{createdBooking?.customer_phone}</b> cho thu ngân.</p>
                <p>3. Thu ngân sẽ xuất vé vào cổng ngay lập tức mà không cần nhập lại thông tin.</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setCreatedBooking(null);
                  }}
                  className="flex-1 py-3 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition shadow-2xs"
                >
                  Đặt vé khác
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (createdBooking?.booking_code) {
                      localStorage.setItem('hpticket_pending_pos_booking', createdBooking.booking_code);
                    }
                    window.location.hash = '/pos';
                  }}
                  className="flex-1 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-600/20"
                >
                  Mở bán tại POS
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white">
        <p>© 2026 HPTicket System • Phân hệ Pre-sale & Đặt vé đoàn trực tuyến</p>
      </footer>
    </div>
  );
};
