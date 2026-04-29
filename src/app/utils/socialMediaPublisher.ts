// Social Media Publisher - Real API Integration
// Publishes posts to Facebook, Instagram, LinkedIn, YouTube, and Twitter

import { uploadImageToPublicHost, isValidHttpUrl } from './imageUploader';
import { API_BASE_URL, API_ORIGIN } from './apiConfig';
import { getAccessToken } from './authService';
import { loadAPIKeys } from './apiService';
import { refreshConnectedPageTokens } from './facebookService';

// Detects "this page token is no longer valid" errors from the Graph API.
// IMPORTANT: do NOT match the generic word "invalid" — Facebook also uses it
// for things like "Missing or invalid image file", which is NOT a token issue.
// Stay strict: only canonical OAuth/token errors should match here.
const isFbAuthExpired = (result: any): boolean => {
  const e = result?.error || {};
  if (e.code === 190) return true;
  if (e.type === 'OAuthException' && [102, 458, 459, 460, 463, 464, 467].includes(e.code))
    return true;
  if (typeof e.message === 'string') {
    return /\b(token|session)\b.{0,40}\b(expired|invalid|revoked)\b/i.test(e.message);
  }
  return false;
};

// Tries to refresh the page access tokens stored in our backend using the
// user's saved FB user token. Returns the fresh access_token for the given
// pageId if we managed to get one, or null otherwise.
const tryRefreshFacebookPageToken = async (pageId: string): Promise<string | null> => {
  try {
    const apiKeys = await loadAPIKeys();
    const userToken = apiKeys?.facebookAccessToken?.trim();
    if (!userToken) return null;
    const { pages } = await refreshConnectedPageTokens(userToken);
    const page = pages.find((p: any) => p.pageId === pageId);
    return page?.pageAccessToken || null;
  } catch (err) {
    console.warn('[publisher] refresh tokens failed:', err);
    return null;
  }
};

// Social platforms can't reach our backend's localhost URLs. If the image
// lives on our own server, ask the backend to re-upload it to a public host
// (ImgBB) and swap the URL before publishing.
const toPubliclyReachableUrl = async (url?: string): Promise<string | undefined> => {
  if (!url) return url;
  const needsProxy =
    url.startsWith(API_ORIGIN) ||
    /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\//i.test(url) ||
    /^https?:\/\/[^/]+\.(?:local|lan|internal)(?::\d+)?\//i.test(url);
  if (!needsProxy) return url;

  try {
    const token = getAccessToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/expose-public`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.publicUrl) {
      console.log('[publisher] exposed', url, '→', data.publicUrl);
      return data.publicUrl;
    }
    console.warn('[publisher] expose-public failed:', data);
  } catch (err) {
    console.warn('[publisher] expose-public error:', err);
  }
  return url; // best effort; FB will still reject but at least we tried
};

interface PublishPostData {
  caption: string;
  imageUrl?: string;
  imageFile?: File;
  platforms: string[];
  scheduledTime?: Date;
}

interface PublishResult {
  platform: string;
  success: boolean;
  postUrl?: string;
  error?: string;
  postId?: string;
}

// Get stored access tokens and connection data
const getConnectionData = (platform: string, platformId?: string) => {
  // For Facebook, get the specific page's access token
  if (platform === 'facebook' && platformId) {
    const facebookPages = JSON.parse(localStorage.getItem('motopsy_facebook_pages') || '[]');
    const page = facebookPages.find((p: any) => p.pageId === platformId);
    if (page) {
      return {
        connected: true,
        pageId: page.pageId,
        pageName: page.pageName,
        accessToken: page.pageAccessToken,
      };
    }
  }

  // Fallback to old structure
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  return connections[platform] || null;
};

// ============================================
// FACEBOOK POSTING
// ============================================
//
// STRATEGY: page access tokens that come out of /me/accounts are short-lived
// when the user token is short-lived. Instead of trusting whatever is sitting
// in localStorage, we always start by ASKING Facebook for a fresh page token
// via the user token — this is one cheap HTTP call and removes the entire
// "stale token" class of failures. We persist the fresh token on the way
// through so the connected-pages list in Settings stays accurate.
const fetchFreshPageToken = async (
  pageId: string
): Promise<{ token: string } | { error: string }> => {
  const apiKeys = await loadAPIKeys();
  const userToken = (apiKeys?.facebookAccessToken || '').trim();
  if (!userToken) {
    return {
      error:
        'No Facebook user access token saved. Open Settings → API Keys, paste a token, click Save.',
    };
  }
  try {
    const r = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(
        userToken
      )}`
    );
    const body: any = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (body?.error?.code === 190) {
        return {
          error:
            'Your Facebook user access token in Settings → API Keys is expired. ' +
            'Replace it with a fresh token from Graph API Explorer (with pages_show_list, pages_read_engagement, pages_manage_posts), Save, then try again.',
        };
      }
      return { error: body?.error?.message || `Facebook returned HTTP ${r.status}` };
    }
    const page = (body?.data || []).find((p: any) => p.id === pageId);
    if (!page) {
      return {
        error:
          `This Facebook user does not own / admin page ${pageId}. ` +
          'Open Settings → Social Media → Fetch My Pages and pick a page you actually administer.',
      };
    }

    // Persist the fresh token so other places (UI status, future calls) see it.
    refreshConnectedPageTokens(userToken).catch((e) =>
      console.warn('[publisher] background refresh persist failed:', e)
    );

    return { token: page.access_token };
  } catch (err: any) {
    return { error: err.message || 'Network error talking to Facebook' };
  }
};

const postToFacebook = async (data: PublishPostData, platformId: string): Promise<PublishResult> => {
  // Extract page ID from platformId (e.g., "facebook-123456" -> "123456")
  const pageId = platformId.replace('facebook-', '');

  const connection = getConnectionData('facebook', pageId);
  if (!connection || !connection.connected) {
    return {
      platform: 'Facebook',
      success: false,
      error: 'Facebook page not connected. Open Settings → Social Media and connect a page.',
    };
  }

  // Always pull a fresh page access token before posting — eliminates the
  // entire "stored token has expired" failure mode.
  const tokenResult = await fetchFreshPageToken(pageId);
  if ('error' in tokenResult) {
    return { platform: 'Facebook', success: false, error: tokenResult.error };
  }
  const accessToken = tokenResult.token;
  console.log('[publisher] using freshly-minted page token for', pageId);

  try {

    // If image is provided, upload to Imgur first to get a public URL
    let publicImageUrl = data.imageUrl;
    
    // Only upload if we have a file AND the imageUrl is not already a valid HTTP URL
    if (data.imageFile && (!data.imageUrl || !isValidHttpUrl(data.imageUrl))) {
      console.log('Uploading image to public host...');
      try {
        publicImageUrl = await uploadImageToPublicHost(data.imageFile);
        console.log('✅ Image uploaded to:', publicImageUrl);
      } catch (uploadError: any) {
        console.error('❌ Image upload failed:', uploadError);
        return {
          platform: 'Facebook',
          success: false,
          error: `Image upload failed: ${uploadError.message}. Please try using "Use Image URL" instead and paste a direct image URL.`,
        };
      }
    } else if (data.imageUrl && isValidHttpUrl(data.imageUrl)) {
      // Image URL is already valid, use it directly
      console.log('✅ Using provided image URL:', data.imageUrl);
      publicImageUrl = data.imageUrl;
    } else if (data.imageUrl && !isValidHttpUrl(data.imageUrl)) {
      // If imageUrl is a base64 data URL, we can't use it directly
      return {
        platform: 'Facebook',
        success: false,
        error: 'Image must be uploaded as a file or be a valid HTTP URL. Please use "Use Image URL" and paste a direct image link.',
      };
    }

    // Facebook Graph API endpoint
    const endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`;

    const body: any = {
      message: data.caption,
      access_token: accessToken,
    };

    // If image is provided, upload to photos endpoint instead
    if (publicImageUrl) {
      const photoEndpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`;

      // STRATEGY: read the image as a Blob (works for localhost backend AND
      // any remote URL the browser can fetch) and stream the bytes directly
      // to Facebook's photo endpoint via multipart `source`. Facebook never
      // has to fetch a URL — eliminates the "Missing or invalid image file"
      // failure mode caused by localhost / temporary host URLs.
      let imageBlob: Blob | null = null;
      try {
        const fetchRes = await fetch(publicImageUrl);
        if (fetchRes.ok) imageBlob = await fetchRes.blob();
      } catch (e) {
        console.warn('[publisher] could not load image as blob, falling back to url=', e);
      }

      const callPhotosApi = async (token: string) => {
        if (imageBlob) {
          // Multipart upload — bytes go straight to FB.
          const form = new FormData();
          form.append('source', imageBlob, 'post-image.png');
          form.append('caption', data.caption);
          form.append('access_token', token);
          return fetch(photoEndpoint, { method: 'POST', body: form });
        }
        // Fallback: tell FB to fetch the URL (legacy path).
        return fetch(photoEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: publicImageUrl,
            caption: data.caption,
            access_token: token,
          }),
        });
      };

      let response = await callPhotosApi(accessToken);
      let result = await response.json();

      // Token expired? Try refreshing once using the saved user token.
      if (!response.ok && isFbAuthExpired(result)) {
        console.warn('[publisher] FB token expired — attempting one-shot refresh');
        const fresh = await tryRefreshFacebookPageToken(pageId);
        if (fresh) {
          console.log('[publisher] got fresh page token, retrying publish');
          response = await callPhotosApi(fresh);
          result = await response.json();
        }
      }

      if (response.ok && result.id) {
        return {
          platform: 'Facebook',
          success: true,
          postId: result.id,
          postUrl: `https://www.facebook.com/${result.id}`,
        };
      }
      if (isFbAuthExpired(result)) {
        throw new Error(
          'Facebook access token has expired and could not be auto-refreshed. ' +
            'Please update your Facebook Access Token in Settings → API Keys, ' +
            'then click "Fetch My Pages" once to refresh page tokens.'
        );
      }
      throw new Error(result.error?.message || 'Failed to post to Facebook');
    } else {
      // Text-only post
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        return {
          platform: 'Facebook',
          success: true,
          postId: result.id,
          postUrl: `https://www.facebook.com/${result.id}`,
        };
      } else {
        // Check if it's a token expiration error
        if (result.error?.code === 190 || result.error?.message?.includes('expired')) {
          throw new Error('Facebook access token has expired. Please reconnect your Facebook account in Settings → Social Media Connections.');
        }
        throw new Error(result.error?.message || 'Failed to post to Facebook');
      }
    }
  } catch (error: any) {
    console.error('Facebook posting error:', error);
    return {
      platform: 'Facebook',
      success: false,
      error: error.message || 'Failed to post to Facebook',
    };
  }
};

// ============================================
// INSTAGRAM POSTING
// ============================================
const postToInstagram = async (data: PublishPostData): Promise<PublishResult> => {
  const connection = getConnectionData('instagram');
  
  if (!connection || !connection.connected || !connection.accessToken) {
    return {
      platform: 'Instagram',
      success: false,
      error: 'Instagram account not connected. Please connect in Settings.',
    };
  }

  try {
    const accessToken = connection.accessToken;
    const igUserId = connection.userId || connection.username;

    // Instagram requires an image URL
    if (!data.imageUrl) {
      throw new Error('Instagram posts require an image');
    }

    // Step 1: Create media container
    const containerEndpoint = `https://graph.facebook.com/v18.0/${igUserId}/media`;
    
    const containerResponse = await fetch(containerEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: data.imageUrl,
        caption: data.caption,
        access_token: accessToken,
      }),
    });

    const containerResult = await containerResponse.json();

    if (!containerResponse.ok || !containerResult.id) {
      throw new Error(containerResult.error?.message || 'Failed to create Instagram media container');
    }

    // Step 2: Publish the container
    const publishEndpoint = `https://graph.facebook.com/v18.0/${igUserId}/media_publish`;
    
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        creation_id: containerResult.id,
        access_token: accessToken,
      }),
    });

    const publishResult = await publishResponse.json();

    if (publishResponse.ok && publishResult.id) {
      return {
        platform: 'Instagram',
        success: true,
        postId: publishResult.id,
        postUrl: `https://www.instagram.com/p/${publishResult.id}`,
      };
    } else {
      throw new Error(publishResult.error?.message || 'Failed to publish to Instagram');
    }
  } catch (error: any) {
    console.error('Instagram posting error:', error);
    return {
      platform: 'Instagram',
      success: false,
      error: error.message || 'Failed to post to Instagram',
    };
  }
};

// ============================================
// LINKEDIN POSTING
// ============================================
const postToLinkedIn = async (data: PublishPostData): Promise<PublishResult> => {
  const connection = getConnectionData('linkedin');
  
  if (!connection || !connection.connected || !connection.accessToken) {
    return {
      platform: 'LinkedIn',
      success: false,
      error: 'LinkedIn account not connected. Please connect in Settings.',
    };
  }

  try {
    const accessToken = connection.accessToken;
    const authorUrn = connection.authorUrn || 'urn:li:person:AUTHOR_ID'; // Get from user profile

    const endpoint = 'https://api.linkedin.com/v2/ugcPosts';

    const postData: any = {
      author: authorUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: data.caption,
          },
          shareMediaCategory: data.imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    // If image is provided, add media
    if (data.imageUrl) {
      postData.specificContent['com.linkedin.ugc.ShareContent'].media = [
        {
          status: 'READY',
          description: {
            text: data.caption,
          },
          media: data.imageUrl,
          title: {
            text: 'Post Image',
          },
        },
      ];
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(postData),
    });

    const result = await response.json();

    if (response.ok && result.id) {
      return {
        platform: 'LinkedIn',
        success: true,
        postId: result.id,
        postUrl: `https://www.linkedin.com/feed/update/${result.id}`,
      };
    } else {
      throw new Error(result.message || 'Failed to post to LinkedIn');
    }
  } catch (error: any) {
    console.error('LinkedIn posting error:', error);
    return {
      platform: 'LinkedIn',
      success: false,
      error: error.message || 'Failed to post to LinkedIn',
    };
  }
};

// ============================================
// TWITTER/X POSTING
// ============================================
const postToTwitter = async (data: PublishPostData): Promise<PublishResult> => {
  const connection = getConnectionData('twitter');
  
  if (!connection || !connection.connected || !connection.accessToken) {
    return {
      platform: 'Twitter',
      success: false,
      error: 'Twitter account not connected. Please connect in Settings.',
    };
  }

  try {
    const accessToken = connection.accessToken;

    // Twitter API v2 endpoint
    const endpoint = 'https://api.twitter.com/2/tweets';

    const tweetData: any = {
      text: data.caption,
    };

    // Note: Twitter image upload requires separate media upload endpoint
    // This is a simplified version
    if (data.imageUrl) {
      // Would need to first upload media to Twitter's media endpoint
      // Then attach the media_id to the tweet
      console.warn('Twitter image upload requires additional media upload step');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tweetData),
    });

    const result = await response.json();

    if (response.ok && result.data?.id) {
      const username = connection.username?.replace('@', '') || 'user';
      return {
        platform: 'Twitter',
        success: true,
        postId: result.data.id,
        postUrl: `https://twitter.com/${username}/status/${result.data.id}`,
      };
    } else {
      throw new Error(result.errors?.[0]?.message || 'Failed to post to Twitter');
    }
  } catch (error: any) {
    console.error('Twitter posting error:', error);
    return {
      platform: 'Twitter',
      success: false,
      error: error.message || 'Failed to post to Twitter',
    };
  }
};

// ============================================
// YOUTUBE POSTING (Community Post)
// ============================================
const postToYouTube = async (data: PublishPostData): Promise<PublishResult> => {
  const connection = getConnectionData('youtube');
  
  if (!connection || !connection.connected || !connection.accessToken) {
    return {
      platform: 'YouTube',
      success: false,
      error: 'YouTube account not connected. Please connect in Settings.',
    };
  }

  try {
    // YouTube Community Posts API
    const accessToken = connection.accessToken;
    const channelId = connection.channelId;

    // Note: YouTube Community Posts require special API access
    // This is a placeholder for the actual implementation
    console.warn('YouTube Community Post API requires special access');

    return {
      platform: 'YouTube',
      success: false,
      error: 'YouTube Community Posts require YouTube Partner Program access. Please use YouTube Studio to post manually.',
    };
  } catch (error: any) {
    console.error('YouTube posting error:', error);
    return {
      platform: 'YouTube',
      success: false,
      error: error.message || 'Failed to post to YouTube',
    };
  }
};

// ============================================
// MAIN PUBLISH FUNCTION
// ============================================
export const publishToSocialMedia = async (data: PublishPostData): Promise<PublishResult[]> => {
  const results: PublishResult[] = [];

  // Upload image to hosting if file is provided
  let imageUrl = data.imageUrl;
  if (data.imageFile && !imageUrl) {
    try {
      imageUrl = await uploadImageToPublicHost(data.imageFile);
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  }

  // Note: Facebook now receives image *bytes* directly via multipart upload
  // (see postToFacebook), so no rehost is needed for FB. Instagram & LinkedIn
  // still expect a publicly-fetchable URL, so we only rehost in that case.
  const needsPublicUrl = data.platforms.some((p) =>
    /^(instagram|linkedin)/i.test(p)
  );
  if (needsPublicUrl) {
    imageUrl = await toPubliclyReachableUrl(imageUrl);
  }

  const publishData = { ...data, imageUrl };

  // Publish to each selected platform
  const publishPromises = data.platforms.map(async (platformId) => {
    // Extract platform name from ID (e.g., "facebook-123456" -> "facebook")
    const platform = platformId.split('-')[0].toLowerCase();

    switch (platform) {
      case 'facebook':
        return await postToFacebook(publishData, platformId);
      
      case 'instagram':
        return await postToInstagram(publishData);
      
      case 'linkedin':
        return await postToLinkedIn(publishData);
      
      case 'twitter':
        return await postToTwitter(publishData);
      
      case 'youtube':
        return await postToYouTube(publishData);
      
      default:
        return {
          platform: platform,
          success: false,
          error: 'Unknown platform',
        };
    }
  });

  // Wait for all platforms to finish
  const publishResults = await Promise.allSettled(publishPromises);

  publishResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      results.push({
        platform: 'Unknown',
        success: false,
        error: result.reason?.message || 'Failed to publish',
      });
    }
  });

  return results;
};

// Helper function to validate post data
export const validatePostData = (data: PublishPostData): { valid: boolean; error?: string } => {
  if (!data.caption || data.caption.trim().length === 0) {
    return { valid: false, error: 'Caption is required' };
  }

  if (!data.platforms || data.platforms.length === 0) {
    return { valid: false, error: 'Please select at least one platform' };
  }

  // Instagram requires image
  const hasInstagram = data.platforms.some(p => p.includes('instagram'));
  if (hasInstagram && !data.imageUrl && !data.imageFile) {
    return { valid: false, error: 'Instagram posts require an image' };
  }

  return { valid: true };
};

// Save post to history
export const savePostToHistory = (data: PublishPostData, results: PublishResult[]) => {
  const history = JSON.parse(localStorage.getItem('post_history') || '[]');
  
  const post = {
    id: Date.now().toString(),
    caption: data.caption,
    imageUrl: data.imageUrl,
    platforms: data.platforms,
    results: results,
    publishedAt: new Date().toISOString(),
  };

  history.unshift(post);
  
  // Keep only last 50 posts
  if (history.length > 50) {
    history.splice(50);
  }

  localStorage.setItem('post_history', JSON.stringify(history));
};