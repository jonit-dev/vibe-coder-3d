import React from 'react';

import { isComponentRemovable } from '@core/lib/ecs/dynamicComponentRegistry';
import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';

interface ITransformAdapterProps {
  transformComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent?: (type: string) => boolean;
  entityId: number;
}

export const TransformAdapter: React.FC<ITransformAdapterProps> = ({
  transformComponent,
  updateComponent,
  removeComponent,
  entityId,
}) => {
  const data = transformComponent?.data;

  if (!data) return null;

  const componentId = 'Transform'; // Using string literal ID

  const handlePositionChange = React.useCallback(
    (position: [number, number, number]) => {
      console.log(`[Transform] Position changed for entity ${entityId}:`, position);
      updateComponent(componentId, {
        ...data,
        position,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleRotationChange = React.useCallback(
    (rotation: [number, number, number]) => {
      console.log(`[Transform] Rotation changed for entity ${entityId}:`, rotation);
      updateComponent(componentId, {
        ...data,
        rotation,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleScaleChange = React.useCallback(
    (scale: [number, number, number]) => {
      console.log(`[Transform] Scale changed for entity ${entityId}:`, scale);
      updateComponent(componentId, {
        ...data,
        scale,
      });
    },
    [data, updateComponent, entityId],
  );

  const canRemove = isComponentRemovable(componentId);
  const handleRemove = React.useCallback(() => {
    if (removeComponent && canRemove) {
      removeComponent(componentId);
    }
  }, [removeComponent, canRemove]);

  return (
    <TransformSection
      position={data.position || [0, 0, 0]}
      rotation={data.rotation || [0, 0, 0]}
      scale={data.scale || [1, 1, 1]}
      setPosition={handlePositionChange}
      setRotation={handleRotationChange}
      setScale={handleScaleChange}
      onRemove={canRemove && removeComponent ? handleRemove : undefined}
    />
  );
};
