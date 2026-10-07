/**
 * TokenRefreshService — Dịch vụ quản lý phiên bản quyền và Token Demo
 * Trong chế độ Demo Showcase, tự động duy trì phiên Admin ổn định và an toàn,
 * không gửi request ra máy chủ thật.
 */

import { authState } from './authState';

const EXPIRES_AT_KEY = 'hpticket_token_expires_at';

export const tokenRefreshService = {
  start(expiresInSeconds: number, initialToken: string): void {
    authState.setToken(initialToken || 'MOCK_JWT_DEMO_TOKEN');
    const expiresAt = Date.now() + (expiresInSeconds || 86400) * 1000;
    localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));
  },

  async resume(): Promise<boolean> {
    const username = localStorage.getItem('hpticket_username') || 'admin';
    localStorage.setItem('hpticket_username', username);
    localStorage.setItem('hpticket_role', 'ADMIN');
    authState.setToken('MOCK_JWT_DEMO_TOKEN');
    return true;
  },

  stop(): void {
    authState.clearToken();
  },

  async doRefresh(): Promise<'SUCCESS' | 'EXPIRED' | 'ERROR'> {
    authState.setToken('MOCK_JWT_DEMO_TOKEN');
    return 'SUCCESS';
  },
};
