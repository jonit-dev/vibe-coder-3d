import { hasComponent } from 'bitecs';
import { z } from 'zod';

import {
  MeshType,
  MeshTypeEnum,
  Transform,
  Velocity,
  addVelocity,
  createEntity,
  getEntityName,
  resetWorld,
  setEntityName,
  transformQuery,
  world,
} from '@core/lib/ecs';

export const SCENE_VERSION = 1;

export interface IVelocityComponent {
  linear: [number, number, number];
  angular: [number, number, number];
  linearDamping: number;
  angularDamping: number;
  priority: number;
}

export interface ISerializedEntity {
  id: number;
  name?: string;
  meshType: MeshTypeEnum;
  transform: {
    position: [number, number, number];
    rotation: [number, number, number, number];
    scale: [number, number, number];
  };
  velocity?: IVelocityComponent;
  // Add more component fields as needed
}

export interface ISerializedScene {
  version: number;
  entities: ISerializedEntity[];
}

// --- Zod Schema for Scene Validation ---
const TransformSchema = z.object({
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  scale: z.tuple([z.number(), z.number(), z.number()]),
});
const VelocitySchema = z.object({
  linear: z.tuple([z.number(), z.number(), z.number()]),
  angular: z.tuple([z.number(), z.number(), z.number()]),
  linearDamping: z.number(),
  angularDamping: z.number(),
  priority: z.number(),
});
const EntitySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  meshType: z.nativeEnum(MeshTypeEnum).optional(),
  transform: TransformSchema,
  velocity: VelocitySchema.optional(),
  // TODO: Add more component schemas here as you add to the registry
});
const SceneSchema = z.object({
  version: z.number(),
  entities: z.array(EntitySchema),
});

// --- Component Registry for Generic Serialization ---
const componentRegistry = [
  {
    name: 'transform',
    component: Transform,
    serialize: (eid: number) => ({
      position: [
        Transform.position[eid][0],
        Transform.position[eid][1],
        Transform.position[eid][2],
      ],
      rotation: [
        Transform.rotation[eid][0] || 0,
        Transform.rotation[eid][1] || 0,
        Transform.rotation[eid][2] || 0,
        Transform.rotation[eid][3] || 0,
      ],
      scale: [
        Transform.scale[eid][0] || 1,
        Transform.scale[eid][1] || 1,
        Transform.scale[eid][2] || 1,
      ],
    }),
    deserialize: (eid: number, data: any) => {
      Transform.position[eid][0] = data.position[0];
      Transform.position[eid][1] = data.position[1];
      Transform.position[eid][2] = data.position[2];
      Transform.rotation[eid][0] = data.rotation[0];
      Transform.rotation[eid][1] = data.rotation[1];
      Transform.rotation[eid][2] = data.rotation[2];
      Transform.rotation[eid][3] = data.rotation[3];
      Transform.scale[eid][0] = data.scale[0];
      Transform.scale[eid][1] = data.scale[1];
      Transform.scale[eid][2] = data.scale[2];
      Transform.needsUpdate[eid] = 1;
    },
  },
  {
    name: 'meshType',
    component: MeshType,
    serialize: (eid: number) => MeshType.type[eid],
    deserialize: (eid: number, data: any) => {
      MeshType.type[eid] = data;
    },
  },
  {
    name: 'velocity',
    component: Velocity,
    serialize: (eid: number) =>
      hasComponent(world, Velocity, eid)
        ? {
            linear: [Velocity.linear[eid][0], Velocity.linear[eid][1], Velocity.linear[eid][2]],
            angular: [Velocity.angular[eid][0], Velocity.angular[eid][1], Velocity.angular[eid][2]],
            linearDamping: Velocity.linearDamping[eid],
            angularDamping: Velocity.angularDamping[eid],
            priority: Velocity.priority[eid],
          }
        : undefined,
    deserialize: (eid: number, data: any) => {
      if (!data) return;
      addVelocity(eid, {
        linear: data.linear,
        angular: data.angular,
        linearDamping: data.linearDamping,
        angularDamping: data.angularDamping,
        priority: data.priority,
      });
    },
  },
  // TODO: Add more components here as needed (e.g., materials, physics, custom components)
];

export function useSceneSerialization() {
  // Export the current ECS scene to a serializable object
  function exportScene(): ISerializedScene {
    const entities: any[] = [];
    const validEntities = transformQuery(world);
    for (const eid of validEntities) {
      const entityData: any = { id: eid };
      // Serialize all registered components
      for (const { name, component, serialize } of componentRegistry) {
        if (hasComponent(world, component, eid)) {
          const value = serialize(eid);
          if (value !== undefined) entityData[name] = value;
        }
      }
      // Name is not a required component, but nice to have
      const name = getEntityName(eid);
      if (name) entityData.name = name;
      entities.push(entityData);
    }
    return { version: SCENE_VERSION, entities };
  }

  // Import a scene from a serialized object
  function importScene(scene: any) {
    const result = SceneSchema.safeParse(scene);
    if (!result.success) {
      throw new Error('Invalid scene file: ' + JSON.stringify(result.error.format(), null, 2));
    }
    const { entities } = result.data;
    resetWorld();
    for (const entity of entities) {
      // Always create entity with meshType if present, else default
      const eid = createEntity(entity.meshType ?? MeshTypeEnum.Cube);
      for (const { name, deserialize } of componentRegistry) {
        if (entity[name] !== undefined) {
          deserialize(eid, entity[name]);
        }
      }
      if (entity.name) setEntityName(eid, entity.name);
    }
  }

  return { exportScene, importScene };
}
