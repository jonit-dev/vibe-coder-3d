import { Plugin } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';

// Simple validation without importing TypeScript files
const validateSceneData = (data: unknown): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Scene data must be an object' };
  }

  const scene = data as any;

  if (typeof scene.version !== 'number') {
    return { isValid: false, error: 'Scene version must be a number' };
  }

  if (!Array.isArray(scene.entities)) {
    return { isValid: false, error: 'Scene entities must be an array' };
  }

  return { isValid: true };
};

interface SaveSceneRequest {
  name: string;
  data: unknown;
}

interface SceneFileInfo {
  name: string;
  modified: string;
  size: number;
}

const SCENES_DIR = './scenes';

/**
 * Logs scene API activity for development debugging
 */
const logSceneActivity = (operation: string, details: string) => {
  console.log(`🎬 [Scene API] ${operation}: ${details}`);
};

/**
 * Vite plugin to handle scene persistence via HTTP API
 * Provides endpoints: /api/scene/save, /api/scene/load, /api/scene/list
 */
export function sceneApiMiddleware(): Plugin {
  return {
    name: 'scene-api',
    configureServer(server) {
      // Ensure scenes directory exists and log location
      fs.mkdir(SCENES_DIR, { recursive: true }).then(() => {
        const absolutePath = path.resolve(SCENES_DIR);
        logSceneActivity('INIT', `Scenes directory ready at: ${absolutePath}`);
      }).catch(() => {});

      server.middlewares.use('/api/scene', async (req, res, next) => {
        try {
          const url = new URL(req.url!, `http://${req.headers.host}`);
          const pathname = url.pathname;

          // Set CORS headers
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }

          if (pathname === '/save' && req.method === 'POST') {
            await handleSave(req, res);
          } else if (pathname === '/save-tsx' && req.method === 'POST') {
            await handleSaveTsx(req, res);
          } else if (pathname === '/load' && req.method === 'GET') {
            await handleLoad(req, res, url);
          } else if (pathname === '/list' && req.method === 'GET') {
            await handleList(req, res);
          } else if (pathname === '/list-tsx' && req.method === 'GET') {
            await handleListTsx(req, res);
          } else if (pathname === '/load-tsx' && req.method === 'GET') {
            await handleLoadTsx(req, res, url);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Scene API endpoint not found' }));
          }
        } catch (error) {
          console.error('Scene API error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
          }));
        }
      });
    },
  };
}

/**
 * Handle POST /api/scene/save
 */
async function handleSave(req: any, res: any): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { name, data }: SaveSceneRequest = JSON.parse(body);

      if (!name || typeof name !== 'string') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Scene name is required' }));
        return;
      }

      // Validate scene data
      const validation = validateSceneData(data);
      if (!validation.isValid) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Invalid scene data',
          details: validation.error
        }));
        return;
      }

      // Sanitize filename
      const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
      const filename = sanitizedName.endsWith('.json') ? sanitizedName : `${sanitizedName}.json`;
      const filepath = path.join(SCENES_DIR, filename);

      // Write scene file
      await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

      // Get file stats for response
      const stats = await fs.stat(filepath);

      logSceneActivity('SAVE', `Scene '${filename}' saved (${stats.size} bytes)`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        filename,
        size: stats.size,
        modified: stats.mtime.toISOString()
      }));
    } catch (error) {
      console.error('Save scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Failed to save scene',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  });
}

/**
 * Handle GET /api/scene/load?name=filename
 */
async function handleLoad(req: any, res: any, url: URL): Promise<void> {
  const filename = url.searchParams.get('name');

  if (!filename) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Scene filename is required' }));
    return;
  }

  const sanitizedFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
  const filepath = path.join(SCENES_DIR, sanitizedFilename);

  try {
    // Check if file exists
    await fs.access(filepath);

    // Read scene file
    const content = await fs.readFile(filepath, 'utf-8');
    const sceneData = JSON.parse(content);

    // Validate scene data
    const validation = validateSceneData(sceneData);
    if (!validation.isValid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Invalid scene file',
        details: validation.error
      }));
      return;
    }

    logSceneActivity('LOAD', `Scene '${sanitizedFilename}' loaded successfully`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      filename: sanitizedFilename,
      data: sceneData
    }));
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Scene file not found' }));
    } else {
      console.error('Load scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Failed to load scene',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

/**
 * TSX Scene utilities - inline to avoid import issues
 */
const sanitizeComponentName = (name: string): string => {
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^\d+/, '')
    .replace(/^./, char => char.toUpperCase());
  return sanitized || 'Scene';
};

const generateTsxScene = (entities: any[], metadata: any): string => {
  const componentName = sanitizeComponentName(metadata.name);

  // Debug logging
  console.log('[generateTsxScene] Input entities:', entities?.length || 0);
  console.log('[generateTsxScene] First entity:', entities?.[0]);

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

    // Safely handle components serialization
    const components = entity.components || {};
    const componentsJson = JSON.stringify(components, null, 6) || '{}';

    return `  {
    id: "${normalizedId}",
    name: "${entity.name || `Entity ${normalizedId}`}",${parentId ? `\n    parentId: "${parentId}",` : ''}
    components: ${componentsJson.replace(/^/gm, '    ')}
  }`;
  }).join(',\n\n');

  return imports + metadataComment + '\n' + `export const ${componentName}: React.FC = () => {
  const entityManager = useEntityManager();
  const componentManager = useComponentManager();

  useEffect(() => {
    const entities = [
${entityDefinitions}
    ];

    entityManager.clearEntities();

    entities.forEach((entityData) => {
      const entity = entityManager.createEntity(entityData.name, entityData.parentId || null);

      Object.entries(entityData.components).forEach(([componentType, componentData]) => {
        if (componentData) {
          componentManager.addComponent(entity.id, componentType, componentData);
        }
      });
    });

    console.log(\`[TsxScene] Loaded scene '\${metadata?.name || 'Unknown'}' with \${entities.length} entities\`);
  }, [entityManager, componentManager]);

  return null;
};

export const metadata = ${JSON.stringify(metadata, null, 2)};

export default ${componentName};`;
};

/**
 * Handle POST /api/scene/save-tsx
 */
async function handleSaveTsx(req: any, res: any): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { name, entities, description, author } = JSON.parse(body);

      if (!name || typeof name !== 'string') {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Scene name is required' }));
        return;
      }

      if (!Array.isArray(entities)) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Entities array is required' }));
        return;
      }

      // Debug logging
      console.log('[handleSaveTsx] Processing entities:', entities.length);
      console.log('[handleSaveTsx] Entity structure:', entities[0] || 'No entities');

      const metadata = {
        name,
        version: 1,
        timestamp: new Date().toISOString(),
        description,
        author,
      };

      const sanitizedName = sanitizeComponentName(name);
      const filename = `${sanitizedName}.tsx`;
      const filepath = path.join(SCENES_DIR, filename);

      const tsxContent = generateTsxScene(entities, metadata);

      await fs.writeFile(filepath, tsxContent, 'utf-8');

      const stats = await fs.stat(filepath);

      logSceneActivity('SAVE-TSX', `Scene '${filename}' saved (${stats.size} bytes)`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        filename,
        componentName: sanitizedName,
        size: stats.size,
        modified: stats.mtime.toISOString()
      }));
    } catch (error) {
      console.error('Save TSX scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Failed to save TSX scene',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  });
}

/**
 * Handle GET /api/scene/list-tsx
 */
async function handleListTsx(req: any, res: any): Promise<void> {
  try {
    const files = await fs.readdir(SCENES_DIR);
    const tsxFiles: any[] = [];

    for (const file of files) {
      if (file.endsWith('.tsx')) {
        try {
          const filepath = path.join(SCENES_DIR, file);
          const stats = await fs.stat(filepath);

          tsxFiles.push({
            name: file.replace('.tsx', ''),
            filename: file,
            modified: stats.mtime.toISOString(),
            size: stats.size,
            type: 'tsx'
          });
        } catch (error) {
          console.warn(`Failed to get stats for TSX file ${file}:`, error);
        }
      }
    }

    tsxFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      scenes: tsxFiles
    }));
  } catch (error) {
    console.error('List TSX scenes error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Failed to list TSX scenes',
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}

/**
 * Handle GET /api/scene/load-tsx?name=filename
 */
async function handleLoadTsx(req: any, res: any, url: URL): Promise<void> {
  const filename = url.searchParams.get('name');

  if (!filename) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Scene filename is required' }));
    return;
  }

  const sanitizedFilename = filename.endsWith('.tsx') ? filename : `${filename}.tsx`;
  const filepath = path.join(SCENES_DIR, sanitizedFilename);

  try {
    // Check if file exists
    await fs.access(filepath);

    // Read TSX file
    const content = await fs.readFile(filepath, 'utf-8');

    // Extract entities data from TSX file using regex
    const entitiesMatch = content.match(/const entities = \[([\s\S]*?)\];/);
    if (!entitiesMatch) {
      console.log('[handleLoadTsx] Could not find entities array in file');
      console.log('[handleLoadTsx] File content preview:', content.substring(0, 500));
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Could not extract entities from TSX file' }));
      return;
    }

    console.log('[handleLoadTsx] Extracted entities string:', entitiesMatch[1].substring(0, 200) + '...');

    // Extract metadata from TSX file
    const metadataMatch = content.match(/export const metadata = ({[\s\S]*?});/);
    let metadata = {};
    if (metadataMatch) {
      try {
        // Use Function constructor to safely evaluate the metadata object
        metadata = new Function(`return ${metadataMatch[1]}`)();
      } catch (error) {
        console.warn('Failed to parse metadata from TSX file:', error);
      }
    }

    // Parse entities array safely
    let entities = [];
    try {
      // Convert the JavaScript object syntax to valid JSON
      let entitiesString = entitiesMatch[1];

      // Clean up escaped characters that were literally written in the file
      entitiesString = entitiesString.replace(/\\n/g, '\n'); // Convert literal \n to actual newlines
      entitiesString = entitiesString.replace(/\\t/g, '\t'); // Convert literal \t to actual tabs

      // Replace unquoted property names with quoted ones
      entitiesString = entitiesString.replace(/(\w+):/g, '"$1":');

      // Clean up any trailing commas
      entitiesString = entitiesString.replace(/,(\s*[}\]])/g, '$1');

      // Remove any remaining literal escape sequences
      entitiesString = entitiesString.replace(/\\"/g, '"');

      console.log('[handleLoadTsx] Cleaned entities string:', entitiesString.substring(0, 300) + '...');

      // Try to parse as JSON
      entities = JSON.parse(`[${entitiesString}]`);

      console.log('[handleLoadTsx] Successfully parsed', entities.length, 'entities');
    } catch (error) {
      console.error('[handleLoadTsx] Parse error:', error);
      console.error('[handleLoadTsx] Failed to parse string:', entitiesMatch[1].substring(0, 500));

      // Try a more aggressive cleanup approach
      try {
        let fallbackString = entitiesMatch[1];

        // Remove all escaped sequences and normalize whitespace
        fallbackString = fallbackString.replace(/\\[nt]/g, ' ');
        fallbackString = fallbackString.replace(/\s+/g, ' ');

        // Quote property names
        fallbackString = fallbackString.replace(/(\w+):/g, '"$1":');

        // Clean trailing commas
        fallbackString = fallbackString.replace(/,(\s*[}\]])/g, '$1');

        console.log('[handleLoadTsx] Trying fallback parsing...');
        entities = JSON.parse(`[${fallbackString}]`);
        console.log('[handleLoadTsx] Fallback parsing successful:', entities.length, 'entities');
      } catch (fallbackError) {
        console.error('[handleLoadTsx] Fallback parse also failed:', fallbackError);

        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Failed to parse entities from TSX file',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
        return;
      }
    }

    // Create scene data structure
    const sceneData = {
      version: (metadata as any)?.version || 4,
      name: (metadata as any)?.name || filename.replace('.tsx', ''),
      timestamp: (metadata as any)?.timestamp || new Date().toISOString(),
      entities: entities
    };

    logSceneActivity('LOAD-TSX', `Scene '${sanitizedFilename}' loaded successfully`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      filename: sanitizedFilename,
      data: sceneData
    }));
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'TSX scene file not found' }));
    } else {
      console.error('Load TSX scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: 'Failed to load TSX scene',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }
}

/**
 * Handle GET /api/scene/list
 */
async function handleList(req: any, res: any): Promise<void> {
  try {
    const files = await fs.readdir(SCENES_DIR);
    const sceneFiles: SceneFileInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(SCENES_DIR, file);
          const stats = await fs.stat(filepath);

          sceneFiles.push({
            name: file,
            modified: stats.mtime.toISOString(),
            size: stats.size
          });
        } catch (error) {
          console.warn(`Failed to get stats for scene file ${file}:`, error);
        }
      }
    }

    // Sort by modification time, newest first
    sceneFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      scenes: sceneFiles
    }));
  } catch (error) {
    console.error('List scenes error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Failed to list scenes',
      message: error instanceof Error ? error.message : 'Unknown error'
    }));
  }
}