#!/usr/bin/env node

/**
 * Test script to verify photo URLs are accessible
 * Usage: node test-photo-urls.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Determine base URL (same logic as webhook.ts)
function getPhotoBaseUrl() {
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return 'https://inca-london-wa-bot-av-dvhtghakgxaaetds.francecentral-01.azurewebsites.net';
  }
  return `http://localhost:${process.env.PORT || 3000}`;
}

// Photo files to test
const PHOTO_FILES = [
  'inca_luna_lounge.jpg',
  'inca_main_room.jpg',
  'inca_show.jpg',
  'inca_show_two.jpg',
];

async function testPhotoUrls() {
  const baseUrl = getPhotoBaseUrl();

  console.log('\n🖼️  Photo URL Test\n');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`🔗 BASE_URL env: ${process.env.BASE_URL || 'not set'}\n`);

  console.log('Testing photo accessibility...\n');

  let passCount = 0;
  let failCount = 0;

  for (const file of PHOTO_FILES) {
    const photoUrl = `${baseUrl}/assets/photos/${file}`;

    try {
      const response = await axios.head(photoUrl, { timeout: 5000 });

      if (response.status === 200) {
        console.log(`✅ ${file}`);
        console.log(`   URL: ${photoUrl}`);
        console.log(`   Status: ${response.status}\n`);
        passCount++;
      } else {
        console.log(`⚠️  ${file}`);
        console.log(`   URL: ${photoUrl}`);
        console.log(`   Status: ${response.status}\n`);
        failCount++;
      }
    } catch (error) {
      console.log(`❌ ${file}`);
      console.log(`   URL: ${photoUrl}`);
      console.log(`   Error: ${error.message}\n`);
      failCount++;
    }
  }

  console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed\n`);

  if (failCount === 0) {
    console.log('✅ All photo URLs are accessible! Photos should send correctly.\n');
    process.exit(0);
  } else {
    console.log('❌ Some photo URLs failed. Check your configuration:\n');

    if (process.env.BASE_URL) {
      console.log(`   - BASE_URL is set to: ${process.env.BASE_URL}`);
      console.log('   - Make sure this ngrok URL is currently active');
      console.log('   - Ngrok URLs change every 2 hours on the free plan\n');
    } else if (process.env.NODE_ENV === 'production') {
      console.log('   - NODE_ENV is production, using Azure URL');
      console.log('   - Verify the Azure app is deployed and running\n');
    } else {
      console.log('   - Using localhost:3000');
      console.log('   - Make sure the server is running: npm start\n');
    }

    console.log('🔧 Solutions:\n');
    console.log('1. Local with ngrok:');
    console.log('   - Start ngrok: ngrok http 3000');
    console.log('   - Update BASE_URL in .env\n');
    console.log('2. Production with Azure:');
    console.log('   - Set NODE_ENV=production');
    console.log('   - Verify Azure deployment\n');

    process.exit(1);
  }
}

testPhotoUrls().catch((error) => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
