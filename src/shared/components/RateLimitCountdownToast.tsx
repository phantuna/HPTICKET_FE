import React, { useEffect, useState, useRef } from 'react';

interface RateLimitEventDetail {
  message?: string;
  retryAfterSeconds?: number;
  tier?: string;
}

export const RateLimitCountdownToast: React.FC = () => {
  const [visible, setVisible] = useState<boolean>(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [tierName, setTierName] = useState<string>('');
  const [isFinished, setIsFinished] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    const handleRateLimited = (e: any) => {
      const detail: RateLimitEventDetail = e.detail || {};
      const retrySec = Math.max(1, detail.retryAfterSeconds || 10);

      // Nếu đang đếm và thời gian mới nhận nhỏ hơn thời gian còn lại thì giữ thời gian lớn hơn
      setRemainingSeconds(prev => (visible && prev > retrySec ? prev : retrySec));
      setTotalSeconds(retrySec);
      setTierName(detail.tier || 'Thao tác hệ thống');
      setIsFinished(false);
      setVisible(true);
    };

    window.addEventListener('api_rate_limited', handleRateLimited);
    return () => window.removeEventListener('api_rate_limited', handleRateLimited);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (remainingSeconds <= 0) {
      setIsFinished(true);
      const closeTimeout = setTimeout(() => {
        setVisible(false);
        setIsFinished(false);
      }, 1500);
      return () => clearTimeout(closeTimeout);
    }

    timerRef.current = setTimeout(() => {
      setRemainingSeconds(prev => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, remainingSeconds]);

  if (!visible) return null;

  const percent = totalSeconds > 0 ? Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100)) : 0;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-6 right-6 z-[99999] max-w-sm w-full animate-bounce-in transition-all duration-300 pointer-events-auto"
    >
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl border p-4 backdrop-blur-md transition-all duration-300 ${
        isFinished 
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-950/40' 
          : 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/50'
      }`}>
        
        {/* Progress Bar chạy ngầm phía trên viền Toast */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-start gap-3.5">
          {/* Biểu tượng đồng hồ đếm ngược hoặc hoàn thành */}
          <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
            isFinished
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
          }`}>
            {isFinished ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <span>{remainingSeconds}s</span>
            )}
          </div>

          {/* Nội dung thông báo */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between">
              <h4 className={`text-sm font-bold tracking-tight ${isFinished ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isFinished ? 'Đã sẵn sàng thao tác' : 'Thao tác quá nhanh!'}
              </h4>
              <button
                onClick={() => setVisible(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-lg hover:bg-slate-800/60"
                title="Đóng thông báo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-xs mt-1 text-slate-300 leading-relaxed">
              {isFinished ? (
                'Hạn chế đã được dỡ bỏ. Bạn có thể tiếp tục thực hiện yêu cầu.'
              ) : (
                <>
                  Hệ thống tạm khóa yêu cầu để chống spam ({tierName}). Vui lòng đợi trong{' '}
                  <span className="font-semibold text-amber-300 font-mono text-sm underline decoration-amber-500/50">
                    {remainingSeconds} giây
                  </span>{' '}
                  để tiếp tục.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
