import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, BadgeCheck, Phone, UserCheck, AlertCircle, Volume2 } from 'lucide-react';
import { User } from '../../../shared/types/hpticket';
import { dbStore } from '../../../shared/data/mockDatabase';

interface CameraQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanResult: (staff: User | null, rawCode: string) => void;
}

export const CameraQRScannerModal: React.FC<CameraQRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanResult,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detectedStaff, setDetectedStaff] = useState<User | null>(null);
  const [scannedCode, setScannedCode] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      setIsScanning(true);
      setDetectedStaff(null);
      setScannedCode('');
      setCameraError(null);

      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setHasCameraPermission(false);
          setCameraError('Chưa cấp quyền camera hoặc thiết bị không hỗ trợ camera trực tiếp.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const simulateScan = (codeToScan: string) => {
    setScannedCode(codeToScan);
    const found = dbStore.users.find(
      (u) =>
        u.qr_code === codeToScan ||
        u.username === codeToScan ||
        u.phone === codeToScan ||
        codeToScan.includes(u.qr_code) ||
        codeToScan.includes(u.phone)
    );

    setDetectedStaff(found || null);
    onScanResult(found || null, codeToScan);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col text-slate-900">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Camera className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                MÁY QUÉT CAMERA TRỰC TIẾP (LIVE QR SCANNER)
              </h3>
              <p className="text-[11px] text-slate-400">Đưa camera điện thoại / máy tính hướng vào thẻ nhân viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Camera Feed */}
        <div className="relative bg-slate-950 aspect-video sm:aspect-4/3 w-full flex items-center justify-center overflow-hidden">
          {hasCameraPermission ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Chế độ giả lập Camera Trực Quan Active</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  {cameraError || 'Đang chờ khung hình camera hoặc bấm các mẫu test thẻ nhân viên bên dưới:'}
                </p>
              </div>
            </div>
          )}

          {/* Target Scanning Reticle */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
            <div className="w-48 h-48 border-2 border-dashed border-emerald-400 rounded-2xl relative flex items-center justify-center shadow-lg">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br"></div>
              {/* Laser Animation Line */}
              <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_12px_#34d399] animate-bounce"></div>
            </div>
          </div>
        </div>

        {/* Quick Test Buttons */}
        <div className="p-3 bg-slate-50 border-t border-b border-slate-200">
          <p className="text-[11px] text-slate-600 font-bold mb-2 flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
            Giả lập quẹt camera với thẻ nhân viên:
          </p>
          <div className="flex flex-wrap gap-2">
            {dbStore.users.map((u) => (
              <button
                key={u.id}
                onClick={() => simulateScan(u.qr_code)}
                className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-2xs"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                {u.fullname} ({u.qr_code})
              </button>
            ))}
          </div>
        </div>

        {/* Scan Result Info */}
        <div className="p-4 sm:p-5 bg-white space-y-3 min-h-[120px]">
          {scannedCode ? (
            detectedStaff ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> TÌM THẤY HỒ SƠ NHÂN VIÊN
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-800">{scannedCode}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Họ và Tên</span>
                    <span className="text-sm font-black text-slate-900">{detectedStaff.fullname}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Số Điện Thoại</span>
                    <span className="text-sm font-mono font-black text-emerald-700 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      {detectedStaff.phone || '0901234567'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Chức Danh</span>
                    <span className="font-bold text-slate-800">
                      {dbStore.roles.find((r) => r.id === detectedStaff.role_id)?.name || 'Nhân viên'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Tên Đăng Nhập</span>
                    <span className="font-mono text-slate-700">@{detectedStaff.username}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <span className="font-bold block">Không tìm thấy nhân viên với mã: {scannedCode}</span>
                  <span>Mã này chưa được đăng ký trong hệ thống tài khoản IAM.</span>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-3 text-xs text-slate-400 italic">
              Đang chờ quét... Đưa mã QR thẻ nhân viên trước ống kính camera.
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Đóng Camera Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
