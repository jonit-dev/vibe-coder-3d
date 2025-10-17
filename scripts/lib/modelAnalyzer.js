#!/usr/bin/env node

/**
 * Model Analysis Module
 *
 * Single Responsibility: Analyze glTF models and provide complexity metrics
 * Used by both the optimizer and complexity checker
 */

/**
 * Calculate triangle count for a glTF document
 */
export function getTriangleCount(document) {
  let triangleCount = 0;

  document
    .getRoot()
    .listMeshes()
    .forEach((mesh) => {
      mesh.listPrimitives().forEach((primitive) => {
        const indices = primitive.getIndices();
        if (indices) {
          triangleCount += indices.getCount() / 3;
        }
      });
    });

  return Math.floor(triangleCount);
}

/**
 * Classify model based on triangle count
 * Based on industry LOD standards for Three.js/WebGL
 */
export function classifyModel(triangleCount) {
  // LOD0 High: 20k-80k for hero models
  if (triangleCount > 20000) return 'hero';
  // LOD1 Medium: 5k-20k for props
  if (triangleCount > 5000) return 'prop';
  // LOD2 Low: 1k-5k for background
  return 'background';
}

/**
 * Get target metrics for model classification
 * Targets based on WebGL/Three.js LOD best practices
 */
export function getTargetMetrics(classification) {
  const targets = {
    // LOD0: Desktop high-end (50k-100k), Mobile high-end (20k-40k)
    // Target middle ground: 50k ideal, 80k max
    hero: { ideal: 50000, max: 80000, name: 'Hero Character/Main Prop' },

    // LOD1: Desktop (20k-50k), Mobile (10k-20k)
    // Target: 20k ideal, 50k max
    prop: { ideal: 20000, max: 50000, name: 'Environment Prop' },

    // LOD2: Desktop (5k-20k), Mobile (2k-10k)
    // Target: 5k ideal, 20k max
    background: { ideal: 5000, max: 20000, name: 'Background Object' },
  };

  return targets[classification] || targets.prop;
}

/**
 * Determine severity level based on triangle count and target
 */
export function getSeverity(triangleCount, target) {
  if (triangleCount > target.max * 3) return 'critical';
  if (triangleCount > target.max) return 'warning';
  return 'ok';
}

/**
 * Calculate required reduction percentage
 */
export function getRequiredReduction(triangleCount, targetCount) {
  if (triangleCount <= targetCount) return 0;
  return Math.round(((triangleCount - targetCount) / triangleCount) * 100);
}

/**
 * Get recommended decimation ratio to reach target
 */
export function getRecommendedRatio(triangleCount, targetCount) {
  if (triangleCount <= targetCount) return 1.0;

  const ratio = targetCount / triangleCount;

  // Clamp between 2% and 100%
  return Math.max(0.02, Math.min(1.0, ratio));
}

/**
 * Analyze a glTF document and return comprehensive metrics
 */
export function analyzeModel(document) {
  const triangleCount = getTriangleCount(document);
  const classification = classifyModel(triangleCount);
  const target = getTargetMetrics(classification);
  const severity = getSeverity(triangleCount, target);
  const reduction = getRequiredReduction(triangleCount, target.ideal);
  const recommendedRatio = getRecommendedRatio(triangleCount, target.ideal);

  return {
    triangleCount,
    classification,
    target,
    severity,
    reduction,
    recommendedRatio,
    needsOptimization: severity !== 'ok',
  };
}
