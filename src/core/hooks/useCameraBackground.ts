import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Color } from 'three';

export function useCameraBackground(
  clearFlags: string = 'skybox',
  backgroundColor?: { r: number; g: number; b: number; a: number },
) {
  const { scene, invalidate } = useThree();
  const currentClearFlagsRef = useRef<string | null>(null);
  const currentBgColorRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Log hook initialization
  if (!isInitializedRef.current) {
    console.log('[useCameraBackground] Hook initialized with:', { clearFlags, backgroundColor });
    isInitializedRef.current = true;
  }

  useEffect(() => {
    console.log('[useCameraBackground] Hook called with params:', { clearFlags, backgroundColor });

    const bgColorKey = backgroundColor
      ? `${backgroundColor.r}-${backgroundColor.g}-${backgroundColor.b}-${backgroundColor.a}`
      : null;

    // Check if anything has changed
    const clearFlagsChanged = currentClearFlagsRef.current !== clearFlags;
    const bgColorChanged = currentBgColorRef.current !== bgColorKey;

    console.log('[useCameraBackground] Effect triggered:', {
      clearFlags,
      backgroundColor,
      clearFlagsChanged,
      bgColorChanged,
      currentClearFlags: currentClearFlagsRef.current,
      currentBgColor: currentBgColorRef.current,
    });

    if (!clearFlagsChanged && !bgColorChanged) {
      console.log('[useCameraBackground] No changes detected, skipping update');
      return;
    }

    console.log(
      '[useCameraBackground] Applying background - clearFlags:',
      clearFlags,
      'backgroundColor:',
      backgroundColor,
    );

    // Apply the appropriate background based on clear flags
    let appliedColor: Color | null = null;

    switch (clearFlags) {
      case 'solidColor':
        if (backgroundColor) {
          appliedColor = new Color(backgroundColor.r, backgroundColor.g, backgroundColor.b);
          scene.background = appliedColor;
          console.log(
            '[useCameraBackground] Applied solid color background:',
            appliedColor.getHexString(),
          );
        } else {
          appliedColor = new Color(0, 0, 0); // Black fallback
          scene.background = appliedColor;
          console.log('[useCameraBackground] Applied black fallback for solid color');
        }
        break;

      case 'skybox':
        appliedColor = new Color('#404040'); // Neutral gray
        scene.background = appliedColor;
        console.log('[useCameraBackground] Applied skybox background (gray)');
        break;

      case 'depthOnly':
      case 'dontClear':
        scene.background = null;
        console.log('[useCameraBackground] Set background to null for:', clearFlags);
        break;

      default:
        appliedColor = new Color('#404040'); // Default to neutral gray
        scene.background = appliedColor;
        console.log(
          '[useCameraBackground] Applied default background (gray) for unknown clearFlags:',
          clearFlags,
        );
        break;
    }

    // Update refs
    currentClearFlagsRef.current = clearFlags;
    currentBgColorRef.current = bgColorKey;

    console.log('[useCameraBackground] Background update complete, refs updated');
    console.log('[useCameraBackground] Final scene.background:', scene.background);

    // Invalidate the frame to trigger a re-render
    invalidate();
    console.log('[useCameraBackground] Frame invalidated');
  }, [clearFlags, backgroundColor, scene, invalidate]);
}
