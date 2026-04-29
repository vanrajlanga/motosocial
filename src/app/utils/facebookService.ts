// Facebook Graph API Service
// Fetches user's Facebook pages and manages connections

import { getAccessToken } from './authService';
import { API_BASE_URL as BACKEND_BASE } from './apiConfig';

const API_BASE_URL = BACKEND_BASE;

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category?: string;
  tasks?: string[];
}

interface FacebookPagesResponse {
  data: FacebookPage[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface ConnectedFacebookPage {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  category?: string;
  connectedAt: string;
}

// Cache for Facebook pages (to avoid repeated server calls)
let facebookPagesCache: ConnectedFacebookPage[] | null = null;

/**
 * Fetch all Facebook pages the user manages
 * @param userAccessToken - User's Facebook access token
 * @returns Array of Facebook pages
 */
export const fetchFacebookPages = async (userAccessToken: string): Promise<FacebookPage[]> => {
  try {
    if (!userAccessToken || userAccessToken.trim().length === 0) {
      throw new Error('Access token is required');
    }

    // Facebook Graph API endpoint to get user's pages
    const endpoint = `https://graph.facebook.com/v18.0/me/accounts?access_token=${userAccessToken}`;

    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to fetch pages: ${response.statusText}`);
    }

    const data: FacebookPagesResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      throw new Error('No Facebook pages found. Make sure you manage at least one Facebook page.');
    }

    return data.data;
  } catch (error: any) {
    console.error('Facebook API Error:', error);
    throw new Error(error.message || 'Failed to fetch Facebook pages');
  }
};

/**
 * Fetch user's basic info to validate token
 * @param userAccessToken - User's Facebook access token
 * @returns User info
 */
export const validateFacebookToken = async (userAccessToken: string): Promise<{ id: string; name: string }> => {
  try {
    const endpoint = `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${userAccessToken}`;
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid access token');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Token validation error:', error);
    throw new Error(error.message || 'Failed to validate token');
  }
};

/**
 * Get connected Facebook pages from cache or cloud
 */
export const getConnectedFacebookPages = (): ConnectedFacebookPage[] => {
  // Return cached pages if available
  if (facebookPagesCache) {
    return facebookPagesCache;
  }
  
  // Fallback to localStorage for backwards compatibility
  const saved = localStorage.getItem('motopsy_facebook_pages');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Error parsing saved Facebook pages:', error);
      return [];
    }
  }
  return [];
};

/**
 * Load Facebook pages from Supabase (async)
 */
export const loadFacebookPages = async (): Promise<ConnectedFacebookPage[]> => {
  const accessToken = getAccessToken();
  
  if (!accessToken) {
    console.warn('No access token available');
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/facebook-pages`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Update cache
      facebookPagesCache = data.pages || [];
      // Also save to localStorage for backwards compatibility
      if (facebookPagesCache.length > 0) {
        localStorage.setItem('motopsy_facebook_pages', JSON.stringify(facebookPagesCache));
      }
      return facebookPagesCache;
    } else {
      console.error('Failed to load Facebook pages:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error loading Facebook pages:', error);
    return [];
  }
};

/**
 * Save connected Facebook pages to localStorage
 */
export const saveConnectedFacebookPages = async (pages: ConnectedFacebookPage[]): Promise<boolean> => {
  const accessToken = getAccessToken();
  
  // Save to localStorage first for backwards compatibility
  localStorage.setItem('motopsy_facebook_pages', JSON.stringify(pages));
  
  // Also update the old social_connections format for backwards compatibility
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  connections.facebook = {
    connected: pages.length > 0,
    pages: pages,
    // Keep the first page as default for backwards compatibility
    pageId: pages.length > 0 ? pages[0].pageId : '',
    pageName: pages.length > 0 ? pages[0].pageName : '',
    accessToken: pages.length > 0 ? pages[0].pageAccessToken : '',
  };
  localStorage.setItem('motopsy_social_connections', JSON.stringify(connections));
  
  // Save to backend (MySQL). localStorage is only a UX cache on top of this.
  if (!accessToken) {
    console.warn('[fb-pages] no auth token — saving to localStorage only');
    facebookPagesCache = pages;
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/facebook-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pages }),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success) {
      facebookPagesCache = pages;
      console.log('[fb-pages] persisted to server, count =', pages.length);
      return true;
    }
    console.error('[fb-pages] server rejected save:', response.status, data);
    return false;
  } catch (error) {
    console.error('[fb-pages] network error during save:', error);
    return false;
  }
};

/**
 * Refresh stored page-access-tokens for already-connected pages, using a
 * USER access token. FB returns fresh page tokens here; we update the
 * matching entries in our connected list and persist. Returns the count
 * of pages that got a new token. Doesn't touch un-matched entries.
 */
export const refreshConnectedPageTokens = async (
  userAccessToken: string
): Promise<{ refreshed: number; pages: ConnectedFacebookPage[] }> => {
  if (!userAccessToken?.trim()) throw new Error('Facebook user access token is required');

  const fresh = await fetchFacebookPages(userAccessToken);
  const current = await loadFacebookPages();

  let refreshed = 0;
  const updated = current.map((p) => {
    const match = fresh.find((f) => f.id === p.pageId);
    if (match && match.access_token && match.access_token !== p.pageAccessToken) {
      refreshed += 1;
      return { ...p, pageAccessToken: match.access_token };
    }
    return p;
  });

  if (refreshed > 0) {
    const saved = await saveConnectedFacebookPages(updated);
    if (!saved) throw new Error('Failed to persist refreshed page tokens.');
  }
  return { refreshed, pages: updated };
};

/**
 * Connect a Facebook page. Returns the updated list (so callers don't have
 * to re-fetch from the server — that was racing against the in-flight save).
 * Throws if the backend save fails so the UI can surface the error.
 */
export const connectFacebookPage = async (
  page: FacebookPage
): Promise<ConnectedFacebookPage[]> => {
  // Always hydrate the current list from the server first, so we never clobber
  // pages that were connected on another device / session.
  const current = await loadFacebookPages();

  if (current.some((p) => p.pageId === page.id)) {
    throw new Error('This page is already connected');
  }

  const newPage: ConnectedFacebookPage = {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    category: page.category,
    connectedAt: new Date().toISOString(),
  };

  const updated = [...current, newPage];
  const saved = await saveConnectedFacebookPages(updated);
  if (!saved) {
    throw new Error(
      'Failed to persist connected page to server. Please check your login and try again.'
    );
  }
  return updated;
};

/**
 * Disconnect a Facebook page. Same persistence contract as connect.
 */
export const disconnectFacebookPage = async (
  pageId: string
): Promise<ConnectedFacebookPage[]> => {
  const current = await loadFacebookPages();
  const filtered = current.filter((p) => p.pageId !== pageId);
  const saved = await saveConnectedFacebookPages(filtered);
  if (!saved) {
    throw new Error(
      'Failed to persist disconnection to server. Please check your login and try again.'
    );
  }
  return filtered;
};

/**
 * Disconnect all Facebook pages
 */
export const disconnectAllFacebookPages = (): void => {
  localStorage.removeItem('motopsy_facebook_pages');
  
  // Update social_connections
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  connections.facebook = {
    connected: false,
    pages: [],
    pageId: '',
    pageName: '',
    accessToken: '',
  };
  localStorage.setItem('motopsy_social_connections', JSON.stringify(connections));
};