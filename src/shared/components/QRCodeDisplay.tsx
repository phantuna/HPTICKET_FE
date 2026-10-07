import React, { useMemo, useRef, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 160,
  className = '',
  showText = true,
}) => {
  // 1. Sinh vector SVG ĐỒNG BỘ 100% bằng QRCode.create ngay tại render time (0ms, không phụ thuộc canvas/DOM/async)
  const svgData = useMemo(() => {
    if (!value) return null;
    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: 'M' });
      const modSize = qr.modules.size;
      const data = qr.modules.data;
      const margin = 1;
      let path = '';
      for (let r = 0; r < modSize; r++) {
        for (let c = 0; c < modSize; c++) {
          if (data[r * modSize + c]) {
            path += `M${c + margin},${r + margin}h1v1h-1z `;
          }
        }
      }
      return {
        viewBoxSize: modSize + margin * 2,
        path,
      };
    } catch (err) {
      console.warn('[QRCodeDisplay] QRCode.create sync failed, fallback to canvas:', err);
      return null;
    }
  }, [value]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fallback vẽ canvas nếu QRCode.create gặp lỗi
  useEffect(() => {
    if (!svgData && canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      }, (error) => {
        if (error) console.error('[QRCodeDisplay] Canvas fallback error:', error);
      });
    }
  }, [value, size, svgData]);

  if (!value) return null;

  return (
    <div className={`flex flex-col items-center justify-center p-1 bg-white ${className}`}>
      {svgData ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${svgData.viewBoxSize} ${svgData.viewBoxSize}`}
          width={size}
          height={size}
          className="block mx-auto"
          style={{ width: `${size}px`, height: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
          shapeRendering="crispEdges"
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          <path d={svgData.path} fill="#000000" />
        </svg>
      ) : (
        <canvas ref={canvasRef} className="rounded block mx-auto" />
      )}
      {showText && (
        <span className="mt-1 text-xs font-mono font-bold text-slate-700 break-all text-center max-w-[200px]">
          {value}
        </span>
      )}
    </div>
  );
};
