import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
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

  const handleUpdate = (updates: Partial<ICameraData>) => {
    const newData = { ...data, ...updates };
    updateComponent(KnownComponentTypes.CAMERA, newData);
  };

  const handleRemove = removeComponent
    ? () => removeComponent(KnownComponentTypes.CAMERA)
    : undefined;

  return (
    <CameraSection
      cameraData={data}
      onUpdate={handleUpdate}
      onRemove={handleRemove}
      entityId={entityId}
    />
  );
};
