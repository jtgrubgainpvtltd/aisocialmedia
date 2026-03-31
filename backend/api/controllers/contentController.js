import { body, validationResult } from 'express-validator';
import * as openaiService from '../services/openaiService.js';
import logger from '../utils/logger.js';
import prisma from '../../prisma/client.js';

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
      restaurantName, restaurantType, city, tone, dishName, occasion,
      hashtags, platform, language, imageStyle, imageSize, imageQuality,
      generateImage: shouldGenerateImage = true,
      includeCTA = false, addEmojis = false, autoHashtags = false,
      prompt: customPrompt, campaignType, dishDescription
    } = req.body;

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!userRecord || !userRecord.restaurant) {
      return res.status(404).json({ success: false, error: { message: 'Restaurant profile not found. Please complete your profile first.' } });
    }

    const restaurant = userRecord.restaurant;
    let caption, imageUrl, metadata;

    if (shouldGenerateImage) {
      const result = await openaiService.generateFullContent({
        restaurantName: restaurant.name || restaurantName,
        restaurantType: restaurant.cuisine_type || restaurantType,
        city: restaurant.city || city,
        area: restaurant.area,
        tone: restaurant.brand_tone || tone,
        signatureDishes: restaurant.signature_dishes,
        occasion, dishName, dishDescription,
        hashtags, imageStyle, imageSize, imageQuality, campaignType,
        prompt: customPrompt || occasion,
        dallEStyle: 'vivid'
      });
      caption = result.caption;
      imageUrl = result.imageUrl;
      metadata = result.metadata;
    } else {
      const result = await openaiService.generateCaption({
        restaurantName: restaurant.name || restaurantName,
        restaurantType: restaurant.cuisine_type || restaurantType,
        city: restaurant.city || city,
        tone: restaurant.brand_tone || tone || 'casual',
        occasion, dishName, hashtags
      });
      caption = result.caption;
      metadata = { caption: result.metadata };
    }

    const savedContent = await prisma.generatedContent.create({
      data: {
        restaurant_id: restaurant.id,
        platform: (platform || 'INSTAGRAM').toUpperCase(),
        language: language || 'BILINGUAL',
        tone: tone || 'casual',
        prompt: customPrompt || JSON.stringify({ dishName, occasion, tone }),
        caption_english: caption,
        caption_hindi: null,
        hashtags: Array.isArray(hashtags) ? hashtags.join(', ') : (hashtags || null),
        include_cta: includeCTA,
        add_emojis: addEmojis,
        auto_hashtags: autoHashtags,
        image_url: imageUrl || null,
        status: 'DRAFT',
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    logger.info('Content generated and saved', { contentId: savedContent.id });

    res.json({
      success: true,
      message: 'Content generated and saved successfully',
      data: {
        contentId: savedContent.id,
        caption,
        imageUrl,
        metadata
      }
    });

  } catch (error) {
    logger.error('Error in generateContent controller', { error: error.message });
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

    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!userRecord || !userRecord.restaurant) {
      return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });
    }

    const content = await prisma.generatedContent.findMany({
      where: { restaurant_id: userRecord.restaurant.id, iud_flag: { not: 'D' } },
      orderBy: { created_on: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
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
      include: { restaurant: true }
    });

    if (!userRecord || !userRecord.restaurant) {
      return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });
    }

    const generated = await prisma.generatedContent.count({
      where: { restaurant_id: userRecord.restaurant.id, iud_flag: { not: 'D' } }
    });
    const scheduled = await prisma.scheduledPost.count({
      where: { restaurant_id: userRecord.restaurant.id, iud_flag: { not: 'D' } }
    });
    const published = await prisma.publishedPost.count({
      where: { restaurant_id: userRecord.restaurant.id }
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
    const content = await prisma.generatedContent.findFirst({
      where: { id: parseInt(id), iud_flag: { not: 'D' } },
      include: { restaurant: { select: { name: true, city: true, cuisine_type: true } } }
    });

    if (!content) {
      return res.status(404).json({ success: false, error: { message: 'Content not found' } });
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

    await prisma.generatedContent.update({
      where: { id: parseInt(id) },
      data: { iud_flag: 'D', updated_by: userId.toString() }
    });

    logger.info('Content soft-deleted', { contentId: id });
    res.json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
//  Test endpoints (no auth needed; rate limited on upper layer)
// ---------------------------------------------------------
export const testCaption = async (req, res, next) => {
  try {
    const { restaurantName, restaurantType, city, tone, occasion, dishName, hashtags } = req.body;
    const result = await openaiService.generateCaption({
      restaurantName: restaurantName || '',
      restaurantType: restaurantType || '',
      city: city || '',
      tone: tone || 'casual',
      occasion, dishName, hashtags
    });
    res.json({ success: true, data: { caption: result.caption, metadata: result.metadata } });
  } catch (error) {
    logger.error('Error in testCaption', { error: error.message });
    next(error);
  }
};

export const testImage = async (req, res, next) => {
  try {
    const { prompt, dishName, cuisineType, description, style, size, quality, dallEStyle } = req.body;
    let imagePrompt = prompt;
    if (!prompt && dishName) {
      imagePrompt = await openaiService.generateFoodPrompt({ dishName, cuisineType: cuisineType || '', description, style: style || 'appetizing' });
    } else if (!prompt) {
      imagePrompt = 'Professional food photography, appetizing, vibrant colors, restaurant quality';
    }
    const result = await openaiService.generateImage({ prompt: imagePrompt, size: size || '1024x1024', quality: quality || 'standard', style: dallEStyle || 'vivid' });
    res.json({ success: true, data: { imageUrl: result.imageUrl, revisedPrompt: result.revisedPrompt, metadata: result.metadata } });
  } catch (error) {
    logger.error('Error in testImage', { error: error.message });
    next(error);
  }
};

export const testFullContent = async (req, res, next) => {
  try {
    const result = await openaiService.generateFullContent({
      restaurantName: req.body.restaurantName || '',
      restaurantType: req.body.restaurantType || '',
      city: req.body.city || '',
      tone: req.body.tone || 'casual',
      occasion: req.body.occasion,
      dishName: req.body.dishName || '',
      dishDescription: req.body.dishDescription,
      hashtags: req.body.hashtags || [],
      imageStyle: req.body.imageStyle || 'appetizing',
      imageSize: req.body.imageSize || '1024x1024',
      imageQuality: req.body.imageQuality || 'standard',
      dallEStyle: req.body.dallEStyle || 'vivid'
    });
    res.json({ success: true, data: { caption: result.caption, imageUrl: result.imageUrl, metadata: result.metadata } });
  } catch (error) {
    logger.error('Error in testFullContent', { error: error.message });
    next(error);
  }
};

export const generateContentValidation = [
  body('restaurantName').optional().isString(),
  body('tone').optional().isIn(['casual', 'professional', 'fun', 'elegant']),
  body('imageSize').optional().isIn(['1024x1024', '1024x1792', '1792x1024']),
  body('imageQuality').optional().isIn(['standard', 'hd'])
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
  testFullContent
};