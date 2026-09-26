import { getLocalDateStr } from './orderFiltering';

export const filterGateLogs = (
  rawGateLogs: any[],
  fromDate: string,
  toDate: string,
  nameSearch?: string
): any[] => {
  return rawGateLogs.filter(log => {
    const logDate = getLocalDateStr(log.scan_time || log.created_at);
    if (logDate < fromDate || logDate > toDate) return false;
    if (nameSearch) {
      const searchLower = nameSearch.toLowerCase();
      const matchQr = log.ticket_qr?.toLowerCase().includes(searchLower);
      const matchGate = log.gate_name?.toLowerCase().includes(searchLower);
      if (!matchQr && !matchGate) return false;
    }
    return true;
  });
};

export const filterSystemLogs = (
  rawSystemLogs: any[],
  fromDate: string,
  toDate: string
): any[] => {
  return rawSystemLogs.filter(log => {
    const logDate = getLocalDateStr(log.created_at);
    return logDate >= fromDate && logDate <= toDate;
  });
};
