// LEGACY SHIM — the backend has been migrated from Supabase to a local
// Node.js + MySQL server. This file used to export a Supabase client; it
// now exports a tiny compatibility stub so any remaining `supabase.auth.*`
// call sites don't crash at import time. All real auth now goes through
// `authService.ts` → REST → backend.

import { getAccessToken, getCurrentUser, signOut as localSignOut } from './authService';

const notSupported = (name: string) => {
  throw new Error(
    `supabase.${name}() is no longer available — backend migrated to MySQL/Node. ` +
      `Use authService / apiService helpers instead.`
  );
};

export const supabase = {
  auth: {
    getSession: async () => {
      const token = getAccessToken();
      const user = getCurrentUser();
      if (!token || !user) return { data: { session: null }, error: null };
      return {
        data: {
          session: {
            access_token: token,
            refresh_token: token,
            user: { id: user.id, email: user.email, user_metadata: { name: user.name } },
          },
        },
        error: null,
      };
    },
    getUser: async () => {
      const user = getCurrentUser();
      return { data: { user }, error: user ? null : { message: 'Not signed in' } };
    },
    signInWithPassword: async () => notSupported('auth.signInWithPassword'),
    signUp: async () => notSupported('auth.signUp'),
    signOut: async () => {
      localSignOut();
      return { error: null };
    },
  },
  storage: {
    from: () => ({
      upload: async () => notSupported('storage.upload'),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
};
