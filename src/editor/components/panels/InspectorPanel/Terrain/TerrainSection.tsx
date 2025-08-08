import React from 'react';
import { TbMountain } from 'react-icons/tb';

import { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { CheckboxField } from '@/editor/components/shared/CheckboxField';
import { CollapsibleSection } from '@/editor/components/shared/CollapsibleSection';
import { GenericComponentSection } from '@/editor/components/shared/GenericComponentSection';
import { SingleAxisField } from '@/editor/components/shared/SingleAxisField';
import { Vector2Field } from '@/editor/components/shared/Vector2Field';

export interface ITerrainSectionProps {
  terrain: TerrainData;
  onUpdate: (updates: Partial<TerrainData>) => void;
  onRemove: () => void;
}

export const TerrainSection: React.FC<ITerrainSectionProps> = ({ terrain, onUpdate, onRemove }) => {
  return (
    <GenericComponentSection
      title="Terrain"
      icon={<TbMountain />}
      headerColor="green"
      componentId="Terrain"
      onRemove={onRemove}
    >
      <CollapsibleSection title="Dimensions" defaultExpanded>
        <div className="space-y-2">
          <Vector2Field
            label="Size (X,Z)"
            value={[terrain.size[0], terrain.size[1]]}
            min={1}
            step={1}
            onChange={([x, z]) => onUpdate({ size: [x, z] })}
          />
          <Vector2Field
            label="Segments (X,Z)"
            value={[terrain.segments[0], terrain.segments[1]]}
            min={2}
            step={1}
            onChange={([sx, sz]) =>
              onUpdate({
                segments: [Math.max(2, Math.floor(sx)), Math.max(2, Math.floor(sz))],
              })
            }
          />
          <SingleAxisField
            label="Height Scale"
            value={terrain.heightScale}
            min={0}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ heightScale: Math.max(0, v) })}
          />
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Noise" defaultExpanded>
        <div className="space-y-2">
          <CheckboxField
            label="Enabled"
            value={terrain.noiseEnabled}
            onChange={(v) => onUpdate({ noiseEnabled: v })}
          />
          <SingleAxisField
            label="Seed"
            value={terrain.noiseSeed}
            min={0}
            step={1}
            precision={0}
            onChange={(v) => onUpdate({ noiseSeed: Math.max(0, Math.floor(v)) })}
          />
          <SingleAxisField
            label="Frequency"
            value={terrain.noiseFrequency}
            min={0.1}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ noiseFrequency: Math.max(0.1, v) })}
          />
          <SingleAxisField
            label="Octaves"
            value={terrain.noiseOctaves}
            min={1}
            max={8}
            step={1}
            precision={0}
            onChange={(v) => onUpdate({ noiseOctaves: Math.min(8, Math.max(1, Math.floor(v))) })}
          />
          <SingleAxisField
            label="Persistence"
            value={terrain.noisePersistence}
            min={0}
            max={1}
            step={0.05}
            precision={2}
            onChange={(v) => onUpdate({ noisePersistence: Math.min(1, Math.max(0, v)) })}
          />
          <SingleAxisField
            label="Lacunarity"
            value={terrain.noiseLacunarity}
            min={1}
            step={0.1}
            precision={2}
            onChange={(v) => onUpdate({ noiseLacunarity: Math.max(1, v) })}
          />
        </div>
      </CollapsibleSection>
    </GenericComponentSection>
  );
};
