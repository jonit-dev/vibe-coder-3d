import { useTexture } from '@react-three/drei';
import React, { useMemo } from 'react';
import type { Mesh, Texture } from 'three';

import { CameraGeometry } from './CameraGeometry';

interface IEntityMeshProps {
  meshRef: React.RefObject<Mesh | null>;
  meshType: string | null;
  renderingContributions: any;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: any) => void;
  isPlaying?: boolean;
  entityComponents?: Array<{ type: string; data: any }>;
}

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

    // Load textures if materialType is 'texture'
    const material = renderingContributions.material || {};
    const isTextureMode = material.materialType === 'texture';

    // Prepare texture URLs for batch loading with useTexture
    const textureUrls = useMemo(() => {
      if (!isTextureMode) return {};

      const urls: Record<string, string> = {};
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
    const textures = useTexture(textureUrls, (loadedTextures) => {
      // onLoad callback - configure loaded textures
      Object.values(loadedTextures).forEach((texture) => {
        if (texture && typeof texture === 'object' && 'needsUpdate' in texture) {
          texture.needsUpdate = true;
        }
      });
    });

    // Memoized geometry/content selection based on mesh type
    const geometryContent = useMemo(() => {
      switch (meshType) {
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
        case 'Camera':
          return null; // Special case - uses CameraGeometry component
        default:
          return <boxGeometry args={[1, 1, 1]} />;
      }
    }, [meshType]);

    // Special handling for camera entities
    if (meshType === 'Camera') {
      // Extract camera data for dynamic frustum
      const cameraComponent = entityComponents.find((c) => c.type === 'Camera');
      const cameraData = cameraComponent?.data;

      return (
        <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
          <CameraGeometry
            showFrustum={true}
            isPlaying={isPlaying}
            fov={cameraData?.fov}
            near={cameraData?.near}
            far={cameraData?.far}
            aspect={16 / 9} // TODO: Get actual viewport aspect ratio
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
              // Base color - white when using textures to not tint them
              color="#ffffff"
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
