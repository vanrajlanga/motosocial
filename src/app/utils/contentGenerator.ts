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
            content:
              'You are the social media voice of MOTOPSY — writing EXCLUSIVELY for the Indian market. ' +
              'Every post must target Indian consumers AND must carry the Motopsy brand. Follow these HARD rules on every post without exception:\n' +
              '1. BRANDING (non-negotiable): every post MUST\n' +
              '   - Mention the brand word "Motopsy" naturally in the post body at least once (e.g., "at Motopsy", "with Motopsy", "the Motopsy way", "— Motopsy").\n' +
              '   - Include the hashtag #Motopsy. Prefer also #MotopsyAI or #MotopsyIndia where it fits. These are in addition to topic hashtags.\n' +
              '2. Currency: ALWAYS use Indian Rupees with the ₹ symbol (e.g., ₹5,00,000). NEVER use $, USD, dollars, or any non-INR currency.\n' +
              '3. Numbers: use the Indian numbering system (lakh, crore) where it reads naturally (e.g., "₹2.5 lakh", "₹1 crore").\n' +
              '4. Cultural context: references should fit India — cities (Delhi, Mumbai, Bengaluru, Chennai, Hyderabad, Pune), festivals (Diwali, Holi, Eid, Onam), brands (Maruti Suzuki, Tata, Mahindra, Hyundai, Bajaj, Flipkart, Paytm, Zomato, OLA).\n' +
              '5. Language: primarily English, but natural Hinglish sprinkles ("dost", "paisa vasool", "sahi hai") are welcome when they fit. Avoid US-centric idioms.\n' +
              '6. Examples/phone/money: any example numbers should look Indian (₹, +91 phone, PIN codes).\n' +
              '7. Tone: warm, conversational, Indian-market appropriate. Include relevant emojis.\n' +
              'STRICTLY follow the character limit provided. Output only the post text.',
          },
          {
            role: 'user',
            content: `Create a compelling social media post for INDIAN audiences about: "${keyword}".

HARD REQUIREMENTS:
- ${characterLimit}
- Brand: mention "Motopsy" in the body AND include #Motopsy (plus topic hashtags).
- Target market: India only
- Currency: Indian Rupees (₹) — never $ or USD
- Use Indian context (cities, brands, festivals, people) where relevant to the topic
- Engaging and attention-grabbing
- Include relevant emojis
- Professional yet conversational tone
- Optimized for Indian social media engagement (Instagram, Facebook, LinkedIn India)

Output ONLY the post text, no preamble. STRICTLY stay within the character limit.`,
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
    let generatedContent = data.choices[0]?.message?.content?.trim();

    if (!generatedContent) {
      throw new Error('No content generated from OpenAI');
    }

    // Safety-net: the system prompt already requires "Motopsy" + "#Motopsy",
    // but if the model ever slips we patch it ourselves so the brand ALWAYS
    // appears in the final post. Keeps the caption coherent rather than
    // awkwardly stapled on.
    generatedContent = ensureMotopsyBranding(generatedContent);

    return generatedContent;
  } catch (error: any) {
    console.error('Error generating content:', error);
    throw new Error(error.message || 'Failed to generate content');
  }
};

const ensureMotopsyBranding = (text: string): string => {
  let out = text;

  // 1. Ensure #Motopsy is present (case-insensitive). If any #Motopsy-style tag
  // exists (e.g. #motopsyai, #motopsyindia), leave it; otherwise append #Motopsy.
  if (!/#motopsy/i.test(out)) {
    const sep = /\n\s*#/.test(out) ? ' ' : '\n\n';
    out = `${out}${sep}#Motopsy`;
  }

  // 2. Ensure the brand word "Motopsy" appears in the body (not only as a
  // hashtag). Strip hashtag matches before testing.
  const bodyOnly = out.replace(/#\w+/g, '');
  if (!/motopsy/i.test(bodyOnly)) {
    // Prepend a short brand bump. Keep it light so it doesn't feel tacked on.
    out = `From Motopsy 👇\n${out}`;
  }

  return out;
};