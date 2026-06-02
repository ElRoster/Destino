import { create } from 'zustand';
import type { UserDTO } from '@tarot-platform/shared-types';

interface StoreState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  balance: number;
  setAuth: (user: UserDTO, access: string, refresh: string) => void;
  clearAuth: () => void;
  setBalance: (balance: number) => void;
}

const readStoredUser = (): UserDTO | null => {
  let storedUser: string | null = null;

  try {
    storedUser = localStorage.getItem('user');
  } catch {
    return null;
  }

  if (!storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as Partial<UserDTO>;

    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.email || !parsed.role) {
      throw new Error('Invalid stored user');
    }

    return parsed as UserDTO;
  } catch {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } catch {
      // Ignore storage cleanup failures; rendering should continue.
    }
    return null;
  }
};

const readStoredToken = (key: 'accessToken' | 'refreshToken') => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const useStore = create<StoreState>((set) => ({
  user: readStoredUser(),
  accessToken: readStoredToken('accessToken'),
  refreshToken: readStoredToken('refreshToken'),
  balance: 0.00,

  setAuth: (user, access, refresh) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    set({ user, accessToken: access, refreshToken: refresh });
  },

  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null, balance: 0.00 });
  },

  setBalance: (balance) => set({ balance }),
}));
