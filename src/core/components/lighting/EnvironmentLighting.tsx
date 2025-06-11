import React, { useCallback, useEffect, useState } from 'react';
import { defineQuery } from 'bitecs';
import { useThree } from '@react-three/fiber';
import { CubeTexture, PMREMGenerator, Scene, Texture } from 'three';

import { useEvent } from '@/core/hooks/useEvent';
import { componentRegistry } from '@/core/lib/ecs/ComponentRegistry';
import { ECSWorld } from '@/core/lib/ecs/World';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';

/**
 * Environment Lighting Manager
 * Handles ambient lighting, environment maps, and IBL (Image-Based Lighting)
 */
export const EnvironmentLighting: React.FC = () => {
  const { scene, gl } = useThree();
  const [environmentIntensity, setEnvironmentIntensity] = useState(1.0);
  const [hasAmbientLight, setHasAmbientLight] = useState(false);

  const world = ECSWorld.getInstance().getWorld();

  // Update environment lighting based on light components
  const updateEnvironmentLighting = useCallback(() => {
    try {
      const lightComponent = componentRegistry.getBitECSComponent('Light');
      if (!lightComponent) {
        console.log('[EnvironmentLighting] Light component not registered yet');
        return;
      }

      const query = defineQuery([lightComponent]);
      const entities = query(world);

      // Find ambient lights
      let totalAmbientIntensity = 0;
      let ambientColor = { r: 0.2, g: 0.2, b: 0.2 }; // Default ambient
      let foundAmbientLight = false;

      for (const eid of entities) {
        const lightData = componentRegistry.getComponentData<LightData>(eid, 'Light');

        if (lightData?.lightType === 'ambient' && lightData.enabled) {
          foundAmbientLight = true;
          totalAmbientIntensity += lightData.intensity;
          // Use the last ambient light's color (in a real implementation, you might blend them)
          ambientColor = lightData.color;
        }
      }

      setHasAmbientLight(foundAmbientLight);

      if (foundAmbientLight) {
        // Apply ambient lighting to scene
        scene.environment = null; // Clear any existing environment map

        // Set environment intensity for IBL
        setEnvironmentIntensity(totalAmbientIntensity);

        console.log('[EnvironmentLighting] Applied ambient lighting:', {
          intensity: totalAmbientIntensity,
          color: ambientColor,
        });
      } else {
        // Use default environment lighting when no ambient lights
        setEnvironmentIntensity(0.3);
        console.log('[EnvironmentLighting] Using default environment lighting');
      }
    } catch (error) {
      console.error('[EnvironmentLighting] Error updating environment lighting:', error);
    }
  }, [world, scene]);

  // Initial update
  useEffect(() => {
    updateEnvironmentLighting();
  }, [updateEnvironmentLighting]);

  // Listen for light component changes
  useEvent('component:updated', (event) => {
    if (event.componentId === 'Light') {
      setTimeout(() => updateEnvironmentLighting(), 0);
    }
  });

  useEvent('component:added', (event) => {
    if (event.componentId === 'Light') {
      setTimeout(() => updateEnvironmentLighting(), 0);
    }
  });

  useEvent('component:removed', (event) => {
    if (event.componentId === 'Light') {
      setTimeout(() => updateEnvironmentLighting(), 0);
    }
  });

  // Apply basic environment lighting
  useEffect(() => {
    if (!hasAmbientLight) {
      // Create a simple gradient environment when no ambient light is present
      const pmremGenerator = new PMREMGenerator(gl);
      pmremGenerator.compileEquirectangularShader();

      // Create a simple sky-like environment
      const gradientScene = new Scene();

      // This is a simple approach - in a full implementation you'd want to use
      // proper HDR environment maps or procedural sky generation

      try {
        const envMap = pmremGenerator.fromScene(gradientScene).texture;
        scene.environment = envMap;
        scene.environmentIntensity = environmentIntensity;

        console.log('[EnvironmentLighting] Applied gradient environment:', {
          intensity: environmentIntensity,
        });
      } catch (error) {
        console.warn('[EnvironmentLighting] Failed to create environment map:', error);
      }

      return () => {
        pmremGenerator.dispose();
      };
    }
  }, [scene, gl, environmentIntensity, hasAmbientLight]);

  return null; // This component doesn't render anything visual
};

/**
 * Hook for loading environment textures
 * This can be expanded to support HDR environment maps
 */
export const useEnvironmentTexture = (url?: string): CubeTexture | Texture | null => {
  const [texture, setTexture] = useState<CubeTexture | Texture | null>(null);

  useEffect(() => {
    if (!url) {
      setTexture(null);
      return;
    }

    // In a full implementation, you would load HDR environment maps here
    // For now, this is a placeholder for future HDR/IBL support
    console.log(
      '[useEnvironmentTexture] Environment texture loading not yet implemented for:',
      url,
    );

    // TODO: Implement proper environment texture loading
    // This would involve loading HDR files, cubemaps, etc.
  }, [url]);

  return texture;
};
