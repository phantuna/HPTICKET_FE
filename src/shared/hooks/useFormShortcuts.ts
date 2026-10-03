import { useEffect } from 'react';

export interface UseFormShortcutsOptions {
  /**
   * Hàm thực thi khi ấn phím Enter (Lưu / Gửi form)
   */
  onSubmit?: ((e?: any) => void) | (() => Promise<void>);

  /**
   * Hàm thực thi khi ấn phím Escape (Đóng / Hủy)
   */
  onClose?: () => void;

  /**
   * Trạng thái modal / form có đang mở hay không
   */
  isOpen?: boolean;

  /**
   * Đang trong quá trình gọi API (đang lưu) -> Chặn submit trùng lặp
   */
  isSubmitting?: boolean;

  /**
   * Nút submit đang bị vô hiệu hóa
   */
  disabled?: boolean;

  /**
   * Bật/tắt tính năng Enter để submit (mặc định: true)
   */
  enableEnterSubmit?: boolean;
}

/**
 * Custom Hook toàn cục: Xử lý phím tắt chuẩn cho toàn bộ Cửa sổ khai báo / Form:
 * - Enter : Xác nhận gửi / Lưu thông tin trên form
 * - Escape: Đóng cửa sổ / Hủy bỏ
 * 
 * Đã tích hợp các quy tắc an toàn (Smart Guards):
 * - Không submit nhầm khi đang gõ xuống dòng trong <textarea> (chỉ submit nếu ấn Ctrl+Enter)
 * - Không submit nhầm khi đang ấn Enter trên nút phụ (Button type="button", ví dụ nút Hủy)
 * - Không submit nhầm khi đang thao tác chọn mục trong menu dropdown (role="listbox" / role="option")
 * - Chặn gửi đúp khi đang isSubmitting hoặc disabled
 */
export function useFormShortcuts({
  onSubmit,
  onClose,
  isOpen = true,
  isSubmitting = false,
  disabled = false,
  enableEnterSubmit = true,
}: UseFormShortcutsOptions) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Phím ESCAPE: Đóng cửa sổ khai báo
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      // 2. Phím ENTER: Xác nhận gửi / Lưu thông tin trên form
      if (e.key === 'Enter' && enableEnterSubmit && onSubmit) {
        // Chặn submit nếu form đang xử lý hoặc đang bị disable
        if (isSubmitting || disabled) return;

        const target = e.target as HTMLElement | null;

        // An toàn 1: Nếu đang gõ trong <textarea>, Enter là để xuống dòng!
        // (Chỉ submit nếu người dùng chủ động gõ tổ hợp Ctrl+Enter hoặc Cmd+Enter)
        if (target && target.tagName === 'TEXTAREA') {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onSubmit(e);
          }
          return;
        }

        // An toàn 2: Nếu đang bấm Enter trên một button phụ (ví dụ: nút Hủy, nút Xóa)
        if (target && target.tagName === 'BUTTON' && (target as HTMLButtonElement).type !== 'submit') {
          return;
        }

        // An toàn 3: Nếu đang mở danh sách dropdown / combobox
        if (
          target &&
          (target.getAttribute('role') === 'listbox' ||
            target.getAttribute('role') === 'option' ||
            target.closest('[role="listbox"]'))
        ) {
          return;
        }

        // Kích hoạt lưu form
        e.preventDefault();
        onSubmit(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, disabled, enableEnterSubmit, onSubmit, onClose]);
}
