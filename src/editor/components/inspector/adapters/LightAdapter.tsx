import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { LightSection } from '@/editor/components/panels/InspectorPanel/Light/LightSection';

interface ILightAdapterProps {
  lightComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent: (type: string) => boolean;
  entityId: number;
}

export const LightAdapter: React.FC<ILightAdapterProps> = ({
  lightComponent,
  updateComponent,
  removeComponent,
  entityId,
}) => {
  const data = lightComponent?.data as LightData;

  if (!data) return null;

  // Ensure default values for all properties
  const lightData: LightData = {
    lightType: data.lightType ?? 'directional',
    color: data.color ?? { r: 1.0, g: 1.0, b: 1.0 },
    intensity: data.intensity ?? 1.0,
    enabled: data.enabled ?? true,
    castShadow: data.castShadow ?? true,
    directionX: data.directionX ?? 0.0,
    directionY: data.directionY ?? -1.0,
    directionZ: data.directionZ ?? 0.0,
    range: data.range ?? 10.0,
    decay: data.decay ?? 1.0,
    angle: data.angle ?? Math.PI / 6,
    penumbra: data.penumbra ?? 0.1,
    shadowMapSize: data.shadowMapSize ?? 1024,
    shadowBias: data.shadowBias ?? -0.0001,
    shadowRadius: data.shadowRadius ?? 1.0,
    shadowNear: data.shadowNear ?? 0.1,
    shadowFar: data.shadowFar ?? 50.0,
  };

  const handleUpdate = (updates: Partial<LightData>) => {
    const newData = { ...lightData, ...updates };
    updateComponent(KnownComponentTypes.LIGHT, newData);
  };

  const handleRemove = () => {
    removeComponent(KnownComponentTypes.LIGHT);
  };

  return (
    <LightSection
      lightData={lightData}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      entityId={entityId}
    />
  );
};
