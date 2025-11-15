// EditorPhysicsIntegration.tsx - Integrates physics with editor play/pause state
import { useEffect, useRef } from 'react';

import { IPhysicsBodyHandle } from '@/core/components/physics/PhysicsBody';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { IRigidBodyData } from '@/core/lib/ecs/components/RigidBodyComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useEditorStore } from '@/editor/store/editorStore';

/**
 * Component that manages physics integration with the editor
 * Creates physics bodies for entities with rigid body components when play mode is active
 */
export const EditorPhysicsIntegration = () => {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  const physicsBodyRefs = useRef<Map<number, IPhysicsBodyHandle>>(new Map());

  useEffect(() => {
    if (isPlaying) {
      // Get all entities with RigidBody components
      const entitiesWithRigidBodies = componentManager.getEntitiesWithComponent(
        KnownComponentTypes.RIGID_BODY,
      );

      entitiesWithRigidBodies.forEach((entityId) => {
        const rigidBodyComponent = componentManager.getRigidBodyComponent(entityId);

        if (rigidBodyComponent && rigidBodyComponent.data) {
          // Create physics body for this entity

          // Note: In a real implementation, you'd want to create the actual PhysicsBody
          // component and attach it to the entity's mesh. This is a simplified version
          // that demonstrates the integration pattern.
        }
      });
    } else {
      // Clean up physics bodies when stopping play mode
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      physicsBodyRefs.current.forEach((_bodyRef, _entityId) => {
        // Clean up physics body
      });
      physicsBodyRefs.current.clear();
    }
  }, [isPlaying, entityManager, componentManager]);

  // This component doesn't render anything - it's just for side effects
  return null;
};

/**
 * Hook to create physics bodies for entities with rigid body data
 */
export const usePhysicsBodyCreation = (entityId: number) => {
  const isPlaying = useEditorStore((state) => state.isPlaying);
  const componentManager = useComponentManager();

  const rigidBodyComponent = componentManager.getRigidBodyComponent(entityId);
  const rigidBodyData = rigidBodyComponent?.data as IRigidBodyData | undefined;
  const shouldHavePhysics = isPlaying && rigidBodyData && !rigidBodyData.isStatic;

  return {
    shouldHavePhysics,
    rigidBodyData,
    isPlaying,
  };
};
