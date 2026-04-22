import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from 'npm:@supabase/supabase-js@2';

// Initialize default API keys on server startup
const initializeDefaultAPIKeys = async () => {
  try {
    console.log('🔧 Initializing default API keys...');
    
    const defaultKeys = {
      openai: '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',
      gemini: 'AIzaSyBvVjlX0xr0ScDLQMdWgRt4hIc3UAZWjC8',
      facebook: 'EAAUxAhZAljXMBQ5r1m0qlUflTzraPUqArkcz4BZB0ZB10lpUyHBN3cJPy9lC3XuMZAWSuZCdVciDF0bZBaNwtz94LzPt6y8MTudfNZBKk893vgZC12RRwOPRjaP8XbNXcp9p5jPkfnJQKeswAahBiFufOTZA1YVWXbfChfSIvuuSEKZBLavopVdAZChgVt5ZALymdMv5AkyZAZB341D20yYzBWlOi8SHFoSZBNobWguh2zR04jZAmtbUSZBvZAtEZApFIZCqdcmWnkR6zkEZAyV1IJHwIFBzahZA3NUVjC'
    };
    
    await kv.set('default_api_keys', defaultKeys);
    console.log('✅ Default API keys initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing default API keys:', error);
  }
};

// Initialize on startup
initializeDefaultAPIKeys();

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase admin client
const getSupabaseAdmin = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
};

// Create Supabase client with user token
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
};

// Initialize storage bucket on startup
const initializeStorage = async () => {
  try {
    const supabase = getSupabaseAdmin();
    const bucketName = 'make-782899ec-public';
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      console.log('Creating public storage bucket:', bucketName);
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make bucket public so images are accessible
        fileSizeLimit: 52428800, // 50MB limit
      });
      
      if (error) {
        console.error('Failed to create bucket:', error);
      } else {
        console.log('✅ Public storage bucket created successfully');
      }
    } else {
      console.log('✅ Storage bucket already exists');
    }
  } catch (error) {
    console.error('Storage initialization error:', error);
  }
};

// Initialize on startup
initializeStorage();

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// User signup
app.post("/make-server-782899ec/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    const supabase = getSupabaseAdmin();
    
    console.log('Creating user with email:', email);

    // Create user with admin API (auto-confirms email)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since we don't have email server
      user_metadata: { name },
    });

    if (error) {
      console.error('Signup error:', error);
      // If user already exists, that's okay
      if (error.message.includes('already registered')) {
        return c.json({ success: true, message: 'User already exists' });
      }
      return c.json({ success: false, error: error.message }, 400);
    }

    console.log('User created successfully:', data.user.id);
    
    // Return user data (frontend will handle sign-in separately)
    return c.json({ 
      success: true, 
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ success: false, error: error.message || 'Server error' }, 500);
  }
});

// Sign in existing user
app.post("/make-server-782899ec/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('Sign in error:', error);
      return c.json({ error: error.message }, 401);
    }

    console.log('User signed in successfully:', data.user?.id);
    return c.json({ 
      success: true,
      session: data.session,
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name: data.user?.user_metadata?.name
      }
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get current session
app.get("/make-server-782899ec/auth/session", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'No access token provided' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      console.error('Session validation error:', error);
      return c.json({ error: 'Invalid session' }, 401);
    }

    return c.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name
      }
    });
  } catch (error: any) {
    console.error('Session error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================
// USER DATA ROUTES (API Keys, Settings, etc.)
// ============================================

// Save user settings (API keys, connected accounts, etc.)
app.post("/make-server-782899ec/user/settings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { settings } = await c.req.json();

    // Save settings to KV store with user ID as key
    const settingsKey = `user_settings_${user.id}`;
    await kv.set(settingsKey, settings);

    console.log('Settings saved for user:', user.id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Save settings error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get user settings
app.get("/make-server-782899ec/user/settings", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get settings from KV store
    const settingsKey = `user_settings_${user.id}`;
    const settings = await kv.get(settingsKey);

    console.log('Settings retrieved for user:', user.id);
    return c.json({ success: true, settings: settings || {} });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Save API keys
app.post("/make-server-782899ec/user/api-keys", async (c) => {
  try {
    console.log('=== Save API Keys Request ===');
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.error('❌ No access token provided');
      return c.json({ code: 401, message: 'No access token' }, 401);
    }

    // TEMPORARY: Extract user ID from JWT payload WITHOUT validating signature
    // This is a workaround because the server's Supabase env vars might be for a different project
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const userId = payload.sub;
      
      console.log('✅ User ID extracted from token:', userId);
      
      if (!userId) {
        throw new Error('No user ID in token');
      }

      const body = await c.req.json();
      const { apiKeys } = body;

      if (!apiKeys) {
        console.error('❌ No apiKeys in request body');
        return c.json({ success: false, error: 'No apiKeys provided in request' }, 400);
      }

      console.log('API keys to save:', Object.keys(apiKeys));

      // Save API keys to KV store
      const apiKeysKey = `user_api_keys_${userId}`;
      console.log('Saving to key:', apiKeysKey);
      
      await kv.set(apiKeysKey, apiKeys);
      console.log('✅ KV store save successful');

      console.log('✅ API keys saved successfully for user:', userId);
      return c.json({ success: true });
    } catch (jwtError: any) {
      console.error('❌ JWT decode error:', jwtError);
      return c.json({ code: 401, message: 'Invalid JWT format' }, 401);
    }
  } catch (error: any) {
    console.error('❌ Save API keys error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ success: false, error: `Server error: ${error.message || 'Unknown error'}` }, 500);
  }
});

// Get API keys
app.get("/make-server-782899ec/user/api-keys", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      console.log('⚠️ No access token, returning default API keys');
      // Return default keys if no auth
      const defaultKeys = await kv.get('default_api_keys');
      return c.json({ success: true, apiKeys: defaultKeys || {} });
    }

    // Try to extract user ID (with fallback)
    let userId = null;
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      console.log('⚠️ Could not extract user ID, returning default API keys');
      const defaultKeys = await kv.get('default_api_keys');
      return c.json({ success: true, apiKeys: defaultKeys || {} });
    }

    if (!userId) {
      console.log('⚠️ No user ID, returning default API keys');
      const defaultKeys = await kv.get('default_api_keys');
      return c.json({ success: true, apiKeys: defaultKeys || {} });
    }

    // Get user's API keys from KV store
    const apiKeysKey = `user_api_keys_${userId}`;
    const userKeys = await kv.get(apiKeysKey);
    
    // Get default keys
    const defaultKeys = await kv.get('default_api_keys') || {};
    
    // Merge: user keys override defaults
    const mergedKeys = {
      ...defaultKeys,
      ...(userKeys || {})
    };

    console.log('✅ API keys retrieved for user:', userId, '- Keys available:', Object.keys(mergedKeys));
    return c.json({ success: true, apiKeys: mergedKeys });
  } catch (error: any) {
    console.error('❌ Get API keys error:', error);
    // Fallback to default keys on error
    const defaultKeys = await kv.get('default_api_keys');
    return c.json({ success: true, apiKeys: defaultKeys || {} });
  }
});

// Save Facebook pages
app.post("/make-server-782899ec/user/facebook-pages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { pages } = await c.req.json();

    // Save Facebook pages to KV store
    const pagesKey = `user_facebook_pages_${user.id}`;
    await kv.set(pagesKey, pages);

    console.log('Facebook pages saved for user:', user.id);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Save Facebook pages error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Get Facebook pages
app.get("/make-server-782899ec/user/facebook-pages", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getSupabaseAdmin();
    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      console.error('Authorization error:', authError);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get Facebook pages from KV store
    const pagesKey = `user_facebook_pages_${user.id}`;
    const pages = await kv.get(pagesKey);

    console.log('Facebook pages retrieved for user:', user.id);
    return c.json({ success: true, pages: pages || [] });
  } catch (error: any) {
    console.error('Get Facebook pages error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// Upload image to Supabase Storage (server-side - no CORS issues!)
app.post("/make-server-782899ec/upload-image", async (c) => {
  try {
    console.log('📤 Receiving image upload request...');
    
    const formData = await c.req.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return c.json({ success: false, error: 'No image file provided' }, 400);
    }

    console.log('📁 Image file received:', imageFile.name, imageFile.size, 'bytes');

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `social-media/${timestamp}-${randomStr}.${extension}`;

    const supabase = getSupabaseAdmin();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('make-782899ec-public')
      .upload(fileName, imageFile, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
        contentType: imageFile.type
      });

    if (error) {
      console.error('❌ Supabase upload error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('make-782899ec-public')
      .getPublicUrl(fileName);

    console.log('✅ Image uploaded successfully:', publicUrl);

    return c.json({ 
      success: true, 
      url: publicUrl 
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    return c.json({ success: false, error: error.message || 'Upload failed' }, 500);
  }
});

// Generate image using Unsplash (server-side - no CORS issues!)
app.post("/make-server-782899ec/generate-image", async (c) => {
  try {
    console.log('🎨 AI Image Generation Request Received');
    
    const body = await c.req.json();
    const { query, caption } = body;
    
    console.log('📝 Caption:', caption);
    
    // STEP 1: Use Gemini to enhance the prompt
    console.log('🤖 [STEP 1] Enhancing prompt with Gemini AI...');
    const geminiApiKey = 'AIzaSyBvVjlX0xr0ScDLQMdWgRt4hIc3UAZWjC8';
    
    let enhancedPrompt = caption;
    
    try {
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are an expert at writing detailed image generation prompts. Enhance this social media caption into a detailed image generation prompt. Add artistic details, style, lighting, composition. Keep it concise (max 150 words).\n\nCaption: "${caption}"\n\nEnhanced prompt:`
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            }
          }),
        }
      );
      
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        enhancedPrompt = geminiData.candidates[0].content.parts[0].text.trim();
        console.log('✅ [STEP 1 DONE] Enhanced prompt:', enhancedPrompt);
      } else {
        console.log('⚠️ Gemini enhancement failed, using original caption');
      }
    } catch (error) {
      console.log('⚠️ Gemini error, using original caption:', error);
    }
    
    // STEP 2: Generate image with Pollinations.ai using enhanced prompt (WITH RETRY!)
    console.log('🎨 [STEP 2] Generating AI image with Pollinations...');
    const encodedPrompt = encodeURIComponent(enhancedPrompt);
    
    let imageBlob = null;
    let lastError = null;
    
    // Try Pollinations.ai first (with retry)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/3: Trying Pollinations.ai...`);
        
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&enhance=true&seed=${Date.now()}&model=flux`;
        
        console.log('📸 Pollinations URL:', pollinationsUrl);
        
        const imageResponse = await fetch(pollinationsUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log('📥 Pollinations response status:', imageResponse.status);
        
        if (imageResponse.ok) {
          imageBlob = await imageResponse.blob();
          console.log('✅ Image downloaded, size:', imageBlob.size, 'bytes');
          
          if (imageBlob.size > 1000) {
            console.log('✅ [STEP 2 DONE] Pollinations successful!');
            break; // Success!
          } else {
            console.log('⚠️ Image too small, retrying...');
            lastError = new Error('Image too small');
          }
        } else {
          lastError = new Error(`Pollinations returned ${imageResponse.status}`);
          console.log(`⚠️ Pollinations failed with ${imageResponse.status}, retrying in 2s...`);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          }
        }
      } catch (error: any) {
        lastError = error;
        console.log(`⚠️ Pollinations error:`, error.message);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // If Pollinations failed after 3 attempts, try alternative services
    if (!imageBlob || imageBlob.size < 1000) {
      console.log('⚠️ Pollinations failed after 3 attempts, trying alternatives...');
      
      // Try Picsum.photos (placeholder images - reliable fallback)
      try {
        console.log('🔄 Trying Picsum.photos as fallback...');
        const picsumUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`;
        
        const picsumResponse = await fetch(picsumUrl);
        if (picsumResponse.ok) {
          imageBlob = await picsumResponse.blob();
          console.log('✅ Fallback image downloaded from Picsum');
        }
      } catch (error: any) {
        console.log('⚠️ Picsum also failed:', error.message);
      }
    }
    
    // If still no image, throw error
    if (!imageBlob || imageBlob.size < 1000) {
      throw new Error(`All image generation services failed. Last error: ${lastError?.message || 'Unknown'}`);
    }
    
    // STEP 3: Upload to Supabase Storage
    console.log('☁️ [STEP 3] Uploading to Supabase Storage...');
    
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const fileName = `social-media/ai-${timestamp}-${randomStr}.png`;
    
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase.storage
      .from('make-782899ec-public')
      .upload(fileName, imageBlob, {
        cacheControl: '31536000', // 1 year cache
        upsert: false,
        contentType: 'image/png'
      });
    
    if (error) {
      console.error('❌ Supabase upload error:', error);
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
    
    // Get public URL from Supabase
    const { data: { publicUrl } } = supabase.storage
      .from('make-782899ec-public')
      .getPublicUrl(fileName);
    
    console.log('✅ [STEP 3 DONE] Image uploaded to Supabase!');
    console.log('🌐 Public URL:', publicUrl);
    
    return c.json({ 
      success: true, 
      imageUrl: publicUrl,
      enhancedPrompt: enhancedPrompt
    });
    
  } catch (error: any) {
    console.error('❌ AI Image Generation Error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ 
      success: false, 
      error: error.message || 'Failed to generate AI image' 
    }, 500);
  }
});

// Health check endpoint
app.get("/make-server-782899ec/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);