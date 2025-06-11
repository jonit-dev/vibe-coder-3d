import { useGLTF, useTexture } from '@react-three/drei';
import React, { Suspense, useMemo } from 'react';
import type { Mesh, Texture } from 'three';

import { CameraGeometry } from './CameraGeometry';
import { LightGeometry } from './LightGeometry';

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

const CustomModelMesh: React.FC<{
  modelPath: string;
  meshRef: React.RefObject<Mesh | null>;
  renderingContributions: any;
  entityId: number;
  onMeshClick: (e: any) => void;
}> = ({ modelPath, meshRef, renderingContributions, entityId, onMeshClick }) => {
  const { scene } = useGLTF(modelPath);

  return (
    <group
      ref={meshRef as any}
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
    const modelPath = meshRendererComponent?.data?.modelPath;

    // If it's a custom model with a valid path, render the custom model
    if (meshType === 'custom' && modelPath) {
      return (
        <Suspense fallback={null}>
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
        case 'Camera':
          return null; // Special case - uses CameraGeometry component
        case 'Light':
          return null; // Special case - uses LightGeometry component
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

    // Special handling for light entities
    if (meshType === 'Light') {
      // Extract light data for dynamic visualization
      const lightComponent = entityComponents.find((c) => c.type === 'Light');
      const lightData = lightComponent?.data;

      return (
        <group ref={meshRef as any} userData={{ entityId }} onClick={onMeshClick}>
          <LightGeometry
            lightType={lightData?.lightType || 'point'}
            showDirection={true}
            isPlaying={isPlaying}
            color={lightData?.color}
            intensity={lightData?.intensity}
            range={lightData?.range}
            angle={lightData?.angle}
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
