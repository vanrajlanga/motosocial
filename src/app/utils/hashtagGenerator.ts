// AI-powered Hashtag Generator
// Generates relevant hashtags based on post content using OpenAI

import { getAPIKeys } from './apiService';

/**
 * Generate hashtags from post content using AI
 * @param content - The post caption/content
 * @param count - Number of hashtags to generate (default: 10)
 * @returns Array of hashtags
 */
export const generateHashtags = async (content: string, count: number = 10): Promise<string[]> => {
  const keys = getAPIKeys();
  const apiKey = keys.openai;

  if (!apiKey) {
    // Fallback: Generate basic hashtags without AI
    return generateBasicHashtags(content, count);
  }

  try {
    const prompt = `Generate ${count} relevant, trending hashtags for this social media post. Return ONLY the hashtags separated by spaces, without numbering or explanation.

Post content: "${content}"

Requirements:
- Mix of popular and niche hashtags
- Relevant to the content
- Include branded hashtags if applicable
- Format: #Hashtag #AnotherHashtag (no spaces in hashtags)
- No explanations, just the hashtags`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert specializing in hashtag optimization for maximum reach and engagement.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to generate hashtags');
    }

    const data = await response.json();
    const hashtagsText = data.choices[0].message.content.trim();

    // Extract hashtags from the response
    const hashtags = hashtagsText
      .split(/\s+/)
      .filter((tag: string) => tag.startsWith('#'))
      .slice(0, count);

    return hashtags.length > 0 ? hashtags : generateBasicHashtags(content, count);
  } catch (error) {
    console.error('Hashtag generation error:', error);
    // Fallback to basic hashtag generation
    return generateBasicHashtags(content, count);
  }
};

/**
 * Generate basic hashtags without AI (fallback)
 */
const generateBasicHashtags = (content: string, count: number): string[] => {
  // Extract key words from content
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3); // Only words longer than 3 characters

  // Common social media hashtags
  const commonHashtags = [
    '#Marketing',
    '#SocialMedia',
    '#Business',
    '#Digital',
    '#Content',
    '#Engagement',
    '#Brand',
    '#Strategy',
    '#Growth',
    '#Success',
  ];

  // Create hashtags from key words
  const wordHashtags = words
    .slice(0, 5)
    .map((word) => `#${word.charAt(0).toUpperCase() + word.slice(1)}`);

  // Combine and deduplicate
  const allHashtags = [...wordHashtags, ...commonHashtags];
  const uniqueHashtags = Array.from(new Set(allHashtags));

  return uniqueHashtags.slice(0, count);
};

/**
 * Add hashtags to caption
 */
export const addHashtagsToCaption = (caption: string, hashtags: string[]): string => {
  const cleanCaption = caption.trim();
  const hashtagString = hashtags.join(' ');

  // Check if caption already has hashtags
  if (cleanCaption.includes('#')) {
    return cleanCaption; // Don't add if hashtags already exist
  }

  return `${cleanCaption}\n\n${hashtagString}`;
};
