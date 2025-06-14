import { useCallback } from 'react';

import { ICameraData } from '@/core/lib/ecs/components/CameraComponent';
import { LightData } from '@/core/lib/ecs/components/definitions/LightComponent';
import { ITransformData } from '@/core/lib/ecs/components/TransformComponent';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import { useEditorStore } from '@/editor/store/editorStore';

import { useComponentManager } from './useComponentManager';
import { useEntityData } from './useEntityData';
import { useEntityManager } from './useEntityManager';

export const useEntityCreation = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const setSelectedId = useEditorStore((state) => state.setSelectedId);
  const { getComponentData } = useEntityData();

  // Helper to get the next available number for entity naming
  const getNextNumber = useCallback(
    (baseName: string) => {
      const entities = entityManager.getAllEntities();
      const existingNames = entities.map((e) => e.name);

      let number = 0;
      while (existingNames.includes(`${baseName} ${number}`)) {
        number++;
      }
      return number;
    },
    [entityManager],
  );

  const createEntity = useCallback(
    (name: string, parentId?: number) => {
      // Create entity through ECS system
      const entity = entityManager.createEntity(name, parentId);

      // Add default Transform component
      const defaultTransform: ITransformData = {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      };

      componentManager.addComponent(entity.id, KnownComponentTypes.TRANSFORM, defaultTransform);

      // Select the newly created entity
      setSelectedId(entity.id);

      return entity;
    },
    [entityManager, componentManager, setSelectedId],
  );

  const addMeshRenderer = useCallback(
    (entityId: number, meshId: string, modelPath?: string) => {
      // Get color from old material component if it exists
      const materialData = getComponentData(entityId, 'material') as {
        color?: number[] | string;
      } | null;
      let color = '#3399ff'; // Default blue

      if (materialData?.color) {
        if (Array.isArray(materialData.color)) {
          // Convert RGB array to hex
          const [r, g, b] = materialData.color;
          color = `#${Math.round(r * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(g * 255)
            .toString(16)
            .padStart(2, '0')}${Math.round(b * 255)
            .toString(16)
            .padStart(2, '0')}`;
        } else if (typeof materialData.color === 'string') {
          color = materialData.color;
        }
      }

      // Add MeshRenderer component with proper material
      const meshRendererData = {
        meshId,
        materialId: 'default',
        enabled: true,
        castShadows: true,
        receiveShadows: true,
        modelPath: modelPath, // Add support for custom model paths
        material: {
          color,
          metalness: 0.0,
          roughness: 0.5,
          emissive: '#000000',
          emissiveIntensity: 0.0,
        },
      };

      console.log('[addMeshRenderer] Adding MeshRenderer:', { entityId, meshRendererData });

      componentManager.addComponent(entityId, KnownComponentTypes.MESH_RENDERER, meshRendererData);
    },
    [componentManager, getComponentData],
  );

  const createCube = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Cube ${getNextNumber('Cube')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'cube');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createSphere = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Sphere ${getNextNumber('Sphere')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'sphere');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createCylinder = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Cylinder ${getNextNumber('Cylinder')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'cylinder');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createCone = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Cone ${getNextNumber('Cone')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'cone');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createTorus = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Torus ${getNextNumber('Torus')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'torus');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createPlane = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Plane ${getNextNumber('Plane')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'plane');

      // Position the plane to be parallel to the floor (rotate -90 degrees on X axis)
      const transformData: ITransformData = {
        position: [0, 0, 0],
        rotation: [-90, 0, 0], // Rotate to lay flat on the floor
        scale: [10, 10, 1], // Make it larger and thinner like a ground plane
      };

      componentManager.updateComponent(entity.id, KnownComponentTypes.TRANSFORM, transformData);

      return entity;
    },
    [createEntity, addMeshRenderer, componentManager, getNextNumber],
  );

  const createWall = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Wall ${getNextNumber('Wall')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'Wall');

      // Position the wall upright (default orientation is good)
      const transformData: ITransformData = {
        position: [0, 0.5, 0], // Position at ground level (half height up)
        rotation: [0, 0, 0], // Upright wall
        scale: [1, 1, 1], // Standard scale
      };

      componentManager.updateComponent(entity.id, KnownComponentTypes.TRANSFORM, transformData);

      return entity;
    },
    [createEntity, addMeshRenderer, componentManager, getNextNumber],
  );

  const createCamera = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Camera ${getNextNumber('Camera')}`;
      const entity = createEntity(actualName, parentId);

      // Add Camera component with default Unity-like settings
      const defaultCamera: ICameraData = {
        fov: 20,
        near: 0.1,
        far: 1000,
        projectionType: 'perspective',
        orthographicSize: 10,
        depth: 0,
        isMain: false,
      };
      componentManager.addComponent(entity.id, KnownComponentTypes.CAMERA, defaultCamera);

      return entity;
    },
    [createEntity, componentManager, getNextNumber],
  );

  const createDirectionalLight = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Directional Light ${getNextNumber('Directional Light')}`;
      const entity = createEntity(actualName, parentId);

      // Add Light component with directional light defaults
      const defaultLightData: LightData = {
        lightType: 'directional',
        color: { r: 1.0, g: 1.0, b: 1.0 },
        intensity: 1.0,
        enabled: true,
        castShadow: true,
        directionX: 0.0,
        directionY: -1.0,
        directionZ: 0.0,
        shadowMapSize: 2048,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
      };
      componentManager.addComponent(entity.id, KnownComponentTypes.LIGHT, defaultLightData);

      return entity;
    },
    [createEntity, componentManager, getNextNumber],
  );

  const createPointLight = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Point Light ${getNextNumber('Point Light')}`;
      const entity = createEntity(actualName, parentId);

      // Add Light component with point light defaults
      const defaultLightData: LightData = {
        lightType: 'point',
        color: { r: 1.0, g: 1.0, b: 1.0 },
        intensity: 1.0,
        enabled: true,
        castShadow: true,
        range: 10.0,
        decay: 1.0,
        shadowMapSize: 1024,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
      };
      componentManager.addComponent(entity.id, KnownComponentTypes.LIGHT, defaultLightData);

      return entity;
    },
    [createEntity, componentManager, getNextNumber],
  );

  const createSpotLight = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Spot Light ${getNextNumber('Spot Light')}`;
      const entity = createEntity(actualName, parentId);

      // Add Light component with spot light defaults
      const defaultLightData: LightData = {
        lightType: 'spot',
        color: { r: 1.0, g: 1.0, b: 1.0 },
        intensity: 1.0,
        enabled: true,
        castShadow: true,
        range: 10.0,
        decay: 1.0,
        angle: Math.PI / 6, // 30 degrees
        penumbra: 0.1,
        shadowMapSize: 1024,
        shadowBias: -0.0001,
        shadowRadius: 1.0,
      };
      componentManager.addComponent(entity.id, KnownComponentTypes.LIGHT, defaultLightData);

      return entity;
    },
    [createEntity, componentManager, getNextNumber],
  );

  const createAmbientLight = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Ambient Light ${getNextNumber('Ambient Light')}`;
      const entity = createEntity(actualName, parentId);

      // Add Light component with ambient light defaults
      const defaultLightData: LightData = {
        lightType: 'ambient',
        color: { r: 0.4, g: 0.4, b: 0.4 },
        intensity: 0.5,
        enabled: true,
        castShadow: false,
      };
      componentManager.addComponent(entity.id, KnownComponentTypes.LIGHT, defaultLightData);

      return entity;
    },
    [createEntity, componentManager, getNextNumber],
  );

  const createTrapezoid = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Trapezoid ${getNextNumber('Trapezoid')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'trapezoid');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createOctahedron = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Octahedron ${getNextNumber('Octahedron')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'octahedron');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createPrism = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Prism ${getNextNumber('Prism')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'prism');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createPyramid = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Pyramid ${getNextNumber('Pyramid')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'pyramid');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createCapsule = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Capsule ${getNextNumber('Capsule')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'capsule');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createHelix = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Helix ${getNextNumber('Helix')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'helix');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createMobiusStrip = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Mobius Strip ${getNextNumber('Mobius Strip')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'mobiusStrip');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createDodecahedron = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Dodecahedron ${getNextNumber('Dodecahedron')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'dodecahedron');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createIcosahedron = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Icosahedron ${getNextNumber('Icosahedron')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'icosahedron');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createTetrahedron = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Tetrahedron ${getNextNumber('Tetrahedron')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'tetrahedron');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createTorusKnot = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Torus Knot ${getNextNumber('Torus Knot')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'torusKnot');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createRamp = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Ramp ${getNextNumber('Ramp')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'ramp');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createStairs = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Stairs ${getNextNumber('Stairs')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'stairs');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createSpiralStairs = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Spiral Stairs ${getNextNumber('Spiral Stairs')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'spiralStairs');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createStar = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Star ${getNextNumber('Star')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'star');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createHeart = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Heart ${getNextNumber('Heart')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'heart');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createDiamond = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Diamond ${getNextNumber('Diamond')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'diamond');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createTube = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Tube ${getNextNumber('Tube')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'tube');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createCross = useCallback(
    (name?: string, parentId?: number) => {
      const actualName = name || `Cross ${getNextNumber('Cross')}`;
      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'cross');
      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const createCustomModel = useCallback(
    (modelPath: string, name?: string, parentId?: number) => {
      // Extract filename from path for default naming
      const filename = modelPath.split('/').pop()?.split('.')[0] || 'Model';
      const actualName = name || `${filename} ${getNextNumber(filename)}`;

      console.log('[createCustomModel] Creating custom model:', { modelPath, actualName });

      const entity = createEntity(actualName, parentId);
      addMeshRenderer(entity.id, 'custom', modelPath);

      console.log('[createCustomModel] Created entity:', entity.id);

      return entity;
    },
    [createEntity, addMeshRenderer, getNextNumber],
  );

  const deleteEntity = useCallback(
    (entityId: number) => {
      // Remove all components first
      componentManager.removeComponentsForEntity(entityId);

      // Delete entity
      entityManager.deleteEntity(entityId);

      // Clear selection if this entity was selected
      const selectedId = useEditorStore.getState().selectedId;
      if (selectedId === entityId) {
        setSelectedId(null);
      }
    },
    [entityManager, componentManager, setSelectedId],
  );

  return {
    createEntity,
    createCube,
    createSphere,
    createCylinder,
    createCone,
    createTorus,
    createPlane,
    createWall,
    createCamera,
    createDirectionalLight,
    createPointLight,
    createSpotLight,
    createAmbientLight,
    createTrapezoid,
    createOctahedron,
    createPrism,
    createPyramid,
    createCapsule,
    createHelix,
    createMobiusStrip,
    createDodecahedron,
    createIcosahedron,
    createTetrahedron,
    createTorusKnot,
    createRamp,
    createStairs,
    createSpiralStairs,
    createStar,
    createHeart,
    createDiamond,
    createTube,
    createCross,
    createCustomModel,
    deleteEntity,
  };
};
