import { useThree } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import {
  ClampToEdgeWrapping,
  Color,
  MathUtils,
  RepeatWrapping,
  Texture,
  TextureLoader,
} from 'three';

export interface ISkyboxTransform {
  scale?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  repeat?: { u: number; v: number };
  offset?: { u: number; v: number };
  intensity?: number;
  blur?: number;
}

export function useCameraBackground(
  clearFlags: string = 'skybox',
  backgroundColor?: { r: number; g: number; b: number; a: number },
  skyboxTexture?: string,
  skyboxTransform?: ISkyboxTransform,
) {
  const { scene, invalidate } = useThree();
  const currentClearFlagsRef = useRef<string | null>(null);
  const currentBgColorRef = useRef<string | null>(null);
  const currentSkyboxRef = useRef<string | null>(null);
  const currentSkyboxTransformRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);
  const [textureLoader] = useState(() => new TextureLoader());

  // Track initialization
  if (!isInitializedRef.current) {
    isInitializedRef.current = true;
  }

  const isThreeTexture = (value: unknown): value is Texture => {
    return Boolean(value && (value as Texture).isTexture);
  };

  const applySkyboxTransformToTexture = (texture: Texture, transform?: ISkyboxTransform) => {
    if (!texture) {
      return;
    }

    if (transform?.repeat) {
      texture.wrapS = RepeatWrapping;
      texture.wrapT = RepeatWrapping;
      texture.repeat.set(transform.repeat.u, transform.repeat.v);
    } else {
      texture.wrapS = ClampToEdgeWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.repeat.set(1, 1);
    }

    if (transform?.offset) {
      texture.offset.set(transform.offset.u, transform.offset.v);
    } else {
      texture.offset.set(0, 0);
    }

    if (transform?.rotation) {
      // Texture rotation is only supported around the Z axis.
      texture.center.set(0.5, 0.5);
      texture.rotation = MathUtils.degToRad(transform.rotation.z ?? 0);
    } else {
      texture.center.set(0, 0);
      texture.rotation = 0;
    }

    texture.needsUpdate = true;
  };

  const applySkyboxSceneSettings = (transform?: ISkyboxTransform) => {
    const intensity = transform?.intensity ?? 1;
    const blur = transform?.blur ?? 0;

    if ('backgroundIntensity' in scene) {
      (scene as typeof scene & { backgroundIntensity: number }).backgroundIntensity = intensity;
    }

    if ('backgroundBlurriness' in scene) {
      (scene as typeof scene & { backgroundBlurriness: number }).backgroundBlurriness = blur;
    }
  };

  useEffect(() => {
    const bgColorKey = backgroundColor
      ? `${backgroundColor.r}-${backgroundColor.g}-${backgroundColor.b}-${backgroundColor.a}`
      : null;
    const skyboxTransformKey = skyboxTransform ? JSON.stringify(skyboxTransform) : null;

    // Check if anything has changed
    const clearFlagsChanged = currentClearFlagsRef.current !== clearFlags;
    const bgColorChanged = currentBgColorRef.current !== bgColorKey;
    const skyboxChanged = currentSkyboxRef.current !== skyboxTexture;
    const skyboxTransformChanged = currentSkyboxTransformRef.current !== skyboxTransformKey;

    if (!clearFlagsChanged && !bgColorChanged && !skyboxChanged && !skyboxTransformChanged) {
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
          applySkyboxSceneSettings(skyboxTransform);

          if (!skyboxChanged && skyboxTransformChanged) {
            const existingBackground = scene.background;
            if (isThreeTexture(existingBackground)) {
              applySkyboxTransformToTexture(existingBackground, skyboxTransform);
              shouldInvalidate = true;
              break;
            }
          }

          textureLoader.load(
            skyboxTexture,
            (texture) => {
              if (currentSkyboxRef.current !== skyboxTexture) {
                return;
              }

              // Apply skybox transforms if provided
              applySkyboxTransformToTexture(texture, skyboxTransform);
              applySkyboxSceneSettings(skyboxTransform);
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
          applySkyboxSceneSettings(undefined);
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
    currentSkyboxTransformRef.current = skyboxTransformKey;

    // Only invalidate the frame if we need to (not for async texture loading)
    if (shouldInvalidate) {
      invalidate();
    }
  }, [
    clearFlags,
    backgroundColor,
    skyboxTexture,
    skyboxTransform,
    scene,
    invalidate,
    textureLoader,
  ]);
}
