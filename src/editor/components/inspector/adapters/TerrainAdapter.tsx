import React from 'react';

import { IComponent } from '@/core/lib/ecs/IComponent';
import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { TerrainSection } from '@/editor/components/panels/InspectorPanel/Terrain/TerrainSection';

interface ITerrainAdapterProps {
  terrainComponent: IComponent<TerrainData> | null;
  updateComponent: (type: string, data: unknown) => boolean;
  removeComponent: (type: string) => boolean;
}

export const TerrainAdapter: React.FC<ITerrainAdapterProps> = ({
  terrainComponent,
  updateComponent,
  removeComponent,
}) => {
  const data = terrainComponent?.data;
  if (!data) return null;

  return (
    <TerrainSection
      terrain={data}
      onUpdate={(updates) => updateComponent('Terrain', updates)}
      onRemove={() => removeComponent('Terrain')}
    />
  );
};
