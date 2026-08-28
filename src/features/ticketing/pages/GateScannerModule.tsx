import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  Scan,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Layers,
  Sparkles,
  Server,
  Zap,
  UserCheck,
  Phone,
  BadgeCheck,
  ToggleLeft,
  ToggleRight,
  Globe,
  Database,
} from 'lucide-react';
import { dbStore } from '../../../shared/data/mockDatabase';
import { ticketingService, GateScanResponse } from '../../../api/ticketingService';
import { ScanStatusResult, GateAccessLog } from '../../../shared/types/hpticket';
import {setUseMockApi, API_BASE_URL } from '../../../api/apiConfig';

export const GateScannerModule: React.FC = () => {
  const [gates, setGates] = useState<any[]>([]);
  const [selectedGateId, setSelectedGateId] = useState<string>('');
  const [qrInput, setQrInput] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastResponse, setLastResponse] = useState<GateScanResponse | null>(null);
  const [logs, setLogs] = useState<GateAccessLog[]>([]);

  useEffect(() => {
    ticketingService.fetchControlGates().then(res => {
      if (res.data && res.data.length > 0) {
        const activeGates = res.data.filter((g: any) => g.is_active || g.isActive);
        setGates(activeGates);
        if (activeGates.length > 0) setSelectedGateId(activeGates[0].id);
      }
    });
  }, []);

  const selectedGate = gates.find((g) => g.id === selectedGateId);
  const [selectedZone, setSelectedZone] = useState<any>(null);

  useEffect(() => {
    if (selectedGate?.control_zone_id) {
       ticketingService.fetchControlZones().then(res => {
         if (res.data) {
           setSelectedZone(res.data.find((z: any) => z.id === selectedGate.control_zone_id));
         }
       });
    }
  }, [selectedGate]);

  // Execute scan pipeline
  const handleScan = async (qrToScan?: string) => {
    const codeToScan = qrToScan || qrInput;
    if (!codeToScan.trim()) return;

    setIsScanning(true);
    setLastResponse(null);

    // Simulate hardware reader + backend transmission
    try {
      const res = await ticketingService.scanGatePass({
        gate_id: selectedGateId,
        qr_string: codeToScan.trim(),
      });

      setLastResponse(res.data);
      const logsRes = await ticketingService.fetchAccessLogs();
      setLogs(logsRes.data || [...dbStore.gateAccessLogs]);
      setQrInput('');

      // TRUYỀN TÍN HIỆU XUỐNG C# ĐỂ NHẢY CHỐT ZKTECO
      if (res.data && ((res.data as any).status_result === 'OPEN_GATE' || res.data.result === ScanStatusResult.SUCCESS)) {
        const globalWindow = window as any;
        if (globalWindow.chrome && globalWindow.chrome.webview) {
          globalWindow.chrome.webview.postMessage(JSON.stringify({
             action: 'OPEN_GATE',
             gate_id: selectedGateId
          }));
        }
      }
    } catch (e) {
      console.error('Scan error:', e);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Left Column: Gate Terminal Scanner Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Terminal Header & Device Selector */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scan className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Đầu Đọc Thẻ & Cổng Soát Vé</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Chọn Thiết Bị Cổng Soát (Device)
              </label>
              <select
                value={selectedGateId}
                onChange={(e) => setSelectedGateId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 p-2.5 outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              >
                {gates.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.device_name} ({g.ip_address}:{g.device_port})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Khu Vực Kiểm Soát Ánh Xạ
              </label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-semibold flex items-center justify-between">
                <span>{selectedZone?.name || 'Khu A'}</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                  {selectedZone?.code}
                </span>
              </div>
            </div>
          </div>

          {/* QR Manual Reader / Hardware Input */}
          <div className="mt-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Chuỗi Mã QR Tĩnh Từ Thiết Bị Quét (Hardware Text Reader)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                placeholder="Nhập hoặc quét chuỗi QR vé (ví dụ: HPT-PASS-...)"
                className="flex-1 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs placeholder:text-slate-400"
              />
              <button
                onClick={() => handleScan()}
                disabled={isScanning || !qrInput.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition shadow-xs"
              >
                {isScanning ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Quét
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Access Scan Logs Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Lịch Sử Qua Cổng Theo Thời Gian Thực</h2>
            </div>
            <span className="text-xs text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-mono font-semibold">
              {logs.filter(log => log.status_result === ScanStatusResult.SUCCESS || (log as any).status_result === 'OPEN_GATE').length} Lượt
            </span>
          </div>

          <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-mono text-[10px] sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Thời Gian</th>
                  <th className="p-2.5">Cổng Soát</th>
                  <th className="p-2.5">Mã QR Vé</th>
                  <th className="p-2.5 text-right">Kết Quả</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      Chưa có lượt quét mã qua cổng nào
                    </td>
                  </tr>
                ) : (
                  [...logs]
                    .sort((a, b) => new Date(b.scan_time).getTime() - new Date(a.scan_time).getTime())
                    .map((log) => {
                      const isSuccess =
                        log.status_result === ScanStatusResult.SUCCESS ||
                        (log as any).status_result === 'OPEN_GATE';
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-2.5 font-mono text-[11px] text-slate-500">
                          {new Date(log.scan_time).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 font-medium text-slate-800">{log.gate_name || 'Cổng A1'}</td>
                        <td className="p-2.5 font-mono text-slate-600 truncate max-w-[140px]">
                          {log.ticket_qr}
                        </td>
                        <td className="p-2.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isSuccess ? 'HỢP LỆ (CHO QUA)' : 'TỪ CHỐI'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Simulated Turnstile Barrier Display */}
      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-between shadow-sm text-center">
        <div className="w-full">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 w-full mb-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" /> Màn Hình Cổng Tự Động (Turnstile)
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Dynamic Barrier Graphic */}
          {lastResponse ? (
            <div
              className={`rounded-2xl p-6 border transition-all duration-300 ${
                lastResponse.result === ScanStatusResult.SUCCESS || (lastResponse as any).status_result === 'OPEN_GATE'
                  ? 'bg-emerald-50/80 border-emerald-200 shadow-sm'
                  : 'bg-rose-50/80 border-rose-200 shadow-sm'
              }`}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  lastResponse.result === ScanStatusResult.SUCCESS || (lastResponse as any).status_result === 'OPEN_GATE'
                    ? 'bg-emerald-100 text-emerald-600 border-emerald-300 animate-bounce'
                    : 'bg-rose-100 text-rose-600 border-rose-300'
                }`}
              >
                {lastResponse.result === ScanStatusResult.SUCCESS || (lastResponse as any).status_result === 'OPEN_GATE' ? (
                  <ShieldCheck className="w-12 h-12" />
                ) : (
                  <ShieldX className="w-12 h-12" />
                )}
              </div>

              <h4
                className={`text-xl font-black uppercase tracking-tight ${
                  lastResponse.result === ScanStatusResult.SUCCESS || (lastResponse as any).status_result === 'OPEN_GATE' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {lastResponse.result === ScanStatusResult.SUCCESS || (lastResponse as any).status_result === 'OPEN_GATE' ? 'MỜI QUA CỔNG' : 'TỪ CHỐI QUA CỔNG'}
              </h4>

              <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed">
                {lastResponse.message}
              </p>

              {/* Staff Details Card if Employee Scan */}
              {lastResponse.staff_info && (
                <div className="mt-4 bg-white rounded-xl p-3.5 border border-emerald-200 text-left space-y-2 shadow-xs">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs border-b border-slate-100 pb-2">
                    <BadgeCheck className="w-4 h-4 text-emerald-600" />
                    <span>THÔNG TIN THẺ NHÂN VIÊN</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Họ & Tên:</span>
                      <span className="font-bold text-slate-900">{lastResponse.staff_info.fullname}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Số Điện Thoại:</span>
                      <span className="font-mono font-bold text-emerald-700">{lastResponse.staff_info.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Chức Danh / Quyền:</span>
                      <span className="font-semibold text-slate-800">{lastResponse.staff_info.role_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Mã QR Nhân Viên:</span>
                      <span className="font-mono text-slate-700">{lastResponse.staff_info.qr_code}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Pass Counter Progress / Unlimited Pass Badge */}
              {lastResponse.allowed_passes !== undefined && (
                lastResponse.allowed_passes >= 999999 ||
                lastResponse.allowed_passes === -1 ||
                (lastResponse.ticket as any)?.ticket_type === 'UNLIMITED' ||
                lastResponse.message?.toLowerCase().includes('vô hạn') ? (
                  <div className="mt-5 bg-emerald-50/90 rounded-xl p-3.5 border border-emerald-300 shadow-xs text-left">
                    <div className="flex justify-between items-center text-xs text-emerald-950 font-semibold mb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Quyền Truy Cập Cổng:
                      </span>
                      <span className="font-extrabold text-emerald-700 uppercase bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                        ∞ Vô Hạn Lượt (Trong 30 Ngày)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-700 border-t border-emerald-200/60 pt-2">
                      <span>Số lần đã quét qua cổng:</span>
                      <span className="font-mono text-emerald-700 font-bold text-sm">
                        {lastResponse.used_passes} Lượt (Không giới hạn)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 bg-white rounded-xl p-3 border border-slate-200 shadow-xs">
                    <div className="flex justify-between text-xs text-slate-700 mb-1.5 font-semibold">
                      <span>Số Lượt Đã Quét:</span>
                      <span className="font-mono text-amber-600 font-bold">
                        {lastResponse.used_passes} / {lastResponse.allowed_passes} Lượt
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            ((lastResponse.used_passes || 0) / (lastResponse.allowed_passes || 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-16 px-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                <Scan className="w-8 h-8 animate-pulse text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-800">Sẵn Sàng Nhận Mã QR Quét Cổng</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[240px]">
                Chọn thiết bị cổng và đưa vé vào mắt đọc để kiểm tra quy tắc qua cổng.
              </p>
            </div>
          )}
        </div>

        {/* System Architecture Reminder Box */}
        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 w-full">
          <p className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Quy Chuẩn Kiểm Soát Ra Vào HPTicket
          </p>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600">
            <li>Thiết bị cổng chỉ đọc chuỗi TEXT nguyên bản từ mã QR.</li>
            <li>Logic khóa giao dịch chống Race Condition (Pessimistic Locking).</li>
            <li>Lưu giữ vết nhật ký qua cổng (gate_access_logs).</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
