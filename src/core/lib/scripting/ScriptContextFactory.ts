/**
 * Script Context Factory - Creates script execution contexts
 */

import * as THREE from 'three';
import type { ITransformAccessor } from '../ecs/components/accessors/types';
import { ComponentMutationBuffer } from '../ecs/mutations/ComponentMutationBuffer';
import { EntityId } from '../ecs/types';
import {
  IInputAPI,
  IScriptContext,
  ITimeAPI,
  createConsoleAPI,
  createEntityAPI,
  createMathAPI,
} from './ScriptAPI';
import { threeJSEntityRegistry } from './ThreeJSEntityRegistry';
import { createAudioAPI } from './apis/AudioAPI';
import { createCharacterControllerAPI } from './apis/CharacterControllerAPI';
import { createComponentsAPI } from './apis/ComponentsAPI';
import { createEntitiesAPI } from './apis/EntitiesAPI';
import { createEventAPI } from './apis/EventAPI';
import { createPhysicsEventsAPI } from './apis/PhysicsEventsAPI';
import { createPrefabAPI } from './apis/PrefabAPI';
import { createQueryAPI } from './apis/QueryAPI';
import { createTimerAPI } from './apis/TimerAPI';
import { createGameObjectAPI } from './apis/GameObjectAPI';

export interface IScriptContextFactoryOptions {
  entityId: EntityId;
  parameters: Record<string, unknown>;
  timeInfo: ITimeAPI;
  inputInfo: IInputAPI;
  meshRef?: () => THREE.Object3D | null;
  sceneRef?: () => THREE.Scene | null;
  mutationBuffer: ComponentMutationBuffer;
}

export class ScriptContextFactory {
  public createContext(options: IScriptContextFactoryOptions): IScriptContext {
    const { entityId, parameters, timeInfo, inputInfo, meshRef, sceneRef, mutationBuffer } =
      options;

    // Use ThreeJSEntityRegistry for mesh and scene access, fallback to provided refs
    const getMeshRef = () => {
      const registeredObject = threeJSEntityRegistry.getEntityObject3D(entityId);
      if (registeredObject) return registeredObject;
      return meshRef ? meshRef() : null;
    };

    const getSceneRef = () => {
      const registeredScene = threeJSEntityRegistry.getEntityScene(entityId);
      if (registeredScene) return registeredScene;
      return sceneRef ? sceneRef() : null;
    };

    // Create base entity API
    const entityAPI = createEntityAPI(entityId);

    // Add direct component accessors via components proxy
    const componentsProxy = createComponentsAPI(entityId, mutationBuffer);

    // Merge direct accessors into entity API using getters
    // This allows entity.meshRenderer?.material.setColor(...) style access
    // Use getters so they're evaluated lazily when accessed
    Object.defineProperty(entityAPI, 'meshRenderer', {
      get() {
        return componentsProxy.MeshRenderer;
      },
      enumerable: true,
    });

    Object.defineProperty(entityAPI, 'camera', {
      get() {
        return componentsProxy.Camera;
      },
      enumerable: true,
    });

    Object.defineProperty(entityAPI, 'rigidBody', {
      get() {
        return componentsProxy.RigidBody;
      },
      enumerable: true,
    });

    Object.defineProperty(entityAPI, 'meshCollider', {
      get() {
        return componentsProxy.MeshCollider;
      },
      enumerable: true,
    });

    // Add physics events API if entity has RigidBody or MeshCollider
    Object.defineProperty(entityAPI, 'physicsEvents', {
      get() {
        // Only provide physics events if entity has physics components
        if (componentsProxy.RigidBody || componentsProxy.MeshCollider) {
          return createPhysicsEventsAPI(entityId);
        }
        return undefined;
      },
      enumerable: true,
    });

    // Add character controller API if entity has RigidBody
    Object.defineProperty(entityAPI, 'controller', {
      get() {
        // Only provide controller if entity has a RigidBody
        if (componentsProxy.RigidBody) {
          return createCharacterControllerAPI(entityId);
        }
        return undefined;
      },
      enumerable: true,
    });

    // Override the legacy transform API to also use the component accessor
    // This ensures all transform updates go through the mutation buffer
    Object.defineProperty(entityAPI, 'transform', {
      get() {
        const transformAccessor = componentsProxy.Transform as ITransformAccessor | undefined;
        if (!transformAccessor) {
          // Return a no-op transform API if Transform component doesn't exist
          return {
            position: [0, 0, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [1, 1, 1] as [number, number, number],
            setPosition: () => {},
            setRotation: () => {},
            setScale: () => {},
            translate: () => {},
            rotate: () => {},
            lookAt: () => {},
            forward: () => [0, 0, 1] as [number, number, number],
            right: () => [1, 0, 0] as [number, number, number],
            up: () => [0, 1, 0] as [number, number, number],
          };
        }
        // Return accessor with getter properties for position/rotation/scale
        return {
          get position() {
            return transformAccessor.get()?.position || [0, 0, 0];
          },
          get rotation() {
            // Scripts expect radians; convert stored degrees to radians for reads
            const rot = transformAccessor.get()?.rotation || [0, 0, 0];
            return [
              (rot[0] * Math.PI) / 180,
              (rot[1] * Math.PI) / 180,
              (rot[2] * Math.PI) / 180,
            ] as [number, number, number];
          },
          get scale() {
            return transformAccessor.get()?.scale || [1, 1, 1];
          },
          setPosition: transformAccessor.setPosition.bind(transformAccessor),
          // setRotation expects radians via accessor wrapper we built (it converts to degrees)
          setRotation: transformAccessor.setRotation.bind(transformAccessor),
          setScale: transformAccessor.setScale.bind(transformAccessor),
          translate: transformAccessor.translate.bind(transformAccessor),
          // rotate expects radians via accessor wrapper (it converts to degrees)
          rotate: transformAccessor.rotate.bind(transformAccessor),
          lookAt: transformAccessor.lookAt.bind(transformAccessor),
          forward: transformAccessor.forward.bind(transformAccessor),
          right: transformAccessor.right.bind(transformAccessor),
          up: transformAccessor.up.bind(transformAccessor),
        };
      },
      enumerable: true,
    });

    const entityWithComponents = entityAPI;

    return {
      entity: entityWithComponents,
      time: timeInfo,
      input: inputInfo,
      math: createMathAPI(),
      console: createConsoleAPI(entityId),
      events: createEventAPI(entityId),
      audio: createAudioAPI(entityId, getMeshRef),
      timer: createTimerAPI(entityId),
      query: createQueryAPI(entityId, getSceneRef),
      prefab: createPrefabAPI(entityId),
      entities: createEntitiesAPI(),
      gameObject: createGameObjectAPI(entityId),
      parameters,
    };
  }
}
