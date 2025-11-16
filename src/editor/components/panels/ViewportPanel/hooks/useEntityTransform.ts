import { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { EntityManager } from '@/core/lib/ecs/EntityManager';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';

interface IUseEntityTransformProps {
  transform: { data: ITransformData } | null | undefined;
  isTransforming: boolean;
  isPhysicsDriven?: boolean;
  entityId: number;
}

export const useEntityTransform = ({
  transform,
  isTransforming,
  isPhysicsDriven = false,
  entityId,
}: IUseEntityTransformProps) => {
  const meshRef = useRef<THREE.Group | THREE.Mesh | THREE.Object3D | null>(null);
  const lastSyncedTransform = useRef<string>('');

  // Extract transform data with defaults
  // For prefab roots without Transform, use first child's transform
  const transformData = useMemo(() => {
    if (!transform?.data) {
      // Check if this is a prefab root (has PrefabInstance but no Transform)
      const isPrefabRoot =
        componentRegistry.hasComponent(entityId, 'PrefabInstance') &&
        !componentRegistry.hasComponent(entityId, KnownComponentTypes.TRANSFORM);

      if (isPrefabRoot) {
        // Use first child's transform for gizmo positioning
        const entity = EntityManager.getInstance().getEntity(entityId);
        if (entity?.children && entity.children.length > 0) {
          const firstChildId = entity.children[0];
          const firstChildTransform = componentRegistry.getComponentData(
            firstChildId,
            KnownComponentTypes.TRANSFORM,
          ) as ITransformData | undefined;

          if (firstChildTransform) {
            return {
              position: firstChildTransform.position || ([0, 0, 0] as [number, number, number]),
              rotation: firstChildTransform.rotation || ([0, 0, 0] as [number, number, number]),
              scale: firstChildTransform.scale || ([1, 1, 1] as [number, number, number]),
            };
          }
        }
      }
      return null; // Don't provide any transform data until it's properly loaded
    }
    return {
      position: transform.data.position || ([0, 0, 0] as [number, number, number]),
      rotation: transform.data.rotation || ([0, 0, 0] as [number, number, number]),
      scale: transform.data.scale || ([1, 1, 1] as [number, number, number]),
    };
  }, [transform?.data, entityId]);

  // Convert rotation to radians for physics
  const rotationRadians = useMemo((): [number, number, number] | null => {
    if (!transformData) return null;
    return [
      transformData.rotation[0] * (Math.PI / 180),
      transformData.rotation[1] * (Math.PI / 180),
      transformData.rotation[2] * (Math.PI / 180),
    ];
  }, [transformData]);

  const syncObjectTransform = useCallback(
    (object: THREE.Object3D | THREE.Group | THREE.Mesh | null, force = false) => {
      if (!object || !transformData || (!force && isTransforming)) {
        return;
      }

      if (isPhysicsDriven) {
        if (force) {
          object.position.set(0, 0, 0);
          object.rotation.set(0, 0, 0);
          object.scale.set(1, 1, 1);
          object.updateMatrix();
          object.updateMatrixWorld(true);
          lastSyncedTransform.current = 'physics-driven';
        }
        return;
      }

      const { position, rotation, scale } = transformData;

      // Mesh rotation is in radians; component data is in degrees
      const rotRadX = rotation[0] * (Math.PI / 180);
      const rotRadY = rotation[1] * (Math.PI / 180);
      const rotRadZ = rotation[2] * (Math.PI / 180);

      const posMatches =
        Math.abs(object.position.x - position[0]) < 0.001 &&
        Math.abs(object.position.y - position[1]) < 0.001 &&
        Math.abs(object.position.z - position[2]) < 0.001;

      const rotMatches =
        Math.abs(object.rotation.x - rotRadX) < 0.001 &&
        Math.abs(object.rotation.y - rotRadY) < 0.001 &&
        Math.abs(object.rotation.z - rotRadZ) < 0.001;

      const scaleMatches =
        Math.abs(object.scale.x - scale[0]) < 0.001 &&
        Math.abs(object.scale.y - scale[1]) < 0.001 &&
        Math.abs(object.scale.z - scale[2]) < 0.001;

      const transformHash = `${position.join(',')},${rotation.join(',')},${scale.join(',')}`;

      if (
        force ||
        lastSyncedTransform.current !== transformHash ||
        !(posMatches && rotMatches && scaleMatches)
      ) {
        object.position.set(position[0], position[1], position[2]);
        object.rotation.set(rotRadX, rotRadY, rotRadZ);
        object.scale.set(scale[0], scale[1], scale[2]);

        object.updateMatrix();
        object.updateMatrixWorld(true);

        lastSyncedTransform.current = transformHash;
      }
    },
    [transformData, isTransforming, isPhysicsDriven],
  );

  // Sync mesh transform from ComponentManager (single source of truth)
  // CRITICAL: Only sync when transform data actually changes, not on every render
  // Allow sync during play mode to handle position restoration on stop
  useLayoutEffect(() => {
    if (meshRef.current) {
      syncObjectTransform(meshRef.current);
    }
  }, [syncObjectTransform]);

  const meshInstanceRef = useCallback(
    (object: THREE.Object3D | THREE.Group | THREE.Mesh | null) => {
      meshRef.current = object;

      if (!object) {
        lastSyncedTransform.current = '';
        return;
      }

      syncObjectTransform(object, true);
    },
    [syncObjectTransform],
  );

  return {
    meshRef,
    meshInstanceRef,
    position: transformData?.position || null,
    rotation: transformData?.rotation || null,
    scale: transformData?.scale || null,
    rotationRadians,
  };
};
