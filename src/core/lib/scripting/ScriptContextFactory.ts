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

export interface IScriptContextFactoryOptions {
  entityId: EntityId;
  parameters: Record<string, unknown>;
  timeInfo: ITimeAPI;
  inputInfo: IInputAPI;
  meshRef?: () => THREE.Object3D | null;
  sceneRef?: () => THREE.Scene | null;
}

export class ScriptContextFactory {
  public createContext(options: IScriptContextFactoryOptions): IScriptContext {
    const { entityId, parameters, timeInfo, inputInfo, meshRef, sceneRef } = options;

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

    return {
      entity: createEntityAPI(entityId),
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
