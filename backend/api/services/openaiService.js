import OpenAI from 'openai';
import logger from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/** Retryable OpenAI status codes: Rate Limit & Service Unavailable */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1500;

/**
 * Wraps any async OpenAI call with exponential backoff retry logic.
 * Retries up to MAX_RETRIES times for transient errors (429, 503).
 * Delays: 1.5s → 3s → 6s
 */
async function withRetry(fn, label = 'OpenAI call') {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.status ?? err?.response?.status;
      const isRetryable = RETRYABLE_STATUS_CODES.has(status);

      if (!isRetryable || attempt === MAX_RETRIES) {
        throw err;
      }

      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      logger.warn(`${label} failed (status ${status}). Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`, {
        error: err.message
      });
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function assertOpenAiCompletionShape(completion) {
  if (!completion?.choices || completion.choices.length === 0) {
    throw new Error('OpenAI response missing choices');
  }
  if (!completion.choices[0]?.message?.content) {
    throw new Error('OpenAI response missing message content');
  }
  if (!completion?.usage?.total_tokens && completion?.usage?.total_tokens !== 0) {
    throw new Error('OpenAI response missing token usage');
  }
}

/**
 * Generate social media caption using GPT-4
 * @param {Object} params - Caption generation parameters
 * @param {string} params.restaurantName - Name of the restaurant
 * @param {string} params.restaurantType - Type of cuisine
 * @param {string} params.city - City location
 * @param {string} params.tone - Tone of the caption (casual, professional, fun, etc.)
 * @param {string} params.occasion - Special occasion or event (optional)
 * @param {string} params.dishName - Specific dish to highlight (optional)
 * @param {Array} params.hashtags - Suggested hashtags (optional)
 * @returns {Promise<Object>} Generated caption and metadata
 */
export const generateCaption = async ({
  restaurantName,
  restaurantType,
  city,
  tone = 'casual',
  occasion = null,
  dishName = null,
  hashtags = []
}) => {
  try {
    logger.info('Generating caption with OpenAI GPT-4', {
      restaurantName,
      restaurantType,
      city,
      tone
    });

    const prompt = `You are a social media marketing expert for restaurants. Generate an engaging Instagram/Facebook caption for:

Restaurant: ${restaurantName}
Cuisine Type: ${restaurantType}
Location: ${city}
Tone: ${tone}
${occasion ? `Occasion: ${occasion}` : ''}
${dishName ? `Dish to Highlight: ${dishName}` : ''}

Requirements:
- Keep it concise (100-150 characters)
- Make it engaging and appetizing
- Include 1-2 relevant emojis
- ${hashtags.length > 0 ? `Use these hashtags: ${hashtags.join(', ')}` : 'Suggest 3-5 relevant hashtags'}
- Match the specified tone: ${tone}

Return ONLY the caption text with hashtags at the end.`;

    const completion = await withRetry(
      () => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional social media content creator specializing in restaurant marketing.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      }),
      'generateCaption'
    );

    assertOpenAiCompletionShape(completion);
    const caption = completion.choices[0].message.content.trim();

    logger.info('Caption generated successfully', {
      captionLength: caption.length,
      tokensUsed: completion.usage.total_tokens
    });

    return {
      success: true,
      caption,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage.total_tokens,
        finishReason: completion.choices[0].finish_reason
      }
    };

  } catch (error) {
    logger.error('Error generating caption with OpenAI', {
      error: error.message,
      stack: error.stack
    });

    throw new Error(`OpenAI Caption Generation Failed: ${error.message}`);
  }
};

/**
 * Generate image using DALL-E 3
 * @param {Object} params - Image generation parameters
 * @param {string} params.prompt - Description of the image to generate
 * @param {string} params.size - Image size (1024x1024, 1024x1792, 1792x1024)
 * @param {string} params.quality - Quality (standard, hd)
 * @param {string} params.style - Style (vivid, natural)
 * @returns {Promise<Object>} Generated image URL and metadata
 */
export const generateImage = async ({
  prompt,
  size = '1024x1024',
  quality = 'standard',
  style = 'vivid'
}) => {
  try {
    logger.info('Generating image with DALL-E 3', {
      prompt: prompt.substring(0, 100),
      size,
      quality,
      style
    });

    const response = await withRetry(
      () => openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        style
      }),
      'generateImage (DALL-E 3)'
    );

    if (!response?.data || response.data.length === 0 || !response.data[0]?.url) {
      throw new Error('DALL-E response missing image URL');
    }

    const imageUrl = response.data[0].url;
    const revisedPrompt = response.data[0].revised_prompt || prompt;

    logger.info('Image generated successfully', {
      imageUrl: imageUrl.substring(0, 50) + '...',
      revisedPrompt: revisedPrompt.substring(0, 100)
    });

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      metadata: {
        model: 'dall-e-3',
        size,
        quality,
        style,
        originalPrompt: prompt
      }
    };

  } catch (error) {
    logger.error('Error generating image with DALL-E', {
      error: error.message,
      stack: error.stack
    });

    throw new Error(`DALL-E Image Generation Failed: ${error.message}`);
  }
};

import fs from 'fs';
import path from 'path';

/**
 * Generate branded promotional poster prompt for DALL-E
 */
export const generateFoodPrompt = ({
  restaurantName,
  cuisineType,
  cityName = '',
  area = '',
  brandTone = 'modern',
  signatureDishes = '',
  campaignType = 'General Branding',
  description = '',
  style = 'appetizing'
}) => {
  const baseInstructions = `A highly professional, premium social media promotional poster for a restaurant named "${restaurantName}". The style is high-end graphic design for a "${brandTone}" brand. NEVER generate random gibberish text or pseudo-words.`;
  
  let brandingInstruction = `The poster MUST prominently feature the exact text "${restaurantName}" in elegant, bold typography. The vibe is "${brandTone}".`;
  
  if (cityName || area) {
    brandingInstruction += ` It should subtly reflect the essence of its location: ${area ? `${area}, ` : ''}${cityName}.`;
  }

  let sceneInstruction = '';
  if (campaignType === 'Festival Greeting') {
    sceneInstruction = `Integrated festive elements along with appetizing ${cuisineType} food. Large bold header: "HAPPY FESTIVAL".`;
  } else if (campaignType === 'Discount Offer') {
    sceneInstruction = `Bold marketing-focused layout with "EXCLUSIVE OFFER" and "ORDER NOW" text. Feature the price/value prominently if provided in context: ${description}.`;
  } else {
    sceneInstruction = `Focus on appetizing ${cuisineType} imagery.${signatureDishes ? ` Specifically highlight elements of ${signatureDishes}.` : ''}`;
  }

  const prompt = `${baseInstructions} ${brandingInstruction} ${sceneInstruction} Cuisine: ${cuisineType}. ${description ? `Context: ${description}.` : ''} Style: Vector graphic style with high-quality photorealistic food elements, clean layout, vibrant colors, marketing agency quality. No typos.`;

  return prompt;
};

/**
 * Download image from URL and save to public/uploads
 */
const downloadAndSaveImage = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `generated_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, buffer);
    
    // Return the relative URL string that Vite can serve
    return `/uploads/${fileName}`;
  } catch (err) {
    logger.error('Error saving downloaded image to public/uploads', { error: err.message });
    return imageUrl; // Fallback to original DALL-E url if saving fails
  }
};

/**
 * Generate full content package (caption + image)
 * @param {Object} params - Content generation parameters
 * @returns {Promise<Object>} Complete content package
 */
export const generateFullContent = async (params) => {
  try {
    logger.info('Generating full branded content package', { params });

    // Generate caption first
    const captionResult = await generateCaption(params);

    // Generate food photography prompt with FULL restaurant context
    const imagePrompt = generateFoodPrompt({
      restaurantName: params.restaurantName,
      cuisineType: params.restaurantType,
      cityName: params.city,
      area: params.area || '',
      brandTone: params.tone || 'modern',
      signatureDishes: params.signatureDishes || '',
      campaignType: params.campaignType,
      description: params.prompt || params.occasion || params.dishDescription,
      style: params.imageStyle || 'appetizing'
    });

    // Generate image from DALL-E
    const imageResult = await generateImage({
      prompt: imagePrompt,
      size: params.imageSize || '1024x1024',
      quality: params.imageQuality || 'standard',
      style: params.dalleStyle || 'vivid'
    });

    // Download and save the ephemeral DALL-E image to public/uploads
    let finalImageUrl = imageResult.imageUrl;
    if (finalImageUrl) {
      finalImageUrl = await downloadAndSaveImage(finalImageUrl);
    }

    logger.info('Full branded content package generated successfully');

    return {
      success: true,
      caption: captionResult.caption,
      imageUrl: finalImageUrl,
      metadata: {
        caption: captionResult.metadata,
        image: imageResult.metadata,
        generatedAt: new Date().toISOString(),
        usedPrompt: imagePrompt
      }
    };

  } catch (error) {
    logger.error('Content Generation Failed', {
      error: error.message,
      stack: error.stack
    });

    throw new Error(`Content Generation Failed: ${error.message}`);
  }
};

/**
 * Dynamically fetch top local events (Sports, Festivals) for a given city and current date using GPT-4o-mini
 * Returns an array of formatted Insight objects.
 */
export const getDynamicLocalEvents = async (city) => {
  try {
    const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full' });
    
    // Prompt the AI to identify upcoming events and return exactly a JSON array
    const prompt = `You are a Live Local Events Engine. The current date is ${today}. The user's city is ${city}, India.
Identify exactly 1 major upcoming or ongoing sports event relevant to ${city} (like IPL, local cricket, football) AND 1 major upcoming Indian cultural festival or holiday within the next 30 days.

Respond ONLY with a valid JSON array of two objects. No markdown formatting, no code blocks, just raw JSON.
Each object must have the exact following keys:
"title" (string, e.g. "IPL 2026: Mumbai Indians vs CSK" or "Upcoming: Holi Festival")
"type" (string, strictly "event" or "Local Insights")
"source" (string, e.g. "Sports Calendar" or "Cultural Calendar")
"impact" (string, strictly "high" or "medium")
"angle" (string, a 1-sentence marketing angle for a restaurant, e.g. "Host a live screening with a 20% discount on pitchers!")
"detail" (string, a 1-sentence detail about the event)

Raw JSON array only:`;

    logger.info(`Fetching dynamic local events for ${city} via OpenAI...`);

    const completion = await withRetry(
      () => openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 400
      }),
      'getDynamicLocalEvents'
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return [];

    // Strip markdown formatting if AI still decided to include it
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const events = JSON.parse(cleanJson);
    
    // Map them to the dashboard format by ensuring an ID and icon
    return events.map((ev, i) => ({
      ...ev,
      id: `dynamic-event-${Date.now()}-${i}`,
      icon: ev.source.toLowerCase().includes('sport') ? 'event' : 'google'
    }));

  } catch (error) {
    logger.error('Error fetching dynamic events from OpenAI', { error: error.message });
    return []; // Graceful fallback
  }
};

/**
 * Assess a social media comment and draft an appropriate reply.
 * @param {string} comment - The user's comment
 * @param {object} context - Context containing restaurantName, etc.
 * @returns {Promise<{type: string, reply: string}>} Classification and drafted reply
 */
export const draftCommentReply = async (comment, context) => {
  const systemPrompt = `You are a social media manager for the restaurant "${context.restaurantName}".
Your task is to classify an incoming comment on a social media post and draft a contextual, natural reply.

Classification Types:
- POSITIVE (compliments, great experiences)
- COMPLAINT (bad food, poor service, long wait)
- QUESTION (hours, menu, location, reservations)
- OTHER (tags, short generic emojis, spam)

Rules for drafting the reply:
- For POSITIVE: Be warm, thankful, and invite them back.
- For COMPLAINT: Be highly empathetic, apologize without making excuses, and ask them to DM/email for resolution.
- For QUESTION: Be helpful and concise.
- Keep the reply under 250 characters.

Return a JSON object:
{
  "type": "POSITIVE" | "COMPLAINT" | "QUESTION" | "OTHER",
  "reply": "The response string"
}`;

  const completion = await withRetry(
    () => openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Comment: "${comment}"` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.6
    }),
    'OpenAI draftCommentReply'
  );

  assertOpenAiCompletionShape(completion);
  const result = JSON.parse(completion.choices[0].message.content);

  logger.info('Generated AI reply', { type: result.type });
  return result;
};

export default {
  generateCaption,
  generateImage,
  generateFoodPrompt,
  generateFullContent,
  getDynamicLocalEvents,
  draftCommentReply
};
