// Facebook Graph API Service
// Fetches user's Facebook pages and manages connections

import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getAccessToken } from './authService';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-782899ec`;

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
  
  // Save to Supabase cloud
  if (!accessToken) {
    console.warn('No access token available, saving to localStorage only');
    facebookPagesCache = pages;
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/user/facebook-pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ pages }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Update cache
      facebookPagesCache = pages;
      console.log('✅ Facebook pages saved to cloud successfully!');
      return true;
    } else {
      console.error('Failed to save Facebook pages:', data.error);
      return false;
    }
  } catch (error) {
    console.error('Error saving Facebook pages:', error);
    return false;
  }
};

/**
 * Connect a Facebook page
 */
export const connectFacebookPage = (page: FacebookPage): void => {
  const connectedPages = getConnectedFacebookPages();
  
  // Check if page is already connected
  const exists = connectedPages.some(p => p.pageId === page.id);
  if (exists) {
    throw new Error('This page is already connected');
  }

  const newPage: ConnectedFacebookPage = {
    pageId: page.id,
    pageName: page.name,
    pageAccessToken: page.access_token,
    category: page.category,
    connectedAt: new Date().toISOString(),
  };

  connectedPages.push(newPage);
  saveConnectedFacebookPages(connectedPages);
};

/**
 * Disconnect a Facebook page
 */
export const disconnectFacebookPage = (pageId: string): void => {
  const connectedPages = getConnectedFacebookPages();
  const filtered = connectedPages.filter(p => p.pageId !== pageId);
  saveConnectedFacebookPages(filtered);
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