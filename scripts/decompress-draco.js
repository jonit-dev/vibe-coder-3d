#!/usr/bin/env node

/**
 * Draco Decompression Preprocessing Script
 *
 * This script decompresses Draco-compressed glTF/GLB models offline.
 * Running this BEFORE optimization is faster and simpler than runtime decompression.
 *
 * Why offline decompression?
 * - Faster: One-time cost vs runtime penalty
 * - Simpler: No Draco decoder needed in Rust engine
 * - Better optimization: Allows decimation/LOD on decompressed geometry
 * - Smaller final files: Meshoptimizer compression often beats Draco
 *
 * Usage:
 *   node scripts/decompress-draco.js <input.glb> <output.glb>
 *   node scripts/decompress-draco.js --check <model.glb>  # Check if Draco-compressed
 *   node scripts/decompress-draco.js --batch <dir>        # Decompress all in directory
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';

// Initialize glTF I/O with Draco decoder
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(), // For writing uncompressed
});

/**
 * Check if a glTF document uses Draco compression
 */
function isDracoCompressed(document) {
  const root = document.getRoot();
  const extensionsUsed = root.listExtensionsUsed();

  return extensionsUsed.some((ext) => ext.extensionName === 'KHR_draco_mesh_compression');
}

/**
 * Get compression info about a model
 */
function getCompressionInfo(document) {
  const root = document.getRoot();
  const extensionsUsed = root.listExtensionsUsed();
  const extensionsRequired = root.listExtensionsRequired();

  const compressionInfo = {
    draco: {
      used: false,
      required: false,
    },
    meshopt: {
      used: false,
      required: false,
    },
  };

  for (const ext of extensionsUsed) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') {
      compressionInfo.draco.used = true;
    }
    if (ext.extensionName === 'EXT_meshopt_compression') {
      compressionInfo.meshopt.used = true;
    }
  }

  for (const ext of extensionsRequired) {
    if (ext.extensionName === 'KHR_draco_mesh_compression') {
      compressionInfo.draco.required = true;
    }
    if (ext.extensionName === 'EXT_meshopt_compression') {
      compressionInfo.meshopt.required = true;
    }
  }

  return compressionInfo;
}

/**
 * Decompress a Draco-compressed glTF model
 */
async function decompressDraco(inputPath, outputPath) {
  console.log(`📥 Reading: ${inputPath}`);

  // Read the model
  const document = await io.read(inputPath);
  const compressionInfo = getCompressionInfo(document);

  if (!compressionInfo.draco.used) {
    console.log('ℹ️  Model is not Draco-compressed, skipping');
    return { skipped: true, reason: 'not-draco' };
  }

  console.log('🔓 Draco compression detected');
  console.log(`   Required: ${compressionInfo.draco.required ? 'Yes' : 'No'}`);

  // Get stats before
  const beforeStats = getModelStats(document);
  console.log(`📊 Original stats:`);
  console.log(`   Triangles: ${beforeStats.triangleCount.toLocaleString()}`);
  console.log(`   Vertices: ${beforeStats.vertexCount.toLocaleString()}`);

  // Remove Draco extension
  const root = document.getRoot();
  const dracoExtension = root
    .listExtensionsUsed()
    .find((ext) => ext.extensionName === 'KHR_draco_mesh_compression');

  if (dracoExtension) {
    dracoExtension.dispose();
  }

  // Clean up the document
  await document.transform(
    prune(), // Remove unused resources
    dedup(), // Deduplicate identical resources
  );

  // Get stats after
  const afterStats = getModelStats(document);

  console.log(`📊 Decompressed stats:`);
  console.log(`   Triangles: ${afterStats.triangleCount.toLocaleString()}`);
  console.log(`   Vertices: ${afterStats.vertexCount.toLocaleString()}`);

  // Write uncompressed GLB
  console.log(`💾 Writing: ${outputPath}`);
  await io.write(outputPath, document);

  return {
    success: true,
    beforeStats,
    afterStats,
    compressionInfo,
  };
}

/**
 * Get mesh statistics
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

  return { triangleCount, vertexCount };
}

/**
 * Check if a model is Draco-compressed
 */
async function checkModel(modelPath) {
  const document = await io.read(modelPath);
  const compressionInfo = getCompressionInfo(document);
  const stats = getModelStats(document);

  console.log(`\n📦 ${basename(modelPath)}`);
  console.log(
    `   Draco: ${compressionInfo.draco.used ? '✅ Yes' : '❌ No'}${compressionInfo.draco.required ? ' (required)' : ''}`,
  );
  console.log(
    `   Meshopt: ${compressionInfo.meshopt.used ? '✅ Yes' : '❌ No'}${compressionInfo.meshopt.required ? ' (required)' : ''}`,
  );
  console.log(`   Triangles: ${stats.triangleCount.toLocaleString()}`);
  console.log(`   Vertices: ${stats.vertexCount.toLocaleString()}`);

  return compressionInfo;
}

/**
 * Batch decompress all models in a directory
 */
async function batchDecompress(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const ext = extname(entry.name).toLowerCase();
    if (ext !== '.glb' && ext !== '.gltf') continue;

    const inputPath = join(dirPath, entry.name);
    const outputName = basename(entry.name, ext) + '.decompressed' + ext;
    const outputPath = join(dirPath, outputName);

    try {
      const result = await decompressDraco(inputPath, outputPath);

      if (result.skipped) {
        skipped++;
      } else {
        processed++;
      }
    } catch (err) {
      console.error(`❌ Failed to process ${entry.name}: ${err.message}`);
      errors++;
    }

    console.log(''); // Blank line between files
  }

  console.log('\n📊 Batch Summary:');
  console.log(`   Processed: ${processed}`);
  console.log(`   Skipped: ${skipped}`);
  console.log(`   Errors: ${errors}`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help')) {
    console.log('Draco Decompression Tool\n');
    console.log('Usage:');
    console.log('  node scripts/decompress-draco.js <input.glb> <output.glb>');
    console.log('  node scripts/decompress-draco.js --check <model.glb>');
    console.log('  node scripts/decompress-draco.js --batch <directory>');
    console.log('\nExamples:');
    console.log('  node scripts/decompress-draco.js model.glb model-decompressed.glb');
    console.log(
      '  node scripts/decompress-draco.js --check src/game/assets/models/Farmhouse/farmhouse.glb',
    );
    console.log('  node scripts/decompress-draco.js --batch src/game/assets/models/Farmhouse');
    process.exit(0);
  }

  // Check mode
  if (args[0] === '--check') {
    if (args.length < 2) {
      console.error('Error: --check requires a model path');
      process.exit(1);
    }

    await checkModel(args[1]);
    return;
  }

  // Batch mode
  if (args[0] === '--batch') {
    if (args.length < 2) {
      console.error('Error: --batch requires a directory path');
      process.exit(1);
    }

    await batchDecompress(args[1]);
    return;
  }

  // Single file mode
  if (args.length < 2) {
    console.error('Error: requires input and output paths');
    console.error('Usage: node scripts/decompress-draco.js <input.glb> <output.glb>');
    process.exit(1);
  }

  const [inputPath, outputPath] = args;

  try {
    await decompressDraco(inputPath, outputPath);
    console.log('✅ Decompression complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
