import React, { useCallback } from 'react';
import { FiCamera } from 'react-icons/fi';

import { CameraPreset } from '@/core/components/cameras/DefaultCamera';
import { isComponentRemovable } from '@/core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { InspectorSection } from '@/editor/components/shared/InspectorSection';

export interface ICameraSectionProps {
  cameraData: ICameraData;
  onUpdate: (data: Partial<ICameraData>) => void;
  onRemove?: () => void;
  entityId: number;
}

const CAMERA_PRESETS: CameraPreset[] = [
  'unity-default',
  'perspective-game',
  'perspective-film',
  'orthographic-top',
  'orthographic-front',
  'isometric',
];

const PROJECTION_TYPES = ['perspective', 'orthographic'] as const;

export const CameraSection: React.FC<ICameraSectionProps> = ({
  cameraData,
  onUpdate,
  onRemove,
  entityId,
}) => {
  const handleFieldChange = useCallback(
    (field: keyof ICameraData, value: any) => {
      onUpdate({ [field]: value });
    },
    [onUpdate],
  );

  const handlePresetChange = useCallback(
    (preset: CameraPreset) => {
      // Update preset and apply preset-specific defaults
      const presetDefaults: Record<CameraPreset, Partial<ICameraData>> = {
        'unity-default': {
          fov: 60,
          near: 0.3,
          far: 1000,
          projectionType: 'perspective',
        },
        'perspective-game': {
          fov: 75,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
        },
        'perspective-film': {
          fov: 35,
          near: 0.1,
          far: 1000,
          projectionType: 'perspective',
        },
        'orthographic-top': {
          near: 0.1,
          far: 1000,
          projectionType: 'orthographic',
          orthographicSize: 10,
        },
        'orthographic-front': {
          near: 0.1,
          far: 1000,
          projectionType: 'orthographic',
          orthographicSize: 10,
        },
        isometric: {
          near: 0.1,
          far: 1000,
          projectionType: 'orthographic',
          orthographicSize: 10,
        },
      };

      onUpdate({
        preset,
        ...presetDefaults[preset],
      });
    },
    [onUpdate],
  );

  const handleTargetChange = useCallback(
    (index: number, value: number) => {
      const newTarget = [...cameraData.target] as [number, number, number];
      newTarget[index] = value;
      handleFieldChange('target', newTarget);
    },
    [cameraData.target, handleFieldChange],
  );

  return (
    <InspectorSection
      title="Camera"
      icon={<FiCamera className="w-4 h-4" />}
      headerColor="cyan"
      collapsible
      defaultCollapsed={false}
      removable={isComponentRemovable(KnownComponentTypes.CAMERA)}
      onRemove={onRemove}
    >
      <div className="space-y-3">
        {/* Camera Preset */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Preset</label>
          <select
            value={cameraData.preset}
            onChange={(e) => handlePresetChange(e.target.value as CameraPreset)}
            className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            {CAMERA_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset.charAt(0).toUpperCase() + preset.slice(1).replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Projection Type */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Projection</label>
          <select
            value={cameraData.projectionType}
            onChange={(e) => handleFieldChange('projectionType', e.target.value)}
            className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
          >
            {PROJECTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* FOV (Perspective only) */}
        {cameraData.projectionType === 'perspective' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Field of View</label>
            <input
              type="number"
              value={cameraData.fov}
              onChange={(e) => handleFieldChange('fov', parseFloat(e.target.value) || 60)}
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              min="10"
              max="179"
              step="1"
            />
          </div>
        )}

        {/* Orthographic Size (Orthographic only) */}
        {cameraData.projectionType === 'orthographic' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Size</label>
            <input
              type="number"
              value={cameraData.orthographicSize || 10}
              onChange={(e) =>
                handleFieldChange('orthographicSize', parseFloat(e.target.value) || 10)
              }
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              min="0.1"
              step="0.1"
            />
          </div>
        )}

        {/* Clipping Planes */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Near</label>
            <input
              type="number"
              value={cameraData.near}
              onChange={(e) => handleFieldChange('near', parseFloat(e.target.value) || 0.1)}
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              min="0.01"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Far</label>
            <input
              type="number"
              value={cameraData.far}
              onChange={(e) => handleFieldChange('far', parseFloat(e.target.value) || 1000)}
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              min="0.1"
              step="1"
            />
          </div>
        </div>

        {/* Target Position */}
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Target</label>
          <div className="grid grid-cols-3 gap-1">
            {cameraData.target.map((value, index) => (
              <div key={index}>
                <label className="block text-xs text-gray-400 mb-1">{['X', 'Y', 'Z'][index]}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleTargetChange(index, parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
                  step="0.1"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Main Camera Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`main-camera-${entityId}`}
            checked={cameraData.isMain}
            onChange={(e) => handleFieldChange('isMain', e.target.checked)}
            className="w-3 h-3 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor={`main-camera-${entityId}`} className="text-xs text-gray-300">
            Main Camera
          </label>
        </div>

        {/* Controls Toggle */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`enable-controls-${entityId}`}
            checked={cameraData.enableControls}
            onChange={(e) => handleFieldChange('enableControls', e.target.checked)}
            className="w-3 h-3 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor={`enable-controls-${entityId}`} className="text-xs text-gray-300">
            Enable Controls
          </label>
        </div>

        {/* Background Color */}
        {cameraData.backgroundColor && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Background Color</label>
            <input
              type="color"
              value={cameraData.backgroundColor}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-8 bg-gray-800 border border-gray-600 rounded cursor-pointer"
            />
          </div>
        )}

        {/* Render Priority */}
        {typeof cameraData.renderPriority === 'number' && (
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Render Priority</label>
            <input
              type="number"
              value={cameraData.renderPriority}
              onChange={(e) => handleFieldChange('renderPriority', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-blue-400 focus:outline-none"
              step="1"
            />
          </div>
        )}
      </div>
    </InspectorSection>
  );
};
