// EditorPhysicsIntegration.tsx - Integrates physics with editor play/pause state
import { useEffect, useRef } from 'react';

import { IPhysicsBodyHandle } from '@/core/components/physics/PhysicsBody';
import { useEditorStore } from '@/editor/store/editorStore';

/**
 * Component that manages physics integration with the editor
 * Creates physics bodies for entities with rigid body data when play mode is active
 */
export const EditorPhysicsIntegration = () => {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const rigidBodies = useEditorStore((state) => state.rigidBodies);

  const physicsBodyRefs = useRef<Map<number, IPhysicsBodyHandle>>(new Map());

  useEffect(() => {
    if (isPlaying) {
      // Create physics bodies for all entities with rigid body data
      Object.entries(rigidBodies).forEach(([entityIdStr, rigidBodyData]) => {
        const entityId = parseInt(entityIdStr, 10);

        if (rigidBodyData && rigidBodyData.enabled) {
          // Create physics body for this entity
          console.log(`Creating physics body for entity ${entityId}`, rigidBodyData);

          // Note: In a real implementation, you'd want to create the actual PhysicsBody
          // component and attach it to the entity's mesh. This is a simplified version
          // that demonstrates the integration pattern.
        }
      });
    } else {
      // Clean up physics bodies when stopping play mode
      physicsBodyRefs.current.forEach((bodyRef, entityId) => {
        console.log(`Cleaning up physics body for entity ${entityId}`);
        // Clean up physics body
      });
      physicsBodyRefs.current.clear();
    }
  }, [isPlaying, rigidBodies]);

  // This component doesn't render anything - it's just for side effects
  return null;
};

/**
 * Hook to create physics bodies for entities with rigid body data
 */
export const usePhysicsBodyCreation = (entityId: number) => {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const rigidBodies = useEditorStore((state) => state.rigidBodies);

  const rigidBodyData = rigidBodies[entityId];
  const shouldHavePhysics = isPlaying && rigidBodyData && rigidBodyData.enabled;

  return {
    shouldHavePhysics,
    rigidBodyData,
    isPlaying,
  };
};
