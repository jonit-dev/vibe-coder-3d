import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Color, TextureLoader } from 'three';

export function useCameraBackground(
  clearFlags: string = 'skybox',
  backgroundColor?: { r: number; g: number; b: number; a: number },
  skyboxTexture?: string,
) {
  const { scene, invalidate } = useThree();
  const currentClearFlagsRef = useRef<string | null>(null);
  const currentBgColorRef = useRef<string | null>(null);
  const currentSkyboxRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [textureLoader] = useState(() => new TextureLoader());

  // Log hook initialization
  if (!isInitializedRef.current) {
    console.log('[useCameraBackground] Hook initialized with:', {
      clearFlags,
      backgroundColor,
      skyboxTexture,
    });
    isInitializedRef.current = true;
  }

  useEffect(() => {
    console.log('[useCameraBackground] Hook called with params:', {
      clearFlags,
      backgroundColor,
      skyboxTexture,
    });

    const bgColorKey = backgroundColor
      ? `${backgroundColor.r}-${backgroundColor.g}-${backgroundColor.b}-${backgroundColor.a}`
      : null;

    // Check if anything has changed
    const clearFlagsChanged = currentClearFlagsRef.current !== clearFlags;
    const bgColorChanged = currentBgColorRef.current !== bgColorKey;
    const skyboxChanged = currentSkyboxRef.current !== skyboxTexture;

    console.log('[useCameraBackground] Effect triggered:', {
      clearFlags,
      backgroundColor,
      skyboxTexture,
      clearFlagsChanged,
      bgColorChanged,
      skyboxChanged,
      currentClearFlags: currentClearFlagsRef.current,
      currentBgColor: currentBgColorRef.current,
      currentSkybox: currentSkyboxRef.current,
    });

    if (!clearFlagsChanged && !bgColorChanged && !skyboxChanged) {
      console.log('[useCameraBackground] No changes detected, skipping update');
      return;
    }

    console.log(
      '[useCameraBackground] Applying background - clearFlags:',
      clearFlags,
      'backgroundColor:',
      backgroundColor,
      'skyboxTexture:',
      skyboxTexture,
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
        if (skyboxTexture && skyboxTexture.length > 0) {
          console.log('[useCameraBackground] Loading skybox texture:', skyboxTexture);
          textureLoader.load(
            skyboxTexture,
            (texture) => {
              scene.background = texture;
              console.log('[useCameraBackground] Applied skybox texture:', skyboxTexture);
              invalidate();
            },
            undefined,
            (error) => {
              console.error('[useCameraBackground] Failed to load skybox texture:', error);
              // Fallback to neutral gray
              appliedColor = new Color('#404040');
              scene.background = appliedColor;
              console.log('[useCameraBackground] Applied gray fallback for failed skybox');
              invalidate();
            },
          );
        } else {
          appliedColor = new Color('#404040'); // Neutral gray
          scene.background = appliedColor;
          console.log('[useCameraBackground] Applied default skybox background (gray)');
        }
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
    currentSkyboxRef.current = skyboxTexture || null;

    console.log('[useCameraBackground] Background update complete, refs updated');
    console.log('[useCameraBackground] Final scene.background:', scene.background);

    // Invalidate the frame to trigger a re-render
    invalidate();
    console.log('[useCameraBackground] Frame invalidated');
  }, [clearFlags, backgroundColor, skyboxTexture, scene, invalidate, textureLoader]);
}
