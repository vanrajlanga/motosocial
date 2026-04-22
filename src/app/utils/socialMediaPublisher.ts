// Social Media Publisher - Real API Integration
// Publishes posts to Facebook, Instagram, LinkedIn, YouTube, and Twitter

import { uploadImageToPublicHost, isValidHttpUrl } from './imageUploader';

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
const postToFacebook = async (data: PublishPostData, platformId: string): Promise<PublishResult> => {
  // Extract page ID from platformId (e.g., "facebook-123456" -> "123456")
  const pageId = platformId.replace('facebook-', '');
  
  const connection = getConnectionData('facebook', pageId);
  
  if (!connection || !connection.connected || !connection.accessToken) {
    return {
      platform: 'Facebook',
      success: false,
      error: 'Facebook account not connected. Please connect in Settings.',
    };
  }

  try {
    const accessToken = connection.accessToken;

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
      
      const response = await fetch(photoEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: publicImageUrl,
          caption: data.caption,
          access_token: accessToken,
        }),
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