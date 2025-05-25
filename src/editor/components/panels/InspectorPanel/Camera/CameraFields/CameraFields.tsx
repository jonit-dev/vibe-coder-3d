import React, { useCallback } from 'react';

import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { cameraSystem } from '@/core/systems/cameraSystem';

import { CameraFieldInput } from './CameraFieldInput';

export interface ICameraFieldsProps {
  cameraData: ICameraData;
  onUpdate: (data: Partial<ICameraData>) => void;
}

export const CameraFields: React.FC<ICameraFieldsProps> = ({ cameraData, onUpdate }) => {
  const handleFieldChange = useCallback(
    (field: keyof ICameraData, value: number) => {
      onUpdate({ [field]: value });
      // Trigger camera system update for real-time changes - immediate like transform system
      cameraSystem();
    },
    [onUpdate],
  );

  const handleTargetChange = useCallback(
    (index: number, value: number) => {
      const newTarget = [...cameraData.target] as [number, number, number];
      newTarget[index] = value;
      onUpdate({ target: newTarget });
      // Trigger camera system update for real-time changes
      cameraSystem();
    },
    [cameraData.target, onUpdate],
  );

  const handleReset = useCallback(
    (field: keyof ICameraData, defaultValue: number) => {
      onUpdate({ [field]: defaultValue });
      // Trigger camera system update for real-time changes
      cameraSystem();
    },
    [onUpdate],
  );

  const handleTargetReset = useCallback(
    (index: number) => {
      const newTarget = [...cameraData.target] as [number, number, number];
      newTarget[index] = 0;
      onUpdate({ target: newTarget });
      // Trigger camera system update for real-time changes
      cameraSystem();
    },
    [cameraData.target, onUpdate],
  );

  return (
    <div className="space-y-3">
      {/* FOV (Perspective only) */}
      {cameraData.projectionType === 'perspective' && (
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">Field of View</label>
          <CameraFieldInput
            label="FOV"
            color="#9b59b6"
            value={cameraData.fov}
            onChange={(value: number) => handleFieldChange('fov', value)}
            onReset={() => handleReset('fov', 30)}
            step={1}
            min={10}
            max={179}
          />
        </div>
      )}

      {/* Orthographic Size (Orthographic only) */}
      {cameraData.projectionType === 'orthographic' && (
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-2">Size</label>
          <CameraFieldInput
            label="SIZE"
            color="#9b59b6"
            value={cameraData.orthographicSize || 10}
            onChange={(value: number) => handleFieldChange('orthographicSize', value)}
            onReset={() => handleReset('orthographicSize', 10)}
            step={0.1}
            min={0.1}
          />
        </div>
      )}

      {/* Clipping Planes */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2">Clipping Planes</label>
        <div className="space-y-2">
          <CameraFieldInput
            label="NEAR"
            color="#4ecdc4"
            value={cameraData.near}
            onChange={(value: number) => handleFieldChange('near', value)}
            onReset={() => handleReset('near', 0.1)}
            step={0.01}
            min={0.01}
          />
          <CameraFieldInput
            label="FAR"
            color="#45b7d1"
            value={cameraData.far}
            onChange={(value: number) => handleFieldChange('far', value)}
            onReset={() => handleReset('far', 10)}
            step={1}
            min={0.1}
          />
        </div>
      </div>

      {/* Target Position */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2">Target</label>
        <div className="space-y-1">
          {cameraData.target.map((value, index) => (
            <CameraFieldInput
              key={index}
              label={['X', 'Y', 'Z'][index]}
              color={['#ff6b6b', '#4ecdc4', '#45b7d1'][index]}
              value={value}
              onChange={(newValue: number) => handleTargetChange(index, newValue)}
              onReset={() => handleTargetReset(index)}
              step={0.1}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
