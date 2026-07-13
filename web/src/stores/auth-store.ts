import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: number;
  email: string;
  nickname: string;
}

interface AuthState {
  auth: {
    user: AuthUser | null;
    token: string | null;
  };
  setUser: (user: AuthUser, token: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      auth: {
        user: null,
        token: null,
      },
      setUser: (user, token) => set({ auth: { user, token } }),
      reset: () => set({ auth: { user: null, token: null } }),
    }),
    {
      name: 'auth-storage',
    },
  ),
);
