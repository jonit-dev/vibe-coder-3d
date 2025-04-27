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
}

export interface ISerializedScene {
  version: number;
  entities: ISerializedEntity[];
}

const VelocityComponentSchema = z.object({
  linear: z.tuple([z.number(), z.number(), z.number()]),
  angular: z.tuple([z.number(), z.number(), z.number()]),
  linearDamping: z.number(),
  angularDamping: z.number(),
  priority: z.number(),
});

const SerializedEntitySchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  meshType: z.nativeEnum(MeshTypeEnum),
  transform: z.object({
    position: z.tuple([z.number(), z.number(), z.number()]),
    rotation: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    scale: z.tuple([z.number(), z.number(), z.number()]),
  }),
  velocity: VelocityComponentSchema.optional(),
});

const SerializedSceneSchema = z.object({
  version: z.number(),
  entities: z.array(SerializedEntitySchema),
});

export function useSceneSerialization() {
  // Export the current ECS scene to a serializable object
  function exportScene(): ISerializedScene {
    const entities: ISerializedEntity[] = [];
    // Use the transformQuery to get only valid entities with Transform component
    const validEntities = transformQuery(world);
    for (const eid of validEntities) {
      // Only include entities that also have MeshType component
      if (MeshType.type[eid] !== undefined) {
        const name = getEntityName(eid);
        let velocity: IVelocityComponent | undefined = undefined;
        if (hasComponent(world, Velocity, eid)) {
          velocity = {
            linear: [Velocity.linear[eid][0], Velocity.linear[eid][1], Velocity.linear[eid][2]],
            angular: [Velocity.angular[eid][0], Velocity.angular[eid][1], Velocity.angular[eid][2]],
            linearDamping: Velocity.linearDamping[eid],
            angularDamping: Velocity.angularDamping[eid],
            priority: Velocity.priority[eid],
          };
        }

        // Ensure valid rotation data
        const rotation: [number, number, number, number] = [
          Transform.rotation[eid][0] || 0,
          Transform.rotation[eid][1] || 0,
          Transform.rotation[eid][2] || 0,
          Transform.rotation[eid][3] || 0,
        ];

        // Ensure valid scale data
        const scale: [number, number, number] = [
          Transform.scale[eid][0] || 1,
          Transform.scale[eid][1] || 1,
          Transform.scale[eid][2] || 1,
        ];

        entities.push({
          id: eid,
          name: name || undefined,
          meshType: MeshType.type[eid] as MeshTypeEnum,
          transform: {
            position: [
              Transform.position[eid][0],
              Transform.position[eid][1],
              Transform.position[eid][2],
            ],
            rotation,
            scale,
          },
          velocity,
        });
      }
    }
    return { version: SCENE_VERSION, entities };
  }

  // Import a scene from a serialized object
  function importScene(scene: unknown) {
    const result = SerializedSceneSchema.safeParse(scene);
    if (!result.success) {
      throw new Error('Invalid scene file: ' + JSON.stringify(result.error.format(), null, 2));
    }
    const { entities } = result.data;
    resetWorld();
    for (const entity of entities) {
      const eid = createEntity(entity.meshType);
      Transform.position[eid][0] = entity.transform.position[0];
      Transform.position[eid][1] = entity.transform.position[1];
      Transform.position[eid][2] = entity.transform.position[2];
      Transform.rotation[eid][0] = entity.transform.rotation[0];
      Transform.rotation[eid][1] = entity.transform.rotation[1];
      Transform.rotation[eid][2] = entity.transform.rotation[2];
      Transform.rotation[eid][3] = entity.transform.rotation[3];
      Transform.scale[eid][0] = entity.transform.scale[0];
      Transform.scale[eid][1] = entity.transform.scale[1];
      Transform.scale[eid][2] = entity.transform.scale[2];
      Transform.needsUpdate[eid] = 1;
      if (entity.name) setEntityName(eid, entity.name);
      if (entity.velocity) {
        addVelocity(eid, {
          linear: entity.velocity.linear,
          angular: entity.velocity.angular,
          linearDamping: entity.velocity.linearDamping,
          angularDamping: entity.velocity.angularDamping,
          priority: entity.velocity.priority,
        });
      }
    }
  }

  return { exportScene, importScene };
}
