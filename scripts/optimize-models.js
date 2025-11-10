#!/usr/bin/env node

import { readdir, stat, readFile, writeFile, mkdir, access } from 'fs/promises';
import { join, dirname, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { config } from 'dotenv';
import { NodeIO, Document } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import {
  prune,
  dedup,
  quantize,
  weld,
  simplify,
  textureCompress,
  draco,
  resample,
  cloneDocument,
  center,
  reorder,
  join as joinMeshes,
  palette,
} from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier, MeshoptEncoder } from 'meshoptimizer';
import sharp from 'sharp';
import { findMinimalViableRatio } from './lib/autoTriangleBudget.js';
import { analyzeModel } from './lib/modelAnalyzer.js';

// Load environment variables
config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Environment-based configuration
const ENV = {
  // Platform settings
  platform: process.env.PLATFORM || 'desktop',
  isMobile: process.env.IS_MOBILE === 'true',
  webglCompat: process.env.WEBGL_COMPAT_MODE === 'true',

  // Optimization settings
  aggressiveOptimization: process.env.AGGRESSIVE_MODEL_OPTIMIZATION === 'true',
  autoDecimate: process.env.AUTO_DECIMATE_MODELS === 'true',
  autoDecimateRatio: parseFloat(process.env.AUTO_DECIMATE_RATIO || '0.1'),
  autoDecimateError: parseFloat(process.env.AUTO_DECIMATE_ERROR || '0.1'),
  useBlender: process.env.USE_BLENDER_DECIMATION === 'true',
  blenderPath: process.env.BLENDER_PATH || '',
  minTriangles: parseInt(process.env.OPTIMIZATION_MIN_TRIANGLES || '1000', 10),

  // Texture settings
  maxTextureSize: parseInt(process.env.MAX_TEXTURE_SIZE || '2048', 10),
  enableTextureCompression: process.env.ENABLE_TEXTURE_COMPRESSION !== 'false',
  textureQuality: parseInt(process.env.TEXTURE_COMPRESSION_QUALITY || '128', 10),
  forcePOT: process.env.FORCE_POT_TEXTURES !== 'false',

  // LOD settings
  enableLOD: process.env.ENABLE_LOD_GENERATION !== 'false',
  lodHighRatio: parseFloat(process.env.LOD_HIGH_RATIO || '0.25'),
  lodLowRatio: parseFloat(process.env.LOD_LOW_RATIO || '0.25'),
  lodHighError: parseFloat(process.env.LOD_HIGH_ERROR || '0.01'),
  lodLowError: parseFloat(process.env.LOD_LOW_ERROR || '0.1'),

  // Compression settings
  meshCompression: process.env.MESH_COMPRESSION || 'draco',
  dracoEncodeSpeed: parseInt(process.env.DRACO_ENCODE_SPEED || '5', 10),
  dracoDecodeSpeed: parseInt(process.env.DRACO_DECODE_SPEED || '5', 10),

  // Development settings
  verbose: process.env.VERBOSE_OPTIMIZATION === 'true',
  forceReoptimize: process.env.FORCE_REOPTIMIZE === 'true',
  checkComplexity: process.env.CHECK_MODEL_COMPLEXITY !== 'false',
  warnOnComplex: process.env.WARN_ON_COMPLEX_MODELS !== 'false',
};

const modelsDir = join(projectRoot, process.env.MODELS_DIR || 'public/assets/models');
const manifestPath = join(projectRoot, '.model-optimization-manifest.json');
const configPath = join(projectRoot, '.model-optimization.config.json');

// Initialize meshoptimizer
await MeshoptSimplifier.ready;

// Initialize glTF I/O with extensions
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptSimplifier,
  'meshopt.encoder': MeshoptEncoder,
});

/**
 * Load optimization configuration
 * Merges file-based config with environment variables
 */
async function loadConfig() {
  let fileConfig = {};

  try {
    const content = await readFile(configPath, 'utf-8');
    fileConfig = JSON.parse(content);
  } catch {
    // File doesn't exist, will use env-based defaults
  }

  // Build config from environment variables, with file overrides
  const config = {
    pipelineVersion: fileConfig.pipelineVersion || 5,
    autoTriangles: fileConfig.autoTriangles || {
      enabled: false,
      minRatio: 0.05,
      maxRatio: 1.0,
      targetClassificationBudgets: {
        hero: { minTriangles: 20000 },
        prop: { minTriangles: 5000 },
        background: { minTriangles: 1500 },
      },
    },
    geometry: {
      quantize: fileConfig.geometry?.quantize || {
        position: 14,
        normal: 10,
        texcoord: 12,
        color: 8,
        generic: 12,
      },
      simplify: {
        enabled: fileConfig.geometry?.simplify?.enabled ?? !ENV.aggressiveOptimization,
        ratio: fileConfig.geometry?.simplify?.ratio || (ENV.aggressiveOptimization ? 0.3 : 1.0),
        error: fileConfig.geometry?.simplify?.error || (ENV.aggressiveOptimization ? 0.1 : 0.001),
      },
    },
    compression: {
      method: fileConfig.compression?.method || ENV.meshCompression,
      draco: {
        encodeSpeed: fileConfig.compression?.draco?.encodeSpeed || ENV.dracoEncodeSpeed,
        decodeSpeed: fileConfig.compression?.draco?.decodeSpeed || ENV.dracoDecodeSpeed,
      },
      meshopt: fileConfig.compression?.meshopt || { level: 'medium' },
    },
    textures: {
      resize: {
        enabled: fileConfig.textures?.resize?.enabled ?? true,
        max: fileConfig.textures?.resize?.max || ENV.maxTextureSize,
        powerOfTwo: fileConfig.textures?.resize?.powerOfTwo ?? ENV.forcePOT,
      },
      ktx2: {
        enabled: fileConfig.textures?.ktx2?.enabled ?? ENV.enableTextureCompression,
        mode: fileConfig.textures?.ktx2?.mode || 'ETC1S',
        quality: fileConfig.textures?.ktx2?.quality || ENV.textureQuality,
        uastcZstandard: fileConfig.textures?.ktx2?.uastcZstandard || 18,
      },
    },
    lod: {
      enabled: fileConfig.lod?.enabled ?? ENV.enableLOD,
      variants: fileConfig.lod?.variants || {
        high_fidelity: {
          ratio: ENV.lodHighRatio,
          error: ENV.lodHighError,
        },
        low_fidelity: {
          ratio: ENV.lodLowRatio,
          error: ENV.lodLowError,
        },
      },
    },
  };

  // Apply mobile-specific overrides
  if (ENV.isMobile) {
    config.textures.resize.max = Math.min(config.textures.resize.max, 1024);
    config.lod.variants.high_fidelity.ratio = Math.min(
      config.lod.variants.high_fidelity.ratio,
      0.5,
    );
    config.lod.variants.low_fidelity.ratio = Math.min(config.lod.variants.low_fidelity.ratio, 0.3);
  }

  return config;
}

/**
 * Calculate hash for configuration to detect config changes
 */
function getConfigHash(config) {
  const configString = JSON.stringify(config);
  return createHash('sha256').update(configString).digest('hex');
}

/**
 * Load or create optimization manifest
 */
async function loadManifest() {
  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { optimized: {} };
  }
}

/**
 * Save optimization manifest
 */
async function saveManifest(manifest) {
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * Calculate file hash for change detection
 */
async function getFileHash(filePath) {
  try {
    const content = await readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Recursively find all GLB files (excluding glb/ and lod/ subdirectories)
 */
async function findModelFiles(dir, fileList = [], isRoot = true) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip glb and lod subdirectories as they contain generated outputs
      if (entry.name === 'glb' || entry.name === 'lod') {
        continue;
      }
      await findModelFiles(fullPath, fileList, false);
    } else if (entry.isFile() && entry.name.endsWith('.glb')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Get model statistics for reporting
 */
function getModelStats(document) {
  const root = document.getRoot();
  let triangleCount = 0;
  let vertexCount = 0;

  for (const mesh of root.listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      const indices = primitive.getIndices();
      const position = primitive.getAttribute('POSITION');

      if (indices) {
        triangleCount += indices.getCount() / 3;
      }
      if (position) {
        vertexCount += position.getCount();
      }
    }
  }

  return { triangleCount, vertexCount, textureCount: root.listTextures().length };
}

/**
 * Ensure directory exists
 */
async function ensureDir(dirPath) {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * Resize textures to power-of-two if needed
 */
async function processTextures(document, config) {
  if (!config.textures.resize.enabled) return;

  const root = document.getRoot();
  const textures = root.listTextures();

  for (const texture of textures) {
    const image = texture.getImage();
    if (!image) continue;

    const mimeType = texture.getMimeType();
    if (!mimeType || (!mimeType.includes('png') && !mimeType.includes('jpeg'))) {
      continue;
    }

    try {
      const sharpImage = sharp(Buffer.from(image));
      const metadata = await sharpImage.metadata();
      const { width, height } = metadata;

      // Check if resizing is needed
      const maxDim = config.textures.resize.max;
      const needsResize =
        width > maxDim ||
        height > maxDim ||
        (config.textures.resize.powerOfTwo && (!isPowerOfTwo(width) || !isPowerOfTwo(height)));

      if (needsResize) {
        let newWidth = width;
        let newHeight = height;

        // Scale down if exceeds max
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          newWidth = Math.floor(width * scale);
          newHeight = Math.floor(height * scale);
        }

        // Adjust to power of two
        if (config.textures.resize.powerOfTwo) {
          newWidth = nearestPowerOfTwo(newWidth);
          newHeight = nearestPowerOfTwo(newHeight);
        }

        const resizedBuffer = await sharpImage
          .resize(newWidth, newHeight, { fit: 'fill' })
          .toBuffer();

        texture.setImage(new Uint8Array(resizedBuffer));
      }
    } catch (err) {
      // Skip texture if processing fails
      continue;
    }
  }
}

/**
 * Check if number is power of two
 */
function isPowerOfTwo(n) {
  return n > 0 && (n & (n - 1)) === 0;
}

/**
 * Get nearest power of two
 */
function nearestPowerOfTwo(n) {
  return Math.pow(2, Math.round(Math.log2(n)));
}

/**
 * Generate LOD variants for a model
 */
async function generateLODs(document, config, baseDir, modelName) {
  if (!config.lod.enabled || !config.lod.variants) {
    return [];
  }

  const lodDir = join(baseDir, 'lod');
  await ensureDir(lodDir);

  const lodOutputs = [];

  // Generate each named LOD variant
  for (const [variantName, variantConfig] of Object.entries(config.lod.variants)) {
    const lodDoc = cloneDocument(document);

    // CRITICAL: Weld vertices before simplification for meshopt to work properly
    await lodDoc.transform(
      weld(),
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: variantConfig.ratio,
        error: variantConfig.error,
      }),
      // CRITICAL: Re-center after simplification to ensure consistent centering across all LOD levels
      // Without this, simplified models can have shifted centers causing visual misalignment
      center({ pivot: 'center' }),
    );

    // Apply mesh compression to LOD variant
    if (config.compression.method === 'draco' || config.compression.method === 'both') {
      await lodDoc.transform(
        draco({
          encodeSpeed: config.compression.draco.encodeSpeed,
          decodeSpeed: config.compression.draco.decodeSpeed,
        }),
      );
    }

    const lodPath = join(lodDir, `${modelName}.${variantName}.glb`);
    await io.write(lodPath, lodDoc);

    const lodStats = await stat(lodPath);
    const modelStats = getModelStats(lodDoc);

    lodOutputs.push({
      name: variantName,
      path: lodPath,
      size: lodStats.size,
      ratio: variantConfig.ratio,
      triangles: modelStats.triangleCount,
    });
  }

  return lodOutputs;
}

/**
 * Optimize a single model file
 */
async function optimizeModel(filePath, config, configHash, silent = false) {
  const relativePath = relative(modelsDir, filePath);
  const modelDir = dirname(filePath);
  const modelName = basename(filePath, extname(filePath));

  try {
    // Get original file size
    const originalStats = await stat(filePath);
    const originalSize = originalStats.size;

    // Load the model
    const document = await io.read(filePath);
    const originalModelStats = getModelStats(document);

    // Clone document BEFORE heavy optimization for LOD generation
    // This ensures LOD simplification can work on clean, unquantized geometry
    const lodSourceDoc = cloneDocument(document);

    // Apply minimal optimization to LOD source (no quantization yet)
    await lodSourceDoc.transform(
      prune(),
      dedup(),
      weld(),
      center({ pivot: 'center' }),
      joinMeshes({ keepNamed: true, keepMeshes: false }),
    );

    // Auto-select minimal viable triangle budget
    let autoSelectedRatio = 1.0;
    if (config.autoTriangles.enabled) {
      const analysis = analyzeModel(lodSourceDoc);
      const minTriangles = config.autoTriangles.targetClassificationBudgets[analysis.classification]?.minTriangles || 1000;

      const { ratio, triangles } = await findMinimalViableRatio(lodSourceDoc, {
        minRatio: config.autoTriangles.minRatio,
        maxRatio: config.autoTriangles.maxRatio,
        minTriangles,
      });

      autoSelectedRatio = ratio;

      if (!silent) {
        console.log(`   Auto-selected: ratio=${ratio.toFixed(3)}, triangles=${triangles} (${analysis.classification})`);
      }
    }

    // Apply texture processing
    await processTextures(document, config);

    // Apply geometry optimization transforms
    await document.transform(
      prune(),
      dedup(),
      weld(),
      center({ pivot: 'center' }), // Center model at origin for proper gizmo alignment
      joinMeshes({ keepNamed: true, keepMeshes: false }), // Merge compatible meshes (fewer draw calls)
    );

    // Apply auto-selected simplification OR manual simplification
    if (config.autoTriangles.enabled && autoSelectedRatio < 1.0) {
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: autoSelectedRatio,
          error: 0.01,
        }),
      );
    } else if (config.geometry.simplify.enabled) {
      await document.transform(
        simplify({
          simplifier: MeshoptSimplifier,
          ratio: config.geometry.simplify.ratio,
          error: config.geometry.simplify.error,
        }),
      );
    }

    // Continue with quantization and reordering
    await document.transform(
      reorder({ encoder: MeshoptEncoder }), // Optimize vertex cache locality (GPU performance)
      quantize({
        quantizePosition: config.geometry.quantize.position,
        quantizeNormal: config.geometry.quantize.normal,
        quantizeTexcoord: config.geometry.quantize.texcoord,
        quantizeColor: config.geometry.quantize.color,
        quantizeGeneric: config.geometry.quantize.generic,
      }),
    );

    // Optimize animations if present
    const root = document.getRoot();
    if (root.listAnimations().length > 0) {
      await document.transform(
        resample({ tolerance: 0.0001 }), // Optimize animation keyframes
      );
    }

    // Apply texture compression (KTX2)
    if (config.textures.ktx2.enabled) {
      await document.transform(
        textureCompress({
          encoder: 'ktx2',
          slots: /^(baseColor|metallicRoughness|normal|occlusion|emissive)$/,
          targetFormat: config.textures.ktx2.mode.toLowerCase(), // 'etc1s' or 'uastc'
          quality: config.textures.ktx2.quality,
          uastcZstandard: config.textures.ktx2.uastcZstandard,
        }),
      );
    }

    // CRITICAL: Generate LOD variants from unquantized source BEFORE mesh compression
    // Simplification requires uncompressed, unquantized geometry
    const lodOutputs = await generateLODs(lodSourceDoc, config, modelDir, modelName);

    // Apply mesh compression
    if (config.compression.method === 'draco' || config.compression.method === 'both') {
      await document.transform(
        draco({
          encodeSpeed: config.compression.draco.encodeSpeed,
          decodeSpeed: config.compression.draco.decodeSpeed,
        }),
      );
    }

    // Note: Meshopt compression is applied via encoder during write

    // Only create glb subdirectory if not already in one
    const isInGlbDir = basename(modelDir) === 'glb';
    const glbDir = isInGlbDir ? modelDir : join(modelDir, 'glb');

    if (!isInGlbDir) {
      await ensureDir(glbDir);
    }

    // Write optimized base model
    const baseOutputPath = join(glbDir, basename(filePath));
    await io.write(baseOutputPath, document);

    // Get optimized file size and stats
    const optimizedStats = await stat(baseOutputPath);
    const optimizedSize = optimizedStats.size;
    const optimizedModelStats = getModelStats(document);

    // Calculate size reduction
    const sizeReduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
    const triangleReduction = (
      (1 - optimizedModelStats.triangleCount / originalModelStats.triangleCount) *
      100
    ).toFixed(1);

    if (!silent) {
      console.log(`✅ Optimized: ${relativePath}`);
      console.log(
        `   Size: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (-${sizeReduction}%)`,
      );
      console.log(
        `   Triangles: ${originalModelStats.triangleCount.toFixed(0)} → ${optimizedModelStats.triangleCount.toFixed(0)} (-${triangleReduction}%)`,
      );
      if (lodOutputs.length > 0) {
        console.log(`   LODs: Generated ${lodOutputs.length} variant(s)`);
        lodOutputs.forEach((lod) => {
          const lodTriReduction = (
            (1 - lod.triangles / originalModelStats.triangleCount) *
            100
          ).toFixed(1);
          console.log(
            `     - ${lod.name}: ${(lod.size / 1024).toFixed(1)}KB, ${lod.triangles.toFixed(0)} tris (-${lodTriReduction}%)`,
          );
        });
      }
    }

    return {
      success: true,
      outputs: {
        lod0: { path: baseOutputPath, size: optimizedSize },
        ...lodOutputs.reduce((acc, lod, idx) => {
          acc[`lod${lod.level}`] = { path: lod.path, size: lod.size };
          return acc;
        }, {}),
      },
      stats: {
        originalSize,
        optimizedSize,
        sizeReduction: parseFloat(sizeReduction),
        originalTriangles: originalModelStats.triangleCount,
        optimizedTriangles: optimizedModelStats.triangleCount,
        triangleReduction: parseFloat(triangleReduction),
      },
    };
  } catch (err) {
    if (!silent) {
      console.error(`❌ Failed to optimize ${relativePath}:`, err.message);
    }
    return { success: false, error: err.message };
  }
}

/**
 * Main optimization routine
 */
async function main() {
  const isSilent = process.argv.includes('--silent');
  const isForce = process.argv.includes('--force') || ENV.forceReoptimize;

  if (!isSilent) {
    console.log('🔧 Starting model optimization pipeline...');
    console.log(`📱 Platform: ${ENV.platform}${ENV.isMobile ? ' (mobile)' : ''}`);
    if (ENV.aggressiveOptimization) {
      console.log('⚡ Aggressive optimization enabled');
    }
    if (ENV.autoDecimate) {
      console.log(`🔪 Auto-decimation enabled (ratio: ${ENV.autoDecimateRatio})`);
    }
  }

  try {
    // Load configuration
    const config = await loadConfig();
    const configHash = getConfigHash(config);

    if (!isSilent) {
      console.log(`📋 Config version: ${config.pipelineVersion}`);
      console.log(`🔑 Config hash: ${configHash.substring(0, 8)}...`);
    }

    // Load manifest
    const manifest = await loadManifest();

    // Find all model files
    const modelFiles = await findModelFiles(modelsDir);

    if (modelFiles.length === 0) {
      if (!isSilent) {
        console.log('ℹ️  No model files found');
      }
      return;
    }

    if (!isSilent) {
      console.log(`📦 Found ${modelFiles.length} model file(s)`);
    }

    let optimizedCount = 0;
    let skippedCount = 0;
    const stats = {
      totalOriginalSize: 0,
      totalOptimizedSize: 0,
      totalOriginalTriangles: 0,
      totalOptimizedTriangles: 0,
    };

    for (const filePath of modelFiles) {
      const relativePath = relative(projectRoot, filePath);
      const currentHash = await getFileHash(filePath);

      // Check if file needs optimization
      const manifestEntry = manifest.optimized[relativePath];
      const needsOptimization =
        isForce ||
        !manifestEntry ||
        manifestEntry.fileHash !== currentHash ||
        manifestEntry.configHash !== configHash;

      if (needsOptimization) {
        const result = await optimizeModel(filePath, config, configHash, isSilent);

        if (result.success) {
          // Update manifest with INPUT file hash (not output)
          manifest.optimized[relativePath] = {
            fileHash: currentHash,
            configHash,
            outputs: result.outputs,
            timestamp: Date.now(),
          };

          optimizedCount++;
          stats.totalOriginalSize += result.stats.originalSize;
          stats.totalOptimizedSize += result.stats.optimizedSize;
          stats.totalOriginalTriangles += result.stats.originalTriangles;
          stats.totalOptimizedTriangles += result.stats.optimizedTriangles;
        }
      } else {
        if (!isSilent) {
          console.log(`⏭️  Skipped (already optimized): ${relative(modelsDir, filePath)}`);
        }
        skippedCount++;
      }
    }

    // Save updated manifest
    await saveManifest(manifest);

    if (!isSilent) {
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Optimized: ${optimizedCount}`);
      console.log(`   ⏭️  Skipped: ${skippedCount}`);

      if (optimizedCount > 0) {
        const totalSizeReduction = (
          (1 - stats.totalOptimizedSize / stats.totalOriginalSize) *
          100
        ).toFixed(1);
        const totalTriangleReduction = (
          (1 - stats.totalOptimizedTriangles / stats.totalOriginalTriangles) *
          100
        ).toFixed(1);

        console.log(
          `   💾 Total size: ${(stats.totalOriginalSize / 1024).toFixed(1)}KB → ${(stats.totalOptimizedSize / 1024).toFixed(1)}KB (-${totalSizeReduction}%)`,
        );
        console.log(
          `   🔺 Total triangles: ${stats.totalOriginalTriangles.toFixed(0)} → ${stats.totalOptimizedTriangles.toFixed(0)} (-${totalTriangleReduction}%)`,
        );
      }

      console.log('✨ Model optimization complete');
    }
  } catch (err) {
    console.error('❌ Optimization failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main().catch(console.error);
