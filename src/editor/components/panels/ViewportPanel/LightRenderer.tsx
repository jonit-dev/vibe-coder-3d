import React, { useEffect, useRef, useState } from 'react';
import { Group, Vector3 } from 'three';

import { useEvent } from '@/core/hooks/useEvent';
import type { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import type { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { useEditorStore } from '@/editor/store/editorStore';

import { LightGeometry } from './components/LightGeometry';

export interface ILightRendererProps {
  entityId: number;
}

export const LightRenderer: React.FC<ILightRendererProps> = React.memo(({ entityId }) => {
  const componentManager = useComponentManager();
  const lightRef = useRef<Group>(null);
  const isPlaying = useEditorStore((state) => state.isPlaying);

  // Use state to trigger re-renders when components change
  const [lightData, setLightData] = useState<LightData | null>(null);
  const [transformData, setTransformData] = useState<ITransformData | null>(null);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Listen for component updates to trigger re-renders
  useEvent('component:updated', (event) => {
    if (
      event.entityId === entityId &&
      (event.componentId === 'Light' || event.componentId === 'Transform')
    ) {
      // Component updated - triggering re-render
      setUpdateTrigger((prev) => prev + 1);
    }
  });

  // Update component data when updateTrigger changes
  useEffect(() => {
    const lightComponent = componentManager.getComponent(entityId, KnownComponentTypes.LIGHT);
    const transformComponent = componentManager.getComponent(
      entityId,
      KnownComponentTypes.TRANSFORM,
    );

    setLightData((lightComponent?.data as LightData) || null);
    setTransformData((transformComponent?.data as ITransformData) || null);
  }, [entityId, updateTrigger, componentManager]);

  // Early return if no data
  if (!lightData || !transformData || !lightData.enabled) {
    return null;
  }

  const position = new Vector3(
    transformData.position[0],
    transformData.position[1],
    transformData.position[2],
  );

  const color = lightData.color;
  const intensity = lightData.intensity;

  switch (lightData.lightType) {
    case 'directional':
      return (
        <group ref={lightRef} position={position}>
          {/* Visual representation */}
          <LightGeometry
            lightType="directional"
            color={color}
            intensity={intensity}
            isPlaying={isPlaying}
          />

          {/* Actual light */}
          <directionalLight
            color={[color.r, color.g, color.b]}
            intensity={intensity}
            position={[
              position.x - (lightData.directionX ?? 0) * 10,
              position.y - (lightData.directionY ?? -1) * 10,
              position.z - (lightData.directionZ ?? 0) * 10,
            ]}
            target-position={[position.x, position.y, position.z]}
            castShadow={lightData.castShadow}
            shadow-mapSize={[lightData.shadowMapSize ?? 4096, lightData.shadowMapSize ?? 4096]}
            shadow-bias={lightData.shadowBias ?? -0.0005}
            shadow-radius={lightData.shadowRadius ?? 0.2}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
          />
        </group>
      );

    case 'point':
      return (
        <group ref={lightRef} position={position}>
          {/* Visual representation */}
          <LightGeometry
            lightType="point"
            color={color}
            intensity={intensity}
            range={lightData.range}
            isPlaying={isPlaying}
          />

          {/* Actual light */}
          <pointLight
            color={[color.r, color.g, color.b]}
            intensity={intensity}
            distance={lightData.range ?? 10}
            decay={lightData.decay ?? 1}
            castShadow={lightData.castShadow}
            shadow-mapSize={[lightData.shadowMapSize ?? 4096, lightData.shadowMapSize ?? 4096]}
            shadow-bias={lightData.shadowBias ?? -0.0005}
            shadow-radius={lightData.shadowRadius ?? 0.2}
          />
        </group>
      );

    case 'spot':
      return (
        <group ref={lightRef} position={position}>
          {/* Visual representation */}
          <LightGeometry
            lightType="spot"
            color={color}
            intensity={intensity}
            range={lightData.range}
            angle={lightData.angle}
            isPlaying={isPlaying}
          />

          {/* Actual light */}
          <spotLight
            color={[color.r, color.g, color.b]}
            intensity={intensity}
            distance={lightData.range ?? 10}
            angle={lightData.angle ?? Math.PI / 6}
            penumbra={lightData.penumbra ?? 0.1}
            decay={lightData.decay ?? 1}
            castShadow={lightData.castShadow}
            shadow-mapSize={[lightData.shadowMapSize ?? 4096, lightData.shadowMapSize ?? 4096]}
            shadow-bias={lightData.shadowBias ?? -0.0005}
            shadow-radius={lightData.shadowRadius ?? 0.2}
          />
        </group>
      );

    case 'ambient':
      return (
        <group ref={lightRef} position={position}>
          {/* Visual representation for ambient light */}
          <LightGeometry
            lightType="ambient"
            color={color}
            intensity={intensity}
            isPlaying={isPlaying}
          />

          {/* Actual light */}
          <ambientLight color={[color.r, color.g, color.b]} intensity={intensity} />
        </group>
      );

    default:
      return null;
  }
});
