import React, { useState, useEffect } from 'react';
import {
  Ticket, Calendar, User, Phone, Mail, Building2, CheckCircle2,
  ArrowLeft, Plus, Minus, Copy, Check,
  Sparkles, Compass, ShieldCheck, Users, AlertCircle, Tag, Clock
} from 'lucide-react';
import { salesService } from '../../../api/salesService';
import { apiClient, API_ENDPOINTS } from '../../../api/apiConfig';
import { Booking } from '../../../shared/types/hpticket';
import { toast } from '../../../shared/utils/toast';
import { VNDateInput } from '../../../shared/components/ui';

// Helper hiển thị ngày chuẩn Việt Nam: DD/MM/YYYY cho người dùng xem
const formatVnDate = (isoStr?: string | null): string => {
  if (!isoStr) return '';
  const clean = String(isoStr).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }
  return isoStr;
};

interface PublicBookingPortalProps {
  onBackToApp?: () => void;
  title?: string;
  destinationName?: string;
  portalCode?: string;
}

export const PublicBookingPortal: React.FC<PublicBookingPortalProps> = ({
  onBackToApp,
  title = 'Đặt Vé Trực Tuyến',
  destinationName = 'Kỳ Co - Eo Gió Quy Nhơn',
  portalCode = 'HPTICKET PORTAL'
}) => {
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
        if (res.data?.promotions && Array.isArray(res.data.promotions) && res.data.promotions.length > 0) {
          const rawProms: any = res.data.promotions;
          const proms = Array.isArray(rawProms) ? rawProms : (rawProms?.content || []);
          setPromotions(proms.filter((p: any) => p.is_active !== false && !p.deleted_at));
        }
      })
      .catch(() => {});

    // Gọi trực tiếp API Khuyến mãi từ module Marketing để không bị dính cache cũ của Backend master-data
    apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS_ACTIVE, { silent: true })
      .catch(() => apiClient.get<any>(API_ENDPOINTS.MARKETING.PROMOTIONS, { silent: true }))
      .then((res: any) => {
        const rawList = res?.data?.content || res?.data || res || [];
        const list = Array.isArray(rawList) ? rawList : [];
        if (list.length > 0) {
          setPromotions(prev => {
            const activeNew = list.filter((p: any) => p.is_active !== false && !p.deleted_at);
            // Hợp nhất dữ liệu khuyến mãi
            const map = new Map();
            [...prev, ...activeNew].forEach((item: any) => {
              if (item?.id || item?.code) map.set(item.id || item.code, item);
            });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleQuantityChange = (templateId: string, delta: number) => {
    setTicketQuantities(prev => {
      const current = prev[templateId] || 0;
      const next = Math.max(0, Math.min(9999, current + delta));
      return { ...prev, [templateId]: next };
    });
  };

  const handleQuantitySet = (templateId: string, valStr: string) => {
    if (valStr.trim() === '') {
      setTicketQuantities(prev => ({ ...prev, [templateId]: 0 }));
      return;
    }
    const cleanStr = valStr.replace(/\D/g, '');
    const num = parseInt(cleanStr, 10);
    const val = isNaN(num) ? 0 : Math.max(0, Math.min(9999, num));
    setTicketQuantities(prev => ({ ...prev, [templateId]: val }));
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
        toast.warning(`Mã [${appliedPromo.code}] không áp dụng cho ngày tham quan ${formatVnDate(targetDateStr)} nên đã được hủy.`);
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
        toast.error(`Mã khuyến mãi chỉ áp dụng từ ngày ${formatVnDate(startStr)} (Ngày tham quan của bạn: ${formatVnDate(targetDateStr)})`);
        return;
      }
    }

    if (found.end_date) {
      const endStr = typeof found.end_date === 'string'
        ? found.end_date.substring(0, 10)
        : new Date(found.end_date).toISOString().split('T')[0];
      if (targetDateStr > endStr) {
        toast.error(`Mã khuyến mãi đã hết hạn sử dụng vào ngày ${formatVnDate(endStr)} (Ngày tham quan của bạn: ${formatVnDate(targetDateStr)})`);
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

  // Helper date shortcuts
  const handleSetQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setVisitDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Banner Navigation (Compact, no wasted height) */}
      <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-600/20 text-white shrink-0">
            <Compass className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest leading-none">
                {portalCode}
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium">
                {destinationName}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onBackToApp && (
            <button
              type="button"
              onClick={onBackToApp}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden md:inline">Về trang quản trị</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.hash = '/pos'}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm cursor-pointer"
          >
            Mở quầy POS
          </button>
        </div>
      </header>

      {/* Main Single-Viewport Layout: Full-height, balanced 2 columns, ZERO main scrolling on desktop */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-4 lg:overflow-hidden flex flex-col min-h-0">
        {step === 'FORM' ? (
          <form onSubmit={handleSubmit} className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:overflow-hidden min-h-0">
            {/* CỘT TRÁI (7 cols): Chọn ngày & Danh sách vé (chiều cao toàn diện, cuộn nội bộ nếu danh sách dài) */}
            <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 lg:overflow-hidden min-h-0 space-y-3.5">
              {/* Header của Cột Trái: Chọn ngày tham quan inline */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                    1
                  </span>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                      Ngày Tham Quan
                    </h2>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Mã đặt chỗ áp dụng cho ngày này
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(0)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition"
                    >
                      Hôm nay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(1)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition"
                    >
                      Ngày mai
                    </button>
                  </div>
                  <VNDateInput
                    id="visit-date-input"
                    value={visitDate}
                    onChange={(val) => setVisitDate(val)}
                    min={new Date().toISOString().split('T')[0]}
                    className="px-2.5 py-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-mono w-[130px]"
                  />
                </div>
              </div>

              {/* Danh sách vé: Tiêu đề + Huy hiệu số lượng */}
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                    2
                  </span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Chọn Loại Vé & Số Lượng
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  Đã chọn: {totalTickets} vé
                </span>
              </div>

              {/* Danh sách thẻ vé: Scrollable nội bộ - KHÔNG BAO GIỜ đẩy form đi xuống */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px] custom-scrollbar">
                {isLoadingTemplates ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    Đang tải danh sách vé từ hệ thống...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-medium">
                    Hiện chưa có bảng giá vé tham quan trực tuyến.
                  </div>
                ) : (
                  templates.map((tpl) => {
                    const qty = ticketQuantities[tpl.id] || 0;
                    const priceNum = Number(tpl.price) || 0;
                    const isFree = priceNum === 0;

                    return (
                      <div
                        key={tpl.id}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          qty > 0
                            ? 'bg-emerald-50/60 border-emerald-500 shadow-2xs ring-1 ring-emerald-500/20'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Thông tin vé */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {tpl.name || tpl.ticket_name}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-slate-200/90 text-slate-600 text-[10px] font-mono rounded">
                              {tpl.code}
                            </span>
                            {qty === 1 && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                Vé lẻ (1 lượt)
                              </span>
                            )}
                            {qty > 1 && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-full flex items-center gap-1 shadow-2xs">
                                <Users className="w-3 h-3" /> Đoàn ({qty} lượt)
                              </span>
                            )}
                          </div>

                          {tpl.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                              {tpl.description}
                            </p>
                          )}

                          <div className="mt-1 flex items-baseline gap-2">
                            {isFree ? (
                              <span className="text-xs font-black text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                Miễn phí (0 đ)
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm font-black font-mono text-emerald-700">
                                {priceNum.toLocaleString('vi-VN')} đ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Nút cộng trừ & ô nhập số lượng trực tiếp */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            aria-label={`Giảm số lượng vé ${tpl.name || tpl.code}`}
                            onClick={() => handleQuantityChange(tpl.id, -1)}
                            disabled={qty === 0}
                            className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-300 flex items-center justify-center text-slate-700 transition shadow-2xs cursor-pointer active:scale-95"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={qty}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleQuantitySet(tpl.id, e.target.value)}
                            aria-label={`Số lượng vé ${tpl.name || tpl.code}`}
                            title="Bấm để nhập số lượng trực tiếp"
                            className="w-12 h-8 text-center font-bold font-mono text-sm text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-2xs hover:border-slate-400"
                          />
                          <button
                            type="button"
                            aria-label={`Tăng số lượng vé ${tpl.name || tpl.code}`}
                            onClick={() => handleQuantityChange(tpl.id, 1)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white transition shadow-xs cursor-pointer active:scale-95"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Ghi chú POS tinh gọn, không chiếm diện tích */}
              <div className="p-2.5 bg-purple-50/80 border border-purple-200/90 rounded-xl text-[11px] text-purple-900 flex items-center gap-2 shrink-0">
                <Users className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="leading-tight">
                  <b>Quy chuẩn POS:</b> Mua từ 2 vé cùng loại trở lên tự động gom thành <b>1 Vé đoàn duy nhất</b> chứa đủ số lượt để quét tuần tự qua cổng.
                </span>
              </div>
            </div>

            {/* CỘT PHẢI (5 cols): THÔNG TIN NGƯỜI ĐẶT ĐẶT NGAY TRÊN ĐẦU + TÓM TẮT & XÁC NHẬN */}
            <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 lg:overflow-hidden min-h-0 space-y-3.5 justify-between">
              <div className="space-y-3.5 overflow-y-auto pr-0.5 custom-scrollbar">
                {/* Bước 3: Thông tin người đặt - ĐẶT NGAY ĐÂY, KHÔNG CẦN CUỘN */}
                <div>
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                      3
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">
                      Thông Tin Người Đặt / Tour
                    </h3>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label htmlFor="customer-name" className="block text-slate-700 font-bold mb-1 text-[11px]">
                        Họ tên người đặt <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                      />
                    </div>

                    <div>
                      <label htmlFor="customer-phone" className="block text-slate-700 font-bold mb-1 text-[11px]">
                        Số điện thoại nhận mã <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="0912345678"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium font-mono"
                      />
                    </div>

                    <div>
                      <label htmlFor="company-name" className="block text-slate-700 font-bold mb-1 text-[11px]">
                        Công ty lữ hành / Tour <span className="text-slate-400 font-normal">(nếu có)</span>
                      </label>
                      <input
                        id="company-name"
                        type="text"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="VD: Du Lịch Miền Trung"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                      />
                    </div>

                    <div>
                      <label htmlFor="customer-email" className="block text-slate-700 font-bold mb-1 text-[11px]">
                        Email xác nhận <span className="text-slate-400 font-normal">(tùy chọn)</span>
                      </label>
                      <input
                        id="customer-email"
                        type="email"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="tour@travel.com"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5">
                    <label htmlFor="booking-note" className="block text-slate-700 font-bold mb-1 text-[11px]">
                      Ghi chú thêm <span className="text-slate-400 font-normal">(tùy chọn)</span>
                    </label>
                    <input
                      id="booking-note"
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Yêu cầu hỗ trợ xe điện, HDV..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Khung Mã Khuyến Mãi / Voucher từ DB */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  {promotions.length > 0 && (
                    <div>
                      <label htmlFor="promo-select" className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-emerald-600" />
                        Chương trình khuyến mãi từ hệ thống:
                      </label>
                      <select
                        id="promo-select"
                        value={selectedPromotionId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedPromotionId(id);
                          if (!id) {
                            setAppliedPromo(null);
                            setPromoCodeInput('');
                            return;
                          }
                          const found = promotions.find(p => p.id === id);
                          if (found) {
                            // Kiểm tra hạn ngày tham quan
                            const targetDateStr = visitDate || new Date().toISOString().split('T')[0];
                            if (found.start_date) {
                              const startStr = typeof found.start_date === 'string' ? found.start_date.substring(0, 10) : new Date(found.start_date).toISOString().split('T')[0];
                              if (targetDateStr < startStr) {
                                toast.warning(`Chương trình [${found.name || found.code}] áp dụng từ ngày ${formatVnDate(startStr)} (Ngày tham quan của bạn: ${formatVnDate(targetDateStr)})`);
                              }
                            }
                            if (found.end_date) {
                              const endStr = typeof found.end_date === 'string' ? found.end_date.substring(0, 10) : new Date(found.end_date).toISOString().split('T')[0];
                              if (targetDateStr > endStr) {
                                toast.warning(`Chương trình [${found.name || found.code}] hết hạn vào ngày ${formatVnDate(endStr)} (Ngày tham quan của bạn: ${formatVnDate(targetDateStr)})`);
                              }
                            }
                            setAppliedPromo(found);
                            setPromoCodeInput(found.code || '');
                            toast.success(`Đã áp dụng: ${found.name || found.code} (${found.discount_percent ? `Giảm ${found.discount_percent}%` : `-${Number(found.discount_value).toLocaleString('vi-VN')} đ`})`);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500 font-medium"
                      >
                        <option value="">-- Hoặc chọn chương trình KM đang chạy ({promotions.length}) --</option>
                        {promotions.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name || p.code} ({p.discount_percent ? `Giảm ${p.discount_percent}%` : `-${Number(p.discount_value).toLocaleString('vi-VN')} đ`})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        placeholder="NHẬP MÃ VOUCHER..."
                        className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-emerald-500"
                        aria-label="Nhập mã voucher giảm giá"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {appliedPromo && (
                    <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-2.5 py-1.5 text-xs text-emerald-800">
                      <span className="truncate">
                        Mã: <b className="font-mono text-emerald-900">{appliedPromo.code}</b> ({appliedPromo.discount_percent ? `-${appliedPromo.discount_percent}%` : `-${Number(appliedPromo.discount_value).toLocaleString('vi-VN')} đ`})
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedPromo(null);
                          setSelectedPromotionId('');
                          setPromoCodeInput('');
                          toast.info('Đã hủy áp dụng mã khuyến mãi');
                        }}
                        className="text-slate-400 hover:text-rose-600 font-bold text-[11px] ml-2 shrink-0 cursor-pointer"
                      >
                        Gỡ
                      </button>
                    </div>
                  )}
                </div>

                {/* Chi tiết giảm giá lấy từ DB (nếu có) */}
                {effectiveDiscount > 0 && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-xs text-emerald-900 flex justify-between items-center">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {isPromoHigher ? (
                        <>Voucher [{activePromo?.code}]</>
                      ) : (
                        <>{matchedCustomerGroup?.name || (isGroup ? 'Ưu đãi đoàn' : 'Ưu đãi lẻ')}</>
                      )}
                      {effectiveDiscountPercent > 0 ? ` (${effectiveDiscountPercent}%)` : ''}:
                    </span>
                    <span className="font-mono font-black text-emerald-700">
                      -{effectiveDiscount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>
                )}
              </div>

              {/* Phần Tóm Tắt & Nút Đặt Chỗ (Cố định ở đáy panel bên phải) */}
              <div className="pt-3 border-t border-slate-100 space-y-2 shrink-0">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Tổng tiền dự kiến ({totalTickets} vé)
                    </span>
                    {effectiveDiscount > 0 && (
                      <span className="text-[11px] text-slate-400 line-through font-mono">
                        Gốc: {rawSubtotal.toLocaleString('vi-VN')} đ
                      </span>
                    )}
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-mono text-emerald-700">
                    {totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || totalTickets === 0}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmitting ? 'Đang tạo mã đặt chỗ...' : 'Xác Nhận Đặt Chỗ Ngay'}
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Bảo lưu snapshot giá
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" /> Nhận vé ưu tiên tại quầy
                  </span>
                </div>
              </div>
            </div>
          </form>
        ) : (
          /* STEP 2: SUCCESS CONFIRMATION SCREEN (Tối ưu gọn gàng 1 màn hình) */
          <div className="max-w-lg w-full mx-auto my-auto py-2">
            <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-7 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-black text-emerald-700 uppercase tracking-widest block mb-0.5">
                  ĐẶT CHỖ THÀNH CÔNG
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">Mã Đặt Chỗ Của Bạn</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đọc mã này hoặc SĐT tại quầy POS để nhận vé vào cổng
                </p>
              </div>

              {/* Digital Pass Voucher Card */}
              <div className="p-4 bg-gradient-to-b from-emerald-50/90 to-slate-50/50 rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center shadow-xs">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider mb-1">
                  MÃ ĐẶT CHỖ (BOOKING CODE)
                </span>

                <div className="mt-1 flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border-2 border-emerald-400 shadow-sm">
                  <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-800 tracking-wider">
                    {createdBooking?.booking_code}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    aria-label="Sao chép mã đặt chỗ"
                    title="Sao chép mã"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <div className="text-xs text-slate-600 mt-3 space-y-0.5">
                  <p>Khách hàng: <b className="text-slate-900">{createdBooking?.customer_name}</b></p>
                  <p>Ngày tham quan: <b className="text-emerald-800 font-bold">{formatVnDate(createdBooking?.visit_date)}</b></p>
                </div>

                {/* Important notice badge */}
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-left text-[11px] text-amber-950 flex items-start gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <b>Lưu ý:</b> Đây là <b>Mã Đặt Chỗ</b>, <b>chưa phải vé quét vào cổng</b>. Khi đến Khu Du Lịch, vui lòng đọc mã này hoặc SĐT tại quầy POS để nhận vé in.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('FORM');
                    setCreatedBooking(null);
                  }}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition shadow-2xs cursor-pointer"
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
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Mở bán tại POS
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
