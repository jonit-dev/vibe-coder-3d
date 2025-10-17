#!/usr/bin/env node

/**
 * Check model complexity and provide optimization recommendations
 *
 * Analyzes 3D models and warns if they exceed recommended triangle counts
 * for real-time rendering. Provides actionable recommendations for fixing.
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readdir } from 'fs/promises';
import { join, relative } from 'path';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// Recommended triangle counts for different asset types
const RECOMMENDATIONS = {
  'hero-character': { max: 50000, ideal: 20000, name: 'Hero Character' },
  'environment-prop': { max: 15000, ideal: 5000, name: 'Environment Prop' },
  'background-object': { max: 5000, ideal: 1000, name: 'Background Object' },
  'terrain-chunk': { max: 10000, ideal: 3000, name: 'Terrain Chunk' },
};

/**
 * Get model statistics
 */
function getModelStats(document) {
  const root = document.getRoot();
  let triangleCount = 0;
  let vertexCount = 0;
  let meshCount = 0;
  let primitiveCount = 0;

  for (const mesh of root.listMeshes()) {
    meshCount++;
    for (const primitive of mesh.listPrimitives()) {
      primitiveCount++;
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

  return { triangleCount, vertexCount, meshCount, primitiveCount };
}

/**
 * Analyze model and provide recommendations
 */
function analyzeModel(filePath, stats) {
  const { triangleCount } = stats;

  // Determine asset type (heuristic based on triangle count)
  let assetType = 'background-object';
  if (triangleCount > 40000) assetType = 'hero-character';
  else if (triangleCount > 10000) assetType = 'environment-prop';

  const rec = RECOMMENDATIONS[assetType];
  const severity =
    triangleCount > rec.max * 3
      ? 'CRITICAL'
      : triangleCount > rec.max
        ? 'WARNING'
        : triangleCount > rec.ideal
          ? 'INFO'
          : 'OK';

  return {
    assetType,
    recommendation: rec,
    severity,
    needsOptimization: triangleCount > rec.ideal,
  };
}

/**
 * Print recommendations
 */
function printRecommendations(analysis, stats, filePath) {
  const { recommendation, severity, assetType } = analysis;
  const { triangleCount } = stats;

  const icons = {
    CRITICAL: '🔴',
    WARNING: '⚠️ ',
    INFO: 'ℹ️ ',
    OK: '✅',
  };

  console.log(`\n${icons[severity]} ${filePath}`);
  console.log(`   Type: ${recommendation.name}`);
  console.log(`   Triangles: ${triangleCount.toFixed(0)}`);
  console.log(`   Ideal: ${recommendation.ideal.toFixed(0)}`);
  console.log(`   Maximum: ${recommendation.max.toFixed(0)}`);

  if (severity === 'CRITICAL' || severity === 'WARNING') {
    const ratio = (recommendation.ideal / triangleCount).toFixed(3);
    console.log(`\n   📌 ACTION REQUIRED:`);
    console.log(`   This model needs ${((1 - ratio) * 100).toFixed(0)}% reduction!`);
    console.log(`\n   💡 SOLUTION:`);
    console.log(`   1. Open model in Blender/Maya/3DS Max`);
    console.log(`   2. Apply Decimate modifier with ratio ~${ratio}`);
    console.log(`   3. Re-export as GLB`);
    console.log(`   4. Run optimization pipeline`);
    console.log(`\n   🔧 Blender Example:`);
    console.log(`   - Select mesh → Add Modifier → Decimate`);
    console.log(`   - Set Ratio to ${ratio}`);
    console.log(`   - Apply modifier → File → Export → glTF 2.0`);
  }
}

/**
 * Main function
 */
async function main() {
  const modelsDir = process.argv[2] || 'public/assets/models';

  console.log('🔍 Checking model complexity...\n');

  const files = [];
  const dirs = await readdir(modelsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const modelPath = join(modelsDir, dir.name);
    const dirContents = await readdir(modelPath);

    for (const file of dirContents) {
      if (file.endsWith('.glb') && !file.includes('lod')) {
        files.push(join(modelPath, file));
      }
    }
  }

  console.log(`Found ${files.length} model(s)\n`);

  let criticalCount = 0;
  let warningCount = 0;

  for (const filePath of files) {
    try {
      const document = await io.read(filePath);
      const stats = getModelStats(document);
      const analysis = analyzeModel(filePath, stats);

      printRecommendations(analysis, stats, relative(modelsDir, filePath));

      if (analysis.severity === 'CRITICAL') criticalCount++;
      if (analysis.severity === 'WARNING') warningCount++;
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary: ${files.length} model(s) checked`);
  if (criticalCount > 0) console.log(`   🔴 Critical: ${criticalCount} (needs immediate action)`);
  if (warningCount > 0) console.log(`   ⚠️  Warning: ${warningCount} (should optimize)`);
  console.log(`${'='.repeat(60)}\n`);

  if (criticalCount > 0 || warningCount > 0) {
    console.log('💡 TIP: The optimization pipeline cannot fix models that start');
    console.log('   too complex. You MUST reduce polygon count in your 3D software');
    console.log('   BEFORE running the optimization pipeline.\n');
  }
}

main().catch(console.error);
