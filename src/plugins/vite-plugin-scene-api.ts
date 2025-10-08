import { promises as fs } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import { Plugin } from 'vite';
import type { ITsxSceneMetadata } from '../core/lib/serialization/tsxSerializer';
import { generateTsxScene, sanitizeComponentName } from '../core/lib/serialization/tsxSerializer';

interface ISaveSceneRequest {
  name: string;
  data: unknown;
}

// Enhanced validation to prevent corrupted scene saves
const validateSceneData = (data: unknown): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Scene data must be an object' };
  }

  const scene = data as Record<string, unknown>;

  if (typeof scene.version !== 'number') {
    return { isValid: false, error: 'Scene version must be a number' };
  }

  if (!Array.isArray(scene.entities)) {
    return { isValid: false, error: 'Scene entities must be an array' };
  }

  // Enhanced validation
  try {
    const entities = scene.entities;

    // Validate scene size limits
    if (entities.length > 10000) {
      return { isValid: false, error: 'Scene too large: maximum 10,000 entities allowed' };
    }

    // Validate each entity structure
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];

      if (!entity || typeof entity !== 'object') {
        return { isValid: false, error: `Entity ${i} is not a valid object` };
      }

      if (
        typeof (entity as any).id === 'undefined' ||
        (typeof (entity as any).id !== 'string' && typeof (entity as any).id !== 'number')
      ) {
        return { isValid: false, error: `Entity ${i} missing valid id field` };
      }

      if (!(entity as any).name || typeof (entity as any).name !== 'string') {
        return { isValid: false, error: `Entity ${i} missing valid name field` };
      }

      if (!(entity as any).components || typeof (entity as any).components !== 'object') {
        return { isValid: false, error: `Entity ${i} missing valid components object` };
      }
    }

    // Validate JSON serializability
    try {
      JSON.stringify(scene);
    } catch (jsonError) {
      return {
        isValid: false,
        error: 'Scene contains non-serializable data (circular references or invalid types)',
      };
    }

    // Validate essential scene structure (warn if missing camera/lights)
    const hasCamera = entities.some((entity: any) => entity.components && entity.components.Camera);
    const hasLight = entities.some((entity: any) => entity.components && entity.components.Light);

    if (!hasCamera) {
      console.warn('[validateSceneData] Warning: Scene has no camera entities');
    }
    if (!hasLight) {
      console.warn('[validateSceneData] Warning: Scene has no light entities');
    }
  } catch (validationError) {
    return {
      isValid: false,
      error:
        'Scene validation failed: ' +
        (validationError instanceof Error ? validationError.message : 'Unknown error'),
    };
  }

  return { isValid: true };
};

interface ISceneFileInfo {
  name: string;
  modified: string;
  size: number;
}

const SCENES_DIR = './src/game/scenes';

/**
 * Logs scene API activity for development debugging
 */
const logSceneActivity = (_operation: string, _details: string) => {
  // Scene API logging disabled for production
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
      fs.mkdir(SCENES_DIR, { recursive: true })
        .then(() => {
          const absolutePath = path.resolve(SCENES_DIR);
          logSceneActivity('INIT', `Scenes directory ready at: ${absolutePath}`);
        })
        .catch(() => {});

      server.middlewares.use('/api/scene', async (req, res) => {
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
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'Internal server error',
              message: error instanceof Error ? error.message : 'Unknown error',
            }),
          );
        }
      });
    },
  };
}

/**
 * Handle POST /api/scene/save
 */
async function handleSave(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { name, data }: ISaveSceneRequest = JSON.parse(body);

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
        res.end(
          JSON.stringify({
            error: 'Invalid scene data',
            details: validation.error,
          }),
        );
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
      res.end(
        JSON.stringify({
          success: true,
          filename,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        }),
      );
    } catch (error) {
      console.error('Save scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to save scene',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  });
}

/**
 * Handle GET /api/scene/load?name=filename
 */
async function handleLoad(_req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
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
      res.end(
        JSON.stringify({
          error: 'Invalid scene file',
          details: validation.error,
        }),
      );
      return;
    }

    logSceneActivity('LOAD', `Scene '${sanitizedFilename}' loaded successfully`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        filename: sanitizedFilename,
        data: sceneData,
      }),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Scene file not found' }));
    } else {
      console.error('Load scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to load scene',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

// TSX scene generation now uses the type-safe implementation from tsxSerializer

/**
 * Handle POST /api/scene/save-tsx
 */
async function handleSaveTsx(req: IncomingMessage, res: ServerResponse): Promise<void> {
  let body = '';

  req.on('data', (chunk: Buffer) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const requestData = JSON.parse(body);
      const {
        name,
        entities,
        materials = [],
        prefabs = [],
        inputAssets = [],
        description,
        author,
      } = requestData;

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

      // Enhanced validation to prevent corrupted scene saves
      try {
        // Validate scene size limits
        if (entities.length > 10000) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Scene too large: maximum 10,000 entities allowed' }));
          return;
        }

        // Validate each entity structure
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];

          if (!entity || typeof entity !== 'object') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Entity ${i} is not a valid object` }));
            return;
          }

          if (
            typeof entity.id === 'undefined' ||
            (typeof entity.id !== 'string' && typeof entity.id !== 'number')
          ) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Entity ${i} missing valid id field` }));
            return;
          }

          if (!entity.name || typeof entity.name !== 'string') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Entity ${i} missing valid name field` }));
            return;
          }

          if (!entity.components || typeof entity.components !== 'object') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Entity ${i} missing valid components object` }));
            return;
          }
        }

        // Validate JSON serializability
        try {
          JSON.stringify(entities);
        } catch (jsonError) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              error: 'Scene contains non-serializable data (circular references or invalid types)',
            }),
          );
          return;
        }

        // Validate essential scene structure (warn if missing camera/lights)
        const hasCamera = entities.some((entity) => entity.components && entity.components.Camera);
        const hasLight = entities.some((entity) => entity.components && entity.components.Light);

        if (!hasCamera) {
          console.warn('[handleSaveTsx] Warning: Scene has no camera entities');
        }
        if (!hasLight) {
          console.warn('[handleSaveTsx] Warning: Scene has no light entities');
        }
      } catch (validationError) {
        console.error('[handleSaveTsx] Validation error:', validationError);
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error:
              'Scene validation failed: ' +
              (validationError instanceof Error ? validationError.message : 'Unknown error'),
          }),
        );
        return;
      }

      const metadata: ITsxSceneMetadata = {
        name,
        version: 1,
        timestamp: new Date().toISOString(),
        description,
        author,
      };

      // Generate TSX content with type safety
      const tsxContent = generateTsxScene(entities, metadata, materials, prefabs, inputAssets);

      const componentName =
        metadata.name
          .replace(/[^a-zA-Z0-9]/g, '')
          .replace(/^\d+/, '')
          .replace(/^./, (char) => char.toUpperCase()) || 'Scene';

      const filename = `${componentName}.tsx`;
      const filepath = path.join(SCENES_DIR, filename);

      await fs.writeFile(filepath, tsxContent, 'utf-8');

      const stats = await fs.stat(filepath);

      logSceneActivity('SAVE-TSX', `Scene '${filename}' saved (${stats.size} bytes)`);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          success: true,
          filename,
          componentName,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        }),
      );
    } catch (error) {
      console.error('Save TSX scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to save TSX scene',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  });
}

/**
 * Handle GET /api/scene/list-tsx
 */
async function handleListTsx(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const files = await fs.readdir(SCENES_DIR);
    const tsxFiles: Array<{
      name: string;
      filename: string;
      modified: string;
      size: number;
      type: string;
    }> = [];

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
            type: 'tsx',
          });
        } catch (error) {
          console.warn(`Failed to get stats for TSX file ${file}:`, error);
        }
      }
    }

    tsxFiles.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        scenes: tsxFiles,
      }),
    );
  } catch (error) {
    console.error('List TSX scenes error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Failed to list TSX scenes',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
}

/**
 * Handle GET /api/scene/load-tsx?name=filename
 */
async function handleLoadTsx(_req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
  const filename = url.searchParams.get('name');

  if (!filename) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Scene filename is required' }));
    return;
  }

  const sanitizedFilename = filename.endsWith('.tsx') ? filename : `${filename}.tsx`;
  const filepath = path.join(SCENES_DIR, sanitizedFilename);

  // Also try the sanitized component name version
  const sanitizedComponentName = sanitizeComponentName(filename.replace('.tsx', ''));
  const sanitizedComponentFilename = `${sanitizedComponentName}.tsx`;
  const sanitizedComponentFilepath = path.join(SCENES_DIR, sanitizedComponentFilename);

  try {
    let actualFilepath = filepath;
    let actualFilename = sanitizedFilename;

    try {
      // Try original filename first
      await fs.access(filepath);
    } catch {
      // If original fails, try sanitized component name version
      await fs.access(sanitizedComponentFilepath);
      actualFilepath = sanitizedComponentFilepath;
      actualFilename = sanitizedComponentFilename;
    }

    // Read TSX file
    const content = await fs.readFile(actualFilepath, 'utf-8');

    // Check if this is the new defineScene format
    const isDefineSceneFormat = content.includes('defineScene(');

    let entities = [];
    let materials = [];
    let prefabs = [];
    let inputAssets = [];
    let metadata = {};

    if (isDefineSceneFormat) {
      // New format: extract from defineScene({...})
      const defineSceneMatch = content.match(/defineScene\(\s*({[\s\S]*?})\s*\);?\s*$/m);

      if (!defineSceneMatch) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Could not extract defineScene data from TSX file',
            debugInfo: { filepath: actualFilepath, content: content.substring(0, 500) + '...' },
          }),
        );
        return;
      }

      try {
        // Parse the defineScene argument as JSON
        let sceneDataString = defineSceneMatch[1];

        // Convert to valid JSON (handle unquoted keys, single quotes, etc.)
        sceneDataString = sceneDataString.replace(
          /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
          '$1"$2":',
        );
        sceneDataString = sceneDataString.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
        sceneDataString = sceneDataString.replace(/,(\s*[}\]])/g, '$1');

        const sceneObj = JSON.parse(sceneDataString);

        entities = sceneObj.entities || [];
        materials = sceneObj.materials || [];
        prefabs = sceneObj.prefabs || [];
        inputAssets = sceneObj.inputAssets || [];
        metadata = sceneObj.metadata || {};
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Failed to parse defineScene data',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
        return;
      }
    } else {
      // Old format: extract from individual constants
      const entitiesMatch = content.match(
        /(?:export\s+)?const\s+(?:entities|sceneData)\s*(?::\s*[^=]+)?=\s*\[([\s\S]*?)\];/,
      );
      if (!entitiesMatch) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Could not extract entities from TSX file',
            debugInfo: { filepath: actualFilepath, content: content.substring(0, 500) + '...' },
          }),
        );
        return;
      }

      const metadataMatch = content.match(
        /export\s+const\s+metadata\s*(?::\s*[^=]+)?=\s*({[\s\S]*?});/,
      );
      if (metadataMatch) {
        try {
          metadata = new Function(`return ${metadataMatch[1]}`)();
        } catch (error) {
          console.warn('Failed to parse metadata from TSX file:', error);
        }
      }

      let entitiesString = entitiesMatch[1];
      try {
        entitiesString = entitiesString.replace(
          /([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g,
          '$1"$2":',
        );
        entitiesString = entitiesString.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"');
        entitiesString = entitiesString.replace(/,(\s*[}\]])/g, '$1');
        entitiesString = entitiesString.replace(/\/\/.*$/gm, '');
        entitiesString = entitiesString.replace(/console\.log\([^)]*\);?/g, '');
        entitiesString = entitiesString.replace(/,\s*$/, '');
        entities = JSON.parse(`[${entitiesString}]`);
      } catch (error) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Failed to parse entities from TSX file',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
        );
        return;
      }
    }

    // Create scene data structure
    const sceneData = {
      version: ((metadata as Record<string, unknown>)?.version as number) || 4,
      name: ((metadata as Record<string, unknown>)?.name as string) || filename.replace('.tsx', ''),
      timestamp:
        ((metadata as Record<string, unknown>)?.timestamp as string) || new Date().toISOString(),
      entities,
      materials,
      prefabs,
      inputAssets,
    };

    logSceneActivity('LOAD-TSX', `Scene '${actualFilename}' loaded successfully`);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        success: true,
        filename: sanitizedFilename,
        data: sceneData,
      }),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'TSX scene file not found' }));
    } else {
      console.error('Load TSX scene error:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Failed to load TSX scene',
          message: error instanceof Error ? error.message : 'Unknown error',
        }),
      );
    }
  }
}

/**
 * Handle GET /api/scene/list
 */
async function handleList(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const files = await fs.readdir(SCENES_DIR);
    const sceneFiles: ISceneFileInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filepath = path.join(SCENES_DIR, file);
          const stats = await fs.stat(filepath);

          sceneFiles.push({
            name: file,
            modified: stats.mtime.toISOString(),
            size: stats.size,
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
    res.end(
      JSON.stringify({
        success: true,
        scenes: sceneFiles,
      }),
    );
  } catch (error) {
    console.error('List scenes error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Failed to list scenes',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    );
  }
}
