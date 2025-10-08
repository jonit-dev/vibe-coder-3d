import { promises as fs } from 'fs';
import path from 'path';
import type { IMaterialDefinition } from '@/core/materials/Material.types';
import type { IPrefabDefinition } from '@/core/prefabs/Prefab.types';
import type { IInputActionsAsset } from '@/core/lib/input/inputTypes';

export interface ITsxSceneEntity {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  components: Record<string, unknown>;
}

export interface ITsxSceneMetadata {
  name: string;
  description?: string;
  version: number;
  timestamp: string;
  author?: string;
}

/**
 * Generates a clean TypeScript React component from scene data
 * Uses the defineScene helper for zero boilerplate
 */
export const generateTsxScene = (
  entities: ITsxSceneEntity[],
  metadata: ITsxSceneMetadata,
  materials: IMaterialDefinition[] = [],
  prefabs: IPrefabDefinition[] = [],
  inputAssets: IInputActionsAsset[] = [],
): string => {
  const componentString = `import { defineScene } from './defineScene';

/**
 * ${metadata.name}${metadata.description ? `\n * ${metadata.description}` : ''}
 * Generated: ${metadata.timestamp}
 * Version: ${metadata.version}${metadata.author ? `\n * Author: ${metadata.author}` : ''}
 *
 * Pure data definition - all loading logic abstracted
 */
export default defineScene({
  metadata: ${JSON.stringify(metadata, null, 2)},
  entities: ${JSON.stringify(
    entities.map((entity) => {
      // For Script components with external scriptRef, only save the reference, not inline code
      if (entity.components.Script && typeof entity.components.Script === 'object') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scriptData = entity.components.Script as any;
        if (scriptData.scriptRef?.source === 'external') {
          return {
            ...entity,
            components: {
              ...entity.components,
              Script: {
                ...scriptData,
                code: '', // Clear inline code when using external script
                scriptRef: scriptData.scriptRef,
                parameters: scriptData.parameters,
                enabled: scriptData.enabled,
                executeInUpdate: scriptData.executeInUpdate,
                executeOnStart: scriptData.executeOnStart,
                executeOnEnable: scriptData.executeOnEnable,
                language: scriptData.language,
                scriptName: scriptData.scriptName,
                description: scriptData.description,
                maxExecutionTime: scriptData.maxExecutionTime,
              },
            },
          };
        }
      }
      return entity;
    }),
    null,
    2,
  )},
  materials: ${JSON.stringify(materials, null, 2)},
  prefabs: ${JSON.stringify(prefabs, null, 2)},
  inputAssets: ${JSON.stringify(inputAssets, null, 2)}
});
`;

  return componentString;
};

/**
 * Saves scene as a TypeScript React component file
 */
export const saveTsxScene = async (
  sceneName: string,
  entities: ITsxSceneEntity[],
  materials: IMaterialDefinition[] = [],
  prefabs: IPrefabDefinition[] = [],
  metadata: Partial<Omit<ITsxSceneMetadata, 'name' | 'timestamp'>> = {},
  inputAssets: IInputActionsAsset[] = [],
): Promise<{ filename: string; filepath: string }> => {
  const scenesDir = './src/game/scenes';
  const sanitizedName = sanitizeComponentName(sceneName);
  const filename = `${sanitizedName}.tsx`;
  const filepath = path.join(scenesDir, filename);

  const fullMetadata: ITsxSceneMetadata = {
    name: sceneName,
    version: metadata.version || 1,
    timestamp: new Date().toISOString(),
    description: metadata.description,
    author: metadata.author,
  };

  const tsxContent = generateTsxScene(entities, fullMetadata, materials, prefabs, inputAssets);

  // Ensure directory exists
  await fs.mkdir(scenesDir, { recursive: true });

  // Write file
  await fs.writeFile(filepath, tsxContent, 'utf-8');

  return { filename, filepath };
};

/**
 * Loads and executes a TSX scene file
 * Scene files now use defineScene, so we get back { Component, metadata, data }
 */
export const loadTsxScene = async (
  sceneName: string,
): Promise<{
  component: React.FC;
  metadata: ITsxSceneMetadata;
}> => {
  const sanitizedName = sanitizeComponentName(sceneName);
  const scenePath = `../../../src/game/scenes/${sanitizedName}.tsx`;

  try {
    // Dynamic import the scene (now returns defineScene result)
    const sceneDefinition = await import(scenePath);
    const sceneObj = sceneDefinition.default;

    return {
      component: sceneObj.Component,
      metadata: sceneObj.metadata,
    };
  } catch (error) {
    throw new Error(
      `Failed to load TSX scene '${sceneName}': ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * Lists available TSX scene files
 */
export const listTsxScenes = async (): Promise<
  Array<{
    name: string;
    filename: string;
    modified: string;
    size: number;
  }>
> => {
  const scenesDir = './src/game/scenes';

  try {
    const files = await fs.readdir(scenesDir);
    const tsxFiles = files.filter((file) => file.endsWith('.tsx'));

    const sceneInfo = await Promise.all(
      tsxFiles.map(async (file) => {
        const filepath = path.join(scenesDir, file);
        const stats = await fs.stat(filepath);
        const name = file.replace('.tsx', '');

        return {
          name,
          filename: file,
          modified: stats.mtime.toISOString(),
          size: stats.size,
        };
      }),
    );

    return sceneInfo.sort(
      (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
    );
  } catch (error) {
    console.error('Failed to list TSX scenes:', error);
    return [];
  }
};

/**
 * Sanitizes scene name to be a valid React component name
 */
export const sanitizeComponentName = (name: string): string => {
  // Remove special characters and spaces, capitalize first letter
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '') // Remove leading numbers
    .replace(/^./, (char) => char.toUpperCase());

  // Ensure it starts with a capital letter and has at least one character
  return sanitized || 'Scene';
};

/**
 * Validates TSX scene file structure
 * New format uses defineScene()
 */
export const validateTsxScene = async (
  filepath: string,
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const content = await fs.readFile(filepath, 'utf-8');

    // Check for new format (defineScene)
    const hasDefineScene = /defineScene\s*\(/.test(content);
    const hasDefaultExport = /export\s+default\s+defineScene/.test(content);

    if (!hasDefineScene || !hasDefaultExport) {
      return {
        isValid: false,
        error: 'Scene must use defineScene() helper and export it as default',
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
