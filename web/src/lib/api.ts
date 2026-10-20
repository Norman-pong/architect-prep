import axios from 'axios';
import { toast } from '@/components/ui/toast';

interface PersistedAuth {
  state?: {
    auth?: {
      token?: string;
    };
  };
}

/** Endpoints that are allowed to answer 401 as a normal "invalid credentials" result. */
const PUBLIC_AUTH_ENDPOINTS = ['/auth/send-code', '/auth/verify-login'];

function isPublicAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0] ?? '';
  return PUBLIC_AUTH_ENDPOINTS.some((endpoint) => path === endpoint || path.endsWith(endpoint));
}

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject token
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (
        parsed &&
        typeof parsed === 'object' &&
        'state' in parsed &&
        parsed.state &&
        typeof parsed.state === 'object' &&
        'auth' in parsed.state &&
        parsed.state.auth &&
        typeof parsed.state.auth === 'object' &&
        'token' in parsed.state.auth
      ) {
        const token = (parsed.state as PersistedAuth['state'])?.auth?.token;
        if (typeof token === 'string' && token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Response handling:
//  - 401 on public auth endpoints (send-code / verify-login) = invalid code, let the
//    login page render its inline banner; never clear the session or reload.
//  - 401 elsewhere = expired session; keep the existing hard redirect to /login.
//  - Network failure / timeout = one actionable toast.
//  - Other HTTP errors = generic toast (callers may still add specific messages).
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAxiosError = axios.isAxiosError(error);
    const status = isAxiosError ? error.response?.status : undefined;
    const url = isAxiosError ? error.config?.url : undefined;
    const method = (isAxiosError ? (error.config?.method ?? 'get') : 'get').toLowerCase();

    if (isPublicAuthRequest(url)) {
      // Login page owns feedback for all auth-endpoint failures (inline banner +
      // exactly one toast); the interceptor must not add a second toast or reload.
      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem('auth-storage');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Queries (GET) render a page/tile ErrorState with retry; a global toast on top
    // of it would duplicate the same failure (and can fire once per parallel query).
    if (method === 'get') {
      return Promise.reject(error);
    }

    if (isAxiosError && !error.response && !axios.isCancel(error)) {
      toast.error('网络异常，请检查网络后重试');
      return Promise.reject(error);
    }

    if (typeof status === 'number' && status >= 400) {
      toast.error('操作失败,请重试');
    }
    return Promise.reject(error);
  },
);
