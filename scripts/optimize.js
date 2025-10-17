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
import { readdir, mkdir, readFile, writeFile, stat } from 'fs/promises';
import { join, relative, basename, extname, dirname } from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, prune, dedup } from '@gltf-transform/functions';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import { analyzeModel } from './lib/modelAnalyzer.js';
import {
  checkBlenderInstalled,
  decimateWithBlender,
  shouldUseBlender,
} from './lib/blenderDecimator.js';
import { logger } from './lib/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Initialize meshoptimizer
await MeshoptSimplifier.ready;

// Load environment
config();

// Initialize glTF I/O with all dependencies
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptSimplifier,
  'meshopt.encoder': MeshoptEncoder,
});

// Parse CLI args
const args = {
  checkOnly: process.argv.includes('--check-only'),
  force: process.argv.includes('--force'),
  model: process.argv.find((arg) => arg.startsWith('--model='))?.split('=')[1],
  silent: process.argv.includes('--silent'),
};

// Manifest path
const manifestPath = join(projectRoot, '.model-optimization-manifest.json');

// Environment config
const ENV = {
  useBlender: process.env.USE_BLENDER_DECIMATION === 'true',
  autoDecimate: process.env.AUTO_DECIMATE_MODELS === 'true',
  blenderPath: process.env.BLENDER_PATH || 'blender',
  modelsDir: process.env.MODELS_DIR || 'src/game/assets/models',
};

/**
 * Load or create optimization manifest
 */
async function loadManifest() {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { version: 1, optimized: {} };
  }
}

/**
 * Save optimization manifest
 */
async function saveManifest(manifest) {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Calculate file hash for caching
 */
async function getFileHash(filePath) {
  const content = await readFile(filePath);
  return createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Check if model needs optimization
 */
async function needsOptimization(modelPath, manifest) {
  if (args.force) return true;

  const relativePath = relative(projectRoot, modelPath);
  const entry = manifest.optimized[relativePath];

  if (!entry) return true;

  // Check if source file changed
  try {
    const currentHash = await getFileHash(modelPath);
    if (currentHash !== entry.sourceHash) return true;

    // Check if output files exist
    const modelDir = dirname(modelPath);
    const fileName = basename(modelPath, extname(modelPath));
    const glbPath = join(modelDir, 'glb', `${fileName}.glb`);
    const lodHighPath = join(modelDir, 'lod', `${fileName}.high_fidelity.glb`);
    const lodLowPath = join(modelDir, 'lod', `${fileName}.low_fidelity.glb`);

    await stat(glbPath);
    await stat(lodHighPath);
    await stat(lodLowPath);

    return false; // All files exist and source unchanged
  } catch {
    return true; // File doesn't exist or error checking
  }
}

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
 * Generate LOD variants from base model
 */
async function generateLODVariants(baseModelPath, modelDir, fileName) {
  const lodDir = join(modelDir, 'lod');
  await mkdir(lodDir, { recursive: true });

  const lodVariants = [
    { name: 'high_fidelity', ratio: 0.75, error: 0.01 },
    { name: 'low_fidelity', ratio: 0.35, error: 0.1 },
  ];

  const results = [];

  for (const variant of lodVariants) {
    const outputPath = join(lodDir, `${fileName}.${variant.name}.glb`);

    try {
      logger.info(`Generating ${variant.name} LOD...`, {
        ratio: `${(variant.ratio * 100).toFixed(0)}%`,
      });

      // Load base model
      const document = await io.read(baseModelPath);

      // Apply pre-processing
      await document.transform(prune(), dedup(), weld({ tolerance: 0.0001 }));

      // Apply simplification
      await document.transform(
        simplify({ simplifier: MeshoptSimplifier, ratio: variant.ratio, error: variant.error }),
      );

      // Write LOD variant
      await io.write(outputPath, document);

      // Get stats
      const triangles = analyzeModel(document).triangleCount;

      logger.success(`Generated ${variant.name}`, {
        output: `lod/${fileName}.${variant.name}.glb`,
        triangles: triangles.toLocaleString(),
      });

      results.push({ variant: variant.name, path: outputPath, triangles });
    } catch (err) {
      logger.error(`Failed to generate ${variant.name} LOD`, { error: err.message });
      results.push({ variant: variant.name, error: err.message });
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
    // Save to glb/ subdirectory where the app loads models from
    const modelDir = join(ENV.modelsDir, dir);
    const glbDir = join(modelDir, 'glb');
    const outputPath = join(glbDir, file);

    try {
      // Ensure glb directory exists
      await mkdir(glbDir, { recursive: true });

      await decimateWithBlender(path, outputPath, {
        ratio: analysis.recommendedRatio,
        textureSize: 1024,
        blenderPath: ENV.blenderPath,
        silent: args.silent,
      });

      logger.success(`Decimated ${dir}/${file}`, {
        output: `glb/${file}`,
        location: relative(process.cwd(), outputPath),
      });

      // Generate LOD variants from the decimated base model
      const fileName = basename(file, extname(file));
      const lodResults = await generateLODVariants(outputPath, modelDir, fileName);

      return {
        success: true,
        decimated: true,
        outputPath,
        lodVariants: lodResults,
      };
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

  // Load manifest
  const manifest = await loadManifest();

  // Find models
  const models = await findModels(ENV.modelsDir, args.model);
  logger.info(`Found ${models.length} model(s)`);

  if (models.length === 0) {
    logger.warn('No models found');
    return;
  }

  // Check which models need optimization (caching)
  const modelsToOptimize = [];
  const modelsSkippedCache = [];

  for (const model of models) {
    const needs = await needsOptimization(model.path, manifest);
    if (needs) {
      modelsToOptimize.push(model);
    } else {
      modelsSkippedCache.push(model);
    }
  }

  if (modelsSkippedCache.length > 0 && !args.silent) {
    logger.info(`Skipping ${modelsSkippedCache.length} cached model(s)`, {
      cached: modelsSkippedCache.map((m) => `${m.dir}/${m.file}`),
    });
  }

  if (modelsToOptimize.length === 0) {
    logger.info('All models are up to date');
    return;
  }

  // Analyze complexity for models that need optimization
  const analyzed = await checkComplexity(modelsToOptimize);

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

    // Update manifest if successful
    if (result.success) {
      const relativePath = relative(projectRoot, model.path);
      const sourceHash = await getFileHash(model.path);

      manifest.optimized[relativePath] = {
        sourceHash,
        timestamp: Date.now(),
        outputs: {
          base: result.outputPath,
          lodVariants: result.lodVariants?.map((v) => v.path) || [],
        },
      };
    }
  }

  // Save manifest
  await saveManifest(manifest);

  // Summary
  const successful = results.filter((r) => r.result?.success).length;
  const skipped = results.filter((r) => r.result?.skipped).length;
  const failed = results.filter((r) => !r.result?.success && !r.result?.skipped).length;

  logger.info('Optimization complete', {
    total: results.length,
    successful,
    skipped,
    cached: modelsSkippedCache.length,
    failed,
  });
}

main().catch((err) => {
  logger.error('Fatal error', { error: err.message, stack: err.stack });
  process.exit(1);
});
