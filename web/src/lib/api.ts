import axios from 'axios';

interface PersistedAuth {
  state?: {
    auth?: {
      token?: string;
    };
  };
}

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
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

// Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);
