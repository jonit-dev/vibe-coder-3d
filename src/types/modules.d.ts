// Module declarations for path aliases

declare module '@core' {
  // Scene Registry
  export function defineScene<T extends Record<string, unknown>>(
    id: string,
    builder: (context: ISceneContext) => void | Promise<void>,
    metadata?: T & { name?: string; description?: string },
  ): void;
  export function loadScene(sceneId: string, clearExisting?: boolean): Promise<void>;
  export const sceneRegistry: {
    defineScene: typeof defineScene;
    loadScene: typeof loadScene;
    getScene: (id: string) => { id: string; name: string; description?: string } | undefined;
    listScenes: () => Array<{ id: string; name: string; description?: string }>;
    getCurrentSceneId: () => string | null;
  };

  export interface ISceneContext {
    createEntity: (name?: string, parent?: number) => number;
    addComponent: <TData = unknown>(entityId: number, componentType: string, data?: TData) => void;
  }

  // Extension Points
  export function registerScript(descriptor: {
    id: string;
    onInit?: (entityId: number) => void;
    onUpdate?: (entityId: number, dt: number) => void;
    onDestroy?: (entityId: number) => void;
  }): void;
  export function registerComponent(descriptor: {
    id: string;
    schema: unknown;
    serialize: (entityId: number) => unknown;
    deserialize: (entityId: number, data: unknown) => void;
  }): void;
  export function registerSystem(descriptor: {
    id: string;
    order?: number;
    update: (dt: number) => void;
  }): void;
  export function registerPrefab(descriptor: {
    id: string;
    create: (params?: Record<string, unknown>) => number;
  }): void;
  export function registerScene(descriptor: { id: string; load: () => Promise<void> }): void;
  export function initializeGameProject(config: {
    name: string;
    version?: string;
    assetBasePath: string;
    startupScene: string;
  }): void;
  export function getRegisteredComponents(): Array<{
    id: string;
    schema: unknown;
  }>;
  export function getRegisteredSystems(): Array<{
    id: string;
    order?: number;
  }>;
  export function getRegisteredScripts(): Array<{
    id: string;
  }>;
  export function getRegisteredPrefabs(): Array<{
    id: string;
  }>;
  export function getRegisteredScenes(): Array<{
    id: string;
    load: () => Promise<void>;
  }>;
  export function getCurrentProjectConfig(): {
    name: string;
    version?: string;
    assetBasePath: string;
    startupScene: string;
  } | null;

  // Assets
  export class ProjectAssetService {
    static getInstance(): ProjectAssetService;
    loadAsset<T = unknown>(path: string): Promise<T>;
    registerAsset<T>(id: string, asset: T): void;
    getAsset<T = unknown>(id: string): T | undefined;
    getAssetBasePath(): string;
  }

  // Types
  export interface IGameProjectConfig {
    name: string;
    version?: string;
    assetBasePath: string;
    startupScene: string;
  }

  // Other exports
  export * from '../core/index';
}

declare module '@core/*' {
  const content: unknown;
  export = content;
}

declare module '@game' {
  export function registerGameExtensions(): void;
  export const gameProjectConfig: {
    name: string;
    version?: string;
    assetBasePath: string;
    startupScene: string;
  } | null;
  export * from '../game/index';
}

declare module '@game/*' {
  const content: unknown;
  export = content;
}

declare module '@editor' {
  export * from '../editor/Editor';
}

declare module '@editor/*' {
  const content: unknown;
  export = content;
}

declare module '@/*' {
  const content: unknown;
  export default content;
}
