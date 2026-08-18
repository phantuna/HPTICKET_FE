export const toast = {
  success: (message: string, title: string = 'Thành công') => {
    window.dispatchEvent(new CustomEvent('toast_notification', { detail: { message, title, type: 'success' } }));
  },
  error: (message: string, title: string = 'Thất bại') => {
    window.dispatchEvent(new CustomEvent('toast_notification', { detail: { message, title, type: 'error' } }));
  },
  info: (message: string, title: string = 'Thông báo') => {
    window.dispatchEvent(new CustomEvent('toast_notification', { detail: { message, title, type: 'success' } }));
  }
};
