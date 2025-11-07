import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { OrthographicCamera, PerspectiveCamera, Vector3, WebGLRenderer } from 'three';

export interface IAdaptiveQualityOptions {
  minPixelRatio?: number; // Lower bound DPR while moving
  restoreDelayMs?: number; // Debounce before restoring DPR when camera stops (editor camera)
  pauseShadowUpdatesWhileMoving?: boolean; // Avoid shadow map renders while moving editor camera
}

export const useAdaptiveQuality = (options: IAdaptiveQualityOptions = {}) => {
  const { gl, camera } = useThree();
  const {
    minPixelRatio = 1,
    // Make restore delay small so shadows resume quickly (avoids visible 500ms lag)
    restoreDelayMs = 50,
    pauseShadowUpdatesWhileMoving = true,
  } = options;

  const lastPosRef = useRef<Vector3>(new Vector3().copy(camera.position));
  const lastZoomRef = useRef<number>((camera as PerspectiveCamera | OrthographicCamera).zoom ?? 1);
  const lastFovRef = useRef<number>((camera as PerspectiveCamera).fov ?? 0);
  const isMovingRef = useRef<boolean>(false);
  const restoreTimerRef = useRef<number | null>(null);
  const originalDprRef = useRef<number>(Math.min(window.devicePixelRatio || 1, 2));
  const lastShadowAutoUpdateRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Initialize DPR and ensure we start with autoUpdate on.
    originalDprRef.current = Math.min(window.devicePixelRatio || 1, 2);
    const renderer = gl as WebGLRenderer;
    lastShadowAutoUpdateRef.current = renderer.shadowMap.autoUpdate;

    return () => {
      // Cleanup: on unmount (e.g. leaving play mode / viewport), guarantee shadows keep updating.
      const r = gl as WebGLRenderer;
      r.shadowMap.autoUpdate = true;
      (r.shadowMap as any).needsUpdate = true;
      if (restoreTimerRef.current !== null) {
        clearTimeout(restoreTimerRef.current);
      }
      restoreTimerRef.current = null;
      lastShadowAutoUpdateRef.current = null;
      isMovingRef.current = false;
    };
  }, [gl]);

  const setDpr = (renderer: WebGLRenderer, value: number) => {
    const clamped = Math.max(0.5, Math.min(2, value));
    if (renderer.getPixelRatio() !== clamped) {
      renderer.setPixelRatio(clamped);
    }
  };

  useFrame(() => {
    const cam = camera as PerspectiveCamera | OrthographicCamera;
    const renderer = gl as WebGLRenderer;

    // If the context is lost or renderer is not fully ready, bail out safely.
    if (!renderer || !(renderer as any).shadowMap) {
      return;
    }

    const movedDistance = lastPosRef.current.distanceTo(camera.position);
    const zoom = cam.zoom ?? 1;
    const fov = (cam as PerspectiveCamera).fov ?? 0;

    const zoomChanged = Math.abs(zoom - lastZoomRef.current) > 0.001;
    const fovChanged = Math.abs(fov - lastFovRef.current) > 0.001;
    const isMoving = movedDistance > 0.002 || zoomChanged || fovChanged;

    // Deep invariant: never leave shadows permanently disabled.
    // If autoUpdate was turned off but we're not currently in a "moving" downgrade,
    // restore it and force an update. This self-heals any stale state from play-mode or remounts.
    if (!isMoving && !renderer.shadowMap.autoUpdate) {
      renderer.shadowMap.autoUpdate = true;
      (renderer.shadowMap as any).needsUpdate = true;
      lastShadowAutoUpdateRef.current = null;
    }

    if (isMoving) {
      // Cancel any pending restore
      if (restoreTimerRef.current !== null) {
        clearTimeout(restoreTimerRef.current);
        restoreTimerRef.current = null;
      }

      // Lower DPR while moving (use MIN of original and configured minPixelRatio)
      const targetDpr = Math.max(0.5, Math.min(originalDprRef.current, minPixelRatio));
      if (renderer.getPixelRatio() > targetDpr) {
        setDpr(renderer, targetDpr);
      }

      // IMPORTANT:
      // We only want to throttle shadows for "editor camera navigation", not for in-game motion.
      // Using camera movement to pause shadow updates causes exactly the bug you observed:
      // character moves (needing dynamic shadows) while camera is also moving, shadows lag/freeze.
      // To avoid this, we DISABLE shadow autoUpdate throttling here and only keep DPR scaling.

      // Do NOT touch renderer.shadowMap.autoUpdate while moving.
      // This ensures dynamic shadows (e.g. character controller) stay in sync even with camera motion.
      if (pauseShadowUpdatesWhileMoving) {
        // If some previous state left autoUpdate false, self-healing logic above will restore it.
        // We intentionally NO-OP here for autoUpdate to avoid shadow lag.
      }
    } else {
      // Not moving: ensure DPR is restored promptly.
      if (isMovingRef.current && restoreTimerRef.current === null) {
        restoreTimerRef.current = window.setTimeout(() => {
          // Restore DPR quickly after movement stops
          setDpr(renderer, originalDprRef.current);

          // We no longer intentionally disable autoUpdate in the moving branch,
          // so here we only enforce safety: never leave shadows disabled.
          if (!renderer.shadowMap.autoUpdate) {
            renderer.shadowMap.autoUpdate = true;
            (renderer.shadowMap as any).needsUpdate = true;
          }

          // Ensure we only restore once and clear timer
          lastShadowAutoUpdateRef.current = null;
          restoreTimerRef.current = null;
        }, restoreDelayMs) as unknown as number;
      }
    }

    // Update baselines
    isMovingRef.current = isMoving;
    lastPosRef.current.copy(camera.position);
    lastZoomRef.current = zoom;
    lastFovRef.current = fov;
  });
};
