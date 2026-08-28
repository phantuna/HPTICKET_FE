import { Dispatch, SetStateAction } from 'react';

export const useReportExport = (setExportNotice: Dispatch<SetStateAction<string | null>>) => {
  const handleExportExcel = (reportTitle: string) => {
    setExportNotice(`Đã kết xuất tệp Báo cáo Excel: ${reportTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return { handleExportExcel };
};
