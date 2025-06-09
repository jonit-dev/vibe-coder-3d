import React from 'react';
import { FiCamera, FiEye, FiSettings, FiTarget } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { CameraData } from '@/core/lib/ecs/components/definitions/CameraComponent';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { InspectorButton } from '@/editor/components/shared/InspectorButton';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';
import { Vector3Field } from '@/editor/components/shared/Vector3Field';
import { useAssetLoader } from '@/editor/hooks/useAssetLoader';
import { useAvailableEntities } from '@/editor/hooks/useAvailableEntities';

import { AssetLoaderModal } from '../../../shared/AssetLoaderModal';

export interface ICameraSectionProps {
  cameraData: CameraData;
  onUpdate: (data: Partial<CameraData>) => void;
  onRemove?: () => void;
  entityId: number;
}

export const CameraSection: React.FC<ICameraSectionProps> = ({
  cameraData,
  onUpdate,
  onRemove,
  entityId,
}) => {
  const handleFieldChange = <K extends keyof CameraData>(field: K, value: CameraData[K]) => {
    onUpdate({ [field]: value });
  };

  const handleRemoveCamera = () => {
    onRemove?.();
  };

  // Get entity options for dropdowns, excluding the current camera entity
  const entityOptions = useAvailableEntities(entityId);

  // Skybox loader
  const skyboxLoader = useAssetLoader({
    title: 'Select Skybox Texture',
    basePath: '/assets/skyboxes',
    allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'hdr'],
    showPreview: true,
    onSelect: (path: string) => handleFieldChange('skyboxTexture', path),
  });

  return (
    <>
      <GenericComponentSection
        title="Camera"
        icon={<FiCamera />}
        headerColor="cyan"
        componentId={KnownComponentTypes.CAMERA}
        onRemove={handleRemoveCamera}
      >
        {/* Basic Camera Settings */}
        <CollapsibleSection title="Basic Settings" icon={<FiCamera />} defaultExpanded={true}>
          <ComponentField
            label="Projection"
            type="select"
            value={cameraData.projectionType ?? 'perspective'}
            onChange={(value) => handleFieldChange('projectionType', value)}
            options={[
              { value: 'perspective', label: 'Perspective' },
              { value: 'orthographic', label: 'Orthographic' },
            ]}
          />

          {cameraData.projectionType === 'perspective' ? (
            <SingleAxisField
              label="Field of View"
              value={cameraData.fov ?? 50}
              onChange={(value) => handleFieldChange('fov', Math.max(1, Math.min(179, value)))}
              resetValue={50}
              min={1}
              max={179}
              step={1}
              sensitivity={1}
              axisLabel="FOV"
              axisColor="#3498db"
            />
          ) : (
            <SingleAxisField
              label="Orthographic Size"
              value={cameraData.orthographicSize ?? 10}
              onChange={(value) => handleFieldChange('orthographicSize', Math.max(0.1, value))}
              resetValue={10}
              min={0.1}
              step={0.1}
              sensitivity={0.1}
              axisLabel="SIZE"
              axisColor="#9b59b6"
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <SingleAxisField
              label="Near Plane"
              value={cameraData.near ?? 0.1}
              onChange={(value) => handleFieldChange('near', Math.max(0.01, value))}
              resetValue={0.1}
              min={0.01}
              step={0.01}
              sensitivity={0.01}
              axisLabel="NEAR"
              axisColor="#e74c3c"
            />
            <SingleAxisField
              label="Far Plane"
              value={cameraData.far ?? 1000}
              onChange={(value) => handleFieldChange('far', Math.max(cameraData.near + 0.1, value))}
              resetValue={1000}
              min={0.1}
              step={1}
              sensitivity={1}
              axisLabel="FAR"
              axisColor="#27ae60"
            />
          </div>

          <ToggleField
            label="Main Camera"
            value={cameraData.isMain ?? false}
            onChange={(value) => handleFieldChange('isMain', value)}
            resetValue={false}
            color="cyan"
          />
        </CollapsibleSection>

        {/* Background & Rendering */}
        <CollapsibleSection title="Background & Rendering" icon={<FiEye />} defaultExpanded={false}>
          <ComponentField
            label="Clear Flags"
            type="select"
            value={cameraData.clearFlags ?? 'skybox'}
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
                        ?.replace(/\.(jpg|jpeg|png|webp|hdr)$/i, '')}
                    </span>
                  ) : (
                    <span className="text-gray-500">No texture selected</span>
                  )}
                </div>
                <InspectorButton
                  onClick={skyboxLoader.openModal}
                  icon={<FiEye />}
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
            <div className="space-y-2">
              <label className="text-xs text-gray-300">Background Color</label>
              <div className="grid grid-cols-4 gap-1">
                <SingleAxisField
                  label="R"
                  value={cameraData.backgroundColor?.r ?? 0}
                  onChange={(value) =>
                    handleFieldChange('backgroundColor', {
                      ...cameraData.backgroundColor,
                      r: Math.max(0, Math.min(1, value)),
                    })
                  }
                  resetValue={0}
                  min={0}
                  max={1}
                  step={0.01}
                  sensitivity={0.01}
                  axisLabel="R"
                  axisColor="#e74c3c"
                />
                <SingleAxisField
                  label="G"
                  value={cameraData.backgroundColor?.g ?? 0}
                  onChange={(value) =>
                    handleFieldChange('backgroundColor', {
                      ...cameraData.backgroundColor,
                      g: Math.max(0, Math.min(1, value)),
                    })
                  }
                  resetValue={0}
                  min={0}
                  max={1}
                  step={0.01}
                  sensitivity={0.01}
                  axisLabel="G"
                  axisColor="#27ae60"
                />
                <SingleAxisField
                  label="B"
                  value={cameraData.backgroundColor?.b ?? 0}
                  onChange={(value) =>
                    handleFieldChange('backgroundColor', {
                      ...cameraData.backgroundColor,
                      b: Math.max(0, Math.min(1, value)),
                    })
                  }
                  resetValue={0}
                  min={0}
                  max={1}
                  step={0.01}
                  sensitivity={0.01}
                  axisLabel="B"
                  axisColor="#3498db"
                />
                <SingleAxisField
                  label="A"
                  value={cameraData.backgroundColor?.a ?? 1}
                  onChange={(value) =>
                    handleFieldChange('backgroundColor', {
                      ...cameraData.backgroundColor,
                      a: Math.max(0, Math.min(1, value)),
                    })
                  }
                  resetValue={1}
                  min={0}
                  max={1}
                  step={0.01}
                  sensitivity={0.01}
                  axisLabel="A"
                  axisColor="#9b59b6"
                />
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* Camera Behavior */}
        <CollapsibleSection title="Camera Behavior" icon={<FiTarget />} defaultExpanded={false}>
          <ToggleField
            label="Enable Look At"
            value={cameraData.enableLookAt ?? false}
            onChange={(value) => handleFieldChange('enableLookAt', value)}
            resetValue={false}
            color="cyan"
          />

          {cameraData.enableLookAt && (
            <>
              <ComponentField
                label="Look At Entity"
                type="select"
                value={(cameraData.targetEntity ?? 0).toString()}
                onChange={(value) => handleFieldChange('targetEntity', parseInt(value, 10))}
                options={entityOptions}
              />

              {(!cameraData.targetEntity || cameraData.targetEntity === 0) && (
                <Vector3Field
                  label="Look At Position"
                  value={[
                    cameraData.lookAtTarget?.x ?? 0,
                    cameraData.lookAtTarget?.y ?? 0,
                    cameraData.lookAtTarget?.z ?? 0,
                  ]}
                  onChange={([x, y, z]) => handleFieldChange('lookAtTarget', { x, y, z })}
                  resetValue={[0, 0, 0]}
                />
              )}
            </>
          )}

          <ToggleField
            label="Enable Follow Entity"
            value={cameraData.enableSmoothing ?? false}
            onChange={(value) => handleFieldChange('enableSmoothing', value)}
            resetValue={false}
            color="green"
          />

          {cameraData.enableSmoothing && (
            <>
              <ComponentField
                label="Follow Entity"
                type="select"
                value={(cameraData.followTarget ?? 0).toString()}
                onChange={(value) => handleFieldChange('followTarget', parseInt(value, 10))}
                options={entityOptions}
              />

              {cameraData.followTarget && cameraData.followTarget > 0 && (
                <>
                  <Vector3Field
                    label="Follow Offset"
                    value={[
                      cameraData.followOffset?.x ?? 0,
                      cameraData.followOffset?.y ?? 5,
                      cameraData.followOffset?.z ?? -10,
                    ]}
                    onChange={([x, y, z]) => handleFieldChange('followOffset', { x, y, z })}
                    resetValue={[0, 5, -10]}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <SingleAxisField
                      label="Position Smooth"
                      value={cameraData.smoothingSpeed ?? 2.0}
                      onChange={(value) =>
                        handleFieldChange('smoothingSpeed', Math.max(0.1, Math.min(10, value)))
                      }
                      resetValue={2.0}
                      min={0.1}
                      max={10}
                      step={0.1}
                      sensitivity={0.1}
                      axisLabel="POS"
                      axisColor="#e67e22"
                    />
                    <SingleAxisField
                      label="Rotation Smooth"
                      value={cameraData.rotationSmoothing ?? 1.5}
                      onChange={(value) =>
                        handleFieldChange('rotationSmoothing', Math.max(0.1, Math.min(10, value)))
                      }
                      resetValue={1.5}
                      min={0.1}
                      max={10}
                      step={0.1}
                      sensitivity={0.1}
                      axisLabel="ROT"
                      axisColor="#8e44ad"
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CollapsibleSection>

        {/* Advanced Settings */}
        <CollapsibleSection title="Advanced Settings" icon={<FiSettings />} defaultExpanded={false}>
          <ToggleField
            label="Enable HDR"
            value={cameraData.hdr ?? false}
            onChange={(value) => handleFieldChange('hdr', value)}
            resetValue={false}
            color="orange"
          />

          {cameraData.hdr && (
            <>
              <ComponentField
                label="Tone Mapping"
                type="select"
                value={cameraData.toneMapping ?? 'none'}
                onChange={(value) => handleFieldChange('toneMapping', value)}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'linear', label: 'Linear' },
                  { value: 'reinhard', label: 'Reinhard' },
                  { value: 'cineon', label: 'Cineon' },
                  { value: 'aces', label: 'ACES' },
                ]}
              />

              <SingleAxisField
                label="Exposure"
                value={cameraData.toneMappingExposure ?? 1.0}
                onChange={(value) => handleFieldChange('toneMappingExposure', Math.max(0, value))}
                resetValue={1.0}
                min={0}
                max={5}
                step={0.1}
                sensitivity={0.1}
                axisLabel="EXP"
                axisColor="#f39c12"
              />
            </>
          )}

          <ToggleField
            label="Enable Post-Processing"
            value={cameraData.enablePostProcessing ?? false}
            onChange={(value) => handleFieldChange('enablePostProcessing', value)}
            resetValue={false}
            color="purple"
          />

          {cameraData.enablePostProcessing && (
            <ComponentField
              label="Post-Processing Preset"
              type="select"
              value={cameraData.postProcessingPreset ?? 'none'}
              onChange={(value) => handleFieldChange('postProcessingPreset', value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'cinematic', label: 'Cinematic' },
                { value: 'realistic', label: 'Realistic' },
                { value: 'stylized', label: 'Stylized' },
              ]}
            />
          )}

          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              Note: Culling mask is currently for future use. Layer system not yet implemented.
            </div>
            <ComponentField
              label="Culling Mask (Layers)"
              type="text"
              value={`0x${(cameraData.cullingMask ?? 0xffffffff).toString(16).toUpperCase()}`}
              onChange={(value: string) => {
                const hexValue = value.replace(/^0x/i, '');
                const numValue = parseInt(hexValue, 16);
                if (!isNaN(numValue)) {
                  handleFieldChange('cullingMask', numValue);
                }
              }}
              placeholder="0xFFFFFFFF (all layers)"
              resetValue="0xFFFFFFFF"
            />
          </div>
        </CollapsibleSection>
      </GenericComponentSection>

      <AssetLoaderModal {...skyboxLoader.modalProps} />
    </>
  );
};
