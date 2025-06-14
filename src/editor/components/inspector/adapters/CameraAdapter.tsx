import React from 'react';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { CameraSection } from '@/editor/components/panels/InspectorPanel/Camera/CameraSection';
import { IComponent } from '@/core/lib/ecs/IComponent';

interface ICameraAdapterProps {
  cameraComponent: IComponent<CameraData> | null;
  updateComponent: (type: string, data: CameraData) => boolean;
  entityId: number;
}

export const CameraAdapter: React.FC<ICameraAdapterProps> = ({
  cameraComponent,
  updateComponent,
  entityId,
}) => {
  const data = cameraComponent?.data as CameraData;

  if (!data) return null;

  // Ensure default values for all properties including HDR and tone mapping
  const cameraData: CameraData = {
    fov: data.fov ?? 50,
    near: data.near ?? 0.1,
    far: data.far ?? 1000,
    projectionType: data.projectionType ?? 'perspective',
    orthographicSize: data.orthographicSize ?? 10,
    depth: data.depth ?? 0,
    isMain: data.isMain ?? false,
    clearFlags: data.clearFlags ?? 'skybox',
    skyboxTexture: data.skyboxTexture ?? '',
    backgroundColor: data.backgroundColor ?? { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
    // Camera Control Mode - Unity-style camera controls
    controlMode: data.controlMode ?? 'free',
    // Viewport Rectangle
    viewportRect: data.viewportRect ?? { x: 0.0, y: 0.0, width: 1.0, height: 1.0 },
    // HDR and Tone Mapping - THESE WERE MISSING!
    hdr: data.hdr ?? false,
    toneMapping: data.toneMapping ?? 'none',
    toneMappingExposure: data.toneMappingExposure ?? 1.0,
    // Follow functionality (replaces old target/lookAt)
    enableSmoothing: data.enableSmoothing ?? false,
    followTarget: data.followTarget ?? 0,
    followOffset: data.followOffset ?? { x: 0, y: 5, z: -10 },
    smoothingSpeed: data.smoothingSpeed ?? 2.0,
    rotationSmoothing: data.rotationSmoothing ?? 1.5,
    // Post-processing
    enablePostProcessing: data.enablePostProcessing ?? false,
    postProcessingPreset: data.postProcessingPreset ?? 'none',
  };

  const handleUpdate = (updates: Partial<CameraData>) => {
    const newData = { ...cameraData, ...updates };
    updateComponent(KnownComponentTypes.CAMERA, newData);
  };

  return <CameraSection cameraData={cameraData} onUpdate={handleUpdate} entityId={entityId} />;
};
