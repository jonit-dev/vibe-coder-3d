import type { ThreeEvent } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import React from 'react';
import * as THREE from 'three';

import type { IMeshColliderData } from '@/editor/components/panels/InspectorPanel/MeshCollider/MeshColliderSection';
import { useEditorStore } from '@/editor/store/editorStore';

import { ColliderVisualization } from './ColliderVisualization';
import { GizmoControls } from './GizmoControls';
import { EntityColliders } from './components/EntityColliders';
import { EntityMesh } from './components/EntityMesh';
import { EntityOutline } from './components/EntityOutline';
import { useEntityColliders } from './hooks/useEntityColliders';
import { useEntityComponents } from './hooks/useEntityComponents';
import type { IPhysicsContributions, IRenderingContributions } from './hooks/useEntityMesh';
import { useEntityMesh } from './hooks/useEntityMesh';
import { useEntitySelection } from './hooks/useEntitySelection';
import { useEntityTransform } from './hooks/useEntityTransform';
import { useEntityValidation } from './hooks/useEntityValidation';
import { useFollowedEntityCheck } from './hooks/useFollowedEntityCheck';
import { useGizmoInteraction } from './hooks/useGizmoInteraction';

type GizmoMode = 'translate' | 'rotate' | 'scale';

export interface IEntityRendererProps {
  entityId: number;
  selected: boolean;
  isPrimarySelection?: boolean;
  mode: GizmoMode;
  onTransformChange?: (values: [number, number, number]) => void;
  setGizmoMode?: (mode: GizmoMode) => void;
  setIsTransforming?: (isTransforming: boolean) => void;
  allEntityIds?: number[];
}

import type { TerrainData } from '@/core/lib/ecs/components/definitions/TerrainComponent';

// Deterministic hash in [0,1] based on integer grid + seed
function hash2(ix: number, iy: number, seed: number): number {
  const x = ix + seed * 374761393;
  const y = iy + seed * 668265263;
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise2D(
  x: number,
  y: number,
  frequency: number,
  octaves: number,
  persistence: number,
  lacunarity: number,
  seed: number,
): number {
  let amp = 1;
  let freq = frequency;
  let sum = 0;
  let norm = 0;

  for (let o = 0; o < octaves; o++) {
    const xi = Math.floor(x * freq);
    const yi = Math.floor(y * freq);

    // Deterministic corner values
    const h = (ix: number, iy: number) => hash2(ix, iy, seed);

    const fx = x * freq - xi;
    const fy = y * freq - yi;

    const v00 = h(xi, yi);
    const v10 = h(xi + 1, yi);
    const v01 = h(xi, yi + 1);
    const v11 = h(xi + 1, yi + 1);

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const smooth = (t: number) => t * t * (3 - 2 * t);

    const i1 = lerp(v00, v10, smooth(fx));
    const i2 = lerp(v01, v11, smooth(fx));
    const val = lerp(i1, i2, smooth(fy));

    // Slight shaping to reduce harsh plateaus
    const shaped = Math.pow(val, 1.2);
    sum += shaped * amp;
    norm += amp;
    amp *= persistence;
    freq *= lacunarity;
  }

  return norm > 0 ? sum / norm : 0;
}

function generateTerrainHeights(terrainData: TerrainData): {
  heights: number[];
  positions: Float32Array;
} {
  const [w, d] = terrainData.size;
  const [sx, sz] = terrainData.segments;

  // Create the same geometry as TerrainGeometry to get exact vertex positions
  const plane = new THREE.PlaneGeometry(w, d, sx - 1, sz - 1);
  plane.rotateX(-Math.PI / 2);
  const positions = plane.attributes.position.array as Float32Array;
  const heights: number[] = [];

  if (!terrainData.noiseEnabled) {
    // Flat terrain - all heights are 0
    return { heights: new Array(positions.length / 3).fill(0), positions };
  }

  let minY = Number.POSITIVE_INFINITY;
  const tempHeights: number[] = [];

  // Generate heights using same algorithm as TerrainGeometry - iterate through actual vertices
  for (let i = 0; i < positions.length / 3; i++) {
    const px = positions[i * 3 + 0];
    const pz = positions[i * 3 + 2];
    const nx = px / w + 0.5;
    const nz = pz / d + 0.5;

    // Base multi-octave noise
    let n = valueNoise2D(
      nx,
      nz,
      terrainData.noiseFrequency,
      terrainData.noiseOctaves,
      terrainData.noisePersistence,
      terrainData.noiseLacunarity,
      terrainData.noiseSeed,
    );

    // Add a gentle large-scale undulation to mimic rolling terrain
    const largeScale = valueNoise2D(
      nx,
      nz,
      Math.max(1.0, terrainData.noiseFrequency * 0.25),
      2,
      0.6,
      2.0,
      terrainData.noiseSeed + 17,
    );
    n = n * 0.7 + largeScale * 0.3;

    // Rim mountains: increase height towards edges using distance to center
    const cx = 0.5;
    const cz = 0.5;
    const dx = Math.abs(nx - cx) * 2; // 0 at center, ~1 at edge
    const dzv = Math.abs(nz - cz) * 2;
    const edge = Math.min(1, Math.pow(Math.max(dx, dzv), 1.25));
    const rim = edge * edge;
    // Slight valley bias towards center to create basins
    const valley = 1.0 - edge;
    n = n * (0.7 + 0.3 * valley) + rim * 0.45; // lift edges, keep center lower

    const y = n * terrainData.heightScale;
    tempHeights.push(y);
    if (y < minY) minY = y;
  }

  // Snap terrain so the lowest point sits on y = 0 (ground)
  if (isFinite(minY) && minY !== 0) {
    for (let i = 0; i < tempHeights.length; i++) {
      heights.push(tempHeights[i] - minY);
    }
  } else {
    heights.push(...tempHeights);
  }

  return { heights, positions };
}
export const EntityRenderer: React.FC<IEntityRendererProps> = React.memo(
  ({
    entityId,
    selected,
    isPrimarySelection = false,
    mode,
    onTransformChange,
    setGizmoMode,
    setIsTransforming,
    allEntityIds = [],
  }) => {
    const isPlaying = useEditorStore((s) => s.isPlaying);

    // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS!
    // This prevents "Rendered fewer hooks than expected" React error
    const { transform, entityComponents, meshCollider } = useEntityComponents(entityId);
    const { isValid } = useEntityValidation({ entityId, transform, isPlaying });
    const { isTransformingLocal, handleSetIsTransforming } = useGizmoInteraction({
      selected,
      setGizmoMode,
      setIsTransforming,
    });

    const { meshRef, position, scale, rotationRadians } = useEntityTransform({
      transform,
      isTransforming: isTransformingLocal,
      isPlaying,
    });

    const {
      meshType,
      entityColor,
      renderingContributions,
      physicsContributions,
      shouldHavePhysics,
    } = useEntityMesh({
      entityComponents,
      isPlaying,
    });

    const { colliderType, colliderConfig, hasCustomColliders } = useEntityColliders({
      meshCollider,
      meshType: meshType || 'unknown', // Provide fallback to avoid null issues
    });

    const { outlineGroupRef, outlineMeshRef, handleMeshClick, handleMeshDoubleClick } =
      useEntitySelection({
        entityId,
        selected,
        meshRef,
        isTransforming: isTransformingLocal,
        position: position || [0, 0, 0], // Provide fallback to avoid null issues
        rotationRadians: rotationRadians || [0, 0, 0],
        scale: scale || [1, 1, 1],
        allEntityIds,
      });

    // When terrain params change, force-remount physics body so trimesh collider rebuilds
    const terrainColliderKey = React.useMemo(() => {
      const t = entityComponents.find((c) => c.type === 'Terrain')?.data as any;
      if (!t) return undefined;
      try {
        return `rb-terrain-${entityId}-${[
          ...(Array.isArray(t.size) ? t.size : []),
          ...(Array.isArray(t.segments) ? t.segments : []),
          t.heightScale,
          t.noiseEnabled,
          t.noiseSeed,
          t.noiseFrequency,
          t.noiseOctaves,
          t.noisePersistence,
          t.noiseLacunarity,
        ].join('|')}`;
      } catch {
        return undefined;
      }
    }, [entityComponents, entityId]);
    // Enhanced collider config with terrain heightfield data
    const enhancedColliderConfig = React.useMemo(() => {
      // Handle terrain entities without MeshCollider component (auto-detect)
      if (!colliderConfig && meshType === 'Terrain' && shouldHavePhysics) {
        const terrainComponent = entityComponents.find((c) => c.type === 'Terrain');
        const terrainData = terrainComponent?.data as TerrainData | undefined;

        if (terrainData) {
          console.log(
            '[EntityRenderer] Auto-creating heightfield collider for terrain without MeshCollider',
          );
          const [w, d] = terrainData.size;
          const [sx, sz] = terrainData.segments;
          const { heights, positions } = generateTerrainHeights(terrainData);

          return {
            type: 'heightfield',
            center: [0, 0, 0],
            isTrigger: false,
            size: { width: w, height: 1, depth: d },
            terrain: {
              widthSegments: sx - 1,
              depthSegments: sz - 1,
              heights,
              positions,
              scale: { x: w / (sx - 1), y: 1, z: d / (sz - 1) },
            },
          };
        }
      }

      if (!colliderConfig || colliderConfig.type !== 'heightfield') {
        return colliderConfig;
      }

      console.log('[EntityRenderer] Processing heightfield collider for terrain');

      // Get terrain data
      const terrainComponent = entityComponents.find((c) => c.type === 'Terrain');
      const terrainData = terrainComponent?.data as TerrainData | undefined;

      if (!terrainData) {
        return colliderConfig;
      }

      // Generate heightfield data
      const [w, d] = terrainData.size;
      const [sx, sz] = terrainData.segments;
      const { heights, positions } = generateTerrainHeights(terrainData);

      return {
        ...colliderConfig,
        terrain: {
          widthSegments: sx - 1,
          depthSegments: sz - 1,
          heights,
          positions,
          scale: { x: w / (sx - 1), y: 1, z: d / (sz - 1) },
        },
      };
    }, [colliderConfig, entityComponents]);

    // Check if this entity is being followed by the main camera (first-person view)
    const isFollowedEntity = useFollowedEntityCheck(entityId, isPlaying);

    // Early return AFTER all hooks - don't render if entity doesn't exist
    if (!isValid) {
      return null;
    }

    // CRITICAL: Block all rendering until all core data is ready (especially for cameras)
    if (!meshRef || !position || !scale || !rotationRadians || !meshType) {
      return null;
    }

    // Hide mesh rendering when this entity is being followed in play mode (first-person view)
    const shouldHideMesh = isFollowedEntity && isPlaying;

    // Create the mesh content (but hide it if being followed)
    const meshContent = !shouldHideMesh ? (
      <EntityMesh
        meshRef={meshRef}
        meshType={meshType as string | null}
        renderingContributions={renderingContributions as IRenderingContributions}
        entityColor={entityColor as string}
        entityId={entityId}
        onMeshClick={handleMeshClick as unknown as (e: ThreeEvent<MouseEvent>) => void}
        onMeshDoubleClick={handleMeshDoubleClick as unknown as (e: ThreeEvent<MouseEvent>) => void}
        isPlaying={isPlaying}
        entityComponents={entityComponents}
      />
    ) : null;

    // When not using physics, render mesh normally and overlay gizmo controls separately
    const renderedNonPhysicsMesh = meshContent;

    const hasEffectiveCustomColliders = React.useMemo(
      () => Boolean(enhancedColliderConfig && enhancedColliderConfig.type !== 'heightfield'),
      [enhancedColliderConfig],
    );

    return (
      <group>
        {shouldHavePhysics ? (
          <RigidBody
            key={terrainColliderKey}
            type={(physicsContributions as IPhysicsContributions).rigidBodyProps.type as any}
            mass={(physicsContributions as IPhysicsContributions).rigidBodyProps.mass}
            friction={(physicsContributions as IPhysicsContributions).rigidBodyProps.friction}
            restitution={(physicsContributions as IPhysicsContributions).rigidBodyProps.restitution}
            density={(physicsContributions as IPhysicsContributions).rigidBodyProps.density}
            gravityScale={
              (physicsContributions as IPhysicsContributions).rigidBodyProps.gravityScale
            }
            canSleep={(physicsContributions as IPhysicsContributions).rigidBodyProps.canSleep}
            position={position}
            rotation={rotationRadians}
            scale={scale}
            colliders={
              // If heightfield (unsupported in our rapier build), fall back to trimesh auto-collider
              enhancedColliderConfig?.type === 'heightfield'
                ? 'trimesh'
                : hasCustomColliders || hasEffectiveCustomColliders
                  ? false
                  : (colliderType as 'ball' | 'cuboid' | 'hull' | 'trimesh')
            }
          >
            {/* Custom Colliders based on MeshCollider settings (skip heightfield) */}
            {enhancedColliderConfig?.type !== 'heightfield' && (
              <EntityColliders colliderConfig={enhancedColliderConfig} />
            )}
            {meshContent}
          </RigidBody>
        ) : (
          renderedNonPhysicsMesh
        )}

        {/* Gizmo controls (disabled during physics) - only show on primary selection */}
        {isPrimarySelection && !shouldHavePhysics && (
          <GizmoControls
            meshRef={meshRef}
            mode={mode}
            entityId={entityId}
            onTransformChange={onTransformChange}
            setIsTransforming={handleSetIsTransforming}
            meshType={meshType}
          />
        )}

        {/* Selection outline with smooth real-time updates */}
        <EntityOutline
          selected={selected}
          meshType={meshType}
          outlineGroupRef={outlineGroupRef}
          outlineMeshRef={outlineMeshRef}
          isPlaying={isPlaying}
          entityComponents={entityComponents}
        />

        {/* Collider Visualization (Unity-style wireframes) */}
        {selected && (
          <group position={position} rotation={rotationRadians} scale={scale}>
            <ColliderVisualization
              meshCollider={
                enhancedColliderConfig
                  ? {
                      enabled: true,
                      colliderType: enhancedColliderConfig.type,
                      isTrigger: enhancedColliderConfig.isTrigger,
                      center: enhancedColliderConfig.center,
                      size: enhancedColliderConfig.size,
                      physicsMaterial: { friction: 0.7, restitution: 0.3, density: 1 },
                    }
                  : (meshCollider?.data as IMeshColliderData) || null
              }
              visible={selected}
              terrainHeights={
                enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
                  ? enhancedColliderConfig.terrain.heights
                  : undefined
              }
              terrainSegments={
                enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
                  ? [
                      enhancedColliderConfig.terrain.widthSegments + 1,
                      enhancedColliderConfig.terrain.depthSegments + 1,
                    ]
                  : undefined
              }
              terrainPositions={
                enhancedColliderConfig?.type === 'heightfield' && enhancedColliderConfig.terrain
                  ? (enhancedColliderConfig.terrain as any).positions
                  : undefined
              }
            />
          </group>
        )}
      </group>
    );
  },
);

EntityRenderer.displayName = 'EntityRenderer';
