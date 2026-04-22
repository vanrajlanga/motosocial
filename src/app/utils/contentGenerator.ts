import { getAPIKeys, loadAPIKeys } from './apiService';

/**
 * Generate content based on a keyword using OpenAI API
 * @param keyword - The keyword or topic to generate content about
 * @param captionSize - The size/length of the caption: 'HE' (40-80 chars), 'GNP' (80-150 chars), or 'GIP' (150-300 chars)
 * @returns Generated content string
 */
export const generateContent = async (keyword: string, captionSize: 'HE' | 'GNP' | 'GIP' = 'GNP'): Promise<string> => {
  try {
    // Load API keys from server (this will get default keys)
    const apiKeys = await loadAPIKeys();
    
    console.log('🔑 API Keys loaded:', {
      hasOpenAI: !!apiKeys.openai,
      openAIKeyPreview: apiKeys.openai ? `${apiKeys.openai.substring(0, 10)}...` : 'NOT FOUND'
    });
    
    if (!apiKeys.openai) {
      throw new Error('❌ OpenAI API key not found. Please add it in Settings.');
    }

    // Define character limits based on caption size
    let characterLimit = '';
    let maxTokens = 200;
    
    switch (captionSize) {
      case 'HE':
        characterLimit = 'EXACTLY 150-200 characters (Highest Engagement - concise and punchy)';
        maxTokens = 100;
        break;
      case 'GNP':
        characterLimit = 'EXACTLY 300-350 characters (Good for Normal Posts - engaging and informative)';
        maxTokens = 200;
        break;
      case 'GIP':
        characterLimit = 'EXACTLY 450 characters or more (Good for Informative Posts - detailed and comprehensive)';
        maxTokens = 300;
        break;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator. Create engaging, high-quality social media posts that are concise, attention-grabbing, and optimized for engagement. Include relevant emojis where appropriate. STRICTLY follow the character limit provided.',
          },
          {
            role: 'user',
            content: `Create a compelling social media post about: "${keyword}". 

IMPORTANT REQUIREMENTS:
- ${characterLimit}
- Engaging and attention-grabbing
- Include relevant emojis
- Professional yet conversational tone
- Optimized for social media engagement

Just provide the post text, no additional commentary. STRICTLY stay within the character limit specified above.`,
          },
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No content generated from OpenAI');
    }

    return generatedContent;
  } catch (error: any) {
    console.error('Error generating content:', error);
    throw new Error(error.message || 'Failed to generate content');
  }
};