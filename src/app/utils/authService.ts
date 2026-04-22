// Authentication Service
// Handles user login, signup, and session management

import { supabase } from './supabaseClient';

export interface User {
  id: string;
  email: string;
  name?: string;
}

// Sign up a new user
export const signUp = async (email: string, password: string, name: string) => {
  try {
    // First, sign up the user with Supabase client (creates account)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        },
        emailRedirectTo: undefined, // No email confirmation
      }
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return { success: false, error: signUpError.message };
    }

    console.log('✅ User signed up successfully:', signUpData.user?.id);

    // Automatically sign in after signup
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Auto sign-in error:', signInError);
      return { success: false, error: signInError.message };
    }

    // Store session info
    if (signInData.session) {
      localStorage.setItem('motopsy_access_token', signInData.session.access_token);
      localStorage.setItem('motopsy_refresh_token', signInData.session.refresh_token);
      localStorage.setItem('motopsy_user', JSON.stringify({
        id: signInData.user.id,
        email: signInData.user.email,
        name: signInData.user.user_metadata?.name,
      }));
    }

    return { 
      success: true, 
      user: signInData.user,
      session: signInData.session
    };
  } catch (error: any) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message || 'Sign up failed' };
  }
};

// Sign in existing user
export const signIn = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting to sign in:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      return { success: false, error: error.message };
    }

    if (!data.session || !data.user) {
      console.error('❌ No session or user returned');
      return { success: false, error: 'Authentication failed - no session' };
    }

    console.log('✅ Sign in successful!');
    console.log('User ID:', data.user.id);
    console.log('Access token length:', data.session.access_token.length);

    // Store session info in localStorage
    localStorage.setItem('motopsy_access_token', data.session.access_token);
    localStorage.setItem('motopsy_refresh_token', data.session.refresh_token);
    localStorage.setItem('motopsy_user', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
    }));

    console.log('✅ Session stored in localStorage');

    return { 
      success: true, 
      user: data.user,
      session: data.session,
    };
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    return { success: false, error: error.message || 'Sign in failed' };
  }
};

// Sign out
export const signOut = () => {
  localStorage.removeItem('motopsy_access_token');
  localStorage.removeItem('motopsy_refresh_token');
  localStorage.removeItem('motopsy_user');
  
  // Also sign out from Supabase
  supabase.auth.signOut();
  
  // Reload to login page
  window.location.reload();
};

// Get stored access token
export const getAccessToken = (): string | null => {
  return localStorage.getItem('motopsy_access_token');
};

// Get current user from localStorage
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('motopsy_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !!getCurrentUser();
};

// Validate session with server
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error || !data.session) {
      console.log('Session validation failed, clearing local storage');
      signOut();
      return false;
    }

    // Update stored token if it changed
    if (data.session.access_token !== getAccessToken()) {
      localStorage.setItem('motopsy_access_token', data.session.access_token);
      localStorage.setItem('motopsy_refresh_token', data.session.refresh_token);
    }

    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};