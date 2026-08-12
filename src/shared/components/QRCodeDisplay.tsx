import React, { useEffect, useRef } from 'react';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      }, (error) => {
        if (error) console.error('Error generating QR Code:', error);
      });
    }
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center justify-center p-3 bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      <canvas ref={canvasRef} className="rounded" />
      {showText && (
        <span className="mt-2 text-xs font-mono font-bold text-slate-700 break-all text-center max-w-[200px]">
          {value}
        </span>
      )}
    </div>
  );
};
