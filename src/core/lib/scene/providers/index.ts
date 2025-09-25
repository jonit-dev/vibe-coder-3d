/**
 * Scene Providers - Export all scene providers
 */

export type { ISceneProvider, ISceneLoadOptions, ISceneLoadResult } from './ISceneProvider';
export { CodeSceneProvider } from './CodeSceneProvider';
export { FileSceneProvider } from './FileSceneProvider';
export { RemoteSceneProvider, type IRemoteSceneConfig } from './RemoteSceneProvider';

// Provider factory function
export function createSceneProviders() {
  return {
    code: new CodeSceneProvider(),
    file: new FileSceneProvider(),
    // Remote provider would be created with specific config
    createRemote: (config: import('./RemoteSceneProvider').IRemoteSceneConfig) =>
      new RemoteSceneProvider(config),
  };
}