#!/usr/bin/env node

/**
 * Diagnostic script to check ngrok and photo URL accessibility
 * Helps identify why Meta can't access photo URLs
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PHOTO_URL = `${process.env.BASE_URL || 'http://localhost:3000'}/assets/photos/inca_show.jpg`;
console.log("PHOTO_ URL ?AEFAE?FIPENFA ", PHOTO_URL);
async function diagnose() {
  console.log('\n🔍 WhatsApp Photo URL Diagnostic\n');

  console.log('📊 Configuration:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`   BASE_URL: ${process.env.BASE_URL || 'not set'}`);
  console.log(`   PORT: ${process.env.PORT || '3000'}\n`);

  console.log('🖼️ Photo URL being used:');
  console.log(`   ${PHOTO_URL}\n`);

  // Test 1: Check if URL is accessible
  console.log('⏳ Test 1: Checking if URL is accessible...');
  try {
    const response = await axios.head(PHOTO_URL, {
      timeout: 5000,
      maxRedirects: 5
    });
    console.log(`✅ URL is accessible (Status: ${response.status})\n`);
  } catch (error) {
    console.log(`❌ URL is NOT accessible`);
    console.log(`   Error: ${error.message}\n`);
    console.log('🔧 Solutions:\n');
    console.log('   1. Check if ngrok is running: ngrok http 3000');
    console.log('   2. Verify BASE_URL in .env matches your current ngrok URL');
    console.log('   3. Check if the bot server is running on port 3000\n');
    process.exit(1);
  }

  // Test 2: Check response headers
  console.log('⏳ Test 2: Checking response headers...');
  try {
    const response = await axios.head(PHOTO_URL, {
      timeout: 5000,
      maxRedirects: 5
    });

    console.log('✅ Headers:');
    console.log(`   Content-Type: ${response.headers['content-type'] || 'not set'}`);
    console.log(`   Content-Length: ${response.headers['content-length'] || 'not set'}`);
    console.log(`   Server: ${response.headers['server'] || 'not set'}\n`);
  } catch (error) {
    console.log(`❌ Failed to read headers: ${error.message}\n`);
  }

  // Test 3: Try to download a small chunk
  console.log('⏳ Test 3: Attempting to download image...');
  try {
    const response = await axios.get(PHOTO_URL, {
      timeout: 5000,
      maxRedirects: 5,
      responseType: 'arraybuffer'
    });

    const sizeMB = (response.data.length / 1024 / 1024).toFixed(2);
    console.log(`✅ Image downloaded successfully`);
    console.log(`   Size: ${sizeMB} MB\n`);
  } catch (error) {
    console.log(`❌ Failed to download image: ${error.message}\n`);
  }

  // Test 4: What ngrok should be
  console.log('⏳ Test 4: Checking ngrok status...');

  if (process.env.BASE_URL) {
    const currentNgrokUrl = process.env.BASE_URL;
    console.log(`📍 Current BASE_URL: ${currentNgrokUrl}`);
    console.log(`\n💡 Check your ngrok terminal to see if the URL is still:\n`);
    console.log(`   Forwarding ... ${currentNgrokUrl} -> http://localhost:3000\n`);
    console.log(`If ngrok shows a DIFFERENT URL, update BASE_URL in .env\n`);
  }

  console.log('✅ Diagnostic complete!\n');
  console.log('Next steps:');
  console.log('1. If URL is accessible: Images should work now');
  console.log('2. If URL is NOT accessible: Update BASE_URL with correct ngrok URL');
  console.log('3. If ngrok URL expired: Restart ngrok: ngrok http 3000\n');
}

diagnose().catch((error) => {
  console.error('Diagnostic failed:', error.message);
  process.exit(1);
});
