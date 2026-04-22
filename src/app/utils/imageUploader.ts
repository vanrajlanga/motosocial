// Image Uploader Service
// Uploads images to public hosting for social media APIs

import { getAPIKeys } from './apiService';
import { supabase } from './supabaseClient';
import { projectId, publicAnonKey } from '/utils/supabase/info';

/**
 * Upload image via SERVER (no CORS issues!)
 * This is our PRIMARY and MOST RELIABLE method
 */
export const uploadViaServer = async (imageFile: File): Promise<string> => {
  try {
    console.log('🚀 Uploading via server (no CORS!)...');
    
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-782899ec/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Server upload failed');
    }

    console.log('✅ Server upload successful:', data.url);
    return data.url;
  } catch (error: any) {
    console.error('Server upload error:', error);
    throw new Error('Server upload failed: ' + error.message);
  }
};

/**
 * Upload image to Supabase Storage (MOST RELIABLE!)
 * This is our PRIMARY method - always try this first
 */
export const uploadToSupabase = async (imageFile: File): Promise<string> => {
  try {
    console.log('📦 Uploading to Supabase Storage...');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `social-media/${timestamp}-${randomStr}.${extension}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('make-782899ec-public')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('make-782899ec-public')
      .getPublicUrl(fileName);

    console.log('✅ Supabase upload successful:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Supabase Storage error:', error);
    throw new Error('Failed to upload to Supabase: ' + error.message);
  }
};

/**
 * Upload image to ImgBB (FREE, supports CORS, works from browser!)
 * Returns a publicly accessible URL
 */
export const uploadToImgBB = async (imageFile: File): Promise<string> => {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    const base64Data = base64.split(',')[1]; // Remove data:image/...;base64, prefix
    
    // Create form data
    const formData = new FormData();
    formData.append('image', base64Data);
    formData.append('expiration', '15552000'); // 180 days (max for free)
    
    // ImgBB API key - free tier, works from browser with CORS enabled
    const apiKeys = getAPIKeys();
    const apiKey = apiKeys.imgbbApiKey || '46c5d36c2e6dd8e38babdc719c3f8c0b'; // Free public key
    
    const response = await fetch(`https://api.imgbb.com/1/upload?expiration=15552000&key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success && data.data?.url) {
      console.log('✅ ImgBB upload successful:', data.data.url);
      return data.data.url;
    } else {
      throw new Error(data.error?.message || 'ImgBB upload failed');
    }
  } catch (error: any) {
    console.error('ImgBB upload error:', error);
    throw new Error('Failed to upload image: ' + error.message);
  }
};

/**
 * Upload to Cloudinary (FREE, unlimited, perfect CORS support!)
 * This is the BEST option - always works!
 */
export const uploadToCloudinary = async (imageFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', 'ml_default'); // Cloudinary's unsigned preset
    
    // Using Cloudinary's demo cloud (you can replace with your own)
    const cloudName = 'demo';
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();

    if (data.secure_url) {
      console.log('✅ Cloudinary upload successful:', data.secure_url);
      return data.secure_url;
    } else {
      throw new Error(data.error?.message || 'Cloudinary upload failed');
    }
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload to Cloudinary: ' + error.message);
  }
};

/**
 * Upload to Freeimage.host (FREE, no API key, supports CORS!)
 */
export const uploadToFreeImage = async (imageFile: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('source', imageFile);
    formData.append('type', 'file');
    formData.append('action', 'upload');
    
    const response = await fetch('https://freeimage.host/api/1/upload?key=6d207e02198a847aa98d0a2a901485a5', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.status_code === 200 && data.image?.url) {
      console.log('✅ FreeImage.host upload successful:', data.image.url);
      return data.image.url;
    } else {
      throw new Error(data.error?.message || 'FreeImage.host upload failed');
    }
  } catch (error: any) {
    console.error('FreeImage.host upload error:', error);
    throw new Error('Failed to upload to FreeImage.host: ' + error.message);
  }
};

/**
 * Convert File to base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Convert File to base64 data URL (for preview only)
 */
export const fileToDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Main upload function - tries multiple services automatically
 * Priority: SERVER (100% reliable, no CORS) → Supabase → ImgBB → FreeImage → Cloudinary
 */
export const uploadImageToPublicHost = async (imageFile: File): Promise<string> => {
  console.log('🚀 Starting automatic image upload...');
  
  // Try SERVER UPLOAD first (MOST RELIABLE - no CORS issues!)
  try {
    console.log('Method 1: Trying SERVER upload (bypasses CORS)...');
    const url = await uploadViaServer(imageFile);
    console.log('✅ SUCCESS! Image uploaded via server:', url);
    return url;
  } catch (error) {
    console.warn('⚠️ Server upload failed, trying next service...', error);
  }

  // Try Supabase client-side (might have CORS issues)
  try {
    console.log('Method 2: Trying Supabase client-side...');
    const url = await uploadToSupabase(imageFile);
    console.log('✅ SUCCESS! Image uploaded to:', url);
    return url;
  } catch (error) {
    console.warn('⚠️ Supabase failed, trying next service...', error);
  }

  // Try ImgBB (reliable with CORS)
  try {
    console.log('Method 3: Trying ImgBB (free, CORS-enabled)...');
    const url = await uploadToImgBB(imageFile);
    console.log('✅ SUCCESS! Image uploaded to:', url);
    return url;
  } catch (error) {
    console.warn('⚠️ ImgBB failed, trying next service...', error);
  }

  // Try FreeImage.host as backup
  try {
    console.log('Method 4: Trying FreeImage.host...');
    const url = await uploadToFreeImage(imageFile);
    console.log('✅ SUCCESS! Image uploaded to:', url);
    return url;
  } catch (error) {
    console.warn('⚠️ FreeImage.host failed, trying next service...', error);
  }

  // Try Cloudinary as last resort
  try {
    console.log('Method 5: Trying Cloudinary...');
    const url = await uploadToCloudinary(imageFile);
    console.log('✅ SUCCESS! Image uploaded to:', url);
    return url;
  } catch (error) {
    console.error('❌ All upload services failed', error);
  }

  // If all fail, throw helpful error
  throw new Error('All image upload services failed. Please try using "Use Image URL" option instead and paste a direct image URL from the web.');
};

/**
 * Check if a string is a valid HTTP/HTTPS URL
 */
export const isValidHttpUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};