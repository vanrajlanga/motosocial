// Authentication Service — talks to local Node.js/MySQL backend via REST.
// Tokens are JWTs issued by the backend and stored in localStorage.

import { API_BASE_URL } from './apiConfig';

export interface User {
  id: string;
  email: string;
  name?: string;
}

const ACCESS_KEY = 'motopsy_access_token';
const REFRESH_KEY = 'motopsy_refresh_token';
const USER_KEY = 'motopsy_user';

// --- Sign up ---
export const signUp = async (email: string, password: string, name: string) => {
  try {
    const signupRes = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const signupData = await signupRes.json();

    if (!signupRes.ok || signupData.success === false) {
      return { success: false, error: signupData.error || 'Sign up failed' };
    }

    // Auto sign in
    const signin = await signIn(email, password);
    return signin;
  } catch (err: any) {
    console.error('Sign up error:', err);
    return { success: false, error: err.message || 'Sign up failed' };
  }
};

// --- Sign in ---
export const signIn = async (email: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Invalid login credentials' };
    }

    const { session, user } = data;

    localStorage.setItem(ACCESS_KEY, session.access_token);
    localStorage.setItem(REFRESH_KEY, session.refresh_token || session.access_token);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({ id: user.id, email: user.email, name: user.name })
    );

    return { success: true, user, session };
  } catch (err: any) {
    console.error('Sign in error:', err);
    return { success: false, error: err.message || 'Sign in failed' };
  }
};

// --- Sign out ---
export const signOut = () => {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.reload();
};

// --- Accessors ---
export const getAccessToken = (): string | null => localStorage.getItem(ACCESS_KEY);

export const getCurrentUser = (): User | null => {
  const s = localStorage.getItem(USER_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => !!getAccessToken() && !!getCurrentUser();

// --- Session validation ---
export const validateSession = async (): Promise<boolean> => {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      signOut();
      return false;
    }
    return true;
  } catch (err) {
    console.error('Session validation error:', err);
    return false;
  }
};
