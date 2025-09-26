import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

/**
 * collision EXAMPLE
 * Generated: 2025-09-26T03:16:47.598Z
 * Version: 1
 */
export const CollisionEXAMPLE: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    const entities = [
      {
        id: '0',
        name: 'Main Camera',
        components: {
          PersistentId: {
            id: 'mg09r1ju-puh035tep',
          },
          Transform: {
            position: [0, 1, -10],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          Camera: {
            fov: 20,
            near: 0.10000000149011612,
            far: 100,
            projectionType: 'perspective',
            orthographicSize: 10,
            depth: 0,
            isMain: true,
            clearFlags: 'skybox',
            skyboxTexture: '',
            backgroundColor: {
              r: 0,
              g: 0,
              b: 0,
              a: 0,
            },
            controlMode: 'free',
            viewportRect: {
              x: 0,
              y: 0,
              width: 1,
              height: 1,
            },
            hdr: false,
            toneMapping: 'none',
            toneMappingExposure: 1,
            enablePostProcessing: false,
            postProcessingPreset: 'none',
            enableSmoothing: false,
            followTarget: 0,
            followOffset: {
              x: 0,
              y: 5,
              z: -10,
            },
            smoothingSpeed: 2,
            rotationSmoothing: 1.5,
          },
        },
      },

      {
        id: '1',
        name: 'Directional Light',
        components: {
          PersistentId: {
            id: 'mg09r1k8-xm6migmx8',
          },
          Transform: {
            position: [5, 10, 5],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          Light: {
            lightType: 'directional',
            color: {
              r: 1,
              g: 1,
              b: 1,
            },
            intensity: 0.800000011920929,
            enabled: true,
            castShadow: true,
            directionX: 0,
            directionY: -1,
            directionZ: 0,
            range: 10,
            decay: 1,
            angle: 0.5235987901687622,
            penumbra: 0.10000000149011612,
            shadowMapSize: 1024,
            shadowBias: -0.00009999999747378752,
            shadowRadius: 1,
          },
        },
      },

      {
        id: '2',
        name: 'Ambient Light',
        components: {
          PersistentId: {
            id: 'mg09r1kd-6brotsduc',
          },
          Transform: {
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          Light: {
            lightType: 'ambient',
            color: {
              r: 0.4000000059604645,
              g: 0.4000000059604645,
              b: 0.4000000059604645,
            },
            intensity: 0.5,
            enabled: true,
            castShadow: false,
            directionX: 0,
            directionY: -1,
            directionZ: 0,
            range: 10,
            decay: 1,
            angle: 0.5235987901687622,
            penumbra: 0.10000000149011612,
            shadowMapSize: 1024,
            shadowBias: -0.00009999999747378752,
            shadowRadius: 1,
          },
        },
      },

      {
        id: '3',
        name: 'Plane 0',
        components: {
          PersistentId: {
            id: 'mg09r4zq-3a92vy5o2',
          },
          Transform: {
            position: [0, 0, 0],
            rotation: [-90, 0, 0],
            scale: [10, 10, 1],
          },
          MeshRenderer: {
            meshId: 'plane',
            materialId: 'default',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            modelPath: '',
            material: {
              shader: 'standard',
              materialType: 'solid',
              color: '#3399ff',
              normalScale: 1,
              metalness: 0,
              roughness: 0.5,
              emissive: '#000000',
              emissiveIntensity: 0,
              occlusionStrength: 1,
              textureOffsetX: 0,
              textureOffsetY: 0,
            },
          },
          RigidBody: {
            enabled: true,
            bodyType: 'fixed',
            type: 'fixed',
            mass: 1,
            gravityScale: 1,
            canSleep: true,
            material: {
              friction: 0.699999988079071,
              restitution: 0.30000001192092896,
              density: 1,
            },
          },
          MeshCollider: {
            enabled: true,
            isTrigger: false,
            colliderType: 'box',
            center: [0, 0, 0],
            size: {
              width: 1,
              height: 1,
              depth: 0.10000000149011612,
              radius: 0.5,
              capsuleRadius: 0.5,
              capsuleHeight: 2,
            },
            physicsMaterial: {
              friction: 0.699999988079071,
              restitution: 0.30000001192092896,
              density: 1,
            },
          },
        },
      },

      {
        id: '4',
        name: 'Sphere 0',
        components: {
          PersistentId: {
            id: 'mg09r7u1-yrwt5v3uw',
          },
          Transform: {
            position: [0, 3, 0],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
          },
          MeshRenderer: {
            meshId: 'sphere',
            materialId: 'default',
            enabled: true,
            castShadows: true,
            receiveShadows: true,
            modelPath: '',
            material: {
              shader: 'standard',
              materialType: 'solid',
              color: '#ff3333',
              normalScale: 1,
              metalness: 0,
              roughness: 0.5,
              emissive: '#000000',
              emissiveIntensity: 0,
              occlusionStrength: 1,
              textureOffsetX: 0,
              textureOffsetY: 0,
            },
          },
          RigidBody: {
            enabled: true,
            bodyType: 'dynamic',
            type: 'dynamic',
            mass: 1,
            gravityScale: 1,
            canSleep: true,
            material: {
              friction: 0.699999988079071,
              restitution: 0.30000001192092896,
              density: 1,
            },
          },
          MeshCollider: {
            enabled: true,
            isTrigger: false,
            colliderType: 'sphere',
            center: [0, 0, 0],
            size: {
              width: 1,
              height: 1,
              depth: 1,
              radius: 0.5,
              capsuleRadius: 0.5,
              capsuleHeight: 2,
            },
            physicsMaterial: {
              friction: 0.699999988079071,
              restitution: 0.30000001192092896,
              density: 1,
            },
          },
        },
      },
    ];

    entityManager.clearEntities();

    entities.forEach((entityData) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(
      `[TsxScene] Loaded scene '${metadata?.name || 'Unknown'}' with ${entities.length} entities`,
    );
  }, [entityManager, componentManager]);

  return null;
};

export const metadata = {
  name: 'collision EXAMPLE',
  version: 1,
  timestamp: '2025-09-26T03:16:47.598Z',
};

export default CollisionEXAMPLE;
