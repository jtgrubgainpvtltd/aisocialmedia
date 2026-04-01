import OpenAI from "openai";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../../public/uploads");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
async function withRetry(fn, label = "OpenAI call") {
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
      logger.warn(
        `${label} failed (status ${status}). Retrying in ${delay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`,
        {
          error: err.message,
        },
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
}

function assertOpenAiCompletionShape(completion) {
  if (!completion?.choices || completion.choices.length === 0) {
    throw new Error("OpenAI response missing choices");
  }
  if (!completion.choices[0]?.message?.content) {
    throw new Error("OpenAI response missing message content");
  }
  if (
    !completion?.usage?.total_tokens &&
    completion?.usage?.total_tokens !== 0
  ) {
    throw new Error("OpenAI response missing token usage");
  }
}

/**
 * Generate social media caption using GPT-4
 * @param {Object} params - Caption generation parameters
 * @param {string} params.restaurantName - Name of the restaurant
 * @param {string} params.restaurantType - Type of cuisine
 * @param {string} params.city - City location
 * @param {string} params.tone - Tone of the caption (casual, professional, fun, etc.)
 * @param {string} params.language - Language preference (ENGLISH, HINDI, BILINGUAL)
 * @param {string} params.occasion - Special occasion or event (optional)
 * @param {string} params.dishName - Specific dish to highlight (optional)
 * @param {boolean} params.addEmojis - Include emojis in caption
 * @param {boolean} params.includeCTA - Include call-to-action
 * @param {Array} params.hashtags - Suggested hashtags (optional)
 * @returns {Promise<Object>} Generated caption and metadata
 */
export const generateCaption = async ({
  restaurantName,
  restaurantType,
  city,
  tone = "casual",
  language = "BILINGUAL",
  occasion = null,
  dishName = null,
  addEmojis = true,
  includeCTA = false,
  hashtags = [],
}) => {
  try {
    logger.info("Generating caption with OpenAI GPT-4", {
      restaurantName,
      restaurantType,
      city,
      tone,
      language,
    });

    // Language-specific instructions
    let languageInstruction = "";
    if (language === "HINDI") {
      languageInstruction =
        "Write the caption ENTIRELY in Hindi (Devanagari script).";
    } else if (language === "ENGLISH") {
      languageInstruction = "Write the caption ENTIRELY in English.";
    } else {
      // BILINGUAL
      languageInstruction =
        "Write the caption in BOTH English and Hindi. Format: English version first, then a blank line, then Hindi version in Devanagari script.";
    }

    // Emoji instruction
    const emojiInstruction = addEmojis
      ? "Include 1-2 relevant emojis naturally throughout the text."
      : "Do NOT use any emojis.";

    // CTA instruction
    const ctaInstruction = includeCTA
      ? 'End with a clear call-to-action like "Order now!", "Visit us today!", or "Book your table!"'
      : "";

    const prompt = `You are a social media marketing expert for restaurants. Generate an engaging Instagram/Facebook caption for:

Restaurant: ${restaurantName}
Cuisine Type: ${restaurantType}
Location: ${city}
Tone: ${tone}
${occasion ? `Occasion: ${occasion}` : ""}
${dishName ? `Dish to Highlight: ${dishName}` : ""}

Requirements:
- Keep it concise (100-150 characters per language)
- Make it engaging and appetizing
- ${languageInstruction}
- ${emojiInstruction}
- ${ctaInstruction}
- ${hashtags.length > 0 ? `Use these hashtags: ${hashtags.join(", ")}` : "Suggest 3-5 relevant hashtags"}
- Match the specified tone: ${tone}

Return ONLY the caption text with hashtags at the end.`;

    const completion = await withRetry(
      () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a professional social media content creator specializing in restaurant marketing.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 400,
        }),
      "generateCaption",
    );

    assertOpenAiCompletionShape(completion);
    const caption = completion.choices[0].message.content.trim();

    logger.info("Caption generated successfully", {
      captionLength: caption.length,
      tokensUsed: completion.usage.total_tokens,
      language,
    });

    return {
      success: true,
      caption,
      metadata: {
        model: completion.model,
        tokensUsed: completion.usage.total_tokens,
        finishReason: completion.choices[0].finish_reason,
        language,
      },
    };
  } catch (error) {
    logger.error("Error generating caption with OpenAI", {
      error: error.message,
      stack: error.stack,
    });

    throw new Error(`OpenAI Caption Generation Failed: ${error.message}`);
  }
};

/**
 * Save a base64 image string to disk and return its public path.
 * gpt-image-1.5 returns b64_json, not a temporary URL.
 * @param {string} b64_json - Base64-encoded image data
 * @returns {Promise<string>} Public path, e.g. "/uploads/generated_xxx.jpg"
 */
async function saveGeneratedImage(b64_json) {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  const fileName = `generated_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  await fs.promises.writeFile(filePath, Buffer.from(b64_json, "base64"));
  logger.info("Generated image saved", { fileName });
  return `/uploads/${fileName}`;
}

/**
 * Generate a marketing poster image using gpt-image-1.5
 * The model renders text, logos, and layouts natively — no post-processing needed.
 *
 * @param {Object} params
 * @param {string} params.prompt  - Full marketing poster prompt
 * @param {string} params.size    - "1024x1024" | "1024x1536" | "1536x1024"
 * @param {string} params.quality - "low" | "medium" | "high" | "auto"
 * @returns {Promise<{ success: boolean, imageUrl: string, metadata: object }>}
 */
export const generateImage = async ({
  prompt,
  size = "1024x1024",
  quality = "high",
}) => {
  try {
    logger.info("Generating image with gpt-image-1.5", {
      prompt: prompt.substring(0, 120),
      size,
      quality,
    });

    const response = await withRetry(
      () =>
        openai.images.generate({
          model: "gpt-image-1.5",
          prompt,
          n: 1,
          size,
          quality,
          // NOTE: gpt-image-1.5 does NOT accept a "style" parameter.
          // "vivid" / "natural" are DALL-E 3 parameters and will cause a 400 error.
        }),
      "generateImage (gpt-image-1)",
    );

    // gpt-image-1 returns b64_json by default, not a temporary URL
    if (!response?.data?.[0]?.b64_json) {
      throw new Error("gpt-image-1 response is missing b64_json data");
    }

    const imageUrl = await saveGeneratedImage(response.data[0].b64_json);

    logger.info("gpt-image-1 image generated and saved", { imageUrl });

    return {
      success: true,
      imageUrl,
      metadata: {
        model: "gpt-image-1",
        size,
        quality,
      },
    };
  } catch (error) {
    logger.error("Error generating image with gpt-image-1.5", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`gpt-image-1.5 Image Generation Failed: ${error.message}`);
  }
};

/**
 * Constructs a highly-detailed marketing poster prompt for gpt-image-1.5.
 *
 * gpt-image-1.5 can render crisp, professional typography natively when given
 * explicit typographic instructions. This prompt enforces that.
 */
export const generateFoodPrompt = ({
  restaurantName,
  cuisineType,
  cityName = "",
  area = "",
  brandTone = "modern",
  signatureDishes = "",
  campaignType = "General Branding",
  description = "",
}) => {
  // ── Brand tone → visual design language ──────────────────────────────────
  const toneMap = {
    modern:
      "clean minimalist layout, geometric sans-serif bold headline, crisp white space, dark navy and teal accent palette",
    elegant:
      "luxury editorial design, high-contrast serif display typeface, rich black and gold palette, fine-dining ambiance",
    fun: "bold vibrant poster style, large rounded chunky typeface, electric saturated colors, playful street-food energy",
    casual:
      "warm earthy tones, approachable friendly headline, bistro-style layout, hand-crafted aesthetic",
    professional:
      "structured grid layout, authoritative clean sans-serif, muted corporate palette, premium business feel",
  };
  const visualStyle = toneMap[brandTone] || toneMap.modern;

  // ── Campaign-type specific layout instructions ────────────────────────────
  const campaignMap = {
    "General Branding": `Aspirational lifestyle food photography. Hero shot of the food with the restaurant name as the dominant typographic element. Balanced, editorial layout.`,
    "Festival Greeting": `Festive Indian celebration motifs — diyas, marigold flowers, rangoli colour splashes. The word "Celebrating" in smaller text above the restaurant name. Warm golden-hour lighting. Joyful and premium.`,
    "Discount Offer": `Bold promotional banner layout. Large attention-grabbing offer text (e.g. "EXCLUSIVE OFFER" or the offer from context below) in a contrasting pill/badge shape. Urgency-driven design. Red and white accent.`,
    "Menu Highlight": `Close-up photorealistic hero shot of the signature dish as the centrepiece. The dish should look steam-fresh, perfectly styled. Restaurant name anchored at top.`,
  };
  const campaignInstruction =
    campaignMap[campaignType] || campaignMap["General Branding"];

  // ── Food description ──────────────────────────────────────────────────────
  const dishInstruction = signatureDishes
    ? `FEATURED FOOD: Photorealistic, steaming, delicious presentation of: ${signatureDishes}. Use dramatic lighting to make it irresistible.`
    : `FEATURED FOOD: Showcase appetizing, photorealistic ${cuisineType} cuisine. Food should look fresh, vibrant, and premium.`;

  // ── Location flavour ──────────────────────────────────────────────────────
  const locationNote =
    cityName || area
      ? `LOCATION ESSENCE: Subtly evoke the cultural character of ${[area, cityName].filter(Boolean).join(", ")}, India — through colour, texture, or atmospheric detail.`
      : "";

  // ── Extra context ─────────────────────────────────────────────────────────
  const contextNote = description ? `ADDITIONAL CONTEXT: ${description}` : "";

  // ── Assemble the full prompt ──────────────────────────────────────────────
  return `
TASK: Create a professional, print-ready social media marketing poster.

━━━ RESTAURANT ━━━
Name: "${restaurantName}"
Cuisine: ${cuisineType}

━━━ TYPOGRAPHY — THIS IS THE MOST CRITICAL REQUIREMENT ━━━
• The restaurant name "${restaurantName}" MUST appear as the primary headline.
• Every single letter must be PERFECTLY rendered: sharp edges, correct spelling, professional kerning.
• The typeface must look like it was set by a senior graphic designer in Adobe Illustrator or Figma.
• Zero blurriness, zero warped letters, zero misspellings, zero garbled or melted text.
• Text must look IDENTICAL to how it would appear on a real printed poster.
• Treat the text rendering with the same precision as a billboard advertisement.

━━━ VISUAL DESIGN STYLE ━━━
${visualStyle}

━━━ CAMPAIGN LAYOUT ━━━
${campaignInstruction}

━━━ FOOD IMAGERY ━━━
${dishInstruction}

${locationNote}
${contextNote}

━━━ TECHNICAL OUTPUT REQUIREMENTS ━━━
• Ultra-high-fidelity photorealistic quality.
• Ready to post directly on Instagram / Facebook — no further editing needed.
• Professional marketing agency standard (think Zomato or Swiggy campaign quality).
• Perfectly balanced composition: text takes 30–40% of space, visuals take 60–70%.
• No watermarks. No stock-photo borders. No lorem ipsum placeholder text.
`.trim();
};

/**
 * Generate a complete content package (AI caption + gpt-image-1.5 branded poster).
 * The compositor pipeline is intentionally removed:
 * gpt-image-1.5 renders restaurant name, layout, and branding natively in one call.
 */
export const generateFullContent = async (params) => {
  try {
    logger.info("Generating full content package with gpt-image-1.5", {
      restaurantName: params.restaurantName,
      campaignType: params.campaignType,
      language: params.language,
    });

    // ── Step 1: Generate caption ───────────────────────────────────────────
    const captionResult = await generateCaption({
      restaurantName: params.restaurantName,
      restaurantType: params.restaurantType,
      city: params.city,
      tone: params.tone,
      language: params.language || "BILINGUAL",
      occasion: params.occasion,
      dishName: params.dishName,
      addEmojis: params.addEmojis !== undefined ? params.addEmojis : true,
      includeCTA: params.includeCTA || false,
      hashtags: params.hashtags || [],
    });

    // ── Step 2: Build the gpt-image-1.5 poster prompt ────────────────────────
    const imagePrompt = generateFoodPrompt({
      restaurantName: params.restaurantName,
      cuisineType: params.restaurantType,
      cityName: params.city,
      area: params.area || "",
      brandTone: params.tone || "modern",
      signatureDishes: params.signatureDishes || "",
      campaignType: params.campaignType || "General Branding",
      description:
        params.prompt || params.occasion || params.dishDescription || "",
    });

    // ── Step 3: Generate the image — gpt-image-1.5 renders text natively ─────
    // Map legacy imageSize values to gpt-image-1.5 supported sizes
    const sizeMap = {
      "1024x1024": "1024x1024",
      "1024x1792": "1024x1536", // gpt-image-1.5 portrait equivalent
      "1792x1024": "1536x1024", // gpt-image-1.5 landscape equivalent
    };
    const resolvedSize = sizeMap[params.imageSize] || "1024x1024";

    const imageResult = await generateImage({
      prompt: imagePrompt,
      size: resolvedSize,
      quality: "high", // Always use 'high' for production marketing assets
    });

    logger.info("Full content package generated successfully", {
      imageUrl: imageResult.imageUrl,
    });

    return {
      success: true,
      caption: captionResult.caption,
      imageUrl: imageResult.imageUrl,
      metadata: {
        caption: captionResult.metadata,
        image: imageResult.metadata,
        generatedAt: new Date().toISOString(),
        usedPrompt: imagePrompt,
        brandingApplied: false, // gpt-image-1.5 handles branding natively in the image
      },
    };
  } catch (error) {
    logger.error("Content Generation Failed", {
      error: error.message,
      stack: error.stack,
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
    const today = new Date().toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
    });

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
      () =>
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 400,
        }),
      "getDynamicLocalEvents",
    );

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return [];

    // Strip markdown formatting if AI still decided to include it
    const cleanJson = content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const events = JSON.parse(cleanJson);

    // Map them to the dashboard format by ensuring an ID and icon
    return events.map((ev, i) => ({
      ...ev,
      id: `dynamic-event-${Date.now()}-${i}`,
      icon: ev.source.toLowerCase().includes("sport") ? "event" : "google",
    }));
  } catch (error) {
    logger.error("Error fetching dynamic events from OpenAI", {
      error: error.message,
    });
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
    () =>
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Comment: "${comment}"` },
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0.6,
      }),
    "OpenAI draftCommentReply",
  );

  assertOpenAiCompletionShape(completion);
  const result = JSON.parse(completion.choices[0].message.content);

  logger.info("Generated AI reply", { type: result.type });
  return result;
};

export default {
  generateCaption,
  generateImage,
  generateFoodPrompt,
  generateFullContent,
  getDynamicLocalEvents,
  draftCommentReply,
};
