import OpenAI from "openai";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import axios from "axios";
import { fileURLToPath } from "url";
import sharp from "sharp";
import logger from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, "../../public/uploads");
const GRUBGAIN_LOGO_PATH = path.resolve(
  __dirname,
  "../../../frontend/public/branding/logo.png",
);

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
  const fileName = `generated_${crypto.randomUUID()}.png`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  const buffer = Buffer.isBuffer(b64_json) ? b64_json : Buffer.from(b64_json, "base64");
  await fs.promises.writeFile(filePath, buffer);
  logger.info("Generated image saved", { fileName });
  return `/uploads/${fileName}`;
}

function sanitizeExternalImageUrl(rawUrl = "") {
  if (typeof rawUrl !== "string") return "";
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  if (!(trimmed.startsWith("http://") || trimmed.startsWith("https://"))) {
    return "";
  }
  return trimmed.slice(0, 500);
}

async function fetchExternalImageBuffer(url) {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 10000,
    maxContentLength: 8 * 1024 * 1024,
    validateStatus: (status) => status >= 200 && status < 300,
  });
  return Buffer.from(response.data);
}

async function fetchRestaurantLogoBuffer(restaurantLogoUrl = "") {
  const raw = String(restaurantLogoUrl || "").trim();
  if (!raw) return null;

  if (raw.startsWith("/uploads/")) {
    const localPath = path.resolve(__dirname, `../../public${raw}`);
    if (!fs.existsSync(localPath)) {
      throw new Error("Restaurant logo file not found in uploads directory");
    }
    return fs.promises.readFile(localPath);
  }

  const sanitized = sanitizeExternalImageUrl(raw);
  if (!sanitized) return null;
  return fetchExternalImageBuffer(sanitized);
}

async function applyBrandingToPoster({ baseImageBuffer, restaurantLogoUrl = "" }) {
  const image = sharp(baseImageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 1024;
  const height = metadata.height || 1024;
  const overlays = [];
  
  // Smaller, less intrusive logos with better drop-shadow backing
  const margin = Math.max(16, Math.round(width * 0.022));

  if (restaurantLogoUrl) {
    try {
      const logoSourceBuffer = await fetchRestaurantLogoBuffer(restaurantLogoUrl);
      if (!logoSourceBuffer) {
        throw new Error("Unsupported restaurant logo URL format");
      }
      // Reduced from 17% to 13% width, 10% to 8% height
      const logoMaxWidth = Math.max(80, Math.round(width * 0.13));
      const logoMaxHeight = Math.max(44, Math.round(height * 0.08));

      const { data: logoBuffer, info: logoInfo } = await sharp(logoSourceBuffer)
        .trim()
        .resize({
          width: logoMaxWidth,
          height: logoMaxHeight,
          fit: "inside",
          withoutEnlargement: true,
        })
        .png()
        .toBuffer({ resolveWithObject: true });

      const logoW = logoInfo.width || logoMaxWidth;
      const logoH = logoInfo.height || logoMaxHeight;

      // Overlay restaurant logo directly (no shadow)
      overlays.push({
        input: logoBuffer,
        top: height - logoH - margin,
        left: margin,
      });
    } catch (error) {
      logger.warn("Could not composite exact restaurant logo overlay", {
        error: error.message,
      });
    }
  }

  if (fs.existsSync(GRUBGAIN_LOGO_PATH)) {
    // Reduced from 14% to 11% width for less intrusion
    const watermarkWidth = Math.max(72, Math.round(width * 0.11));
    const watermarkImage = sharp(GRUBGAIN_LOGO_PATH)
      .trim()
      .resize({
        width: watermarkWidth,
        fit: "contain",
        withoutEnlargement: true,
      });
    const { data: footerLogoBuffer, info } = await watermarkImage
      .png()
      .toBuffer({ resolveWithObject: true });
    const logoW = info.width || watermarkWidth;
    const logoH = info.height || Math.round(watermarkWidth * 0.3);

    // Overlay GrubGain watermark directly (no shadow)
    overlays.push({
      input: footerLogoBuffer,
      top: height - logoH - margin,
      left: width - logoW - margin,
      opacity: 0.92,  // Increased opacity for better visibility without shadow
    });
  }

  if (overlays.length === 0) {
    return baseImageBuffer;
  }

  return sharp(baseImageBuffer).composite(overlays).png().toBuffer();
}

/**
 * Generate a marketing poster image using gpt-image-1.5 and then composite exact GrubGain watermark.
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
  restaurantLogoUrl = "",
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
      "generateImage (gpt-image-1.5)",
    );

    // gpt-image-1.5 returns b64_json by default, not a temporary URL
    if (!response?.data?.[0]?.b64_json) {
      throw new Error("gpt-image-1.5 response is missing b64_json data");
    }

    const baseImageBuffer = Buffer.from(response.data[0].b64_json, "base64");
    const brandedImageBuffer = await applyBrandingToPoster({
      baseImageBuffer,
      restaurantLogoUrl,
    });
    const imageUrl = await saveGeneratedImage(brandedImageBuffer);

    logger.info("gpt-image-1.5 image generated and saved", { imageUrl });

    return {
      success: true,
      imageUrl,
      metadata: {
        model: "gpt-image-1.5",
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
  restaurantLogoUrl = "",
  restaurantBrandColor = "",
  restaurantBrandStory = "",
  restaurantProfile = {},
  contentStudioContext = {},
  cityFeedContext = {},
}) => {
  // ── Brand tone → visual design language ──────────────────────────────────
  const toneMap = {
    modern:
      "clean minimalist layout, geometric sans-serif bold headline, crisp white space, dark navy and teal accent palette",
    elegant:
      "luxury editorial design, high-contrast serif display typeface, rich black and gold palette, fine-dining ambiance",
    fun: "bold vibrant poster style, large rounded chunky typeface, electric saturated colors, playful street-food energy",
    casual:
      "clean friendly layout with natural daylight look, approachable headline style, balanced modern cafe aesthetic",
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

  const profile = {
    targetAudience: restaurantProfile?.targetAudience || "",
    aboutDescription: restaurantProfile?.aboutDescription || "",
    standardOffers: restaurantProfile?.standardOffers || "",
    hashtags: restaurantProfile?.hashtags || "",
    tagline: restaurantProfile?.tagline || "",
    priceRange: restaurantProfile?.priceRange || "",
    instagramHandle: restaurantProfile?.instagramHandle || "",
    website: restaurantProfile?.website || "",
  };

  const studioContextNote = [
    `Studio campaign type: ${contentStudioContext?.campaignType || campaignType}`,
    `Studio format: ${contentStudioContext?.format || "Post"}`,
    `Studio aspect ratio: ${contentStudioContext?.aspectRatio || "Square (1:1)"}`,
    `Studio platform label: ${contentStudioContext?.platformLabel || ""}`,
    `Studio language label: ${contentStudioContext?.languageLabel || ""}`,
    `Studio tone label: ${contentStudioContext?.toneLabel || ""}`,
    `Studio include CTA: ${contentStudioContext?.includeCTA ? "Yes" : "No"}`,
    `Studio add emojis: ${contentStudioContext?.addEmojis ? "Yes" : "No"}`,
    `Studio auto hashtags: ${contentStudioContext?.autoHashtags ? "Yes" : "No"}`,
  ].join(" | ");

  const cityFeedNote = cityFeedContext?.trendTitle
    ? `CITY FEED INSIGHT TO INCLUDE (without stereotype visuals): Title="${cityFeedContext.trendTitle}", Type="${cityFeedContext.trendType || ""}", Impact="${cityFeedContext.trendImpact || ""}", Angle="${cityFeedContext.trendAngle || ""}", Detail="${cityFeedContext.trendDetail || ""}", City="${cityFeedContext.city || cityName || ""}".`
    : "";

  // ── Location flavour (strictly restrained, never stereotypical) ──────────
  const locationNote =
    cityName || area
      ? `LOCATION NOTE: If location is used, keep it subtle and modern (${[area, cityName].filter(Boolean).join(", ")}). Never use cliché city elements unless explicitly requested in context.`
      : "";

  // ── Extra context ─────────────────────────────────────────────────────────
  const contextNote = description ? `ADDITIONAL CONTEXT: ${description}` : "";
  
  // SECURITY FIX: Sanitize user-controlled logo URL to prevent prompt injection
  const sanitizedLogoUrl = restaurantLogoUrl 
    ? (restaurantLogoUrl.startsWith('http://') || restaurantLogoUrl.startsWith('https://'))
      ? restaurantLogoUrl.slice(0, 300) // Truncate to prevent injection
      : '' // Reject non-HTTP URLs
    : '';
  
  const logoNote = sanitizedLogoUrl
    ? `LOGO REQUIREMENT: Use the restaurant logo from this reference URL and integrate it naturally inside the design composition (such as signage, packaging, menu card, wall branding, or product label): ${sanitizedLogoUrl}. The logo must be clearly displayed and not omitted. Do NOT place it as a floating corner sticker or pasted top overlay. Use the logo exactly as provided (shape, colors, text), without redrawing, restyling, or simplifying it.`
    : "LOGO REQUIREMENT: A restaurant logo must be visible in the final poster and integrated naturally into the scene (signage/packaging/menu/label), not as a floating corner sticker. If no uploaded logo is available, create a clean placeholder logo lockup using the restaurant name without inventing a different brand.";
  
  const brandColorNote = restaurantBrandColor
    ? `BRAND COLOR REQUIREMENT: Respect the restaurant's primary brand color ${restaurantBrandColor} in accents, badges, or background elements.`
    : "BRAND COLOR REQUIREMENT: Use a coherent restaurant brand palette that feels premium and consistent.";
  const brandStoryNote = restaurantBrandStory
    ? `BRAND STORY REQUIREMENT: Reflect this brand story in the visual mood and layout: ${restaurantBrandStory}`
    : "BRAND STORY REQUIREMENT: Keep the visual identity consistent with a modern restaurant brand.";
  const grubgainNote = "GRUBGAIN BRANDING REQUIREMENT: Reserve clean negative space in BOTH bottom corners (bottom-left AND bottom-right) for small signature logo watermarks. Do NOT place important text, offers, CTAs, emojis, or decorative elements in the bottom 12% of the poster. Keep bottom corners clear and uncluttered.";
  const grubgainTextBanNote = "CRITICAL NEGATIVE INSTRUCTION: Do NOT generate any text that says 'GrubGain', 'Powered by GrubGain', 'grubgain.com', or any similar attribution/watermark text anywhere in the poster image. Brand watermarks will be added separately after image generation. The AI must NOT add platform or service attribution text.";
  const fullRestaurantDataNote = `RESTAURANT PROFILE DATA (MUST DRIVE CREATIVE): Name="${restaurantName}", Cuisine="${cuisineType}", City="${cityName}", Area="${area}", Signature Dishes="${signatureDishes}", Brand Tone="${brandTone}", Target Audience="${profile.targetAudience}", Tagline="${profile.tagline}", About="${profile.aboutDescription}", Standard Offers="${profile.standardOffers}", Price Range="${profile.priceRange}", Brand Hashtags="${profile.hashtags}", Instagram="${profile.instagramHandle}", Website="${profile.website}".`;

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

━━━ MANDATORY BRANDING ━━━
• The restaurant identity, logo, and name must be treated as mandatory elements, not optional decoration.
• The poster must include the restaurant logo, restaurant name, and location cues in a coherent hierarchy.
• Restaurant branding must be dominant and premium.
• Do not add extra mock watermarks, random brand logos, or UI-style stickers.
• PRIORITY RULE: Restaurant profile and Studio context are the source of truth. Ignore generic stock-city aesthetics.
• STRICT NEGATIVE RULE: Do NOT add rickshaws, generic Mumbai street scenes, random traffic, skyline clichés, or tourist postcard elements unless explicitly asked in the context.
• Use clean, premium, restaurant-first compositions. Background should support food + brand, not overpower it.

${logoNote}
${brandColorNote}
${brandStoryNote}
${fullRestaurantDataNote}
STUDIO CONTEXT (MUST APPLY): ${studioContextNote}
${cityFeedNote}
${grubgainNote}
${grubgainTextBanNote}

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
• CRITICAL FRAMING: Keep all critical elements (restaurant name, offer text, CTA, and hero food) fully inside a SAFE AREA with at least 8% padding from every edge.
• BOTTOM CORNER EXCLUSION ZONE: Reserve the bottom-left and bottom-right corners (bottom 12% height) exclusively for small logo watermarks. Do NOT place any text, CTAs, emojis, promotional copy, or decorative graphics in these corner zones.
• No edge clipping: do not place any text, plates, cups, faces, or badges touching or crossing the frame boundary.
• Maintain comfortable top and bottom breathing room so nothing appears cut off on mobile previews.
• COLOR DIRECTION: Do NOT apply a heavy brown/sepia cast unless explicitly required by the restaurant brand.
• Match the restaurant palette closely; if brand colors are provided, they must dominate highlights, accents, and key UI elements in the poster.
• Keep backgrounds neutral/premium by default; avoid muddy brown casts and avoid stereotypical local-scene clutter.
• No third-party watermarks. No stock-photo borders. No lorem ipsum placeholder text.
`.trim();
};

/**
 * Generate a complete content package (AI caption + gpt-image-1.5 branded poster).
 * Restaurant creative is generated natively by gpt-image-1.5.
 * A subtle exact GrubGain watermark is composited after generation.
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
      restaurantLogoUrl: params.restaurantLogoUrl || "",
      restaurantBrandColor: params.restaurantBrandColor || "",
      restaurantBrandStory: params.restaurantBrandStory || "",
      restaurantProfile: params.restaurantProfile || {},
      contentStudioContext: params.contentStudioContext || {},
      cityFeedContext: params.cityFeedContext || {},
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
      restaurantLogoUrl: params.restaurantLogoUrl || "",
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
        brandingApplied: true,
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

    // SECURITY FIX: Validate AI-generated JSON structure before spreading
    let events;
    try {
      events = JSON.parse(cleanJson);
    } catch (parseError) {
      logger.error("Failed to parse AI-generated JSON", { error: parseError.message });
      return []; // Graceful fallback
    }

    // Type guard: Ensure it's an array
    if (!Array.isArray(events)) {
      logger.warn("AI returned non-array JSON for events", { type: typeof events });
      return [];
    }

    // Validate and sanitize each event object
    const validEvents = events
      .filter(ev => {
        // Basic structure validation
        if (!ev || typeof ev !== 'object') return false;
        if (typeof ev.title !== 'string') return false;
        if (!['event', 'Local Insights'].includes(ev.type)) return false;
        return true;
      })
      .map((ev, i) => ({
        // Explicitly construct safe object - don't spread untrusted AI data
        id: `dynamic-event-${Date.now()}-${i}`,
        title: String(ev.title).slice(0, 200), // Sanitize and limit length
        type: ev.type,
        date: ev.date ? String(ev.date).slice(0, 50) : undefined,
        description: ev.description ? String(ev.description).slice(0, 500) : undefined,
        source: ev.source ? String(ev.source).slice(0, 100) : 'Unknown',
        icon: ev.source?.toLowerCase().includes("sport") ? "event" : "google",
      }));

    return validEvents;
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
