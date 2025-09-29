import React, { useMemo } from 'react';

import {
  BushGeometry,
  CrossGeometry,
  DiamondGeometry,
  GrassGeometry,
  HeartGeometry,
  HelixGeometry,
  MobiusStripGeometry,
  RampGeometry,
  RockGeometry,
  SpiralStairsGeometry,
  StairsGeometry,
  StarGeometry,
  TorusKnotGeometry,
  TreeGeometry,
  TubeGeometry,
} from './CustomGeometries';
import { TerrainGeometry } from './TerrainGeometry';

interface IGeometryRendererProps {
  meshType: string;
  entityComponents: any[];
}

export const GeometryRenderer: React.FC<IGeometryRendererProps> = React.memo(
  ({ meshType, entityComponents }) => {
    // Memoized geometry/content selection based on mesh type
    const terrainData = useMemo(() => {
      const terrain = entityComponents.find((c) => c.type === 'Terrain');
      return (terrain?.data as any) || null;
    }, [entityComponents]);

    const geometryContent = useMemo(() => {
      switch (meshType) {
        case 'Terrain':
          if (terrainData) {
            return (
              <TerrainGeometry
                size={terrainData.size ?? [20, 20]}
                segments={terrainData.segments ?? [129, 129]}
                heightScale={terrainData.heightScale ?? 2}
                noiseEnabled={terrainData.noiseEnabled ?? true}
                noiseSeed={terrainData.noiseSeed ?? 1337}
                noiseFrequency={terrainData.noiseFrequency ?? 0.2}
                noiseOctaves={terrainData.noiseOctaves ?? 4}
                noisePersistence={terrainData.noisePersistence ?? 0.5}
                noiseLacunarity={terrainData.noiseLacunarity ?? 2.0}
              />
            );
          }
          return <planeGeometry args={[20, 20]} />;
        case 'cube':
        case 'Cube':
          return <boxGeometry args={[1, 1, 1]} />;
        case 'sphere':
        case 'Sphere':
          return <sphereGeometry args={[0.5, 32, 32]} />;
        case 'Cylinder':
          return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
        case 'Cone':
          return <coneGeometry args={[0.5, 1, 32]} />;
        case 'Torus':
          return <torusGeometry args={[0.5, 0.2, 16, 100]} />;
        case 'Plane':
          return <planeGeometry args={[1, 1]} />;
        case 'Wall':
          return <boxGeometry args={[2, 1, 0.1]} />;
        case 'Trapezoid':
          return <cylinderGeometry args={[0.3, 0.7, 1, 4]} />;
        case 'Octahedron':
          return <octahedronGeometry args={[0.5, 0]} />;
        case 'Prism':
          return <cylinderGeometry args={[0.5, 0.5, 1, 6]} />;
        case 'Pyramid':
          return <coneGeometry args={[0.5, 1, 4]} />;
        case 'Capsule':
          return <capsuleGeometry args={[0.3, 0.4, 4, 16]} />;
        case 'Helix':
          return <HelixGeometry />;
        case 'MobiusStrip':
          return <MobiusStripGeometry />;
        case 'Dodecahedron':
          return <dodecahedronGeometry args={[0.5, 0]} />;
        case 'Icosahedron':
          return <icosahedronGeometry args={[0.5, 0]} />;
        case 'Tetrahedron':
          return <tetrahedronGeometry args={[0.5, 0]} />;
        case 'TorusKnot':
          return <TorusKnotGeometry />;
        case 'Ramp':
          return <RampGeometry />;
        case 'Stairs':
          return <StairsGeometry />;
        case 'SpiralStairs':
          return <SpiralStairsGeometry />;
        case 'Star':
          return <StarGeometry />;
        case 'Heart':
          return <HeartGeometry />;
        case 'Diamond':
          return <DiamondGeometry />;
        case 'Tube':
          return <TubeGeometry />;
        case 'Cross':
          return <CrossGeometry />;
        case 'Tree':
          return <TreeGeometry />;
        case 'Rock':
          return <RockGeometry />;
        case 'Bush':
          return <BushGeometry />;
        case 'Grass':
          return <GrassGeometry />;
        case 'Camera':
          return null;
        case 'Light':
          return null;
        case 'custom':
          return null;
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType, terrainData]);

    return <>{geometryContent}</>;
  },
);

GeometryRenderer.displayName = 'GeometryRenderer';
