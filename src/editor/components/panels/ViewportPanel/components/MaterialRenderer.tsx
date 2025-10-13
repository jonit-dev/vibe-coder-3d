import type { ThreeEvent } from '@react-three/fiber';
import React from 'react';

import { GeometryRenderer } from './GeometryRenderer';

interface IMaterialRendererProps {
  meshInstanceRef: React.Ref<any>;
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
    meshInstanceRef,
    meshType,
    entityComponents,
    renderingContributions,
    entityColor,
    entityId,
    onMeshClick,
    onMeshDoubleClick,
    textures,
    // isTextureMode, // Not used in new material system
    material,
  }) => {
    // Use the provided material directly
    const materialDef = material;


    const isStandardShader = materialDef.shader === 'standard';

    if (isStandardShader) {
      // Standard PBR material - use single key to prevent recreation when switching between textured/solid
      return (
        <mesh
          ref={meshInstanceRef as any}
          castShadow={renderingContributions.castShadow}
          receiveShadow={renderingContributions.receiveShadow}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
        >
          <GeometryRenderer meshType={meshType} entityComponents={entityComponents} />
          <meshStandardMaterial
            key={`${entityId}-standard-${!!textures.albedoTexture}`}
            color={textures.albedoTexture ? '#ffffff' : (materialDef.color ?? entityColor)}
            map={textures.albedoTexture}
            metalness={materialDef.metalness ?? 0}
            roughness={materialDef.roughness ?? 0.7}
            metalnessMap={textures.metallicTexture as any}
            roughnessMap={textures.roughnessTexture as any}
            normalMap={textures.normalTexture as any}
            normalScale={
              textures.normalTexture
                ? [materialDef.normalScale ?? 1, materialDef.normalScale ?? 1]
                : undefined
            }
            emissive={materialDef.emissive ?? '#000000'}
            emissiveIntensity={materialDef.emissiveIntensity ?? 0}
            emissiveMap={textures.emissiveTexture as any}
            aoMap={textures.occlusionTexture as any}
            aoMapIntensity={materialDef.occlusionStrength ?? 1}
          />
        </mesh>
      );
    } else {
      // Unlit shader - use basic material
      return (
        <mesh
          ref={meshInstanceRef as any}
          castShadow={false}
          receiveShadow={false}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
        >
          <GeometryRenderer meshType={meshType} entityComponents={entityComponents} />
          <meshBasicMaterial
            key={`${entityId}-unlit`}
            color={materialDef.color ?? entityColor}
            map={materialDef.albedoTexture ? (textures.albedoTexture as any) : undefined}
          />
        </mesh>
      );
    }
  },
);

MaterialRenderer.displayName = 'MaterialRenderer';
