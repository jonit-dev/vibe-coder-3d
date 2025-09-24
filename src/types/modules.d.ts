// Module declarations for path aliases

declare module '@core' {
  // Scene Registry
  export function defineScene<T extends Record<string, unknown>>(
    id: string,
    builder: (context: ISceneContext) => void | Promise<void>,
    metadata?: T & { name?: string; description?: string },
  ): void;
  export function loadScene(sceneId: string, clearExisting?: boolean): Promise<void>;
  export const sceneRegistry: any;

  export interface ISceneContext {
    createEntity: (name?: string, parent?: number) => number;
    addComponent: (entityId: number, componentType: string, data?: any) => void;
  }

  // Extension Points
  export function registerScript(descriptor: any): void;
  export function registerComponent(descriptor: any): void;
  export function registerSystem(descriptor: any): void;
  export function registerPrefab(descriptor: any): void;
  export function registerScene(descriptor: any): void;
  export function initializeGameProject(config: any): void;
  export function getRegisteredComponents(): any[];
  export function getRegisteredSystems(): any[];
  export function getRegisteredScripts(): any[];
  export function getRegisteredPrefabs(): any[];
  export function getRegisteredScenes(): any[];
  export function getCurrentProjectConfig(): any;

  // Assets
  export class ProjectAssetService {
    static getInstance(): ProjectAssetService;
    loadAsset(path: string): Promise<any>;
    registerAsset(id: string, asset: any): void;
    getAsset(id: string): any;
    getAssetBasePath(): string;
  }

  // Types
  export interface IGameProjectConfig {
    name: string;
    version: string;
    assetBasePath: string;
    startupScene: string;
  }

  // Other exports
  export * from '../core/index';
}

declare module '@core/*' {
  const content: any;
  export = content;
}

declare module '@game' {
  export function registerGameExtensions(): void;
  export const gameProjectConfig: any;
  export * from '../game/index';
}

declare module '@game/*' {
  const content: any;
  export = content;
}

declare module '@editor' {
  export * from '../editor/Editor';
}

declare module '@editor/*' {
  const content: any;
  export = content;
}

declare module '@/*' {
  const content: any;
  export default content;
}
