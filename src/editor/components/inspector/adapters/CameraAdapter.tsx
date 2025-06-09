import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { CameraSection } from '@/editor/components/panels/InspectorPanel/Camera/CameraSection';

interface ICameraAdapterProps {
  cameraComponent: any;
  updateComponent: (type: string, data: any) => boolean;
}

export const CameraAdapter: React.FC<ICameraAdapterProps> = ({
  cameraComponent,
  updateComponent,
}) => {
  const data = cameraComponent?.data as CameraData;

  if (!data) return null;

  // Ensure default values for new properties
  const cameraData: CameraData = {
    fov: data.fov ?? 50,
    near: data.near ?? 0.1,
    far: data.far ?? 1000,
    projectionType: data.projectionType ?? 'perspective',
    orthographicSize: data.orthographicSize ?? 10,
    depth: data.depth ?? 0,
    isMain: data.isMain ?? false,
    clearFlags: data.clearFlags ?? 'skybox',
    backgroundColor: data.backgroundColor ?? { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
  };

  const handleUpdate = (updates: Partial<CameraData>) => {
    const newData = { ...cameraData, ...updates };
    updateComponent(KnownComponentTypes.CAMERA, newData);
  };

  return <CameraSection cameraData={cameraData} onUpdate={handleUpdate} />;
};
