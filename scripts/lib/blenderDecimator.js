#!/usr/bin/env node

/**
 * Blender Decimation Module
 *
 * Provides high-quality mesh decimation using Blender Python API
 * Integrated into the main optimization pipeline
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logger.js';
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Check if Blender is available
 */
export async function checkBlenderInstalled(blenderPath = 'blender') {
  return new Promise((resolve) => {
    const blender = spawn(blenderPath, ['--version']);
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
export async function decimateWithBlender(inputPath, outputPath, options = {}) {
  const { ratio = 0.15, textureSize = 1024, blenderPath = 'blender', silent = false } = options;

  const scriptPath = join(__dirname, '../blender/convert-low-poly.py');

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

  if (!silent) {
    logger.info('Running Blender decimation', {
      input: inputPath,
      output: outputPath,
      ratio: `${(ratio * 100).toFixed(1)}%`,
      textureSize: `${textureSize}px`,
    });
  }

  return new Promise((resolve, reject) => {
    const blender = spawn(blenderPath, args);
    let stdout = '';
    let stderr = '';

    blender.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;

      // Only show important messages
      if (
        !silent &&
        (text.includes('[INFO]') || text.includes('[ERROR]') || text.includes('[WARNING]'))
      ) {
        const cleanText = text
          .replace(/\[INFO\]\s*/g, '')
          .replace(/\[ERROR\]\s*/g, '')
          .replace(/\[WARNING\]\s*/g, '')
          .trim();
        if (cleanText) {
          logger.debug(cleanText);
        }
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
 * Determine if a model needs Blender decimation based on complexity
 */
export function shouldUseBlender(triangleCount, options = {}) {
  const { targetRatio = 0.25, useBlender = false, autoDecimate = false } = options;

  // If Blender is explicitly enabled, use it for aggressive decimation
  if (useBlender && autoDecimate) {
    return true;
  }

  // For very complex models (>100K triangles), Blender is recommended
  // when trying to achieve <25% reduction (meshopt's quality floor)
  if (triangleCount > 100000 && targetRatio < 0.25) {
    return true;
  }

  return false;
}

/**
 * Calculate appropriate decimation ratio based on model type and complexity
 */
export function calculateDecimationRatio(triangleCount, assetType = 'prop') {
  const targets = {
    hero: { ideal: 40000, max: 50000 },
    prop: { ideal: 10000, max: 15000 },
    background: { ideal: 3000, max: 5000 },
  };

  const target = targets[assetType] || targets.prop;

  // If already within target, no decimation needed
  if (triangleCount <= target.ideal) {
    return 1.0;
  }

  // Calculate ratio to reach ideal target
  const ratio = target.ideal / triangleCount;

  // Clamp to reasonable bounds (2% minimum to avoid over-decimation)
  return Math.max(0.02, Math.min(1.0, ratio));
}
