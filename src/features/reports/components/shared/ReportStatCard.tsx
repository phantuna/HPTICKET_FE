import React from 'react';

export type CardColorTheme = 'blue' | 'emerald' | 'amber' | 'rose' | 'purple' | 'slate';

interface ReportStatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  theme?: CardColorTheme;
  className?: string;
}

const themeStyles: Record<CardColorTheme, { bg: string; border: string; labelColor: string; valueColor: string }> = {
  blue: {
    bg: 'bg-blue-50/50',
    border: 'border-blue-100',
    labelColor: 'text-blue-600/80',
    valueColor: 'text-blue-900',
  },
  emerald: {
    bg: 'bg-emerald-50/50',
    border: 'border-emerald-100',
    labelColor: 'text-emerald-600/80',
    valueColor: 'text-emerald-900',
  },
  amber: {
    bg: 'bg-amber-50/50',
    border: 'border-amber-100',
    labelColor: 'text-amber-600/80',
    valueColor: 'text-amber-900',
  },
  rose: {
    bg: 'bg-rose-50/50',
    border: 'border-rose-100',
    labelColor: 'text-rose-600/80',
    valueColor: 'text-rose-900',
  },
  purple: {
    bg: 'bg-purple-50/50',
    border: 'border-purple-100',
    labelColor: 'text-purple-600/80',
    valueColor: 'text-purple-900',
  },
  slate: {
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    labelColor: 'text-slate-600',
    valueColor: 'text-slate-900',
  }
};

export const ReportStatCard: React.FC<ReportStatCardProps> = ({
  label,
  value,
  subValue,
  theme = 'blue',
  className = ''
}) => {
  const styles = themeStyles[theme];

  return (
    <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition shadow-xs ${styles.bg} ${styles.border} ${className}`}>
      <p className={`font-medium mb-1 text-xs uppercase tracking-wider ${styles.labelColor}`}>{label}</p>
      <p className={`text-lg font-bold font-mono ${styles.valueColor}`}>{value}</p>
      {subValue && <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>}
    </div>
  );
};
