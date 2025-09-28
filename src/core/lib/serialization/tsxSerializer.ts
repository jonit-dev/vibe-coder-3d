import { promises as fs } from 'fs';
import path from 'path';
import type { IMaterialDefinition } from '@/core/materials/Material.types';

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
 * Generates a TypeScript React component from scene data with full type safety
 */
export const generateTsxScene = (
  entities: ITsxSceneEntity[],
  metadata: ITsxSceneMetadata,
  materials: IMaterialDefinition[] = [],
): string => {
  console.log('[TSXSerializer] generateTsxScene called with:', {
    entities: entities.length,
    materials: materials.length,
    materialIds: materials.map(m => m.id)
  });

  const componentName = sanitizeComponentName(metadata.name);

  const componentString = `import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';
import { MaterialRegistry } from '@/core/materials/MaterialRegistry';
import { useMaterialsStore } from '@/editor/store/materialsStore';
import { KnownComponentTypes } from '@/core/lib/ecs/IComponent';
import type {
  ComponentDataMap,
  SceneEntityData,
  SceneMetadata,
} from '@/core/types/scene';
import { validateSceneEntity } from '@/core/types/scene';

/**
 * Type-safe scene data interface
 */
interface ITypedSceneEntity {
  id: string;
  name: string;
  parentId?: string | null;
  components: {
    [K in KnownComponentTypes]?: ComponentDataMap[K];
  } & {
    [key: string]: unknown; // Allow additional components
  };
}

/**
 * Type-safe scene definition
 */
const sceneData: ITypedSceneEntity[] = ${JSON.stringify(entities, null, 2)};

/**
 * Scene materials
 */
const sceneMaterials = ${JSON.stringify(materials, null, 2)};

/**
 * Scene metadata
 */
export const metadata: SceneMetadata = ${JSON.stringify(metadata, null, 2)};

/**
 * ${metadata.name}${metadata.description ? `\n * ${metadata.description}` : ''}
 * Generated: ${metadata.timestamp}
 * Version: ${metadata.version}${metadata.author ? `\n * Author: ${metadata.author}` : ''}
 */
export const ${componentName}: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();
  const materialsStore = useMaterialsStore();

  useEffect(() => {
    // Load materials first
    const materialRegistry = MaterialRegistry.getInstance();
    materialRegistry.clearMaterials();

    sceneMaterials.forEach(material => {
      materialRegistry.upsert(material);
    });

    // Refresh materials store cache
    materialsStore._refreshMaterials();

    console.log(\`[TsxScene] Loaded \${sceneMaterials.length} materials\`);

    // Validate scene data at runtime
    const validatedSceneData = sceneData.map(entity => validateSceneEntity(entity));

    // Clear existing entities
    entityManager.clearEntities();

    // Create entities and components with type safety
    validatedSceneData.forEach((entityData: ITypedSceneEntity) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      // Type-safe component addition
      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          // Type assertion for known component types
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(\`[TsxScene] Loaded scene '\${metadata?.name || 'Unknown'}' with \${validatedSceneData.length} entities and \${sceneMaterials.length} materials\`);
  }, [entityManager, componentManager, materialsStore]);

  return null; // Scene components don't render UI
};

export default ${componentName};
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
  metadata: Partial<Omit<ITsxSceneMetadata, 'name' | 'timestamp'>> = {},
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

  const tsxContent = generateTsxScene(entities, fullMetadata, materials);

  // Ensure directory exists
  await fs.mkdir(scenesDir, { recursive: true });

  // Write file
  await fs.writeFile(filepath, tsxContent, 'utf-8');

  return { filename, filepath };
};

/**
 * Loads and executes a TSX scene file
 * Note: This requires dynamic import which works in dev but needs special handling in production
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
    // Dynamic import the scene component
    const sceneModule = await import(scenePath);

    return {
      component: sceneModule.default || sceneModule[sanitizedName],
      metadata: sceneModule.metadata,
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
 */
export const validateTsxScene = async (
  filepath: string,
): Promise<{ isValid: boolean; error?: string }> => {
  try {
    const content = await fs.readFile(filepath, 'utf-8');

    // Basic validation - check for required exports
    const hasDefaultExport = /export\s+default\s+\w+/.test(content);
    const hasMetadataExport = /export\s+const\s+metadata/.test(content);

    if (!hasDefaultExport) {
      return { isValid: false, error: 'Missing default export for scene component' };
    }

    if (!hasMetadataExport) {
      return { isValid: false, error: 'Missing metadata export' };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};
