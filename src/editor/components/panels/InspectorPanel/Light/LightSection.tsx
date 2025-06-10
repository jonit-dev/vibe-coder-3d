import React from 'react';
import { FiEye, FiSettings, FiSun, FiTarget, FiZap } from 'react-icons/fi';

import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { ColorField } from '@/editor/components/shared/ColorField';
import { ComponentField } from '@/editor/components/shared/ComponentField';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { ToggleField } from '@/editor/components/shared/ToggleField';
import { Vector3Field } from '@/editor/components/shared/Vector3Field';

export interface ILightSectionProps {
  lightData: LightData;
  onUpdate: (data: Partial<LightData>) => void;
  onRemove?: () => void;
  entityId: number;
}

export const LightSection: React.FC<ILightSectionProps> = ({ lightData, onUpdate, onRemove }) => {
  const updateLight = (updates: Partial<LightData>) => {
    onUpdate({ ...lightData, ...updates });
  };

  // Convert color to hex for ColorField
  const lightColorHex = `#${Math.round(lightData.color.r * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(lightData.color.g * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(lightData.color.b * 255)
    .toString(16)
    .padStart(2, '0')}`;

  // Light type options for dropdown
  const lightTypeOptions = [
    { value: 'directional', label: 'Directional' },
    { value: 'point', label: 'Point' },
    { value: 'spot', label: 'Spot' },
    { value: 'ambient', label: 'Ambient' },
  ];

  // Helper to get light type icon
  const getLightTypeIcon = () => {
    switch (lightData.lightType) {
      case 'directional':
        return '☀️';
      case 'point':
        return '💡';
      case 'spot':
        return '🔦';
      case 'ambient':
        return '🌟';
      default:
        return '💡';
    }
  };

  return (
    <GenericComponentSection
      title="Light"
      icon={<FiSun />}
      headerColor="orange"
      componentId={KnownComponentTypes.LIGHT}
      onRemove={onRemove}
    >
      {/* Light Type Configuration */}
      <CollapsibleSection
        title="Light Type"
        defaultExpanded={true}
        icon={<FiSettings />}
        badge={getLightTypeIcon()}
      >
        <ComponentField
          label="Type"
          type="select"
          value={lightData.lightType}
          onChange={(value: string) => updateLight({ lightType: value as LightData['lightType'] })}
          options={lightTypeOptions}
        />
      </CollapsibleSection>

      {/* Basic Properties */}
      <CollapsibleSection title="Basic Properties" defaultExpanded={true} icon={<FiEye />}>
        <ToggleField
          label="Enabled"
          value={lightData.enabled ?? true}
          onChange={(enabled: boolean) => updateLight({ enabled })}
          resetValue={true}
          color="green"
        />

        <ColorField
          label="Color"
          value={lightColorHex}
          onChange={(colorHex: string) => {
            const r = parseInt(colorHex.slice(1, 3), 16) / 255;
            const g = parseInt(colorHex.slice(3, 5), 16) / 255;
            const b = parseInt(colorHex.slice(5, 7), 16) / 255;
            updateLight({ color: { r, g, b } });
          }}
        />

        <SingleAxisField
          label="Intensity"
          value={lightData.intensity}
          onChange={(intensity: number) => updateLight({ intensity: Math.max(0, intensity) })}
          step={0.1}
          min={0}
          sensitivity={0.05}
        />
      </CollapsibleSection>

      {/* Directional Light Properties */}
      {lightData.lightType === 'directional' && (
        <CollapsibleSection title="Directional Light" defaultExpanded={true} icon={<FiTarget />}>
          <Vector3Field
            label="Direction"
            value={[
              lightData.directionX ?? 0,
              lightData.directionY ?? -1,
              lightData.directionZ ?? 0,
            ]}
            onChange={(direction: [number, number, number]) =>
              updateLight({
                directionX: direction[0],
                directionY: direction[1],
                directionZ: direction[2],
              })
            }
            step={0.1}
            sensitivity={0.01}
          />
        </CollapsibleSection>
      )}

      {/* Point Light Properties */}
      {lightData.lightType === 'point' && (
        <CollapsibleSection title="Point Light" defaultExpanded={true} icon={<FiZap />}>
          <SingleAxisField
            label="Range"
            value={lightData.range ?? 10}
            onChange={(range: number) => updateLight({ range: Math.max(0.1, range) })}
            step={0.5}
            min={0.1}
            sensitivity={0.1}
          />

          <SingleAxisField
            label="Decay"
            value={lightData.decay ?? 1}
            onChange={(decay: number) => updateLight({ decay: Math.max(0, decay) })}
            step={0.1}
            min={0}
            sensitivity={0.05}
          />
        </CollapsibleSection>
      )}

      {/* Spot Light Properties */}
      {lightData.lightType === 'spot' && (
        <CollapsibleSection title="Spot Light" defaultExpanded={true} icon={<FiZap />}>
          <SingleAxisField
            label="Angle (degrees)"
            value={((lightData.angle ?? Math.PI / 6) * 180) / Math.PI}
            onChange={(degrees: number) => updateLight({ angle: (degrees * Math.PI) / 180 })}
            step={1}
            min={1}
            max={179}
            sensitivity={1}
          />

          <SingleAxisField
            label="Penumbra"
            value={lightData.penumbra ?? 0.1}
            onChange={(penumbra: number) =>
              updateLight({ penumbra: Math.max(0, Math.min(1, penumbra)) })
            }
            step={0.01}
            min={0}
            max={1}
            sensitivity={0.01}
          />

          <SingleAxisField
            label="Range"
            value={lightData.range ?? 10}
            onChange={(range: number) => updateLight({ range: Math.max(0.1, range) })}
            step={0.5}
            min={0.1}
            sensitivity={0.1}
          />

          <SingleAxisField
            label="Decay"
            value={lightData.decay ?? 1}
            onChange={(decay: number) => updateLight({ decay: Math.max(0, decay) })}
            step={0.1}
            min={0}
            sensitivity={0.05}
          />
        </CollapsibleSection>
      )}

      {/* Shadow Properties - Not shown for ambient lights */}
      {lightData.lightType !== 'ambient' && (
        <CollapsibleSection
          title="Shadows"
          defaultExpanded={false}
          icon={<FiTarget />}
          badge={lightData.castShadow ? 'ON' : 'OFF'}
        >
          <ToggleField
            label="Cast Shadow"
            value={lightData.castShadow ?? true}
            onChange={(castShadow: boolean) => updateLight({ castShadow })}
            resetValue={true}
            color="orange"
          />

          {lightData.castShadow && (
            <>
              <ComponentField
                label="Shadow Map Size"
                type="select"
                value={lightData.shadowMapSize?.toString() ?? '1024'}
                onChange={(value: string) => updateLight({ shadowMapSize: parseInt(value) })}
                options={[
                  { value: '256', label: '256' },
                  { value: '512', label: '512' },
                  { value: '1024', label: '1024' },
                  { value: '2048', label: '2048' },
                  { value: '4096', label: '4096' },
                ]}
              />

              <SingleAxisField
                label="Shadow Bias"
                value={lightData.shadowBias ?? -0.0001}
                onChange={(shadowBias: number) => updateLight({ shadowBias })}
                step={0.0001}
                sensitivity={0.0001}
              />

              <SingleAxisField
                label="Shadow Radius"
                value={lightData.shadowRadius ?? 1.0}
                onChange={(shadowRadius: number) =>
                  updateLight({ shadowRadius: Math.max(0, shadowRadius) })
                }
                step={0.1}
                min={0}
                sensitivity={0.05}
              />

              <SingleAxisField
                label="Shadow Near"
                value={lightData.shadowNear ?? 0.1}
                onChange={(shadowNear: number) =>
                  updateLight({ shadowNear: Math.max(0.001, shadowNear) })
                }
                step={0.1}
                min={0.001}
                sensitivity={0.05}
              />

              <SingleAxisField
                label="Shadow Far"
                value={lightData.shadowFar ?? 50.0}
                onChange={(shadowFar: number) =>
                  updateLight({ shadowFar: Math.max(0.1, shadowFar) })
                }
                step={1}
                min={0.1}
                sensitivity={0.5}
              />
            </>
          )}
        </CollapsibleSection>
      )}
    </GenericComponentSection>
  );
};
