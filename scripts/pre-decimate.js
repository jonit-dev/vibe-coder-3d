#!/usr/bin/env node

/**
 * Pre-decimation script using meshoptimizer directly
 *
 * This script performs aggressive mesh simplification BEFORE the main
 * optimization pipeline runs. It uses meshoptimizer's JavaScript API
 * directly to achieve much higher reduction ratios than gltf-transform's
 * simplify() function allows.
 *
 * Usage:
 *   node scripts/pre-decimate.js <input.glb> <output.glb> <target-triangle-ratio>
 *
 * Example:
 *   node scripts/pre-decimate.js model.glb model-decimated.glb 0.05
 *   # Reduces model to 5% of original triangle count
 */

import { readFile, writeFile } from 'fs/promises';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptSimplifier } from 'meshoptimizer';

// Initialize meshoptimizer
await MeshoptSimplifier.ready;

// Initialize glTF I/O
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

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
 * Aggressively decimate a mesh primitive using meshoptimizer directly
 */
function decimatePrimitive(primitive, targetRatio, targetError = 0.01) {
  const indices = primitive.getIndices();
  const position = primitive.getAttribute('POSITION');

  if (!indices || !position) {
    return;
  }

  const indexArray = indices.getArray();
  const positionArray = position.getArray();
  const indexCount = indices.getCount();
  const vertexCount = position.getCount();

  // Calculate target index count (triangles * 3)
  const targetIndexCount = Math.floor(indexCount * targetRatio);

  // Ensure we have at least one triangle
  if (targetIndexCount < 3) {
    console.warn('Target ratio too low, keeping minimum 1 triangle');
    return;
  }

  // Create typed arrays for meshoptimizer
  const indicesU32 = new Uint32Array(indexArray);
  const positionsF32 = new Float32Array(positionArray);

  console.log(`  Input: ${indexCount / 3} triangles, ${vertexCount} vertices`);
  console.log(`  Target: ${targetIndexCount / 3} triangles (${(targetRatio * 100).toFixed(1)}%)`);

  try {
    // Use meshoptimizer's simplify directly
    const [newIndices, error] = MeshoptSimplifier.simplify(
      indicesU32,
      positionsF32,
      3, // stride (xyz)
      targetIndexCount,
      targetError,
      ['ErrorAbsolute'], // Use absolute error for more aggressive simplification
    );

    const newTriangleCount = newIndices.length / 3;
    console.log(`  Output: ${newTriangleCount} triangles (error: ${error.toFixed(6)})`);
    console.log(`  Reduction: ${((1 - newIndices.length / indexCount) * 100).toFixed(1)}%`);

    // Update the primitive with simplified indices
    indices.setArray(newIndices);

    // Note: We don't remove unused vertices here as gltf-transform's
    // prune() will handle that in the main optimization pipeline
  } catch (err) {
    console.error(`  Simplification failed: ${err.message}`);
  }
}

/**
 * Decimate all meshes in a document
 */
function decimateDocument(document, targetRatio, targetError) {
  const root = document.getRoot();
  let processedCount = 0;

  for (const mesh of root.listMeshes()) {
    console.log(`\nProcessing mesh: ${mesh.getName() || '<unnamed>'}`);

    for (let i = 0; i < mesh.listPrimitives().length; i++) {
      const primitive = mesh.listPrimitives()[i];
      console.log(`  Primitive ${i}:`);
      decimatePrimitive(primitive, targetRatio, targetError);
      processedCount++;
    }
  }

  return processedCount;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: node pre-decimate.js <input.glb> <output.glb> <target-ratio>');
    console.error('');
    console.error('Example:');
    console.error('  node pre-decimate.js model.glb model-reduced.glb 0.05');
    console.error('  # Reduces model to 5% of original triangles');
    process.exit(1);
  }

  const [inputPath, outputPath, targetRatioStr] = args;
  const targetRatio = parseFloat(targetRatioStr);
  const targetError = args[3] ? parseFloat(args[3]) : 0.01;

  if (isNaN(targetRatio) || targetRatio <= 0 || targetRatio > 1) {
    console.error('Error: target-ratio must be between 0 and 1');
    process.exit(1);
  }

  console.log('🔧 Pre-decimation using meshoptimizer');
  console.log(`📥 Input: ${inputPath}`);
  console.log(`📤 Output: ${outputPath}`);
  console.log(`🎯 Target ratio: ${(targetRatio * 100).toFixed(1)}%`);
  console.log(`⚠️  Target error: ${targetError}`);

  try {
    // Load the model
    console.log('\n📖 Loading model...');
    const document = await io.read(inputPath);
    const beforeStats = getModelStats(document);

    console.log(`📊 Original stats:`);
    console.log(`   Triangles: ${beforeStats.triangleCount.toFixed(0)}`);
    console.log(`   Vertices: ${beforeStats.vertexCount.toFixed(0)}`);

    // Decimate all meshes
    const processedCount = decimateDocument(document, targetRatio, targetError);

    // Get final stats
    const afterStats = getModelStats(document);
    const reduction = ((1 - afterStats.triangleCount / beforeStats.triangleCount) * 100).toFixed(1);

    console.log(`\n📊 Final stats:`);
    console.log(`   Triangles: ${afterStats.triangleCount.toFixed(0)} (-${reduction}%)`);
    console.log(`   Vertices: ${afterStats.vertexCount.toFixed(0)}`);
    console.log(`   Processed: ${processedCount} primitive(s)`);

    // Write output
    console.log(`\n💾 Writing to ${outputPath}...`);
    await io.write(outputPath, document);

    console.log('✅ Pre-decimation complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main().catch(console.error);
