import * as XLSX from 'xlsx';
import { API_BASE_URL } from '../../../api/apiConfig';

/**
 * Xuất dữ liệu ra file Excel (.xlsx) và trigger download về máy.
 * @param headers - Mảng tên cột (hàng tiêu đề, sẽ được in đậm + nền xám)
 * @param rows    - Mảng các hàng dữ liệu (mỗi phần tử là 1 hàng)
 * @param fileName - Tên file xuất ra (không cần đuôi .xlsx)
 */
export const downloadExcelFromJsonApi = async (
  headers: string[],
  rows: (string | number | null | undefined)[][],
  fileName: string
): Promise<void> => {
  try {
    const url = `${API_BASE_URL}/system/exports/generate-from-json`;
    const token = localStorage.getItem('hpticket_token');
    
    // Map rows to strings for the DTO
    const stringRows = rows.map(r => r.map(c => c !== null && c !== undefined ? String(c) : ""));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        fileName: fileName,
        headers: headers,
        rows: stringRows
      })
    });

    if (!response.ok) {
      throw new Error('Lỗi khi xuất file từ Server');
    }

    const blob = await response.blob();
    const safeFileName = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', safeFileName);
    document.body.appendChild(link);
    link.click();
    
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Lỗi khi xuất file qua API:', error);
    throw error;
  }
};

export const exportToExcel = (
  headers: string[],
  rows: (string | number | null | undefined)[][],
  fileName: string
): void => {
  // Thay vì xuất nội bộ bằng trình duyệt, gọi API để nhờ Java Backend 
  // chèn Logo và định dạng y như Báo Cáo Hệ Thống (đảm bảo đồng nhất giao diện 100%).
  downloadExcelFromJsonApi(headers, rows, fileName)
    .catch(err => {
      // Fallback fallback error
      console.error(err);
    });
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
