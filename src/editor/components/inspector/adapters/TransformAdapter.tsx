import React from 'react';

import { TransformSection } from '@/editor/components/panels/InspectorPanel/Transform/TransformSection';
import { KnownComponentTypes } from '@/editor/lib/ecs/IComponent';

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

  const handlePositionChange = React.useCallback(
    (position: [number, number, number]) => {
      console.log(`[Transform] Position changed for entity ${entityId}:`, position);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        position,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleRotationChange = React.useCallback(
    (rotation: [number, number, number]) => {
      console.log(`[Transform] Rotation changed for entity ${entityId}:`, rotation);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        rotation,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleScaleChange = React.useCallback(
    (scale: [number, number, number]) => {
      console.log(`[Transform] Scale changed for entity ${entityId}:`, scale);
      updateComponent(KnownComponentTypes.TRANSFORM, {
        ...data,
        scale,
      });
    },
    [data, updateComponent, entityId],
  );

  const handleRemove = React.useCallback(() => {
    if (removeComponent) {
      removeComponent(KnownComponentTypes.TRANSFORM);
    }
  }, [removeComponent]);

  return (
    <TransformSection
      position={data.position || [0, 0, 0]}
      rotation={data.rotation || [0, 0, 0]}
      scale={data.scale || [1, 1, 1]}
      setPosition={handlePositionChange}
      setRotation={handleRotationChange}
      setScale={handleScaleChange}
      onRemove={removeComponent ? handleRemove : undefined}
    />
  );
};
