#!/usr/bin/env node

/**
 * Unified Optimization Script
 *
 * KISS Principle: Single entry point for all model optimization
 * - Analyzes models automatically
 * - Applies appropriate decimation (Blender or meshopt)
 * - Generates LODs
 * - Compresses with Draco
 *
 * Usage:
 *   yarn optimize                    # Optimize all models
 *   yarn optimize --model=FarmHouse  # Optimize specific model
 *   yarn optimize --check-only       # Just check complexity
 *   yarn optimize --force            # Force re-optimization
 */

import { config } from 'dotenv';
import { readdir } from 'fs/promises';
import { join, relative, basename } from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { analyzeModel } from './lib/modelAnalyzer.js';
import {
  checkBlenderInstalled,
  decimateWithBlender,
  shouldUseBlender,
} from './lib/blenderDecimator.js';
import { logger } from './lib/logger.js';

// Load environment
config();
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Parse CLI args
const args = {
  checkOnly: process.argv.includes('--check-only'),
  force: process.argv.includes('--force'),
  model: process.argv.find((arg) => arg.startsWith('--model='))?.split('=')[1],
  silent: process.argv.includes('--silent'),
};

// Environment config
const ENV = {
  useBlender: process.env.USE_BLENDER_DECIMATION === 'true',
  autoDecimate: process.env.AUTO_DECIMATE_MODELS === 'true',
  blenderPath: process.env.BLENDER_PATH || 'blender',
  modelsDir: process.env.MODELS_DIR || 'public/assets/models',
};

/**
 * Find all source models
 */
async function findModels(modelsDir, filterModel) {
  const models = [];
  const dirs = await readdir(modelsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    if (filterModel && dir.name !== filterModel) continue;

    const modelPath = join(modelsDir, dir.name);
    const dirContents = await readdir(modelPath);

    for (const file of dirContents) {
      if (file.endsWith('.glb') && !file.includes('lod') && !file.includes('optimized')) {
        models.push({
          dir: dir.name,
          file,
          path: join(modelPath, file),
        });
      }
    }
  }

  return models;
}

/**
 * Check and report model complexity
 */
async function checkComplexity(models) {
  logger.info('Analyzing model complexity...');

  const results = [];

  for (const model of models) {
    try {
      const document = await io.read(model.path);
      const analysis = analyzeModel(document);

      results.push({
        ...model,
        analysis,
      });

      const icon =
        analysis.severity === 'critical' ? '🔴' : analysis.severity === 'warning' ? '⚠️' : '✅';
      logger.info(`${icon} ${model.dir}/${model.file}`, {
        triangles: analysis.triangleCount.toLocaleString(),
        type: analysis.classification,
        needsOptimization: analysis.needsOptimization,
      });
    } catch (err) {
      logger.error(`Failed to analyze ${model.path}`, { error: err.message });
    }
  }

  return results;
}

/**
 * Optimize a single model
 */
async function optimizeModel(model, blenderAvailable) {
  const { path, dir, file, analysis } = model;

  if (!analysis.needsOptimization) {
    logger.info(`Skipping ${dir}/${file} - already optimized`);
    return { skipped: true };
  }

  logger.info(`Optimizing ${dir}/${file}...`, {
    triangles: analysis.triangleCount.toLocaleString(),
    reduction: `${analysis.reduction}%`,
  });

  // Determine if we should use Blender
  const useBlender = shouldUseBlender(analysis.triangleCount, {
    targetRatio: analysis.recommendedRatio,
    useBlender: ENV.useBlender,
    autoDecimate: ENV.autoDecimate,
  });

  if (useBlender && !blenderAvailable) {
    logger.warn(`Blender decimation recommended but Blender not available for ${dir}/${file}`);
  }

  // If Blender decimation is enabled and available
  if (useBlender && blenderAvailable && ENV.autoDecimate) {
    const outputPath = path.replace('.glb', '-decimated.glb');

    try {
      await decimateWithBlender(path, outputPath, {
        ratio: analysis.recommendedRatio,
        textureSize: 1024,
        blenderPath: ENV.blenderPath,
        silent: args.silent,
      });

      logger.info(`✅ Decimated ${dir}/${file}`, {
        output: basename(outputPath),
      });

      return { success: true, decimated: true, outputPath };
    } catch (err) {
      logger.error(`Failed to decimate ${dir}/${file}`, { error: err.message });
      return { success: false, error: err.message };
    }
  }

  // TODO: Integrate with main optimization pipeline (meshopt, LOD, compression)
  logger.warn(`Full pipeline integration not yet implemented for ${dir}/${file}`);
  return { success: false, reason: 'Pipeline integration pending' };
}

/**
 * Main function
 */
async function main() {
  logger.info('🚀 Starting model optimization', { args, env: ENV });

  // Find models
  const models = await findModels(ENV.modelsDir, args.model);
  logger.info(`Found ${models.length} model(s)`);

  if (models.length === 0) {
    logger.warn('No models found');
    return;
  }

  // Analyze complexity
  const analyzed = await checkComplexity(models);

  // If check-only mode, stop here
  if (args.checkOnly) {
    const needsWork = analyzed.filter((m) => m.analysis?.needsOptimization).length;
    logger.info(`Check complete: ${needsWork}/${analyzed.length} models need optimization`);
    return;
  }

  // Check if Blender is available
  let blenderAvailable = false;
  if (ENV.useBlender) {
    const blenderCheck = await checkBlenderInstalled(ENV.blenderPath);
    blenderAvailable = blenderCheck.installed;

    if (blenderAvailable) {
      logger.info(`Blender ${blenderCheck.version} detected`);
    } else {
      logger.warn('Blender not found - falling back to meshopt only');
    }
  }

  // Optimize each model
  const results = [];
  for (const model of analyzed) {
    const result = await optimizeModel(model, blenderAvailable);
    results.push({ ...model, result });
  }

  // Summary
  const successful = results.filter((r) => r.result?.success).length;
  const skipped = results.filter((r) => r.result?.skipped).length;
  const failed = results.filter((r) => !r.result?.success && !r.result?.skipped).length;

  logger.info('Optimization complete', {
    total: results.length,
    successful,
    skipped,
    failed,
  });
}

main().catch((err) => {
  logger.error('Fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});
