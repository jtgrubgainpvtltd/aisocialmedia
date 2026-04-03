import prisma from '../../prisma/client.js';
import * as storageService from '../services/storageService.js';
import logger from '../utils/logger.js';

/**
 * Get restaurant profile
 * GET /api/v1/restaurant
 */
export const getRestaurant = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        restaurant: {
          include: {
            brandAssets: {
              where: { iud_flag: { not: 'D' } },
              orderBy: { created_on: 'desc' }
            }
          }
        }
      }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    res.json({
      success: true,
      data: user.restaurant
    });

  } catch (error) {
    logger.error('Error in getRestaurant controller', { error: error.message });
    next(error);
  }
};

/**
 * Update restaurant profile
 * PUT /api/v1/restaurant
 */
export const updateRestaurant = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    // Build update object (only include provided fields)
    const data = {};
    if (updateData.name !== undefined) data.name = updateData.name;
    if (updateData.city !== undefined) data.city = updateData.city;
    if (updateData.area !== undefined) data.area = updateData.area;
    if (updateData.cuisine_type !== undefined) data.cuisine_type = updateData.cuisine_type;
    if (updateData.target_audience !== undefined) data.target_audience = updateData.target_audience;
    if (updateData.brand_tone !== undefined) data.brand_tone = updateData.brand_tone;
    if (updateData.language_preference !== undefined) data.language_preference = updateData.language_preference;
    if (updateData.about_description !== undefined) data.about_description = updateData.about_description;
    if (updateData.signature_dishes !== undefined) data.signature_dishes = updateData.signature_dishes;
    if (updateData.standard_offers !== undefined) data.standard_offers = updateData.standard_offers;
    if (updateData.hashtags !== undefined) data.hashtags = updateData.hashtags;
    if (updateData.logo_url !== undefined) data.logo_url = updateData.logo_url;
    // Restored extended fields:
    if (updateData.phone_number !== undefined) data.phone_number = updateData.phone_number;
    if (updateData.contact_email !== undefined) data.contact_email = updateData.contact_email;
    if (updateData.website !== undefined) data.website = updateData.website;
    if (updateData.google_maps_url !== undefined) data.google_maps_url = updateData.google_maps_url;
    if (updateData.full_address !== undefined) data.full_address = updateData.full_address;
    if (updateData.tagline !== undefined) data.tagline = updateData.tagline;
    if (updateData.mascot_url !== undefined) data.mascot_url = updateData.mascot_url;
    if (updateData.brand_color !== undefined) data.brand_color = updateData.brand_color;
    if (updateData.brand_story !== undefined) data.brand_story = updateData.brand_story;
    if (updateData.price_range !== undefined) data.price_range = updateData.price_range;
    if (updateData.avg_order_value !== undefined) data.avg_order_value = updateData.avg_order_value;
    if (updateData.gst_number !== undefined) data.gst_number = updateData.gst_number;
    if (updateData.fssai_license !== undefined) data.fssai_license = updateData.fssai_license;
    if (updateData.owner_name !== undefined) data.owner_name = updateData.owner_name;
    if (updateData.instagram_handle !== undefined) data.instagram_handle = updateData.instagram_handle;
    if (updateData.facebook_page !== undefined) data.facebook_page = updateData.facebook_page;
    if (updateData.twitter_handle !== undefined) data.twitter_handle = updateData.twitter_handle;

    data.iud_flag = 'U';
    data.updated_by = userId.toString();

    const updated = await prisma.restaurant.update({
      where: { id: user.restaurant.id },
      data
    });

    logger.info('Restaurant updated', { restaurantId: updated.id });

    res.json({
      success: true,
      message: 'Restaurant updated successfully',
      data: updated
    });

  } catch (error) {
    logger.error('Error in updateRestaurant controller', { error: error.message });
    next(error);
  }
};

/**
 * Upload brand asset
 * POST /api/v1/restaurant/assets
 */
export const uploadAsset = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: { message: 'No file uploaded' }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    // Upload to local VDI storage
    const result = await storageService.uploadImage(
      file.buffer,
      `restaurants/${user.restaurant.id}/assets`,
      { mimetype: file.mimetype }
    );

    // Save to database
    const asset = await prisma.brandAsset.create({
      data: {
        restaurant_id: user.restaurant.id,
        asset_type: req.body.asset_type || 'LOGO',
        file_url: result.secure_url,
        cloudinary_public_id: result.public_id, // retained for backward compatibility
        file_name: file.originalname,
        file_size: file.size,
        iud_flag: 'I',
        created_by: userId.toString(),
        updated_by: userId.toString()
      }
    });

    if ((req.body.asset_type || 'LOGO') === 'LOGO') {
      await prisma.restaurant.update({
        where: { id: user.restaurant.id },
        data: {
          logo_url: result.secure_url,
          updated_by: userId.toString()
        }
      });
    }

    logger.info('Brand asset uploaded', { assetId: asset.id });

    res.json({
      success: true,
      message: 'Asset uploaded successfully',
      data: asset
    });

  } catch (error) {
    logger.error('Error in uploadAsset controller', { error: error.message });
    next(error);
  }
};

/**
 * Get brand assets
 * GET /api/v1/restaurant/assets
 */
export const getAssets = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { restaurant: true }
    });

    if (!user || !user.restaurant) {
      return res.status(404).json({
        success: false,
        error: { message: 'Restaurant not found' }
      });
    }

    const assets = await prisma.brandAsset.findMany({
      where: {
        restaurant_id: user.restaurant.id,
        iud_flag: { not: 'D' }
      },
      orderBy: { created_on: 'desc' }
    });

    res.json({
      success: true,
      data: assets
    });

  } catch (error) {
    logger.error('Error in getAssets controller', { error: error.message });
    next(error);
  }
};

/**
 * Delete brand asset
 * DELETE /api/v1/restaurant/assets/:id
 */
export const deleteAsset = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const restaurantId = req.user.restaurant?.id;
    const { id } = req.params;

    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        error: { message: 'User does not belong to a restaurant' }
      });
    }

    const asset = await prisma.brandAsset.findFirst({
      where: { 
        id: parseInt(id),
        restaurant_id: restaurantId
      }
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: { message: 'Asset not found' }
      });
    }

    // Delete from local storage
    if (asset.cloudinary_public_id) {
      await storageService.deleteImage(asset.cloudinary_public_id);
    }

    // Soft delete from database
    await prisma.brandAsset.update({
      where: { id: parseInt(id) },
      data: {
        iud_flag: 'D',
        updated_by: userId.toString()
      }
    });

    logger.info('Brand asset deleted', { assetId: id });

    res.json({
      success: true,
      message: 'Asset deleted successfully'
    });

  } catch (error) {
    logger.error('Error in deleteAsset controller', { error: error.message });
    next(error);
  }
};

export default {
  getRestaurant,
  updateRestaurant,
  uploadAsset,
  getAssets,
  deleteAsset
};
