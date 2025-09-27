import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';
import type { Texture } from 'three';

import { GeometryRenderer } from './GeometryRenderer';

interface IMaterialRendererProps {
  meshRef: React.RefObject<any>;
  meshType: string;
  entityComponents: any[];
  renderingContributions: any;
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  textures: Record<string, any>;
  isTextureMode: boolean;
  material: any;
}

export const MaterialRenderer: React.FC<IMaterialRendererProps> = React.memo(
  ({
    meshRef,
    meshType,
    entityComponents,
    renderingContributions,
    entityColor,
    entityId,
    onMeshClick,
    onMeshDoubleClick,
    textures,
    isTextureMode,
    material,
  }) => {
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
            <GeometryRenderer meshType={meshType} entityComponents={entityComponents} />
            <meshStandardMaterial
              key={`${entityId}-${isTextureMode ? 'textured' : 'solid'}-${JSON.stringify(material)}`}
              color={isTextureMode ? '#ffffff' : (material.color ?? entityColor)}
              map={textures.albedoTexture as Texture | undefined}
              metalness={material.metalness ?? 0}
              roughness={material.roughness ?? 0.5}
              metalnessMap={textures.metallicTexture as Texture | undefined}
              roughnessMap={textures.roughnessTexture as Texture | undefined}
              normalMap={textures.normalTexture as Texture | undefined}
              normalScale={
                textures.normalTexture
                  ? [material.normalScale ?? 1, material.normalScale ?? 1]
                  : undefined
              }
              emissive={material.emissive ?? '#000000'}
              emissiveIntensity={material.emissiveIntensity ?? 0}
              emissiveMap={textures.emissiveTexture as Texture | undefined}
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
            <GeometryRenderer meshType={meshType} entityComponents={entityComponents} />
            <meshStandardMaterial
              key={`${entityId}-solid-${JSON.stringify(material)}`}
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
          castShadow={false}
          receiveShadow={false}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
        >
          <GeometryRenderer meshType={meshType} entityComponents={entityComponents} />
          <meshBasicMaterial
            key={`${entityId}-unlit-${isTextureMode ? 'textured' : 'solid'}-${JSON.stringify(material)}`}
            color={material.color ?? entityColor}
            map={isTextureMode ? (textures.albedoTexture as Texture | undefined) : undefined}
          />
        </mesh>
      );
    }
  },
);

MaterialRenderer.displayName = 'MaterialRenderer';
