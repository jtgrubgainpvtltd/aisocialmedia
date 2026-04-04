import { body, validationResult } from "express-validator";
import * as openaiService from "../services/openaiService.js";
import logger from "../utils/logger.js";
import prisma from "../../prisma/client.js";
import {
  normalizeLanguageInput,
  normalizePlatformInput,
} from "../utils/contentNormalization.js";

// ---------------------------------------------------------
//  POST /api/v1/content/generate   (authenticated)
// ---------------------------------------------------------
export const generateContent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.user.id;
    const {
      restaurantName,
      restaurantType,
      city,
      tone,
      dishName,
      occasion,
      hashtags,
      platform,
      language,
      imageStyle,
      imageSize,
      imageQuality,
      generateImage: shouldGenerateImage = true,
      includeCTA = false,
      addEmojis = false,
      autoHashtags = false,
      prompt: customPrompt,
      campaignType,
      dishDescription,
      contentStudioContext,
      cityFeedContext,
    } = req.body;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: {
          include: {
            brandAssets: {
              where: { iud_flag: { not: 'D' } },
              orderBy: { created_on: 'desc' }
            }
          }
        },
      },
    });

    if (!userRecord || !userRecord.restaurant) {
      return res
        .status(404)
        .json({
          success: false,
          error: {
            message:
              "Restaurant profile not found. Please complete your profile first.",
          },
        });
    }

    const restaurant = userRecord.restaurant;
    const normalizedPlatform = normalizePlatformInput(platform, "INSTAGRAM");
    const normalizedLanguage = normalizeLanguageInput(language, "BILINGUAL");
    const restaurantLogoUrl = restaurant.logo_url || restaurant.brandAssets?.find((asset) => asset.asset_type === 'LOGO' && asset.file_url)?.file_url || null;
    let caption, imageUrl, metadata;

    if (shouldGenerateImage) {
      if (!restaurant.name || !restaurant.cuisine_type || !restaurant.city || !restaurantLogoUrl) {
        return res.status(400).json({
          success: false,
          error: {
            message:
              "Restaurant name, cuisine, city, and a uploaded logo are mandatory before generating branded images.",
          },
        });
      }

      const result = await openaiService.generateFullContent({
        restaurantName: restaurant.name || restaurantName,
        restaurantType: restaurant.cuisine_type || restaurantType,
        city: restaurant.city || city,
        area: restaurant.area,
        tone: restaurant.brand_tone || tone,
        signatureDishes: restaurant.signature_dishes,
        restaurantLogoUrl,
        restaurantBrandColor: restaurant.brand_color,
        restaurantBrandStory: restaurant.brand_story,
        language: normalizedLanguage,
        occasion,
        dishName,
        dishDescription,
        hashtags,
        imageStyle,
        imageSize,
        imageQuality,
        campaignType,
        prompt: customPrompt || occasion,
        includeCTA,
        addEmojis,
        autoHashtags,
        contentStudioContext: contentStudioContext || {},
        cityFeedContext: cityFeedContext || {},
        restaurantProfile: {
          name: restaurant.name || "",
          city: restaurant.city || "",
          area: restaurant.area || "",
          cuisineType: restaurant.cuisine_type || "",
          targetAudience: restaurant.target_audience || "",
          brandTone: restaurant.brand_tone || "",
          languagePreference: restaurant.language_preference || "",
          aboutDescription: restaurant.about_description || "",
          signatureDishes: restaurant.signature_dishes || "",
          standardOffers: restaurant.standard_offers || "",
          hashtags: restaurant.hashtags || "",
          brandColor: restaurant.brand_color || "",
          brandStory: restaurant.brand_story || "",
          mascotUrl: restaurant.mascot_url || "",
          tagline: restaurant.tagline || "",
          priceRange: restaurant.price_range || "",
          instagramHandle: restaurant.instagram_handle || "",
          twitterHandle: restaurant.twitter_handle || "",
          website: restaurant.website || "",
        },
      });
      caption = result.caption;
      imageUrl = result.imageUrl;
      metadata = result.metadata;
    } else {
      const result = await openaiService.generateCaption({
        restaurantName: restaurant.name || restaurantName,
        restaurantType: restaurant.cuisine_type || restaurantType,
        city: restaurant.city || city,
        tone: restaurant.brand_tone || tone || "casual",
        language: normalizedLanguage,
        occasion,
        dishName,
        hashtags,
        addEmojis,
        includeCTA,
      });
      caption = result.caption;
      metadata = { caption: result.metadata };
    }

    // Parse bilingual captions
    let captionEnglish = caption;
    let captionHindi = null;

    if (normalizedLanguage === "BILINGUAL" && caption) {
      const parts = caption.split(/\n{2,}/); // Split on blank lines
      if (parts.length >= 2) {
        captionEnglish = parts[0].trim();
        captionHindi = parts[1].trim();
      }
    } else if (normalizedLanguage === "HINDI") {
      captionEnglish = null;
      captionHindi = caption;
    }

    const savedContent = await prisma.generatedContent.create({
      data: {
        restaurant_id: restaurant.id,
        platform: normalizedPlatform,
        language: normalizedLanguage,
        tone: tone || "casual",
        prompt:
          customPrompt ||
          JSON.stringify({ dishName, occasion, tone, campaignType }),
        caption_english: captionEnglish,
        caption_hindi: captionHindi,
        hashtags: Array.isArray(hashtags)
          ? hashtags.join(", ")
          : hashtags || null,
        include_cta: includeCTA,
        add_emojis: addEmojis,
        auto_hashtags: autoHashtags,
        image_url: imageUrl || null,
        status: "DRAFT",
        iud_flag: "I",
        created_by: userId.toString(),
        updated_by: userId.toString(),
      },
    });

    logger.info("Content generated and saved", { contentId: savedContent.id });

    res.json({
      success: true,
      message: "Content generated and saved successfully",
      data: {
        contentId: savedContent.id,
        caption,
        imageUrl,
        metadata,
      },
    });
  } catch (error) {
    logger.error("Error in generateContent controller", {
      error: error.message,
    });
    next(error);
  }
};

// ---------------------------------------------------------
//  GET /api/v1/content/history   (authenticated)
// ---------------------------------------------------------
export const getContentHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100); // Min 1, Max 100
    const safeOffset = Math.max(parseInt(offset) || 0, 0); // Min 0

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!userRecord || !userRecord.restaurant) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Restaurant not found" } });
    }

    const content = await prisma.generatedContent.findMany({
      where: {
        restaurant_id: userRecord.restaurant.id,
        iud_flag: { not: "D" },
      },
      orderBy: { created_on: "desc" },
      take: safeLimit,
      skip: safeOffset,
    });

    res.json({ success: true, data: { content } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
//  GET /api/v1/content/stats   (authenticated)
// ---------------------------------------------------------
export const getContentStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!userRecord || !userRecord.restaurant) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Restaurant not found" } });
    }

    const generated = await prisma.generatedContent.count({
      where: {
        restaurant_id: userRecord.restaurant.id,
        iud_flag: { not: "D" },
      },
    });
    const scheduled = await prisma.scheduledPost.count({
      where: {
        restaurant_id: userRecord.restaurant.id,
        iud_flag: { not: "D" },
      },
    });
    const published = await prisma.publishedPost.count({
      where: { restaurant_id: userRecord.restaurant.id },
    });

    res.json({ success: true, data: { generated, scheduled, published } });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
//  GET /api/v1/content/:id   (authenticated)
// ---------------------------------------------------------
export const getContentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurant?.id;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'User does not belong to a restaurant' }
      });
    }

    const content = await prisma.generatedContent.findFirst({
      where: { 
        id: parseInt(id),
        restaurant_id: restaurantId,
        iud_flag: { not: "D" }
      },
      include: {
        restaurant: { select: { name: true, city: true, cuisine_type: true } },
      },
    });

    if (!content) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Content not found" } });
    }

    res.json({ success: true, data: content });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
//  DELETE /api/v1/content/:id   (authenticated)
// ---------------------------------------------------------
export const deleteContent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true },
    });

    if (!userRecord?.restaurant) {
      return res
        .status(404)
        .json({ success: false, error: { message: "Restaurant not found" } });
    }

    // Ownership check — only delete if this content belongs to THIS restaurant
    const existing = await prisma.generatedContent.findFirst({
      where: {
        id: parseInt(id),
        restaurant_id: userRecord.restaurant.id,
        iud_flag: { not: "D" },
      },
    });

    if (!existing) {
      return res
        .status(404)
        .json({
          success: false,
          error: { message: "Content not found or not yours" },
        });
    }

    await prisma.generatedContent.update({
      where: { id: parseInt(id) },
      data: { iud_flag: "D", updated_by: userId.toString() },
    });

    logger.info("Content soft-deleted", { contentId: id, userId });
    res.json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const testCaption = async (req, res, next) => {
  try {
    const {
      restaurantName,
      restaurantType,
      city,
      tone,
      occasion,
      dishName,
      hashtags,
    } = req.body;
    const result = await openaiService.generateCaption({
      restaurantName: restaurantName || "",
      restaurantType: restaurantType || "",
      city: city || "",
      tone: tone || "casual",
      occasion,
      dishName,
      hashtags,
    });
    res.json({
      success: true,
      data: { caption: result.caption, metadata: result.metadata },
    });
  } catch (error) {
    logger.error("Error in testCaption", { error: error.message });
    next(error);
  }
};

export const testImage = async (req, res, next) => {
  try {
    const {
      prompt,
      dishName,
      cuisineType,
      description,
      style,
      size,
      quality,
      dallEStyle,
    } = req.body;
    let imagePrompt = prompt;
    if (!prompt && dishName) {
      imagePrompt = await openaiService.generateFoodPrompt({
        dishName,
        cuisineType: cuisineType || "",
        description,
        style: style || "appetizing",
      });
    } else if (!prompt) {
      imagePrompt =
        "Professional food photography, appetizing, vibrant colors, restaurant quality";
    }
    const result = await openaiService.generateImage({
      prompt: imagePrompt,
      size: size || "1024x1024",
      quality: quality || "high",
    });
    res.json({
      success: true,
      data: {
        imageUrl: result.imageUrl,
        revisedPrompt: result.revisedPrompt,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    logger.error("Error in testImage", { error: error.message });
    next(error);
  }
};

export const testFullContent = async (req, res, next) => {
  try {
    const result = await openaiService.generateFullContent({
      restaurantName: req.body.restaurantName || "",
      restaurantType: req.body.restaurantType || "",
      city: req.body.city || "",
      tone: req.body.tone || "casual",
      occasion: req.body.occasion,
      dishName: req.body.dishName || "",
      dishDescription: req.body.dishDescription,
      hashtags: req.body.hashtags || [],
      imageStyle: req.body.imageStyle || "appetizing",
      imageSize: req.body.imageSize || "1024x1024",
      imageQuality: req.body.imageQuality || "standard",
      dallEStyle: req.body.dallEStyle || "vivid",
    });
    res.json({
      success: true,
      data: {
        caption: result.caption,
        imageUrl: result.imageUrl,
        metadata: result.metadata,
      },
    });
  } catch (error) {
    logger.error("Error in testFullContent", { error: error.message });
    next(error);
  }
};

export const generateContentValidation = [
  body("restaurantName").optional().isString(),
  body("tone")
    .optional()
    .custom((value) => {
      const allowedTones = new Set([
        "casual",
        "professional",
        "fun",
        "elegant",
        "festive",
        "humorous",
        "emotional",
      ]);
      return allowedTones.has(String(value).trim().toLowerCase());
    })
    .withMessage("Invalid tone value"),
  body("imageSize").optional().isIn(["1024x1024", "1024x1792", "1792x1024"]),
  body("imageQuality").optional().isIn(["low", "medium", "high", "auto"]),
];

export default {
  generateContent,
  generateContentValidation,
  getContentHistory,
  getContentStats,
  getContentById,
  deleteContent,
  testCaption,
  testImage,
  testFullContent,
};
