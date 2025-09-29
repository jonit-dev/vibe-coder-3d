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

  // Track initialization
  if (!isInitializedRef.current) {
    isInitializedRef.current = true;
  }

  useEffect(() => {
    const bgColorKey = backgroundColor
      ? `${backgroundColor.r}-${backgroundColor.g}-${backgroundColor.b}-${backgroundColor.a}`
      : null;

    // Check if anything has changed
    const clearFlagsChanged = currentClearFlagsRef.current !== clearFlags;
    const bgColorChanged = currentBgColorRef.current !== bgColorKey;
    const skyboxChanged = currentSkyboxRef.current !== skyboxTexture;

    if (!clearFlagsChanged && !bgColorChanged && !skyboxChanged) {
      return; // No changes, skip update
    }

    // Background update logic

    // Apply the appropriate background based on clear flags
    let appliedColor: Color | null = null;
    let shouldInvalidate = true; // Track if we need to invalidate frame

    switch (clearFlags) {
      case 'solidColor':
        if (backgroundColor) {
          appliedColor = new Color(backgroundColor.r, backgroundColor.g, backgroundColor.b);
          scene.background = appliedColor;
        } else {
          appliedColor = new Color(0, 0, 0); // Black fallback
          scene.background = appliedColor;
        }
        break;

      case 'skybox':
        if (skyboxTexture && skyboxTexture.length > 0) {
          shouldInvalidate = false; // Don't invalidate immediately, let texture loader handle it
          textureLoader.load(
            skyboxTexture,
            (texture) => {
              scene.background = texture;
              invalidate();
            },
            undefined,
            (error) => {
              console.error('[useCameraBackground] Failed to load skybox texture:', error);
              // Fallback to neutral gray
              appliedColor = new Color('#404040');
              scene.background = appliedColor;
              invalidate();
            },
          );
        } else {
          appliedColor = new Color('#404040'); // Neutral gray
          scene.background = appliedColor;
        }
        break;

      case 'depthOnly':
      case 'dontClear':
        scene.background = null;
        break;

      default:
        appliedColor = new Color('#404040'); // Default to neutral gray
        scene.background = appliedColor;
        break;
    }

    // Update refs
    currentClearFlagsRef.current = clearFlags;
    currentBgColorRef.current = bgColorKey;
    currentSkyboxRef.current = skyboxTexture || null;

    // Only invalidate the frame if we need to (not for async texture loading)
    if (shouldInvalidate) {
      invalidate();
    }
  }, [clearFlags, backgroundColor, skyboxTexture, scene, invalidate, textureLoader]);
}
