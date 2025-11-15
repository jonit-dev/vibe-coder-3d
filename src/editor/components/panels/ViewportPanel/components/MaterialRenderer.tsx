import type { ThreeEvent } from '@react-three/fiber';
import React, { useMemo } from 'react';
import type { Object3D, Texture } from 'three';

import type { IComponent } from '@/core/lib/ecs/IComponent';
import type { IMaterialDefinition } from '@/core/materials/Material.types';

import { GeometryRenderer } from './GeometryRenderer';

interface IMaterialRendererProps {
  meshInstanceRef: React.Ref<Object3D>;
  meshType: string;
  entityComponents: IComponent[];
  renderingContributions: {
    castShadow?: boolean;
    receiveShadow?: boolean;
    visible?: boolean;
  };
  entityColor: string;
  entityId: number;
  onMeshClick: (e: ThreeEvent<MouseEvent>) => void;
  onMeshDoubleClick?: (e: ThreeEvent<MouseEvent>) => void;
  textures: Record<string, Texture | null | undefined>;
  isTextureMode: boolean;
  material: IMaterialDefinition | null;
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

    if (!materialDef) {
      return null;
    }

    const isStandardShader = materialDef.shader === 'standard';

    // Check if this geometry uses vertex colors (GeometryAsset)
    const hasVertexColors = useMemo(() => {
      return meshType === 'GeometryAsset';
    }, [meshType]);

    if (isStandardShader) {
      // Standard PBR material - use single key to prevent recreation when switching between textured/solid
      return (
        <mesh
          ref={meshInstanceRef}
          castShadow={renderingContributions.castShadow}
          receiveShadow={renderingContributions.receiveShadow}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
          frustumCulled={true}
        >
          <GeometryRenderer
            key={`geom-${entityId}-${meshType}`}
            meshType={meshType}
            entityComponents={entityComponents}
          />
          <meshStandardMaterial
            key={`${entityId}-standard-${!!textures.albedoTexture}-${hasVertexColors}`}
            color={textures.albedoTexture ? '#ffffff' : (materialDef.color ?? entityColor)}
            map={textures.albedoTexture}
            metalness={materialDef.metalness ?? 0}
            roughness={materialDef.roughness ?? 0.7}
            metalnessMap={textures.metallicTexture || undefined}
            roughnessMap={textures.roughnessTexture || undefined}
            normalMap={textures.normalTexture || undefined}
            normalScale={
              textures.normalTexture
                ? [materialDef.normalScale ?? 1, materialDef.normalScale ?? 1]
                : undefined
            }
            emissive={materialDef.emissive ?? '#000000'}
            emissiveIntensity={materialDef.emissiveIntensity ?? 0}
            emissiveMap={textures.emissiveTexture || undefined}
            aoMap={textures.occlusionTexture || undefined}
            aoMapIntensity={materialDef.occlusionStrength ?? 1}
            vertexColors={hasVertexColors}
          />
        </mesh>
      );
    } else {
      // Unlit shader - use basic material
      return (
        <mesh
          ref={meshInstanceRef}
          castShadow={false}
          receiveShadow={false}
          userData={{ entityId }}
          visible={renderingContributions.visible}
          onClick={onMeshClick}
          onDoubleClick={onMeshDoubleClick}
          frustumCulled={true}
        >
          <GeometryRenderer
            key={`geom-${entityId}-${meshType}`}
            meshType={meshType}
            entityComponents={entityComponents}
          />
          <meshBasicMaterial
            key={`${entityId}-unlit-${hasVertexColors}`}
            color={materialDef.color ?? entityColor}
            map={materialDef.albedoTexture ? textures.albedoTexture : undefined}
            vertexColors={hasVertexColors}
          />
        </mesh>
      );
    }
  },
);

MaterialRenderer.displayName = 'MaterialRenderer';
