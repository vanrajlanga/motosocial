// OAuth Service for Social Media Platforms
// Handles real OAuth connections for Facebook, Instagram, LinkedIn, YouTube, and Twitter

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
}

// OAuth Configuration for each platform
// NOTE: Replace these Client IDs with your actual App IDs from each platform's developer console
const OAUTH_CONFIGS = {
  facebook: {
    clientId: 'YOUR_FACEBOOK_APP_ID', // Replace with your Facebook App ID
    redirectUri: `${window.location.origin}/settings`,
    scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  instagram: {
    // Instagram uses Facebook's OAuth (Instagram is owned by Meta)
    clientId: 'YOUR_FACEBOOK_APP_ID', // Same as Facebook
    redirectUri: `${window.location.origin}/settings`,
    scope: 'instagram_basic,instagram_content_publish,pages_show_list',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
  },
  linkedin: {
    clientId: 'YOUR_LINKEDIN_CLIENT_ID', // Replace with your LinkedIn Client ID
    redirectUri: `${window.location.origin}/settings`,
    scope: 'w_member_social,r_basicprofile',
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  },
  youtube: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID', // Replace with your Google Client ID
    redirectUri: `${window.location.origin}/settings`,
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  twitter: {
    clientId: 'YOUR_TWITTER_CLIENT_ID', // Replace with your Twitter Client ID
    redirectUri: `${window.location.origin}/settings`,
    scope: 'tweet.read tweet.write users.read',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
  },
};

// Initiate OAuth flow for a platform
export const initiateOAuth = (platform: keyof typeof OAUTH_CONFIGS): void => {
  const config = OAUTH_CONFIGS[platform];
  
  // Check if client ID is configured
  if (config.clientId.startsWith('YOUR_')) {
    // Show setup instructions
    showSetupInstructions(platform);
    return;
  }

  // Build OAuth URL
  const state = generateRandomState();
  localStorage.setItem('oauth_state', state);
  localStorage.setItem('oauth_platform', platform);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: 'token', // Use implicit flow for client-side
    state: state,
  });

  const authUrl = `${config.authUrl}?${params.toString()}`;
  
  // Open OAuth popup
  const popup = window.open(
    authUrl,
    'oauth-popup',
    'width=600,height=700,left=200,top=100'
  );

  // Listen for OAuth callback
  window.addEventListener('message', handleOAuthCallback);
};

// Generate random state for CSRF protection
const generateRandomState = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Handle OAuth callback
const handleOAuthCallback = (event: MessageEvent) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) return;

  if (event.data.type === 'oauth-success') {
    const { platform, accessToken } = event.data;
    
    // Save the access token
    saveAccessToken(platform, accessToken);
    
    // Update connection status
    updateConnectionStatus(platform, true, accessToken);
    
    alert(`✅ Successfully connected to ${platform}!`);
  }
};

// Save access token securely
const saveAccessToken = (platform: string, token: string): void => {
  const tokens = JSON.parse(localStorage.getItem('social_tokens') || '{}');
  tokens[platform] = token;
  localStorage.setItem('social_tokens', JSON.stringify(tokens));
};

// Update connection status
const updateConnectionStatus = (platform: string, connected: boolean, token?: string): void => {
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  
  if (connected && token) {
    connections[platform] = {
      connected: true,
      accessToken: token,
      connectedAt: new Date().toISOString(),
    };
  } else {
    connections[platform] = {
      connected: false,
    };
  }
  
  localStorage.setItem('motopsy_social_connections', JSON.stringify(connections));
};

// Show setup instructions for OAuth
const showSetupInstructions = (platform: string): void => {
  const instructions = {
    facebook: `
🔧 Facebook OAuth Setup Required

To connect your Facebook page:

1. Go to: https://developers.facebook.com/apps
2. Create a new app or use existing one
3. Get your App ID
4. Add this redirect URI: ${window.location.origin}/settings
5. Add required permissions: pages_manage_posts, instagram_basic
6. Replace 'YOUR_FACEBOOK_APP_ID' in oauthService.ts

OR use Access Token directly:
1. Go to: https://developers.facebook.com/tools/explorer/
2. Select your app and page
3. Generate access token with required permissions
4. Paste it in the "Access Token" field below
    `,
    instagram: `
🔧 Instagram OAuth Setup Required

Instagram uses Facebook's OAuth system:

1. Go to: https://developers.facebook.com/apps
2. Create a new app with Instagram Basic Display
3. Get your App ID
4. Add this redirect URI: ${window.location.origin}/settings
5. Add Instagram permissions
6. Replace 'YOUR_FACEBOOK_APP_ID' in oauthService.ts

OR use Access Token directly:
1. Use Facebook Graph API Explorer
2. Get Instagram Business Account token
3. Paste it in the "Access Token" field below
    `,
    linkedin: `
🔧 LinkedIn OAuth Setup Required

To connect LinkedIn:

1. Go to: https://www.linkedin.com/developers/apps
2. Create a new app
3. Get your Client ID
4. Add this redirect URI: ${window.location.origin}/settings
5. Request permissions: w_member_social
6. Replace 'YOUR_LINKEDIN_CLIENT_ID' in oauthService.ts
    `,
    youtube: `
🔧 YouTube OAuth Setup Required

To connect YouTube:

1. Go to: https://console.cloud.google.com
2. Create a new project
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add this redirect URI: ${window.location.origin}/settings
6. Replace 'YOUR_GOOGLE_CLIENT_ID' in oauthService.ts
    `,
    twitter: `
🔧 Twitter/X OAuth Setup Required

To connect Twitter:

1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Create a new app
3. Get your Client ID
4. Add this redirect URI: ${window.location.origin}/settings
5. Enable OAuth 2.0
6. Replace 'YOUR_TWITTER_CLIENT_ID' in oauthService.ts
    `,
  };

  const message = instructions[platform as keyof typeof instructions] || 
    'OAuth setup required. Please configure your app credentials.';
  
  alert(message);
};

// Manual token input (for users who have tokens already)
export const saveManualToken = (platform: string, token: string, additionalData?: any): void => {
  saveAccessToken(platform, token);
  
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  connections[platform] = {
    connected: true,
    accessToken: token,
    connectedAt: new Date().toISOString(),
    ...additionalData,
  };
  localStorage.setItem('motopsy_social_connections', JSON.stringify(connections));
};

// Get saved token
export const getAccessToken = (platform: string): string | null => {
  const tokens = JSON.parse(localStorage.getItem('social_tokens') || '{}');
  return tokens[platform] || null;
};

// Disconnect platform
export const disconnectPlatform = (platform: string): void => {
  // Remove token
  const tokens = JSON.parse(localStorage.getItem('social_tokens') || '{}');
  delete tokens[platform];
  localStorage.setItem('social_tokens', JSON.stringify(tokens));
  
  // Update connection status
  updateConnectionStatus(platform, false);
};

// Check if platform is connected
export const isConnected = (platform: string): boolean => {
  const connections = JSON.parse(localStorage.getItem('motopsy_social_connections') || '{}');
  return connections[platform]?.connected || false;
};
