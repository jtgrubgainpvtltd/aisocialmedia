import { PrismaClient } from '@prisma/client';
import { encrypt } from '../src/server/utils/encryption.js';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed configuration settings with encrypted API keys
    console.log('📝 Seeding configuration settings...');

    const configs = [];

    // OpenAI API Key
    if (process.env.OPENAI_API_KEY) {
      const encryptedOpenAI = encrypt(process.env.OPENAI_API_KEY);
      configs.push({
        config_key: 'OPENAI_API_KEY',
        config_value: encryptedOpenAI,
        description: 'OpenAI API key for content generation',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    // Meta Access Token
    if (process.env.META_ACCESS_TOKEN) {
      const encryptedMeta = encrypt(process.env.META_ACCESS_TOKEN);
      configs.push({
        config_key: 'META_ACCESS_TOKEN',
        config_value: encryptedMeta,
        description: 'Meta API access token for social media posting',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    // Local storage config
    if (process.env.UPLOADS_DIR) {
      configs.push({
        config_key: 'UPLOADS_DIR',
        config_value: process.env.UPLOADS_DIR,
        description: 'Local uploads directory for VDI storage',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    // Google Services API Key
    if (process.env.GOOGLE_SERVICES_API_KEY) {
      const encryptedGoogleKey = encrypt(process.env.GOOGLE_SERVICES_API_KEY);
      configs.push({
        config_key: 'GOOGLE_SERVICES_API_KEY',
        config_value: encryptedGoogleKey,
        description: 'Google Services API key for Places, Trends, Analytics',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    // Google OAuth credentials
    if (process.env.GOOGLE_OAUTH_CLIENT_ID) {
      configs.push({
        config_key: 'GOOGLE_OAUTH_CLIENT_ID',
        config_value: process.env.GOOGLE_OAUTH_CLIENT_ID,
        description: 'Google OAuth Client ID for Business Profile integration',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    if (process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
      const encryptedGoogleSecret = encrypt(process.env.GOOGLE_OAUTH_CLIENT_SECRET);
      configs.push({
        config_key: 'GOOGLE_OAUTH_CLIENT_SECRET',
        config_value: encryptedGoogleSecret,
        description: 'Google OAuth Client Secret',
        is_active: true,
        iud_flag: 'I',
        created_by: 'system'
      });
    }

    // Insert configs if any exist
    if (configs.length > 0) {
      for (const config of configs) {
        await prisma.configSetting.upsert({
          where: { config_key: config.config_key },
          update: {
            config_value: config.config_value,
            updated_by: 'system',
            updated_on: new Date(),
            iud_flag: 'U'
          },
          create: config
        });
      }
      console.log(`✅ Seeded ${configs.length} configuration settings`);
    } else {
      console.log('⚠️  No API keys found in environment variables');
      console.log('   Set OPENAI_API_KEY, META_ACCESS_TOKEN, and storage credentials in .env');
    }

    // Seed sample cities for trends
    console.log('📝 Seeding sample city data...');
    const cities = ['Pune', 'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai'];

    for (const city of cities) {
      // Create sample trend
      await prisma.cityTrend.create({
        data: {
          city,
          type: 'WEATHER',
          title: `${city} Weather Update`,
          description: `Current weather conditions in ${city}`,
          source: 'Seeded Data',
          impact_level: 'MEDIUM',
          suggested_angle: `Create content around ${city} weather`,
          trend_date: new Date(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          iud_flag: 'I',
          created_by: 'system'
        }
      }).catch((error) => { 
        console.log(`⚠️  Skipping duplicate city trend for ${city}`);
      });
    }

    console.log('✅ Database seeding completed successfully');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
