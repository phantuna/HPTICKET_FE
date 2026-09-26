import React, { useState } from 'react';
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ExportExcelButton } from '../../../../shared/components/ExportExcelButton';
import { apiClient, API_ENDPOINTS } from '../../../../api/apiConfig';
import { toast } from '../../../../shared/utils/toast';

export interface ComparisonReportTabProps {
  handleExportExcel: (tab: string, params?: any) => void;
}

export const ComparisonReportTab: React.FC<ComparisonReportTabProps> = ({ handleExportExcel }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [itemType, setItemType] = useState('ALL'); // ALL, TICKET, PRODUCT

  // Kỳ báo cáo
  const [fromDate1, setFromDate1] = useState(new Date().toISOString().split('T')[0]);
  const [toDate1, setToDate1] = useState(new Date().toISOString().split('T')[0]);

  // Kỳ so sánh
  const [fromDate2, setFromDate2] = useState(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().split('T')[0];
  });
  const [toDate2, setToDate2] = useState(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return y.toISOString().split('T')[0];
  });

  const [preset1, setPreset1] = useState('today');
  const [preset2, setPreset2] = useState('yesterday');

  const applyPreset = (preset: string, setFrom: (v: string) => void, setTo: (v: string) => void, setPresetStr: (v: string) => void) => {
    setPresetStr(preset);
    const today = new Date();
    const format = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      setFrom(format(today));
      setTo(format(today));
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      setFrom(format(y));
      setTo(format(y));
    } else if (preset === 'dayBeforeYesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 2);
      setFrom(format(y));
      setTo(format(y));
    } else if (preset === '7days') {
      const y = new Date(today);
      y.setDate(y.getDate() - 6);
      setFrom(format(y));
      setTo(format(today));
    } else if (preset === 'previous7days') {
      const y1 = new Date(today);
      y1.setDate(y1.getDate() - 13);
      const y2 = new Date(today);
      y2.setDate(y2.getDate() - 7);
      setFrom(format(y1));
      setTo(format(y2));
    } else if (preset === 'thisMonth') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1);
      const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setFrom(format(first));
      setTo(format(last));
    } else if (preset === 'lastMonth') {
      const first = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const last = new Date(today.getFullYear(), today.getMonth(), 0);
      setFrom(format(first));
      setTo(format(last));
    } else if (preset === 'thisQuarter') {
      const q = Math.floor(today.getMonth() / 3);
      const first = new Date(today.getFullYear(), q * 3, 1);
      const last = new Date(today.getFullYear(), q * 3 + 3, 0);
      setFrom(format(first));
      setTo(format(last));
    } else if (preset === 'lastQuarter') {
      const q = Math.floor(today.getMonth() / 3) - 1;
      const first = new Date(today.getFullYear(), q * 3, 1);
      const last = new Date(today.getFullYear(), q * 3 + 3, 0);
      setFrom(format(first));
      setTo(format(last));
    } else if (preset === 'thisYear') {
      const first = new Date(today.getFullYear(), 0, 1);
      const last = new Date(today.getFullYear(), 11, 31);
      setFrom(format(first));
      setTo(format(last));
    } else if (preset === 'lastYear') {
      const first = new Date(today.getFullYear() - 1, 0, 1);
      const last = new Date(today.getFullYear() - 1, 11, 31);
      setFrom(format(first));
      setTo(format(last));
    }
  };

  const handlePreset1Click = (preset1Name: string) => {
    applyPreset(preset1Name, setFromDate1, setToDate1, setPreset1);

    if (preset1Name === 'today') {
      applyPreset('yesterday', setFromDate2, setToDate2, setPreset2);
    } else if (preset1Name === 'yesterday') {
      applyPreset('dayBeforeYesterday', setFromDate2, setToDate2, setPreset2);
    } else if (preset1Name === '7days') {
      applyPreset('previous7days', setFromDate2, setToDate2, setPreset2);
    } else if (preset1Name === 'thisMonth') {
      applyPreset('lastMonth', setFromDate2, setToDate2, setPreset2);
    } else if (preset1Name === 'thisQuarter') {
      applyPreset('lastQuarter', setFromDate2, setToDate2, setPreset2);
    }
  };

  const handleSearch = async () => {
    if (!fromDate1 || !toDate1 || !fromDate2 || !toDate2) {
      toast.error('Vui lòng chọn đầy đủ thời gian cho cả 2 kỳ');
      return;
    }
    if (fromDate1 > toDate1 || fromDate2 > toDate2) {
      toast.error('Ngày bắt đầu không thể lớn hơn ngày kết thúc');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.SALES.REPORTS_COMPARE, {
        fromDate1, toDate1,
        fromDate2, toDate2,
        itemType
      }) as any;

      const items = Array.isArray(res?.data) ? res.data : res?.data?.content || [];
      setData(items);
    } catch (err) {
      console.error("Failed to fetch comparison report", err);
      toast.error('Lỗi khi tải dữ liệu báo cáo so sánh');
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (f: string, t: string) => {
    if (!f || !t) return 0;
    const d1 = new Date(f).getTime();
    const d2 = new Date(t).getTime();
    return Math.max(1, Math.round((d2 - d1) / (1000 * 3600 * 24)) + 1);
  };

  const days1 = calculateDays(fromDate1, toDate1);
  const days2 = calculateDays(fromDate2, toDate2);

  const totalQty1 = data.reduce((sum, item) => sum + (item.period1Qty || 0), 0);
  const totalQty2 = data.reduce((sum, item) => sum + (item.period2Qty || 0), 0);
  const totalRev1 = data.reduce((sum, item) => sum + (item.period1Revenue || 0), 0);
  const totalRev2 = data.reduce((sum, item) => sum + (item.period2Revenue || 0), 0);

  const totalQtyDiff = totalQty2 > 0 ? ((totalQty1 - totalQty2) / totalQty2) * 100 : (totalQty1 > 0 ? 100 : 0);
  const totalRevDiff = totalRev2 > 0 ? ((totalRev1 - totalRev2) / totalRev2) * 100 : (totalRev1 > 0 ? 100 : 0);

  const formatPercent = (val: number) => {
    if (val === 0) return <span className="text-slate-400 flex items-center justify-end gap-1"><Minus className="w-3 h-3" /> 0%</span>;
    if (val > 0) return <span className="text-emerald-600 flex items-center justify-end gap-1"><ArrowUpRight className="w-3 h-3" /> {val.toFixed(1)}%</span>;
    return <span className="text-rose-600 flex items-center justify-end gap-1"><ArrowDownRight className="w-3 h-3" /> {Math.abs(val).toFixed(1)}%</span>;
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-md shadow-sm border border-slate-100 flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xl:gap-6">
          {/* Cột 1: Kỳ báo cáo */}
          <div className="flex items-center flex-wrap gap-3 relative pl-4 py-1">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full"></div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-700 text-xs uppercase w-24 shrink-0">Kỳ Báo Cáo</span>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => handlePreset1Click('today')} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset1 === 'today' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Hôm nay</button>
                <button onClick={() => handlePreset1Click('7days')} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset1 === '7days' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>7 ngày qua</button>
                <button onClick={() => handlePreset1Click('thisMonth')} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset1 === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tháng này</button>
                <button onClick={() => handlePreset1Click('thisQuarter')} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset1 === 'thisQuarter' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Quý này</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="date" value={fromDate1} onChange={(e) => { setFromDate1(e.target.value); setPreset1('custom'); }} className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500 text-xs w-32" />
              <span className="text-[10px] text-slate-400 font-medium">đến</span>
              <input type="date" value={toDate1} onChange={(e) => { setToDate1(e.target.value); setPreset1('custom'); }} className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-blue-500 text-xs w-32" />
              {days1 > 0 && <span className="text-[10px] text-blue-600 font-bold ml-1">({days1} ngày)</span>}
            </div>
          </div>

          {/* Cột 2: Kỳ so sánh */}
          <div className="flex items-center flex-wrap gap-3 relative pl-4 py-1">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-full"></div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-orange-700 text-xs uppercase w-24 shrink-0">Kỳ So Sánh</span>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => applyPreset('yesterday', setFromDate2, setToDate2, setPreset2)} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset2 === 'yesterday' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Hôm qua</button>
                <button onClick={() => applyPreset('previous7days', setFromDate2, setToDate2, setPreset2)} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset2 === 'previous7days' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>7 ngày liền trước</button>
                <button onClick={() => applyPreset('lastMonth', setFromDate2, setToDate2, setPreset2)} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset2 === 'lastMonth' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tháng trước</button>
                <button onClick={() => applyPreset('lastQuarter', setFromDate2, setToDate2, setPreset2)} className={`text-[10px] px-2 py-1 rounded font-medium transition ${preset2 === 'lastQuarter' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Quý trước</button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="date" value={fromDate2} onChange={(e) => { setFromDate2(e.target.value); setPreset2('custom'); }} className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-500 text-xs w-32" />
              <span className="text-[10px] text-slate-400 font-medium">đến</span>
              <input type="date" value={toDate2} onChange={(e) => { setToDate2(e.target.value); setPreset2('custom'); }} className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-orange-500 text-xs w-32" />
              {days2 > 0 && <span className="text-[10px] text-orange-600 font-bold ml-1">({days2} ngày)</span>}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-3 gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-600">Lọc theo:</span>
            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="border border-slate-200 rounded px-2 py-1 outline-none focus:border-emerald-500 text-xs w-32 sm:w-48 bg-slate-50">
              <option value="ALL">Tất cả sản phẩm</option>
              <option value="TICKET">Chỉ vé dịch vụ</option>
              <option value="PRODUCT">Chỉ F&B / Khác</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button onClick={handleSearch} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-50">
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />} So sánh
            </button>
            <ExportExcelButton
              onExport={() => handleExportExcel('BaoCaoSoSanh', { comparisonData: data, fromDate: fromDate1, toDate: toDate1 })}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              buttonText="Xuất Excel"
            />
          </div>
        </div>
      </div>

      {days1 !== days2 && days1 > 0 && days2 > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] px-3 py-1.5 rounded-md">
          <strong>Lưu ý:</strong> Kỳ báo cáo có <strong>{days1}</strong> ngày, trong khi Kỳ so sánh có <strong>{days2}</strong> ngày. Việc so sánh tỷ lệ (%) có thể bị lệch.
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-base font-semibold text-slate-800">Bảng So Sánh Doanh Thu & Số Lượng</h3>
          {loading && <RefreshCw className="w-5 h-5 text-emerald-500 animate-spin" />}
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16 text-center bg-slate-50" rowSpan={2}>STT</th>
                <th className="p-3 border-r border-slate-200 bg-slate-50" rowSpan={2}>Tên hàng hóa dịch vụ</th>
                <th className="p-3 text-center border-r border-slate-200 bg-slate-50" colSpan={3}>Kỳ Báo Cáo</th>
                <th className="p-3 text-center border-r border-slate-200 bg-slate-50" colSpan={3}>Kỳ So Sánh</th>
                <th className="p-3 text-center bg-slate-50" colSpan={2}>Tăng/Giảm</th>
              </tr>
              <tr className="border-t border-slate-200 bg-slate-50/50 shadow-[inset_0_1px_0_rgba(226,232,240,1)]">
                <th className="p-2 text-center text-xs bg-slate-50/90 backdrop-blur">Số lượng</th>
                <th className="p-2 text-right text-xs bg-slate-50/90 backdrop-blur">Doanh thu</th>
                <th className="p-2 text-right text-xs border-r border-slate-200 bg-slate-50/90 backdrop-blur">Thành tiền</th>

                <th className="p-2 text-center text-xs bg-slate-50/90 backdrop-blur">Số lượng</th>
                <th className="p-2 text-right text-xs bg-slate-50/90 backdrop-blur">Doanh thu</th>
                <th className="p-2 text-right text-xs border-r border-slate-200 bg-slate-50/90 backdrop-blur">Thành tiền</th>

                <th className="p-2 text-right text-xs text-blue-700 bg-slate-50/90 backdrop-blur whitespace-nowrap">Tỷ lệ SL (%)</th>
                <th className="p-2 text-right text-xs text-emerald-700 bg-slate-50/90 backdrop-blur whitespace-nowrap">Tỷ lệ TT (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length > 0 ? (
                data.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-medium text-slate-800 border-r border-slate-100">{item.itemName}</td>

                    <td className="p-3 text-center font-bold text-blue-900 bg-blue-50/20 whitespace-nowrap">{item.period1Qty?.toLocaleString('vi-VN')}</td>
                    <td className="p-3 text-right text-slate-500 bg-blue-50/20 whitespace-nowrap">{item.period1Revenue?.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-right font-bold text-blue-700 border-r border-slate-100 bg-blue-50/20 whitespace-nowrap">{item.period1Revenue?.toLocaleString('vi-VN')} đ</td>

                    <td className="p-3 text-center font-bold text-orange-900 bg-orange-50/20 whitespace-nowrap">{item.period2Qty?.toLocaleString('vi-VN')}</td>
                    <td className="p-3 text-right text-slate-500 bg-orange-50/20 whitespace-nowrap">{item.period2Revenue?.toLocaleString('vi-VN')} đ</td>
                    <td className="p-3 text-right font-bold text-orange-700 border-r border-slate-100 bg-orange-50/20 whitespace-nowrap">{item.period2Revenue?.toLocaleString('vi-VN')} đ</td>

                    <td className="p-3 font-bold bg-slate-50/30 whitespace-nowrap">
                      {formatPercent(item.qtyDiffPercent)}
                    </td>
                    <td className="p-3 font-bold bg-slate-50/30 whitespace-nowrap">
                      {formatPercent(item.revenueDiffPercent)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-500 h-32">
                    {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
                  </td>
                </tr>
              )}
              {data.length > 0 && (
                <tr className="bg-slate-200/80 text-slate-900 font-bold border-t-2 border-slate-300 sticky bottom-0 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
                  <td colSpan={2} className="p-3 text-right text-slate-900 text-base uppercase border-r border-slate-200">Tổng cộng</td>

                  <td className="p-3 text-center text-blue-900">{totalQty1.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right text-blue-900">-</td>
                  <td className="p-3 text-right text-blue-800 border-r border-slate-200">{totalRev1.toLocaleString('vi-VN')} đ</td>

                  <td className="p-3 text-center text-orange-900">{totalQty2.toLocaleString('vi-VN')}</td>
                  <td className="p-3 text-right text-orange-900">-</td>
                  <td className="p-3 text-right text-orange-800 border-r border-slate-200">{totalRev2.toLocaleString('vi-VN')} đ</td>

                  <td className="p-3">{formatPercent(totalQtyDiff)}</td>
                  <td className="p-3">{formatPercent(totalRevDiff)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
