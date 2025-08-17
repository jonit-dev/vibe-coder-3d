import { useGLTF, useTexture } from '@react-three/drei';
import { ThreeEvent, useThree, useFrame } from '@react-three/fiber';
import React, { Suspense, useMemo, useCallback, useEffect } from 'react';
import { threeJSEntityRegistry } from '@/core/lib/scripting/ThreeJSEntityRegistry';
import { ModelErrorBoundary } from '@/editor/components/shared/ModelErrorBoundary';
import { ModelLoadingMesh } from '@/editor/components/shared/ModelLoadingMesh';
import type { Texture, Group, Mesh } from 'three';

import { CameraGeometry } from './CameraGeometry';
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
import { LightGeometry } from './LightGeometry';
import { TerrainGeometry } from './TerrainGeometry';

// Props interface
interface IEntityMeshProps {
  meshRef: React.RefObject<any>;
  meshType: string | null;
  renderingContributions: any;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  isPlaying?: boolean;
  entityComponents?: any[];
}

// Component data interfaces
interface IMeshRendererData {
  modelPath?: string;
}

interface ICameraData {
  fov?: number;
  near?: number;
  far?: number;
}

interface ILightData {
  lightType?: 'directional' | 'point' | 'spot' | 'ambient';
  color?: string | { r: number; g: number; b: number };
  intensity?: number;
  range?: number;
  angle?: number;
}

// Type guards
const isMeshRendererData = (data: unknown): data is IMeshRendererData => {
  return typeof data === 'object' && data !== null;
};

const isCameraData = (data: unknown): data is ICameraData => {
  return typeof data === 'object' && data !== null;
};

const isLightData = (data: unknown): data is ILightData => {
  return typeof data === 'object' && data !== null;
};

// Helper function to convert color string to RGB object
const parseColorToRGB = (
  color: string | { r: number; g: number; b: number } | undefined,
): { r: number; g: number; b: number } | undefined => {
  if (!color) return undefined;

  if (typeof color === 'object') {
    return color;
  }

  // Handle hex color strings
  if (typeof color === 'string' && color.startsWith('#')) {
    const hex = color.substring(1);
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    return { r, g, b };
  }

  return undefined;
};

// Custom Model Mesh Component - FIXED VERSION
const CustomModelMesh: React.FC<{
  modelPath: string;
  meshRef: React.RefObject<any>;
  renderingContributions: any;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
}> = React.memo(
  ({ modelPath, meshRef, renderingContributions, entityId, onMeshClick, onMeshDoubleClick }) => {
    try {
      const { scene } = useGLTF(modelPath);

      // Don't clone the scene - use it directly to avoid transform inheritance issues
      const modelScene = useMemo(() => {
        // Reset position and rotation but preserve original scale
        scene.position.set(0, 0, 0);
        scene.rotation.set(0, 0, 0);
        // DON'T reset scale - preserve the model's original scale
        scene.matrixAutoUpdate = true;

        // Ensure all children respect parent transforms
        scene.traverse((child) => {
          child.matrixAutoUpdate = true;
        });

        return scene;
      }, [scene, entityId]);

      // Use callback ref to ensure proper Group integration with transform system
      const groupRefCallback = useCallback(
        (groupRef: Group | null) => {
          if (groupRef && meshRef) {
            // CRITICAL: Ensure the group can be transformed by gizmos and physics
            groupRef.matrixAutoUpdate = true;
            groupRef.userData = { ...groupRef.userData, entityId };

            // IMPORTANT: Start the group at origin to match other mesh types
            // The transform system will apply the actual entity position
            groupRef.position.set(0, 0, 0);
            groupRef.rotation.set(0, 0, 0);
            groupRef.scale.set(1, 1, 1);

            // Assign to the passed meshRef for transform system integration
            (meshRef as React.MutableRefObject<Group>).current = groupRef;
          } else if (!groupRef && meshRef.current) {
            // Cleanup when component unmounts
            (meshRef as React.MutableRefObject<Group | null>).current = null;
          }
        },
        [meshRef, entityId, modelScene],
      );

      // Force matrix updates using useFrame to ensure proper parent-child transform inheritance
      useFrame(() => {
        if (meshRef?.current) {
          // Force matrix updates on the group to ensure transforms propagate to children
          meshRef.current.updateMatrixWorld(true);
        }
      });

      return (
        <group
          ref={groupRefCallback}
          userData={{ entityId }}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
          castShadow={renderingContributions.castShadow}
          receiveShadow={renderingContributions.receiveShadow}
          visible={renderingContributions.visible}
        >
          <primitive object={modelScene} />
        </group>
      );
    } catch (error) {
      console.error('[CustomModelMesh] Failed to load model:', {
        entityId,
        modelPath,
        error: (error as Error)?.message || 'Unknown error',
      });

      // Fallback to error mesh with callback ref
      const errorRefCallback = useCallback(
        (errorMeshRef: Mesh | null) => {
          if (errorMeshRef && meshRef) {
            // Ensure the error mesh can be transformed
            errorMeshRef.matrixAutoUpdate = true;
            errorMeshRef.userData = { ...errorMeshRef.userData, entityId };

            (meshRef as React.MutableRefObject<Mesh>).current = errorMeshRef;
          } else if (!errorMeshRef && meshRef.current) {
            (meshRef as React.MutableRefObject<Mesh | null>).current = null;
          }
        },
        [meshRef, entityId],
      );

      return (
        <mesh
          ref={errorRefCallback}
          userData={{ entityId }}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
          castShadow={renderingContributions.castShadow}
          receiveShadow={renderingContributions.receiveShadow}
          visible={renderingContributions.visible}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff4444" wireframe />
        </mesh>
      );
    }
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if actual data changes (return true = skip re-render, false = do re-render)
    return (
      prevProps.modelPath === nextProps.modelPath &&
      prevProps.entityId === nextProps.entityId &&
      prevProps.renderingContributions.castShadow === nextProps.renderingContributions.castShadow &&
      prevProps.renderingContributions.receiveShadow ===
        nextProps.renderingContributions.receiveShadow &&
      prevProps.renderingContributions.visible === nextProps.renderingContributions.visible &&
      JSON.stringify(prevProps.renderingContributions.material) ===
        JSON.stringify(nextProps.renderingContributions.material)
    );
  },
);

export const EntityMesh: React.FC<IEntityMeshProps> = React.memo(
  ({
    meshRef,
    meshType,
    renderingContributions,
    entityColor,
    entityId,
    onMeshClick,
    onMeshDoubleClick,
    isPlaying = false,
    entityComponents = [],
  }) => {
    // Get Three.js scene reference for script system
    const { scene } = useThree();

    // Register/unregister entity with ThreeJSEntityRegistry for script access
    useEffect(() => {
      if (meshRef?.current && entityId && scene) {
        console.log('[EntityMesh] Registering entity with ThreeJSEntityRegistry:', {
          entityId,
          objectType: meshRef.current.type,
          objectId: meshRef.current.id,
        });

        threeJSEntityRegistry.registerEntity(entityId, meshRef.current, scene);

        // Cleanup on unmount or when object changes
        return () => {
          console.log('[EntityMesh] Unregistering entity from ThreeJSEntityRegistry:', {
            entityId,
          });
          threeJSEntityRegistry.unregisterEntity(entityId);
        };
      }
    }, [meshRef?.current, entityId, scene]);

    // Update registry when meshRef.current changes
    useEffect(() => {
      if (meshRef?.current && entityId && scene && threeJSEntityRegistry.hasEntity(entityId)) {
        console.log('[EntityMesh] Updating entity in ThreeJSEntityRegistry:', {
          entityId,
          newObjectType: meshRef.current.type,
        });
        threeJSEntityRegistry.updateEntity(entityId, meshRef.current, scene);
      }
    }, [meshRef?.current]);
    // Don't render anything if no mesh type is set
    if (!meshType) {
      return null;
    }

    // Check if this is a custom model
    const meshRendererComponent = entityComponents.find((c) => c.type === 'MeshRenderer');
    const meshRendererData = meshRendererComponent?.data;
    const modelPath = isMeshRendererData(meshRendererData) ? meshRendererData.modelPath : undefined;

    // If it's a custom model with a valid path, render the custom model
    if (meshType === 'custom' && modelPath) {
      return (
        <ModelErrorBoundary
          entityId={entityId}
          fallbackMesh={
            <mesh
              ref={meshRef}
              userData={{ entityId }}
              onClick={onMeshClick}
              onDoubleClick={onMeshDoubleClick}
              castShadow={renderingContributions.castShadow}
              receiveShadow={renderingContributions.receiveShadow}
              visible={renderingContributions.visible}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#ff4444" wireframe />
            </mesh>
          }
        >
          <Suspense
            fallback={
              <ModelLoadingMesh
                meshRef={meshRef}
                entityId={entityId}
                renderingContributions={renderingContributions}
                onMeshClick={onMeshClick}
                onMeshDoubleClick={onMeshDoubleClick}
              />
            }
          >
            <CustomModelMesh
              modelPath={modelPath}
              meshRef={meshRef}
              renderingContributions={renderingContributions}
              entityId={entityId}
              onMeshClick={onMeshClick}
              onMeshDoubleClick={onMeshDoubleClick}
            />
          </Suspense>
        </ModelErrorBoundary>
      );
    }

    // Load textures if materialType is 'texture'
    const material = renderingContributions.material || {};
    const isTextureMode = material.materialType === 'texture';

    // Prepare texture URLs for batch loading with useTexture
    const textureUrls = useMemo(() => {
      if (!isTextureMode) return {};

      const urls: Record<string, string> = {};

      // Only add URLs that actually exist to prevent unnecessary loading attempts
      if (material.albedoTexture) urls.albedoTexture = material.albedoTexture;
      if (material.normalTexture) urls.normalTexture = material.normalTexture;
      if (material.metallicTexture) urls.metallicTexture = material.metallicTexture;
      if (material.roughnessTexture) urls.roughnessTexture = material.roughnessTexture;
      if (material.emissiveTexture) urls.emissiveTexture = material.emissiveTexture;
      if (material.occlusionTexture) urls.occlusionTexture = material.occlusionTexture;

      return urls;
    }, [
      isTextureMode,
      material.albedoTexture,
      material.normalTexture,
      material.metallicTexture,
      material.roughnessTexture,
      material.emissiveTexture,
      material.occlusionTexture,
    ]);

    // Load all textures at once using drei's useTexture
    // This handles errors gracefully and provides better loading management
    const textures = useTexture(textureUrls);

    // Configure texture offsets after textures are loaded (outside of onLoad to prevent flashing)
    React.useEffect(() => {
      Object.values(textures).forEach((texture) => {
        if (texture && typeof texture === 'object' && 'offset' in texture) {
          texture.offset.set(material.textureOffsetX ?? 0, material.textureOffsetY ?? 0);
          texture.needsUpdate = true;
        }
      });
    }, [textures, material.textureOffsetX, material.textureOffsetY]);

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
          return <boxGeometry args={[2, 1, 0.1]} />; // Wide, tall, thin wall
        case 'Trapezoid':
          return <cylinderGeometry args={[0.3, 0.7, 1, 4]} />; // 4-sided cylinder for trapezoid approximation
        case 'Octahedron':
          return <octahedronGeometry args={[0.5, 0]} />;
        case 'Prism':
          return <cylinderGeometry args={[0.5, 0.5, 1, 6]} />; // 6-sided prism
        case 'Pyramid':
          return <coneGeometry args={[0.5, 1, 4]} />; // 4-sided cone for pyramid
        case 'Capsule':
          return <capsuleGeometry args={[0.3, 0.4, 4, 16]} />; // radius, length, capSegments, radialSegments
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
          return null; // Special case - uses CameraGeometry component
        case 'Light':
          return null; // Special case - uses LightGeometry component
        case 'custom':
          return null; // Special case - uses CustomModelMesh component
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType, terrainData]);

    // Special handling for camera entities
    if (meshType === 'Camera') {
      // Extract camera data for dynamic frustum
      const cameraComponent = entityComponents.find((c) => c.type === 'Camera');
      const cameraData = cameraComponent?.data;
      const typedCameraData = isCameraData(cameraData) ? cameraData : {};

      return (
        <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
          <CameraGeometry
            showFrustum={true}
            isPlaying={isPlaying}
            fov={typedCameraData.fov}
            near={typedCameraData.near}
            far={typedCameraData.far}
            aspect={16 / 9} // TODO: Get actual viewport aspect ratio
          />
        </group>
      );
    }

    // Special handling for light entities
    if (meshType === 'Light') {
      // Extract light data for dynamic visualization
      const lightComponent = entityComponents.find((c) => c.type === 'Light');
      const lightData = lightComponent?.data;
      const typedLightData = isLightData(lightData) ? lightData : {};

      return (
        <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
          <LightGeometry
            lightType={typedLightData.lightType || 'point'}
            showDirection={true}
            isPlaying={isPlaying}
            color={parseColorToRGB(typedLightData.color)}
            intensity={typedLightData.intensity}
            range={typedLightData.range}
            angle={typedLightData.angle}
          />
        </group>
      );
    }

    // Material rendering based on shader and mode
    const isStandardShader = material.shader === 'standard';

    if (isStandardShader) {
      // Standard PBR shader
      if (isTextureMode) {
        // Textured PBR material
        return (
          <mesh
            ref={meshRef}
            castShadow={renderingContributions.castShadow}
            receiveShadow={renderingContributions.receiveShadow}
            userData={{ entityId }}
            visible={renderingContributions.visible}
            onClick={onMeshClick}
            onDoubleClick={onMeshDoubleClick}
          >
            {geometryContent}
            <meshStandardMaterial
              // In texture mode, always use white to not tint textures. In solid mode, use material color.
              color={isTextureMode ? '#ffffff' : (material.color ?? entityColor)}
              map={textures.albedoTexture as Texture | undefined}
              // PBR properties
              metalness={material.metalness ?? 0}
              roughness={material.roughness ?? 0.5}
              metalnessMap={textures.metallicTexture as Texture | undefined}
              roughnessMap={textures.roughnessTexture as Texture | undefined}
              // Normal mapping
              normalMap={textures.normalTexture as Texture | undefined}
              normalScale={
                textures.normalTexture
                  ? [material.normalScale ?? 1, material.normalScale ?? 1]
                  : undefined
              }
              // Emissive properties
              emissive={material.emissive ?? '#000000'}
              emissiveIntensity={material.emissiveIntensity ?? 0}
              emissiveMap={textures.emissiveTexture as Texture | undefined}
              // Ambient occlusion
              aoMap={textures.occlusionTexture as Texture | undefined}
              aoMapIntensity={material.occlusionStrength ?? 1}
            />
          </mesh>
        );
      } else {
        // Solid color PBR material
        return (
          <mesh
            ref={meshRef}
            castShadow={renderingContributions.castShadow}
            receiveShadow={renderingContributions.receiveShadow}
            userData={{ entityId }}
            visible={renderingContributions.visible}
            onClick={onMeshClick}
            onDoubleClick={onMeshDoubleClick}
          >
            {geometryContent}
            <meshStandardMaterial
              color={material.color ?? entityColor}
              metalness={material.metalness ?? 0}
              roughness={material.roughness ?? 0.5}
              emissive={material.emissive ?? '#000000'}
              emissiveIntensity={material.emissiveIntensity ?? 0}
            />
          </mesh>
        );
      }
    } else {
      // Unlit shader - use basic material
      return (
        <mesh
          ref={meshRef}
          castShadow={false} // Unlit materials don't cast shadows
          receiveShadow={false}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
        >
          {geometryContent}
          <meshBasicMaterial
            color={material.color ?? entityColor}
            map={isTextureMode ? (textures.albedoTexture as Texture | undefined) : undefined}
          />
        </mesh>
      );
    }
  },
  (prevProps, nextProps) => {
    // Custom comparison function to prevent unnecessary re-renders

    // Compare primitive values first
    if (
      prevProps.entityId !== nextProps.entityId ||
      prevProps.meshType !== nextProps.meshType ||
      prevProps.entityColor !== nextProps.entityColor ||
      prevProps.isPlaying !== nextProps.isPlaying
    ) {
      return false;
    }

    // Deep compare renderingContributions
    const prevRC = prevProps.renderingContributions;
    const nextRC = nextProps.renderingContributions;
    if (
      prevRC.meshType !== nextRC.meshType ||
      prevRC.castShadow !== nextRC.castShadow ||
      prevRC.receiveShadow !== nextRC.receiveShadow ||
      prevRC.visible !== nextRC.visible ||
      JSON.stringify(prevRC.material) !== JSON.stringify(nextRC.material)
    ) {
      return false;
    }

    // Compare entityComponents (focus on data changes, not reference changes)
    // IMPORTANT: Exclude Transform component changes to prevent mesh re-rendering during gizmo transforms
    const relevantPrevComponents = prevProps.entityComponents.filter((c) => c.type !== 'Transform');
    const relevantNextComponents = nextProps.entityComponents.filter((c) => c.type !== 'Transform');

    if (relevantPrevComponents.length !== relevantNextComponents.length) {
      return false;
    }

    // Check if any relevant component data has actually changed
    for (let i = 0; i < relevantPrevComponents.length; i++) {
      const prev = relevantPrevComponents[i];
      const next = relevantNextComponents[i];

      if (prev.type !== next.type || JSON.stringify(prev.data) !== JSON.stringify(next.data)) {
        return false;
      }
    }

    // Function references can be ignored for memo - they're event handlers
    // and don't affect rendering output directly

    return true; // Props are equal, skip re-render
  },
);

EntityMesh.displayName = 'EntityMesh';
