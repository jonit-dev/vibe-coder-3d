import React from 'react';
import { FiCamera, FiFolder } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { cameraSystem } from '@/core/systems/cameraSystem';
import { AssetLoaderModal } from '@/editor/components/shared/AssetLoaderModal';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { FieldGroup } from '@/editor/components/shared/FieldGroup';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { InspectorButton } from '@/editor/components/shared/InspectorButton';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { useAssetLoader } from '@/editor/hooks/useAssetLoader';

export interface ICameraSectionProps {
  cameraData: CameraData;
  onUpdate: (data: Partial<CameraData>) => void;
  onRemove?: () => void;
}

export const CameraSection: React.FC<ICameraSectionProps> = ({
  cameraData,
  onUpdate,
  onRemove,
}) => {
  const handleFieldChange = (field: keyof CameraData, value: any) => {
    onUpdate({ [field]: value });
    // Trigger camera system update for real-time changes
    cameraSystem();
  };

  // Asset loader for skybox textures
  const skyboxLoader = useAssetLoader({
    title: 'Select Skybox Texture',
    basePath: '/assets/skyboxes',
    allowedExtensions: ['jpg', 'jpeg', 'png'],
    showPreview: true,
    onSelect: (assetPath: string) => {
      handleFieldChange('skyboxTexture', assetPath);
    },
  });

  // Helper function to convert RGBA object to hex color
  const rgbaToHex = (rgba: { r: number; g: number; b: number; a: number }) => {
    const toHex = (n: number) =>
      Math.round(n * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(rgba.r)}${toHex(rgba.g)}${toHex(rgba.b)}`;
  };

  // Helper function to convert hex color to RGBA object
  const hexToRgba = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return { r, g, b, a: cameraData.backgroundColor?.a || 1.0 };
  };

  return (
    <>
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

        <FieldGroup label="Rendering">
          <ComponentField
            label="Clear Flags"
            type="select"
            value={cameraData.clearFlags}
            onChange={(value) => handleFieldChange('clearFlags', value)}
            options={[
              { value: 'skybox', label: 'Skybox' },
              { value: 'solidColor', label: 'Solid Color' },
              { value: 'depthOnly', label: 'Depth Only' },
              { value: 'dontClear', label: "Don't Clear" },
            ]}
          />

          {cameraData.clearFlags === 'skybox' && (
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-gray-300">Skybox Texture</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white min-h-[24px] flex items-center">
                  {cameraData.skyboxTexture ? (
                    <span className="truncate text-gray-300">
                      {cameraData.skyboxTexture
                        .split('/')
                        .pop()
                        ?.replace(/\.(jpg|jpeg|png|webp)$/i, '')}
                    </span>
                  ) : (
                    <span className="text-gray-500">No texture selected</span>
                  )}
                </div>
                <InspectorButton
                  onClick={skyboxLoader.openModal}
                  icon={<FiFolder />}
                  variant="secondary"
                  size="xs"
                  title="Browse skybox textures"
                >
                  Browse
                </InspectorButton>
              </div>
            </div>
          )}

          {cameraData.clearFlags === 'solidColor' && (
            <ColorField
              label="Background Color"
              value={rgbaToHex(cameraData.backgroundColor || { r: 0, g: 0, b: 0, a: 1 })}
              onChange={(hexColor) => {
                const rgba = hexToRgba(hexColor);
                handleFieldChange('backgroundColor', rgba);
              }}
              resetValue="#000000"
            />
          )}
        </FieldGroup>
      </GenericComponentSection>

      <AssetLoaderModal {...skyboxLoader.modalProps} />
    </>
  );
};
