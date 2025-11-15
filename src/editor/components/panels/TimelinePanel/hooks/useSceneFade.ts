import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Logger } from '@core/lib/logger';

const logger = Logger.create('useSceneFade');

const shouldSkipObject = (obj: THREE.Object3D): boolean => {
  const name = (obj.name ?? '').toLowerCase();
  if (
    name.includes('gizmo') ||
    name.includes('helper') ||
    name.includes('grid') ||
    name.includes('axes') ||
    name.includes('outline') ||
    name.includes('animation-focus-ring')
  ) {
    return true;
  }
  if (obj.userData?.isEditorUI || obj.userData?.isHelper || obj.userData?.isAnimationFocusRing) {
    return true;
  }
  return false;
};

export interface ISceneFadeOptions {
  focusedEntityId: number | null;
  isFocusMode: boolean;
  fadeOpacity?: number; // Opacity for non-focused entities (0-1), default 0.2
}

/**
 * Hook to fade out scene entities when in animation focus mode.
 *
 * This hook follows SRP by only managing the visual fade effect on scene objects.
 * It doesn't handle camera or selection - those are separate concerns.
 */
export const useSceneFade = ({
  focusedEntityId,
  isFocusMode,
  fadeOpacity = 0.2,
}: ISceneFadeOptions): void => {
  const { scene } = useThree();
  const originalOpacitiesRef = useRef<Map<THREE.Material, number>>(new Map());
  const pendingFadeRef = useRef(false);
  const warnedRef = useRef(false);
  const loggedRef = useRef(false);
  const latestStateRef = useRef({
    focusedEntityId,
    isFocusMode,
    fadeOpacity,
  });

  latestStateRef.current = { focusedEntityId, isFocusMode, fadeOpacity };

  const restoreMaterials = () => {
    const count = originalOpacitiesRef.current.size;
    logger.info('[restoreMaterials] Restoring materials', { materialCount: count });

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

        materials.forEach((mat) => {
          if (originalOpacitiesRef.current.has(mat)) {
            const originalOpacity = originalOpacitiesRef.current.get(mat)!;
            mat.opacity = originalOpacity;
            mat.transparent = originalOpacity < 1;
            mat.needsUpdate = true;
          }
        });
      }
    });

    originalOpacitiesRef.current.clear();
    logger.info('[restoreMaterials] Materials restored');
  };

  const collectFocusedMeshes = (entityId: number) => {
    const focusedMeshes = new Set<THREE.Mesh | THREE.Line>();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        let current: THREE.Object3D | null = obj;
        let belongsToFocusedEntity = false;

        while (current) {
          if (current.userData?.entityId === entityId) {
            belongsToFocusedEntity = true;
            break;
          }
          current = current.parent;
        }

        if (belongsToFocusedEntity) {
          focusedMeshes.add(obj);
        }
      }
    });

    return focusedMeshes;
  };

  const applyFadeForEntity = (entityId: number | null, opacity: number): number => {
    if (entityId === null) {
      return 0;
    }

    const focusedMeshes = collectFocusedMeshes(entityId);

    if (focusedMeshes.size === 0) {
      if (!warnedRef.current) {
        logger.warn('No meshes found for focused entity', { focusedEntityId: entityId });
        warnedRef.current = true;
      }
    } else if (!loggedRef.current) {
      logger.info('Found meshes for focused entity', {
        focusedEntityId: entityId,
        meshCount: focusedMeshes.size,
      });
      loggedRef.current = true;
    }

    let fadedCount = 0;
    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh || obj instanceof THREE.Line)) {
        return;
      }

      if (focusedMeshes.has(obj) || shouldSkipObject(obj)) {
        return;
      }

      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];

      materials.forEach((mat) => {
        if (!originalOpacitiesRef.current.has(mat)) {
          originalOpacitiesRef.current.set(mat, mat.opacity);
        }

        mat.transparent = true;
        mat.opacity = opacity;
        mat.needsUpdate = true;
        fadedCount++;
      });
    });

    if (fadedCount > 0) {
      logger.info('Applied fade effect', { fadedCount, fadeOpacity: opacity });
    }

    return focusedMeshes.size;
  };

  useEffect(() => {
    logger.info('[useSceneFade useEffect] Called', { isFocusMode, focusedEntityId });

    if (!isFocusMode || focusedEntityId === null) {
      logger.info('[useSceneFade useEffect] Focus mode OFF - restoring materials');
      restoreMaterials();
      pendingFadeRef.current = false;
      warnedRef.current = false;
      loggedRef.current = false;
      return;
    }

    logger.info('[useSceneFade useEffect] Focus mode ON - applying fade');
    warnedRef.current = false;
    loggedRef.current = false;
    pendingFadeRef.current = true;

    const meshCount = applyFadeForEntity(focusedEntityId, fadeOpacity);
    pendingFadeRef.current = meshCount === 0;

    return () => {
      logger.info('[useSceneFade useEffect cleanup] Restoring materials on unmount');
      restoreMaterials();
      pendingFadeRef.current = false;
      warnedRef.current = false;
      loggedRef.current = false;
    };
  }, [focusedEntityId, isFocusMode, fadeOpacity, scene]);

  useFrame(() => {
    const {
      focusedEntityId: currentEntityId,
      isFocusMode: currentFocusMode,
      fadeOpacity: currentFadeOpacity,
    } = latestStateRef.current;

    if (!currentFocusMode || currentEntityId === null || !pendingFadeRef.current) {
      return;
    }

    const meshCount = applyFadeForEntity(currentEntityId, currentFadeOpacity);
    pendingFadeRef.current = meshCount === 0;
  });
};
