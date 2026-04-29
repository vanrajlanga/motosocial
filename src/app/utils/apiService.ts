// API Service for OpenAI and other AI services

import { getAccessToken } from './authService';
import { API_BASE_URL as BACKEND_BASE } from './apiConfig';

const API_BASE_URL = BACKEND_BASE;

export interface APIKeys {
  openai: string;
  gemini: string;
  elevenlabs: string;
  dalle: string;
  stabilityai: string;
  googleCloud: string;
  imgurClientId: string;
  imgbbApiKey: string;
  facebookAccessToken: string;
  instagramAccessToken: string;
  linkedinAccessToken: string;
  youtubeAccessToken: string;
  twitterAccessToken: string;
  dropboxAccessToken: string;
}

// Cache for API keys (to avoid repeated server calls)
let apiKeysCache: APIKeys | null = null;

// DEFAULT API KEYS - ALWAYS AVAILABLE
const DEFAULT_API_KEYS: APIKeys = {
  openai: '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',
  gemini: 'AIzaSyBvVjlX0xr0ScDLQMdWgRt4hIc3UAZWjC8',
  elevenlabs: '',
  dalle: '',
  stabilityai: '',
  googleCloud: '',
  imgurClientId: '',
  imgbbApiKey: '',
  facebookAccessToken: '',
  instagramAccessToken: '',
  linkedinAccessToken: '',
  youtubeAccessToken: '',
  twitterAccessToken: '',
  dropboxAccessToken: '',
};

// Get API keys from Supabase (cloud storage)
export const getAPIKeys = (): APIKeys => {
  // Return cached keys if available (synchronous)
  if (apiKeysCache) {
    return apiKeysCache;
  }
  
  // Return DEFAULT keys instead of empty
  console.log('✅ Using DEFAULT API keys');
  return DEFAULT_API_KEYS;
};

// Load API keys from Supabase (async)
export const loadAPIKeys = async (): Promise<APIKeys> => {
  const accessToken = getAccessToken();
  
  console.log('🔑 Loading API keys...', {
    hasAccessToken: !!accessToken,
    accessTokenPreview: accessToken ? `${accessToken.substring(0, 20)}...` : 'NONE'
  });

  try {
    const headers: HeadersInit = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${API_BASE_URL}/user/api-keys`, {
      method: 'GET',
      headers,
    });

    const data = await response.json();
    
    console.log('🔑 Server response:', {
      ok: response.ok,
      success: data.success,
      hasKeys: !!data.apiKeys,
      openAIKeyExists: !!data.apiKeys?.openai
    });

    if (response.ok && data.success) {
      // Update cache
      apiKeysCache = data.apiKeys || getAPIKeys();
      console.log('✅ API keys cached successfully');
      return apiKeysCache;
    } else {
      console.error('Failed to load API keys:', data.error);
      return getAPIKeys();
    }
  } catch (error) {
    console.error('❌ Error loading API keys:', error);
    return getAPIKeys();
  }
};

// Save API keys to backend
export const saveAPIKeys = async (keys: APIKeys): Promise<boolean> => {
  console.log('🔑 Attempting to save API keys...');

  try {
    const accessToken = getAccessToken();
    if (!accessToken) {
      console.error('❌ No valid session');
      alert('⚠️ Your session is invalid. Please log in again.');
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/user/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ apiKeys: keys }),
    });

    console.log('📥 Response status:', response.status, response.statusText);
    
    const data = await response.json();
    console.log('📥 Response data:', data);

    if (response.ok && data.success) {
      // Update cache
      apiKeysCache = keys;
      console.log('✅ API keys saved successfully!');
      return true;
    } else {
      console.error('❌ Server error:', data);
      alert(`❌ Failed to save: ${data.error}\n\nServer response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Save error:', error);
    alert(`❌ Error: ${error.message}`);
    return false;
  }
};

// Generate image using OpenAI DALL-E
export const generateImage = async (prompt: string, size: string = '1024x1024'): Promise<string> => {
  const keys = getAPIKeys();
  
  // Priority order:
  // 1. Gemini (enhances prompt + uses Pollinations.ai)
  // 2. OpenAI DALL-E (paid but high quality)
  // 3. Pollinations.ai directly (free, no API key needed)
  
  if (keys.gemini) {
    return await generateImageWithGemini(prompt, size);
  } else if (keys.openai || keys.dalle) {
    return await generateImageWithDallE(prompt, size);
  } else {
    // Use Pollinations.ai directly without prompt enhancement
    console.log('No API key configured. Using free Pollinations.ai service...');
    return await generateImageWithPollinations(prompt, size);
  }
};

// Generate image using Google Gemini/Imagen API
export const generateImageWithGemini = async (prompt: string, size: string = '1024x1024'): Promise<string> => {
  const keys = getAPIKeys();
  const apiKey = keys.gemini;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add your API key in Settings.');
  }

  try {
    // Gemini can enhance the prompt before generation
    // First, use Gemini to create an enhanced, detailed prompt
    const enhancedPrompt = await enhancePromptWithGemini(prompt, apiKey);
    
    // Then use a free image generation service with the enhanced prompt
    // Using Pollinations.ai - a free, no-auth-required image generation service
    const imageUrl = await generateImageWithPollinations(enhancedPrompt, size);
    
    return imageUrl;
    
  } catch (error) {
    console.error('Gemini image generation error:', error);
    // Fallback to DALL-E if available
    const keys = getAPIKeys();
    if (keys.openai || keys.dalle) {
      console.log('Falling back to DALL-E...');
      return await generateImageWithDallE(prompt, size);
    }
    throw error;
  }
};

// Enhance prompt using Gemini AI
const enhancePromptWithGemini = async (prompt: string, apiKey: string): Promise<string> => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert at writing detailed image generation prompts. Enhance this prompt for an AI image generator by adding artistic details, style, lighting, composition, and quality descriptors. Keep it concise but descriptive (max 200 words).

Original prompt: "${prompt}"

Enhanced prompt:`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        }
      }),
    });

    if (!response.ok) {
      return prompt; // Fallback to original prompt if enhancement fails
    }

    const data = await response.json();
    const enhancedPrompt = data.candidates[0].content.parts[0].text.trim();
    
    return enhancedPrompt;
  } catch (error) {
    console.error('Prompt enhancement error:', error);
    return prompt; // Fallback to original prompt
  }
};

// Generate image using Pollinations.ai (Free, no API key needed)
const generateImageWithPollinations = async (prompt: string, size: string): Promise<string> => {
  try {
    // Pollinations.ai uses URL-based image generation
    const encodedPrompt = encodeURIComponent(prompt);
    
    // Determine dimensions based on size
    let width = 1024;
    let height = 1024;
    
    if (size === '1024x1792') {
      width = 1024;
      height = 1792;
    } else if (size === '1792x1024') {
      width = 1792;
      height = 1024;
    }
    
    // Pollinations.ai image URL format - the image URL itself is the result
    // No need to verify, just return the URL directly
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${Date.now()}`;
    
    return imageUrl;
    
  } catch (error) {
    console.error('Pollinations.ai generation error:', error);
    throw new Error('Failed to generate image. Please try again or configure an API key.');
  }
};

// Generate image using OpenAI DALL-E (renamed from generateImage)
export const generateImageWithDallE = async (prompt: string, size: string = '1024x1024'): Promise<string> => {
  const keys = getAPIKeys();
  const apiKey = keys.openai || keys.dalle;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key in Settings.');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate image');
    }

    const data = await response.json();
    return data.data[0].url;
  } catch (error) {
    console.error('Image generation error:', error);
    throw error;
  }
};

// Generate article using OpenAI GPT
export const generateArticle = async (
  topic: string,
  keywords: string,
  wordCount: string,
  tone: string
): Promise<string> => {
  const keys = getAPIKeys();
  const apiKey = keys.openai;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key in Settings.');
  }

  const prompt = `Write a ${wordCount} word SEO-optimized article about "${topic}". 
Target keywords: ${keywords}. 
Tone: ${tone}.
Include an engaging introduction, well-structured sections with headers, and a conclusion.
Make it informative and valuable for readers.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional content writer specializing in SEO-optimized articles.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate article');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Article generation error:', error);
    throw error;
  }
};

// Generate video script using OpenAI GPT
export const generateVideoScript = async (topic: string, duration: string): Promise<string> => {
  const keys = getAPIKeys();
  const apiKey = keys.openai;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key in Settings.');
  }

  const prompt = `Create a ${duration} video script about "${topic}".
Include:
- Engaging hook/introduction
- Main content points
- Call to action
- Voice-over friendly format
Keep it natural and conversational.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional video script writer.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate video script');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Video script generation error:', error);
    throw error;
  }
};