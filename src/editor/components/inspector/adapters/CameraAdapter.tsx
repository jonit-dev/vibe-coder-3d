import React from 'react';

import { isComponentRemovable } from '@core/lib/ecs/dynamicComponentRegistry';
import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { CameraSection } from '@/editor/components/panels/InspectorPanel/Camera/CameraSection';

interface ICameraAdapterProps {
  cameraComponent: any;
  updateComponent: (type: string, data: any) => boolean;
  removeComponent?: (type: string) => boolean;
  entityId: number;
}

export const CameraAdapter: React.FC<ICameraAdapterProps> = ({
  cameraComponent,
  updateComponent,
  removeComponent,
  entityId,
}) => {
  const data = cameraComponent?.data as ICameraData;

  if (!data) return null;

  const componentId = 'Camera'; // Using string literal ID

  const handleUpdate = (updates: Partial<ICameraData>) => {
    const newData = { ...data, ...updates };
    updateComponent(componentId, newData);
  };

  const canRemove = isComponentRemovable(componentId);
  const handleRemoveLogic = React.useCallback(() => {
    if (removeComponent && canRemove) {
      removeComponent(componentId);
    }
  }, [removeComponent, canRemove, componentId]);

  return (
    <CameraSection
      cameraData={data}
      onUpdate={handleUpdate}
      onRemove={removeComponent && canRemove ? handleRemoveLogic : undefined}
      entityId={entityId}
    />
  );
};
