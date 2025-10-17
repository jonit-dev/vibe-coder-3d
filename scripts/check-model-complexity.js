#!/usr/bin/env node

/**
 * Model Complexity Checker
 *
 * Single Responsibility: Scan models directory and report complexity issues
 * Uses shared modelAnalyzer module for DRY principle
 */

import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { readdir } from 'fs/promises';
import { join, relative } from 'path';
import { analyzeModel, getTriangleCount } from './lib/modelAnalyzer.js';

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

/**
 * Print analysis results with recommendations
 */
function printAnalysis(analysis, filePath) {
  const { triangleCount, target, severity, reduction, recommendedRatio } = analysis;

  const icons = {
    critical: '🔴',
    warning: '⚠️ ',
    ok: '✅',
  };

  console.log(`\n${icons[severity]} ${filePath}`);
  console.log(`   Type: ${target.name}`);
  console.log(`   Triangles: ${triangleCount.toLocaleString()}`);
  console.log(`   Ideal: ${target.ideal.toLocaleString()}`);
  console.log(`   Maximum: ${target.max.toLocaleString()}`);

  if (severity !== 'ok') {
    console.log(`\n   📌 ACTION REQUIRED:`);
    console.log(`   This model needs ${reduction}% reduction!`);
    console.log(`\n   💡 SOLUTION:`);
    console.log(`   1. Open model in Blender/Maya/3DS Max`);
    console.log(`   2. Apply Decimate modifier with ratio ~${recommendedRatio.toFixed(3)}`);
    console.log(`   3. Re-export as GLB`);
    console.log(`   4. Run optimization pipeline`);
    console.log(`\n   🔧 Blender Example:`);
    console.log(`   - Select mesh → Add Modifier → Decimate`);
    console.log(`   - Set Ratio to ${recommendedRatio.toFixed(3)}`);
    console.log(`   - Apply modifier → File → Export → glTF 2.0`);
  }
}

/**
 * Find all model files in directory
 */
async function findModelFiles(modelsDir) {
  const files = [];
  const dirs = await readdir(modelsDir, { withFileTypes: true });

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;

    const modelPath = join(modelsDir, dir.name);
    const dirContents = await readdir(modelPath);

    for (const file of dirContents) {
      // Skip LOD variants and optimized versions
      if (file.endsWith('.glb') && !file.includes('lod') && !file.includes('optimized')) {
        files.push(join(modelPath, file));
      }
    }
  }

  return files;
}

/**
 * Main function
 */
async function main() {
  const modelsDir = process.argv[2] || 'public/assets/models';

  console.log('🔍 Checking model complexity...\n');

  const files = await findModelFiles(modelsDir);
  console.log(`Found ${files.length} model(s)\n`);

  let criticalCount = 0;
  let warningCount = 0;

  for (const filePath of files) {
    try {
      const document = await io.read(filePath);
      const analysis = analyzeModel(document);

      printAnalysis(analysis, relative(modelsDir, filePath));

      if (analysis.severity === 'critical') criticalCount++;
      if (analysis.severity === 'warning') warningCount++;
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Summary: ${files.length} model(s) checked`);
  if (criticalCount > 0) console.log(`   🔴 Critical: ${criticalCount} (needs immediate action)`);
  if (warningCount > 0) console.log(`   ⚠️  Warning: ${warningCount} (should optimize)`);
  console.log(`${'='.repeat(60)}\n`);

  if (criticalCount > 0 || warningCount > 0) {
    console.log('💡 TIP: Run the optimization pipeline with Blender decimation:');
    console.log('   USE_BLENDER_DECIMATION=true AUTO_DECIMATE_MODELS=true yarn optimize\n');
  }
}

main().catch(console.error);
