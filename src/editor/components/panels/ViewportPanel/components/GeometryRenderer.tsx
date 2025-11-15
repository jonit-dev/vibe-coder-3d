import React, { useEffect, useMemo } from 'react';
import type { BufferGeometry } from 'three';

import type { IComponent } from '@/core/lib/ecs/IComponent';
import type { CustomShapeData, GeometryAssetData } from '@/core/lib/ecs/components/definitions';
import { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';
import { parseMetaToBufferGeometry } from '@/core/lib/geometry/metadata/parseMetaToBufferGeometry';
import { Logger } from '@/core/lib/logger';
import { shapeRegistry } from '@/core/lib/rendering/shapes/shapeRegistry';
import { useGeometryAsset } from '@/editor/hooks/useGeometryAssets';

import { TerrainGeometry } from './TerrainGeometry';

const logger = Logger.create('GeometryRenderer');

interface IGeometryRendererProps {
  meshType: string;
  entityComponents: IComponent[];
}

function applyGeometryAssetOptions(
  geometry: BufferGeometry,
  options?: GeometryAssetData['options'],
): BufferGeometry {
  if (!options) {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  if (options.scale !== undefined && options.scale !== 1) {
    geometry.scale(options.scale, options.scale, options.scale);
  }

  if (options.recenter) {
    geometry.center();
  }

  if (options.recomputeNormals) {
    geometry.computeVertexNormals();
  }

  if (options.recomputeTangents) {
    try {
      geometry.computeTangents();
    } catch (error) {
      logger.warn('Failed to compute tangents for geometry asset', { error });
    }
  }

  if (options.flipNormals) {
    const normalAttribute = geometry.getAttribute('normal');
    if (normalAttribute) {
      const normals = normalAttribute.array as Float32Array | number[];
      for (let index = 0; index < normals.length; index++) {
        normals[index] = -normals[index];
      }
      normalAttribute.needsUpdate = true;
    } else {
      logger.warn('flipNormals requested but geometry has no normal attribute');
    }
  }

  if (options.computeBounds === false) {
    geometry.boundingBox = null;
    geometry.boundingSphere = null;
  } else {
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  return geometry;
}

export const GeometryRenderer: React.FC<IGeometryRendererProps> = React.memo(
  ({ meshType, entityComponents }) => {
    const terrainData = useMemo(() => {
      const terrain = entityComponents.find((component) => component.type === 'Terrain') as
        | IComponent<TerrainData>
        | undefined;
      return terrain?.data || null;
    }, [entityComponents]);

    const customShapeData = useMemo(() => {
      const customShape = entityComponents.find((component) => component.type === 'CustomShape');
      return (customShape?.data as CustomShapeData) || null;
    }, [entityComponents]);

    const geometryAssetData = useMemo(() => {
      const geometryAsset = entityComponents.find(
        (component) => component.type === 'GeometryAsset',
      );
      return (geometryAsset?.data as GeometryAssetData) || null;
    }, [entityComponents]);

    const geometryAssetOptionsKey = useMemo(
      () => (geometryAssetData?.options ? JSON.stringify(geometryAssetData.options) : 'null'),
      [geometryAssetData?.options],
    );

    const geometryAssetSummary = useGeometryAsset(geometryAssetData?.path);

    // Surface actionable warning only when GeometryAsset is the selected meshType
    useEffect(() => {
      if (meshType === 'GeometryAsset') {
        if (!geometryAssetData) {
          logger.warn(
            'GeometryAsset mesh selected but no GeometryAsset component is present on the entity. Add a GeometryAsset component with a valid path.',
          );
        } else if (!geometryAssetData.path) {
          logger.warn(
            'GeometryAsset component is missing "path". Set GeometryAsset.path to a valid asset metadata path (e.g. /assets/geometry/yourMesh.meta.json).',
          );
        }
      }
    }, [meshType, geometryAssetData]);

    const geometryAssetGeometry = useMemo(() => {
      if (!geometryAssetData || !geometryAssetSummary) {
        return null;
      }

      try {
        const geometry = parseMetaToBufferGeometry(geometryAssetSummary.meta);
        return applyGeometryAssetOptions(geometry, geometryAssetData.options);
      } catch (error) {
        logger.error('Failed to parse geometry asset metadata', {
          path: geometryAssetData.path,
          error,
        });
        return null;
      }
    }, [geometryAssetData, geometryAssetSummary, geometryAssetOptionsKey]);

    useEffect(() => {
      return () => {
        geometryAssetGeometry?.dispose();
      };
    }, [geometryAssetGeometry]);

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
        case 'Dodecahedron':
          return <dodecahedronGeometry args={[0.5, 0]} />;
        case 'Icosahedron':
          return <icosahedronGeometry args={[0.5, 0]} />;
        case 'Tetrahedron':
          return <tetrahedronGeometry args={[0.5, 0]} />;
        case 'Camera':
        case 'Light':
        case 'custom':
          return null;
        case 'GeometryAsset':
          if (!geometryAssetGeometry) {
            return null;
          }
          return <primitive object={geometryAssetGeometry} attach="geometry" />;
        case 'CustomShape': {
          if (!customShapeData) {
            return null;
          }

          const descriptor = shapeRegistry.resolve(customShapeData.shapeId);

          if (!descriptor) {
            logger.warn('Custom shape not found in registry', { shapeId: customShapeData.shapeId });
            return null;
          }

          const normalizedParamsResult = descriptor.paramsSchema.safeParse(
            customShapeData.params ?? {},
          );

          const normalizedParams = normalizedParamsResult.success
            ? normalizedParamsResult.data
            : (() => {
                logger.error('Invalid params for custom shape', {
                  shapeId: customShapeData.shapeId,
                  error: normalizedParamsResult.error,
                });
                return descriptor.getDefaultParams();
              })();

          const RenderGeometryComponent = descriptor.renderGeometry as React.ComponentType<
            typeof normalizedParams
          >;

          return <RenderGeometryComponent {...normalizedParams} />;
        }
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType, terrainData, customShapeData, geometryAssetGeometry]);

    return <>{geometryContent}</>;
  },
);

GeometryRenderer.displayName = 'GeometryRenderer';
