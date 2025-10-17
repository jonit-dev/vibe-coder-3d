#!/usr/bin/env node

import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, quantize, weld, simplify, textureCompress } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptSimplifier } from 'meshoptimizer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const modelsDir = join(projectRoot, 'public/assets/models');
const manifestPath = join(projectRoot, '.model-optimization-manifest.json');

// Initialize meshoptimizer
await MeshoptSimplifier.ready;

// Initialize glTF I/O with extensions
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
});

/**
 * Load or create optimization manifest
 * Manifest tracks file hashes to prevent re-optimization
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
 * Recursively find all GLB/GLTF files
 */
async function findModelFiles(dir, fileList = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      await findModelFiles(fullPath, fileList);
    } else if (entry.isFile() && (entry.name.endsWith('.glb') || entry.name.endsWith('.gltf'))) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * Optimize a single model file
 */
async function optimizeModel(filePath, silent = false) {
  const relativePath = relative(modelsDir, filePath);

  try {
    // Load the model
    const document = await io.read(filePath);

    // Apply optimization transforms
    await document.transform(
      // Remove unused nodes, materials, textures, etc.
      prune(),
      // Merge duplicate vertex and texture data
      dedup(),
      // Weld duplicate vertices
      weld(),
      // Quantize vertex attributes (reduces file size)
      quantize({
        quantizePosition: 14, // bits for position
        quantizeNormal: 10, // bits for normals
        quantizeTexcoord: 12, // bits for UVs
        quantizeColor: 8, // bits for vertex colors
        quantizeGeneric: 12, // bits for other attributes
      }),
      // Simplify geometry - reduce polygon count by 75% for real-time performance
      // For high-poly models, this is essential for smooth editing/zooming
      // ratio: 0.25 = keep 25% of triangles, error: 0.01 = allow 1% visual deviation
      simplify({ simplifier: MeshoptSimplifier, ratio: 0.25, error: 0.01 }),
    );

    // Write the optimized model back to the same location
    await io.write(filePath, document);

    if (!silent) {
      console.log(`✅ Optimized: ${relativePath}`);
    }

    return true;
  } catch (err) {
    if (!silent) {
      console.error(`❌ Failed to optimize ${relativePath}:`, err.message);
    }
    return false;
  }
}

/**
 * Main optimization routine
 */
async function main() {
  const isSilent = process.argv.includes('--silent');
  const isForce = process.argv.includes('--force');

  if (!isSilent) {
    console.log('🔧 Starting model optimization...');
  }

  try {
    // Load manifest to check which files were already optimized
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

    for (const filePath of modelFiles) {
      const relativePath = relative(projectRoot, filePath);
      const currentHash = await getFileHash(filePath);

      // Check if file was already optimized
      const previousHash = manifest.optimized[relativePath];
      const needsOptimization = isForce || !previousHash || previousHash !== currentHash;

      if (needsOptimization) {
        const success = await optimizeModel(filePath, isSilent);
        if (success) {
          // Update manifest with new hash after optimization
          const newHash = await getFileHash(filePath);
          manifest.optimized[relativePath] = newHash;
          optimizedCount++;
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
      console.log('✨ Model optimization complete');
    }
  } catch (err) {
    console.error('❌ Optimization failed:', err.message);
    process.exit(1);
  }
}

main().catch(console.error);
