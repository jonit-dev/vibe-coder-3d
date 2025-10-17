#!/usr/bin/env node

/**
 * Blender-based mesh decimation wrapper
 *
 * Uses Blender Python API to perform aggressive mesh decimation that
 * meshoptimizer cannot achieve due to quality constraints.
 *
 * Controlled by .env variables:
 * - USE_BLENDER_DECIMATION=true
 * - BLENDER_PATH=/path/to/blender
 * - AUTO_DECIMATE_RATIO=0.05 (5% of original)
 */

import { spawn } from 'child_process';
import { access, constants } from 'fs/promises';
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables
config();

const ENV = {
  useBlender: process.env.USE_BLENDER_DECIMATION === 'true',
  blenderPath: process.env.BLENDER_PATH || 'blender',
  decimateRatio: parseFloat(process.env.AUTO_DECIMATE_RATIO || '0.1'),
  decimateError: parseFloat(process.env.AUTO_DECIMATE_ERROR || '0.1'),
  textureSize: parseInt(process.env.MAX_TEXTURE_SIZE || '1024', 10),
  isMobile: process.env.IS_MOBILE === 'true',
};

/**
 * Check if Blender is available
 */
async function checkBlenderInstalled() {
  return new Promise((resolve) => {
    const blender = spawn(ENV.blenderPath, ['--version']);
    let output = '';

    blender.stdout.on('data', (data) => {
      output += data.toString();
    });

    blender.on('close', (code) => {
      if (code === 0 && output.includes('Blender')) {
        const version = output.match(/Blender\s+([\d.]+)/)?.[1];
        resolve({ installed: true, version });
      } else {
        resolve({ installed: false });
      }
    });

    blender.on('error', () => {
      resolve({ installed: false });
    });
  });
}

/**
 * Decimate a model using Blender
 */
async function decimateWithBlender(inputPath, outputPath, options = {}) {
  const {
    ratio = ENV.decimateRatio,
    textureSize = ENV.textureSize,
    removeTextures = false,
    fixOrigin = true,
  } = options;

  const scriptPath = join(__dirname, 'blender', 'convert-low-poly.py');

  // Build Blender command
  const args = [
    '--background',
    '--python',
    scriptPath,
    '--',
    inputPath,
    outputPath,
    '--glb',
    '--ratio',
    ratio.toString(),
    '--texture-size',
    textureSize.toString(),
  ];

  if (removeTextures) {
    args.push('--remove-textures');
  }

  if (!fixOrigin) {
    args.push('--no-fix-origin');
  }

  console.log(`🔧 Running Blender decimation...`);
  console.log(`   Input: ${inputPath}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Ratio: ${(ratio * 100).toFixed(1)}%`);
  console.log(`   Texture size: ${textureSize}px`);

  return new Promise((resolve, reject) => {
    const blender = spawn(ENV.blenderPath, args);
    let stdout = '';
    let stderr = '';

    blender.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      // Print Blender script output in real-time
      if (text.includes('[INFO]') || text.includes('[ERROR]') || text.includes('[WARNING]')) {
        console.log(`   ${text.trim()}`);
      }
    });

    blender.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    blender.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject(new Error(`Blender process exited with code ${code}\n${stderr}`));
      }
    });

    blender.on('error', (err) => {
      reject(new Error(`Failed to spawn Blender: ${err.message}`));
    });
  });
}

/**
 * Main function for CLI usage
 */
async function main() {
  if (process.argv.length < 4) {
    console.error('Usage: node blender-decimate.js <input.glb> <output.glb> [ratio]');
    console.error('');
    console.error('Example:');
    console.error('  node blender-decimate.js model.glb model-decimated.glb 0.05');
    console.error('  # Reduces to 5% of original triangles using Blender');
    process.exit(1);
  }

  const [, , inputPath, outputPath, ratioArg] = process.argv;
  const ratio = ratioArg ? parseFloat(ratioArg) : ENV.decimateRatio;

  // Check if Blender is installed
  console.log('🔍 Checking for Blender...');
  const blenderCheck = await checkBlenderInstalled();

  if (!blenderCheck.installed) {
    console.error('❌ Blender not found!');
    console.error('');
    console.error('Please install Blender:');
    console.error('  • Download from: https://www.blender.org/download/');
    console.error('  • Or set BLENDER_PATH in .env to your Blender executable');
    console.error('');
    console.error('Example .env:');
    console.error('  BLENDER_PATH=/Applications/Blender.app/Contents/MacOS/Blender');
    process.exit(1);
  }

  console.log(`✅ Found Blender ${blenderCheck.version}`);

  try {
    await decimateWithBlender(inputPath, outputPath, { ratio });
    console.log('✅ Decimation complete!');
  } catch (err) {
    console.error('❌ Decimation failed:', err.message);
    process.exit(1);
  }
}

// Export for use as module
export { checkBlenderInstalled, decimateWithBlender };

// Run as CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
