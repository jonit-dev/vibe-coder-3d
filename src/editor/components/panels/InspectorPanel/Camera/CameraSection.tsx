import React from 'react';
import { FiCamera } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { cameraSystem } from '@/core/systems/cameraSystem';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';

export interface ICameraSectionProps {
  cameraData: ICameraData;
  onUpdate: (data: Partial<ICameraData>) => void;
  onRemove?: () => void;
}

export const CameraSection: React.FC<ICameraSectionProps> = ({
  cameraData,
  onUpdate,
  onRemove,
}) => {
  const handleFieldChange = (field: keyof ICameraData, value: any) => {
    onUpdate({ [field]: value });
    // Trigger camera system update for real-time changes
    cameraSystem();
  };

  return (
    <GenericComponentSection
      title="Camera"
      icon={<FiCamera />}
      headerColor="cyan"
      componentId={KnownComponentTypes.CAMERA}
      onRemove={onRemove}
    >
      <ComponentField
        label="Projection"
        type="select"
        value={cameraData.projectionType}
        onChange={(value) => handleFieldChange('projectionType', value)}
        options={[
          { value: 'perspective', label: 'Perspective' },
          { value: 'orthographic', label: 'Orthographic' },
        ]}
      />

      {cameraData.projectionType === 'perspective' && (
        <SingleAxisField
          label="Field of View"
          value={cameraData.fov}
          onChange={(value) => handleFieldChange('fov', value)}
          resetValue={50}
          min={1}
          max={179}
          step={0.1}
          sensitivity={0.5}
          axisLabel="FOV"
          axisColor="#9b59b6"
        />
      )}

      {cameraData.projectionType === 'orthographic' && (
        <SingleAxisField
          label="Orthographic Size"
          value={cameraData.orthographicSize}
          onChange={(value) => handleFieldChange('orthographicSize', value)}
          resetValue={10}
          min={0.1}
          step={0.1}
          sensitivity={0.1}
          axisLabel="SIZE"
          axisColor="#9b59b6"
        />
      )}

      <FieldGroup label="Clipping Planes">
        <SingleAxisField
          label="Near"
          value={cameraData.near}
          onChange={(value) => handleFieldChange('near', value)}
          resetValue={0.1}
          min={0.001}
          step={0.001}
          sensitivity={0.01}
          axisLabel="NEAR"
          axisColor="#4ecdc4"
        />

        <SingleAxisField
          label="Far"
          value={cameraData.far}
          onChange={(value) => handleFieldChange('far', value)}
          resetValue={1000}
          min={0.1}
          step={0.1}
          sensitivity={1.0}
          axisLabel="FAR"
          axisColor="#45b7d1"
        />
      </FieldGroup>

      <SingleAxisField
        label="Depth"
        value={cameraData.depth}
        onChange={(value) => handleFieldChange('depth', value)}
        resetValue={0}
        step={1}
        sensitivity={0.1}
        axisLabel="DPTH"
        axisColor="#ff6b6b"
      />

      <ComponentField
        label="Main Camera"
        type="checkbox"
        value={cameraData.isMain}
        onChange={(value) => handleFieldChange('isMain', value)}
        placeholder="Use as main camera"
        resetValue={false}
      />
    </GenericComponentSection>
  );
};
