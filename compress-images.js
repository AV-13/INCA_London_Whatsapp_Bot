#!/usr/bin/env node

/**
 * Compress images for WhatsApp compatibility
 * Meta recommends images < 100KB for optimal delivery
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PHOTO_DIR = path.join(__dirname, 'assets', 'photos');
const TARGET_SIZE = 100; // Target size in KB
const MAX_WIDTH = 1280; // Max width for WhatsApp
const MAX_HEIGHT = 1280; // Max height for WhatsApp

async function compressImage(inputPath, outputPath) {
  try {
    console.log(`\n📸 Processing: ${path.basename(inputPath)}`);

    // Get original size
    const originalStats = await fs.stat(inputPath);
    const originalSizeMB = (originalStats.size / 1024 / 1024).toFixed(2);
    console.log(`   Original size: ${originalSizeMB} MB`);

    // Read and process image
    let image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`   Dimensions: ${metadata.width}x${metadata.height}`);

    // Resize if needed
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      console.log(`   ⚠️  Resizing to ${MAX_WIDTH}x${MAX_HEIGHT}...`);
      image = image.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Start with quality 80 and adjust
    let quality = 80;
    let buffer;
    let size;

    while (quality > 40) {
      buffer = await image.jpeg({ quality, progressive: true }).toBuffer();
      size = buffer.length / 1024; // Size in KB

      console.log(`   Quality ${quality}%: ${size.toFixed(1)} KB`);

      if (size <= TARGET_SIZE) {
        break;
      }

      quality -= 5;
    }

    // Write compressed image
    await fs.writeFile(outputPath, buffer);

    const compressedStats = await fs.stat(outputPath);
    const compressedSizeMB = (compressedStats.size / 1024 / 1024).toFixed(3);
    const reduction = (((originalStats.size - compressedStats.size) / originalStats.size) * 100).toFixed(1);

    console.log(`   ✅ Compressed to: ${compressedSizeMB} MB (${reduction}% reduction)`);

    if (compressedStats.size > 200000) {
      console.log(`   ⚠️  WARNING: Still above 200KB - Meta may have issues`);
    }

    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🖼️  Image Compression for WhatsApp\n');
  console.log(`📁 Photo directory: ${PHOTO_DIR}`);
  console.log(`🎯 Target size: ${TARGET_SIZE} KB`);
  console.log(`📏 Max dimensions: ${MAX_WIDTH}x${MAX_HEIGHT}`);

  try {
    const files = await fs.readdir(PHOTO_DIR);
    const jpgFiles = files.filter((f) => f.endsWith('.jpg') || f.endsWith('.jpeg'));

    if (jpgFiles.length === 0) {
      console.log('\n❌ No JPG files found in assets/photos/');
      process.exit(1);
    }

    console.log(`\n📸 Found ${jpgFiles.length} images to compress:\n`);

    let successCount = 0;

    for (const file of jpgFiles) {
      const inputPath = path.join(PHOTO_DIR, file);
      const outputPath = inputPath; // Overwrite original

      const success = await compressImage(inputPath, outputPath);
      if (success) {
        successCount++;
      }
    }

    console.log(`\n\n✅ Compression complete! (${successCount}/${jpgFiles.length} succeeded)`);
    console.log('\n💡 Tips:');
    console.log('   - Images < 100KB send faster to WhatsApp');
    console.log('   - If still having issues, reduce quality further');
    console.log('   - Test by sending a photo after restarting the bot\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
