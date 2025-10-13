/**
 * Model Matrix System - Batches matrix updates for custom models
 *
 * PERFORMANCE: Replaces individual useFrame hooks in each CustomModelMesh
 * with a single system-level batch update. Expected gain: +2-4 FPS with 20+ custom models
 *
 * See: performance-audit-report.md #4
 */

import React from 'react';
import { useFrame } from '@react-three/fiber';
import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';

/**
 * System component that batches matrix updates for all custom models
 * This runs once per frame instead of N times (where N = number of custom models)
 */
export const ModelMatrixSystem: React.FC = () => {
  useFrame(() => {
    const entityIds = threeJSEntityRegistry.getAllEntities();

    // Batch update all registered entity matrices
    for (const entityId of entityIds) {
      const object3D = threeJSEntityRegistry.getEntityObject3D(entityId);
      if (object3D) {
        // Force matrix updates to ensure transforms propagate to children
        // The 'true' parameter forces recursive update through the entire hierarchy
        object3D.updateMatrixWorld(true);
      }
    }
  });

  return null;
};

ModelMatrixSystem.displayName = 'ModelMatrixSystem';
