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
 */
export function classifyModel(triangleCount) {
  if (triangleCount > 40000) return 'hero';
  if (triangleCount > 10000) return 'prop';
  return 'background';
}

/**
 * Get target metrics for model classification
 */
export function getTargetMetrics(classification) {
  const targets = {
    hero: { ideal: 40000, max: 50000, name: 'Hero Character' },
    prop: { ideal: 10000, max: 15000, name: 'Environment Prop' },
    background: { ideal: 3000, max: 5000, name: 'Background Object' },
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
