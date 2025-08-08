import { useGLTF, useTexture } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import React, { Suspense, useMemo } from 'react';
import type { Mesh, Texture } from 'three';

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

  // Parse hex color string to RGB
  if (typeof color === 'string') {
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      return { r, g, b };
    }
  }

  return undefined;
};

interface IRenderingContributions {
  castShadow: boolean;
  receiveShadow: boolean;
  visible: boolean;
  material?: {
    shader?: string;
    materialType?: string;
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    normalScale?: number;
    occlusionStrength?: number;
    textureOffsetX?: number;
    textureOffsetY?: number;
    albedoTexture?: string;
    normalTexture?: string;
    metallicTexture?: string;
    roughnessTexture?: string;
    emissiveTexture?: string;
    occlusionTexture?: string;
  };
}

interface IEntityMeshProps {
  meshRef: React.RefObject<Mesh | null>;
  meshType: string | null;
  renderingContributions: IRenderingContributions;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  isPlaying?: boolean;
  entityComponents?: Array<{ type: string; data: unknown }>;
}

const CustomModelMesh: React.FC<{
  modelPath: string;
  meshRef: React.RefObject<Mesh | null>;
  renderingContributions: IRenderingContributions;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
}> = ({ modelPath, meshRef, renderingContributions, entityId, onMeshClick }) => {
  console.log('[CustomModelMesh] Loading model from path:', modelPath);

  const { scene } = useGLTF(modelPath);
  console.log('[CustomModelMesh] Model loaded successfully:', scene);

  return (
    <group
      ref={meshRef as React.RefObject<any>}
      userData={{ entityId }}
      onClick={onMeshClick}
      castShadow={renderingContributions.castShadow}
      receiveShadow={renderingContributions.receiveShadow}
      visible={renderingContributions.visible}
    >
      <primitive object={scene.clone()} />
    </group>
  );
};

export const EntityMesh: React.FC<IEntityMeshProps> = React.memo(
  ({
    meshRef,
    meshType,
    renderingContributions,
    entityColor,
    entityId,
    onMeshClick,
    isPlaying = false,
    entityComponents = [],
  }) => {
    // Don't render anything if no mesh type is set
    if (!meshType) {
      return null;
    }

    // Check if this is a custom model
    const meshRendererComponent = entityComponents.find((c) => c.type === 'MeshRenderer');
    const meshRendererData = meshRendererComponent?.data;
    const modelPath = isMeshRendererData(meshRendererData) ? meshRendererData.modelPath : undefined;

    // Debug logging
    console.log('[EntityMesh] Debug:', {
      entityId,
      meshType,
      modelPath,
      meshRendererComponent: meshRendererComponent?.data,
    });

    // If it's a custom model with a valid path, render the custom model
    if (meshType === 'custom' && modelPath) {
      console.log('[EntityMesh] Rendering custom model:', modelPath);
      return (
        <Suspense
          fallback={
            <mesh
              ref={meshRef}
              userData={{ entityId }}
              onClick={onMeshClick}
              castShadow={renderingContributions.castShadow}
              receiveShadow={renderingContributions.receiveShadow}
              visible={renderingContributions.visible}
            >
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="yellow" />
            </mesh>
          }
        >
          <CustomModelMesh
            modelPath={modelPath}
            meshRef={meshRef}
            renderingContributions={renderingContributions}
            entityId={entityId}
            onMeshClick={onMeshClick}
          />
        </Suspense>
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
);

EntityMesh.displayName = 'EntityMesh';
