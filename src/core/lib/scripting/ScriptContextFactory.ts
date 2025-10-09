/**
 * Script Context Factory - Creates script execution contexts
 */

import * as THREE from 'three';
import { EntityId } from '../ecs/types';
import {
  IScriptContext,
  ITimeAPI,
  IInputAPI,
  createEntityAPI,
  createMathAPI,
  createConsoleAPI,
  createThreeJSAPI,
} from './ScriptAPI';
import { threeJSEntityRegistry } from './ThreeJSEntityRegistry';
import { createAudioAPI } from './apis/AudioAPI';
import { createEntitiesAPI } from './apis/EntitiesAPI';
import { createEventAPI } from './apis/EventAPI';
import { createPrefabAPI } from './apis/PrefabAPI';
import { createQueryAPI } from './apis/QueryAPI';
import { createTimerAPI } from './apis/TimerAPI';
import { createComponentsAPI } from './apis/ComponentsAPI';
import { ComponentMutationBuffer } from '../ecs/mutations/ComponentMutationBuffer';

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
    // Future: camera, rigidBody, meshCollider, etc.

    const entityWithComponents = entityAPI;

    return {
      entity: entityWithComponents,
      time: timeInfo,
      input: inputInfo,
      math: createMathAPI(),
      console: createConsoleAPI(entityId),
      three: createThreeJSAPI(entityId, getMeshRef, getSceneRef),
      events: createEventAPI(entityId),
      audio: createAudioAPI(entityId, getMeshRef),
      timer: createTimerAPI(entityId),
      query: createQueryAPI(entityId, getSceneRef),
      prefab: createPrefabAPI(entityId),
      entities: createEntitiesAPI(),
      parameters,
    };
  }
}
