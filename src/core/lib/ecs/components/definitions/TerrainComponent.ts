import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';

// BitECS component interface for Terrain component
interface ITerrainBitECSComponent {
  sizeX: { [eid: number]: number };
  sizeZ: { [eid: number]: number };
  segmentsX: { [eid: number]: number };
  segmentsZ: { [eid: number]: number };
  heightScale: { [eid: number]: number };
  noiseEnabled: { [eid: number]: number };
  noiseSeed: { [eid: number]: number };
  noiseFrequency: { [eid: number]: number };
  noiseOctaves: { [eid: number]: number };
  noisePersistence: { [eid: number]: number };
  noiseLacunarity: { [eid: number]: number };
}

export const TerrainSchema = z.object({
  size: z.tuple([z.number().positive(), z.number().positive()]),
  segments: z.tuple([z.number().min(2), z.number().min(2)]),
  heightScale: z.number().min(0),
  noiseEnabled: z.boolean(),
  noiseSeed: z.number().int().nonnegative(),
  // Frequency represents the number of noise cells across the terrain domain.
  // Values < 1 produce little to no variation. Use >= 2 for visible detail.
  noiseFrequency: z.number().positive(),
  noiseOctaves: z.number().int().min(1).max(8),
  noisePersistence: z.number().min(0).max(1),
  noiseLacunarity: z.number().min(1),
});

export type TerrainData = z.infer<typeof TerrainSchema>;

export const terrainComponent = ComponentFactory.create<TerrainData>({
  id: 'Terrain',
  name: 'Terrain',
  category: ComponentCategory.Rendering,
  schema: TerrainSchema,
  incompatibleComponents: ['Camera', 'Light'],
  dependencies: ['Transform'],
  fields: {
    sizeX: Types.f32,
    sizeZ: Types.f32,
    segmentsX: Types.ui16,
    segmentsZ: Types.ui16,
    heightScale: Types.f32,
    noiseEnabled: Types.ui8,
    noiseSeed: Types.ui32,
    noiseFrequency: Types.f32,
    noiseOctaves: Types.ui8,
    noisePersistence: Types.f32,
    noiseLacunarity: Types.f32,
  },
  serialize: (eid: number, bitECSComponent: unknown): TerrainData => {
    const component = bitECSComponent as ITerrainBitECSComponent;
    return ({
    size: [component.sizeX[eid], component.sizeZ[eid]],
    segments: [component.segmentsX[eid], component.segmentsZ[eid]],
    heightScale: component.heightScale[eid],
    noiseEnabled: Boolean(component.noiseEnabled[eid]),
    noiseSeed: component.noiseSeed[eid],
    noiseFrequency: component.noiseFrequency[eid],
    noiseOctaves: component.noiseOctaves[eid],
    noisePersistence: component.noisePersistence[eid],
    noiseLacunarity: component.noiseLacunarity[eid],
    });
  },
  deserialize: (eid: number, data: TerrainData, bitECSComponent: unknown) => {
    const component = bitECSComponent as ITerrainBitECSComponent;
    const defaults = TerrainSchema.parse(data);
    component.sizeX[eid] = defaults.size[0];
    component.sizeZ[eid] = defaults.size[1];
    component.segmentsX[eid] = defaults.segments[0];
    component.segmentsZ[eid] = defaults.segments[1];
    component.heightScale[eid] = defaults.heightScale;
    component.noiseEnabled[eid] = defaults.noiseEnabled ? 1 : 0;
    component.noiseSeed[eid] = defaults.noiseSeed;
    component.noiseFrequency[eid] = defaults.noiseFrequency;
    component.noiseOctaves[eid] = defaults.noiseOctaves;
    component.noisePersistence[eid] = defaults.noisePersistence;
    component.noiseLacunarity[eid] = defaults.noiseLacunarity;
  },
});
