import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { apiLogin, apiMe, apiLogout } from '../services/api';

const DEMO = {
  'admin@chayilsecurex.com':   { password:'Admin@2024!',   role:'admin',   name:'Seth Odoi Asare' },
  'analyst@chayilsecurex.com': { password:'Analyst@2024!', role:'analyst', name:'Kwame Analyst' },
  'client@chayilsecurex.com':  { password:'Client@2024!',  role:'client',  name:'Abena Client' },
};

export const useAuth = create((set) => ({
  user:    null,
  token:   null,
  loading: true,
  error:   null,

  init: async () => {
    try {
      const token = await SecureStore.getItemAsync('csx_token');
      if (token) {
        try {
          const { data } = await apiMe();
          set({ user: data.user, token, loading: false });
          return;
        } catch {}
      }
    } catch {}
    set({ loading: false });
  },

  login: async (email, password) => {
    set({ error: null });
    const em = email.trim().toLowerCase();

    // Try real backend
    try {
      const { data } = await apiLogin(em, password);
      await SecureStore.setItemAsync('csx_token', data.token);
      set({ user: data.user, token: data.token, error: null });
      return data.user;
    } catch (err) {
      // Demo fallback
      const demo = DEMO[em];
      if (demo && demo.password === password) {
        const demoUser = { id:'demo', name: demo.name, email: em, role: demo.role, org_id:'1', org_name:'Chayil SecureX' };
        await SecureStore.setItemAsync('csx_token', 'demo').catch(() => {});
        set({ user: demoUser, token: 'demo', error: null });
        return demoUser;
      }
      const msg = err.response?.data?.error || 'Invalid email or password';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('csx_token').catch(() => {});
    try { await apiLogout(); } catch {}
    set({ user: null, token: null, error: null });
  },

  clearError: () => set({ error: null }),
}));
