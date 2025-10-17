import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { OrthographicCamera, PerspectiveCamera, Vector3, WebGLRenderer } from 'three';

export interface IAdaptiveQualityOptions {
  minPixelRatio?: number; // Lower bound DPR while moving
  restoreDelayMs?: number; // Debounce before restoring DPR
  pauseShadowUpdatesWhileMoving?: boolean; // Avoid shadow map renders while moving
}

export const useAdaptiveQuality = (options: IAdaptiveQualityOptions = {}) => {
  const { gl, camera } = useThree();
  const { minPixelRatio = 1, restoreDelayMs = 200, pauseShadowUpdatesWhileMoving = true } = options;

  const lastPosRef = useRef<Vector3>(new Vector3().copy(camera.position));
  const lastZoomRef = useRef<number>((camera as PerspectiveCamera | OrthographicCamera).zoom ?? 1);
  const lastFovRef = useRef<number>((camera as PerspectiveCamera).fov ?? 0);
  const isMovingRef = useRef<boolean>(false);
  const restoreTimerRef = useRef<number | null>(null);
  const originalDprRef = useRef<number>(Math.min(window.devicePixelRatio || 1, 2));
  const lastShadowAutoUpdateRef = useRef<boolean | null>(null);

  useEffect(() => {
    originalDprRef.current = Math.min(window.devicePixelRatio || 1, 2);
  }, []);

  const setDpr = (renderer: WebGLRenderer, value: number) => {
    const clamped = Math.max(0.5, Math.min(2, value));
    if (renderer.getPixelRatio() !== clamped) {
      renderer.setPixelRatio(clamped);
    }
  };

  useFrame(() => {
    const cam = camera as PerspectiveCamera | OrthographicCamera;
    const renderer = gl as WebGLRenderer;

    const movedDistance = lastPosRef.current.distanceTo(camera.position);
    const zoom = cam.zoom ?? 1;
    const fov = (cam as PerspectiveCamera).fov ?? 0;

    const zoomChanged = Math.abs(zoom - lastZoomRef.current) > 0.001;
    const fovChanged = Math.abs(fov - lastFovRef.current) > 0.001;
    const isMoving = movedDistance > 0.002 || zoomChanged || fovChanged;

    if (isMoving) {
      // Cancel any pending restore
      if (restoreTimerRef.current !== null) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }

      // Lower DPR while moving
      const targetDpr = Math.min(originalDprRef.current, minPixelRatio);
      if (renderer.getPixelRatio() > targetDpr) {
        setDpr(renderer, targetDpr);
      }

      // Pause shadow map updates to skip extra shadow passes while moving
      if (pauseShadowUpdatesWhileMoving) {
        if (lastShadowAutoUpdateRef.current === null) {
          lastShadowAutoUpdateRef.current = renderer.shadowMap.autoUpdate;
        }
        renderer.shadowMap.autoUpdate = false;
      }
    } else if (isMovingRef.current) {
      // Movement just stopped - schedule restore
      if (restoreTimerRef.current === null) {
        restoreTimerRef.current = window.setTimeout(() => {
          // Restore DPR
          setDpr(renderer, originalDprRef.current);

          // Restore shadow updates and force one update
          if (pauseShadowUpdatesWhileMoving) {
            const prev = lastShadowAutoUpdateRef.current;
            renderer.shadowMap.autoUpdate = prev ?? true;
            // Force a single update on next frame
            (renderer.shadowMap as any).needsUpdate = true;
          }

          restoreTimerRef.current = null;
        }, restoreDelayMs) as unknown as number;
      }
    }

    // Update baselines
    if (isMoving) {
      isMovingRef.current = true;
    } else {
      isMovingRef.current = false;
    }
    lastPosRef.current.copy(camera.position);
    lastZoomRef.current = zoom;
    lastFovRef.current = fov;
  });
};
