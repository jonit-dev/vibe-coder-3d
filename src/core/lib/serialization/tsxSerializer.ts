import { promises as fs } from 'fs';
import path from 'path';

export interface ITsxSceneEntity {
  id: string | number;
  name: string;
  parentId?: string | number | null;
  components: Record<string, any>;
}

export interface ITsxSceneMetadata {
  name: string;
  description?: string;
  version: number;
  timestamp: string;
  author?: string;
}

/**
 * Generates a TypeScript React component from scene data
 */
export const generateTsxScene = (
  entities: ITsxSceneEntity[],
  metadata: ITsxSceneMetadata
): string => {
  const componentName = sanitizeComponentName(metadata.name);

  const imports = `import React from 'react';
import { useEffect } from 'react';
import { useEntityManager } from '@/editor/hooks/useEntityManager';
import { useComponentManager } from '@/editor/hooks/useComponentManager';

`;

  const metadataComment = `/**
 * ${metadata.name}${metadata.description ? `\n * ${metadata.description}` : ''}
 * Generated: ${metadata.timestamp}
 * Version: ${metadata.version}${metadata.author ? `\n * Author: ${metadata.author}` : ''}
 */`;

  const entityDefinitions = entities.map(entity => {
    const normalizedId = typeof entity.id === 'number' ? entity.id.toString() : entity.id;
    const parentId = entity.parentId ?
      (typeof entity.parentId === 'number' ? entity.parentId.toString() : entity.parentId)
      : null;

    return `  {
    id: "${normalizedId}",
    name: "${entity.name}",${parentId ? `\n    parentId: "${parentId}",` : ''}
    components: ${JSON.stringify(entity.components, null, 6).replace(/^/gm, '    ')}
  }`;
  }).join(',\n\n');

  const componentBody = `export const ${componentName}: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    // Define scene entities
    const entities = [
${entityDefinitions}
    ];

    // Clear existing entities
    entityManager.clearEntities();

    // Create entities and components
    entities.forEach((entityData) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      // Add components
      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(\`[TsxScene] Loaded scene '\${metadata.name}' with \${entities.length} entities\`);
  }, [entityManager, componentManager]);

  return null; // Scene components don't render UI
};

export const metadata: ITsxSceneMetadata = ${JSON.stringify(metadata, null, 2)};

export default ${componentName};`;

  return imports + metadataComment + '\n' + componentBody;
};

/**
 * Saves scene as a TypeScript React component file
 */
export const saveTsxScene = async (
  sceneName: string,
  entities: ITsxSceneEntity[],
  metadata: Omit<ITsxSceneMetadata, 'name' | 'timestamp'> = {}
): Promise<{ filename: string; filepath: string }> => {
  const scenesDir = './scenes';
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

  const tsxContent = generateTsxScene(entities, fullMetadata);

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
export const loadTsxScene = async (sceneName: string): Promise<{
  component: React.FC;
  metadata: ITsxSceneMetadata;
}> => {
  const sanitizedName = sanitizeComponentName(sceneName);
  const scenePath = `../../../scenes/${sanitizedName}.tsx`;

  try {
    // Dynamic import the scene component
    const sceneModule = await import(scenePath);

    return {
      component: sceneModule.default || sceneModule[sanitizedName],
      metadata: sceneModule.metadata,
    };
  } catch (error) {
    throw new Error(`Failed to load TSX scene '${sceneName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Lists available TSX scene files
 */
export const listTsxScenes = async (): Promise<Array<{
  name: string;
  filename: string;
  modified: string;
  size: number;
}>> => {
  const scenesDir = './scenes';

  try {
    const files = await fs.readdir(scenesDir);
    const tsxFiles = files.filter(file => file.endsWith('.tsx'));

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
      })
    );

    return sceneInfo.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
  } catch (error) {
    console.error('Failed to list TSX scenes:', error);
    return [];
  }
};

/**
 * Sanitizes scene name to be a valid React component name
 */
const sanitizeComponentName = (name: string): string => {
  // Remove special characters and spaces, capitalize first letter
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '') // Remove leading numbers
    .replace(/^./, char => char.toUpperCase());

  // Ensure it starts with a capital letter and has at least one character
  return sanitized || 'Scene';
};

/**
 * Validates TSX scene file structure
 */
export const validateTsxScene = async (filepath: string): Promise<{ isValid: boolean; error?: string }> => {
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
      error: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};