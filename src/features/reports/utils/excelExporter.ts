import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../api/apiConfig';

/**
 * Xuất dữ liệu ra file Excel (.xlsx) và trigger download về máy.
 * @param headers - Mảng tên cột (hàng tiêu đề, sẽ được in đậm + nền xám)
 * @param rows    - Mảng các hàng dữ liệu (mỗi phần tử là 1 hàng)
 * @param fileName - Tên file xuất ra (không cần đuôi .xlsx)
 */
export const exportToExcel = (
  headers: string[],
  rows: (string | number | null | undefined)[][],
  fileName: string
): void => {
  // Ghép header vào data
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Style cho dòng header (in đậm, nền xám nhạt)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: '1e293b' } },
      fill: { fgColor: { rgb: 'e2e8f0' }, patternType: 'solid' },
      alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
      border: {
        bottom: { style: 'medium', color: { rgb: '94a3b8' } },
      },
    };
  }

  // Auto-size cột theo nội dung
  const colWidths = headers.map((h, colIdx) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => String(r[colIdx] ?? '').length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });
  ws['!cols'] = colWidths;

  // Tạo Workbook và ghi file
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo');

  const safeFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, safeFileName);
};

/**
 * Tải file Excel trực tiếp từ Backend API (Cho các báo cáo lớn).
 * @param endpoint - Đường dẫn API (vd: '/ticketing/access-logs/export')
 * @param params - Query parameters (vd: { fromDate: '...', toDate: '...' })
 * @param fallbackFileName - Tên file mặc định nếu không parse được từ header
 */
export const downloadExcelFromApi = async (
  endpoint: string,
  params: Record<string, any>,
  fallbackFileName: string
): Promise<void> => {
  try {
    const query = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${endpoint}${query ? `?${query}` : ''}`;
    
    const token = localStorage.getItem('hpticket_token');
    const headers: HeadersInit = {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorMsg = 'Lỗi khi tải file từ API';
      try {
        const errorData = await response.json();
        if (errorData.message) errorMsg = errorData.message;
      } catch (e) {}
      throw new Error(errorMsg);
    }

    const blob = await response.blob();

    // Lấy tên file từ header Content-Disposition nếu có
    const contentDisposition = response.headers.get('content-disposition');
    let fileName = fallbackFileName;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        fileName = match[1];
      }
    }

    // Tạo link ảo để download
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    console.error('Lỗi khi tải file từ API:', error);
    throw error;
  }
};
