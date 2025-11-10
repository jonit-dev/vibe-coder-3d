#!/usr/bin/env node

/**
 * Auto Triangle Budget - KISS version
 * Binary search to find lowest viable triangle count
 */

import { cloneDocument, simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import { getTriangleCount } from './qualityMetrics.js';

/**
 * Find minimal viable simplification ratio via binary search
 * @param {Document} original - Original glTF document
 * @param {Object} options - { minRatio, maxRatio, minTriangles, maxIterations }
 * @returns {Promise<{ratio: number, triangles: number}>}
 */
export async function findMinimalViableRatio(original, options) {
  const {
    minRatio = 0.05,
    maxRatio = 1.0,
    minTriangles = 1000,
    maxIterations = 8,
  } = options;

  const originalTriangles = getTriangleCount(original);

  let low = minRatio;
  let high = maxRatio;
  let bestRatio = maxRatio;
  let bestTriangles = originalTriangles;

  for (let i = 0; i < maxIterations; i++) {
    const ratio = (low + high) / 2;

    // Test this ratio
    const testDoc = cloneDocument(original);
    await testDoc.transform(
      weld(),
      simplify({
        simplifier: MeshoptSimplifier,
        ratio,
        error: 0.01,
      })
    );

    const triangles = getTriangleCount(testDoc);

    // Check if meets minimum threshold
    if (triangles >= minTriangles) {
      // Good! Try going lower
      bestRatio = ratio;
      bestTriangles = triangles;
      high = ratio;
    } else {
      // Too low, need more triangles
      low = ratio;
    }
  }

  return { ratio: bestRatio, triangles: bestTriangles };
}
