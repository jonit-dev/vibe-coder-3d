/**
 * Vite Plugin: Script API
 * Provides CRUD endpoints for external script management during development
 */

import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Plugin } from 'vite';
import { z } from 'zod';
import { triggerLuaTranspile } from './utils/triggerLuaTranspile';

// ============================================================================
// Schemas
// ============================================================================

export const ScriptIdSchema = z
  .string()
  .min(3)
  .max(128)
  .regex(/^[a-z0-9._-]+$/i, 'Script ID must contain only alphanumeric characters, dots, dashes, and underscores');

export const SaveScriptRequestSchema = z.object({
  id: ScriptIdSchema,
  code: z.string().min(0).max(262_144, 'Script code must be less than 256KB'),
  description: z.string().max(2000).optional(),
  author: z.string().max(256).optional(),
  knownHash: z.string().optional(),
  force: z.boolean().optional(),
});

export const RenameScriptRequestSchema = z.object({
  id: ScriptIdSchema,
  newId: ScriptIdSchema,
});

export const DeleteScriptRequestSchema = z.object({
  id: ScriptIdSchema,
});

export const ValidateScriptRequestSchema = z.object({
  code: z.string().min(0).max(262_144),
});

// ============================================================================
// Types
// ============================================================================

interface IScriptInfo {
  id: string;
  filename: string;
  path: string;
  hash: string;
  modified: string;
  size: number;
}

// ============================================================================
// Utilities
// ============================================================================

const SCRIPTS_DIR = './src/game/scripts';
const MAX_FILE_SIZE = 262_144; // 256KB

/**
 * Sanitize script ID to valid filename
 */
function sanitizeFilename(id: string): string {
  return id.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
}

/**
 * Get file path from script ID
 */
function getScriptPath(id: string): string {
  const filename = `${sanitizeFilename(id)}.ts`;
  return path.join(SCRIPTS_DIR, filename);
}

/**
 * Compute SHA-256 hash of content
 */
function computeHash(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Ensure scripts directory exists
 */
async function ensureScriptsDir(): Promise<void> {
  try {
    await fs.mkdir(SCRIPTS_DIR, { recursive: true });
  } catch (error) {
    // Ignore if already exists
  }
}

/**
 * Check if path is within scripts directory (security check)
 */
function isPathSafe(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  const scriptsDir = path.normalize(SCRIPTS_DIR);
  return normalized.startsWith(scriptsDir);
}

// ============================================================================
// API Handlers
// ============================================================================

/**
 * Handle /api/script/save
 */
async function handleSave(body: unknown): Promise<any> {
  const data = SaveScriptRequestSchema.parse(body);
  const scriptPath = getScriptPath(data.id);

  // Security check
  if (!isPathSafe(scriptPath)) {
    return {
      success: false,
      error: 'Invalid script path',
    };
  }

  await ensureScriptsDir();

  // Check for conflicts if knownHash is provided
  let existingHash: string | null = null;
  try {
    const existingContent = await fs.readFile(scriptPath, 'utf-8');
    existingHash = computeHash(existingContent);

    if (data.knownHash && existingHash !== data.knownHash && !data.force) {
      // Conflict detected
      const diff = generateDiff(existingContent, data.code);
      return {
        success: false,
        error: 'hash_mismatch',
        serverHash: existingHash,
        diff,
      };
    }
  } catch (error: any) {
    // File doesn't exist yet, which is fine
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  // Write the file
  await fs.writeFile(scriptPath, data.code, 'utf-8');

  await triggerLuaTranspile('vite-plugin-script-api');

  const hash = computeHash(data.code);
  const stats = await fs.stat(scriptPath);

  return {
    success: true,
    id: data.id,
    path: scriptPath,
    hash,
    modified: stats.mtime.toISOString(),
  };
}

/**
 * Handle /api/script/load
 */
async function handleLoad(id: string): Promise<any> {
  const scriptPath = getScriptPath(id);

  // Security check
  if (!isPathSafe(scriptPath)) {
    return {
      success: false,
      error: 'Invalid script path',
    };
  }

  try {
    const code = await fs.readFile(scriptPath, 'utf-8');
    const hash = computeHash(code);
    const stats = await fs.stat(scriptPath);

    return {
      success: true,
      id,
      path: scriptPath,
      code,
      hash,
      modified: stats.mtime.toISOString(),
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'not_found',
      };
    }
    throw error;
  }
}

/**
 * Handle /api/script/list
 */
async function handleList(): Promise<any> {
  await ensureScriptsDir();

  try {
    const files = await fs.readdir(SCRIPTS_DIR);
    const scripts: IScriptInfo[] = [];

    for (const file of files) {
      if (!file.endsWith('.ts')) continue;

      const filePath = path.join(SCRIPTS_DIR, file);
      const stats = await fs.stat(filePath);

      // Skip if too large
      if (stats.size > MAX_FILE_SIZE) continue;

      const code = await fs.readFile(filePath, 'utf-8');
      const hash = computeHash(code);
      const id = file.replace(/\.ts$/, '');

      scripts.push({
        id,
        filename: file,
        path: filePath,
        hash,
        modified: stats.mtime.toISOString(),
        size: stats.size,
      });
    }

    return {
      success: true,
      scripts,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: true,
        scripts: [],
      };
    }
    throw error;
  }
}

/**
 * Handle /api/script/rename
 */
async function handleRename(body: unknown): Promise<any> {
  const data = RenameScriptRequestSchema.parse(body);
  const oldPath = getScriptPath(data.id);
  const newPath = getScriptPath(data.newId);

  // Security checks
  if (!isPathSafe(oldPath) || !isPathSafe(newPath)) {
    return {
      success: false,
      error: 'Invalid script path',
    };
  }

  try {
    // Check if old file exists
    await fs.access(oldPath);

    // Check if new file already exists
    try {
      await fs.access(newPath);
      return {
        success: false,
        error: 'exists',
      };
    } catch {
      // New path doesn't exist, which is what we want
    }

    // Rename the file
    await fs.rename(oldPath, newPath);

    const code = await fs.readFile(newPath, 'utf-8');
    const hash = computeHash(code);
    const stats = await fs.stat(newPath);

    return {
      success: true,
      id: data.newId,
      oldId: data.id,
      path: newPath,
      hash,
      modified: stats.mtime.toISOString(),
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'not_found',
      };
    }
    throw error;
  }
}

/**
 * Handle /api/script/delete
 */
async function handleDelete(body: unknown): Promise<any> {
  const data = DeleteScriptRequestSchema.parse(body);
  const scriptPath = getScriptPath(data.id);

  // Security check
  if (!isPathSafe(scriptPath)) {
    return {
      success: false,
      error: 'Invalid script path',
    };
  }

  try {
    await fs.unlink(scriptPath);
    return {
      success: true,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'not_found',
      };
    }
    throw error;
  }
}

/**
 * Handle /api/script/validate
 */
async function handleValidate(body: unknown): Promise<any> {
  const data = ValidateScriptRequestSchema.parse(body);

  const issues: Array<{ level: 'error' | 'warn'; message: string; line?: number }> = [];

  // Basic validation
  if (data.code.length > MAX_FILE_SIZE) {
    issues.push({
      level: 'error',
      message: `Script exceeds maximum size of ${MAX_FILE_SIZE} bytes`,
    });
  }

  // Check for common patterns (basic syntax validation)
  const lines = data.code.split('\n');
  let braceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;

    // Check for common issues
    if (line.includes('eval(')) {
      issues.push({
        level: 'error',
        message: 'eval() is not allowed',
        line: i + 1,
      });
    }

    if (line.includes('Function(')) {
      issues.push({
        level: 'error',
        message: 'Function constructor is not allowed',
        line: i + 1,
      });
    }
  }

  if (braceCount !== 0) {
    issues.push({
      level: 'error',
      message: 'Mismatched braces',
    });
  }

  return {
    success: true,
    issues,
  };
}

/**
 * Handle /api/script/diff
 */
async function handleDiff(id: string, clientHash: string): Promise<any> {
  const scriptPath = getScriptPath(id);

  // Security check
  if (!isPathSafe(scriptPath)) {
    return {
      success: false,
      error: 'Invalid script path',
    };
  }

  try {
    const code = await fs.readFile(scriptPath, 'utf-8');
    const serverHash = computeHash(code);
    const same = serverHash === clientHash;

    return {
      success: true,
      same,
      serverHash,
      diff: same ? undefined : `Hashes differ: client=${clientHash} server=${serverHash}`,
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {
        success: false,
        error: 'not_found',
      };
    }
    throw error;
  }
}

/**
 * Generate simple diff between two strings
 */
function generateDiff(oldContent: string, newContent: string): string {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  let diff = '--- server\n+++ client\n';

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine !== newLine) {
      if (oldLine !== undefined) {
        diff += `- ${oldLine}\n`;
      }
      if (newLine !== undefined) {
        diff += `+ ${newLine}\n`;
      }
    }
  }

  return diff;
}

// ============================================================================
// Plugin
// ============================================================================

export function vitePluginScriptAPI(): Plugin {
  return {
    name: 'vite-plugin-script-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Only handle script API routes
        if (!url.startsWith('/api/script/')) {
          return next();
        }

        try {
          let result: any;

          // Parse request body for POST requests
          const getBody = (): Promise<any> => {
            return new Promise((resolve, reject) => {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', () => {
                try {
                  resolve(JSON.parse(body));
                } catch (error) {
                  reject(new Error('Invalid JSON'));
                }
              });
              req.on('error', reject);
            });
          };

          // Route handling
          if (url.startsWith('/api/script/save') && req.method === 'POST') {
            const body = await getBody();
            result = await handleSave(body);
          } else if (url.startsWith('/api/script/load') && req.method === 'GET') {
            const urlObj = new URL(url, `http://${req.headers.host}`);
            const id = urlObj.searchParams.get('id');
            if (!id) {
              result = { success: false, error: 'Missing id parameter' };
            } else {
              result = await handleLoad(id);
            }
          } else if (url.startsWith('/api/script/list') && req.method === 'GET') {
            result = await handleList();
          } else if (url.startsWith('/api/script/rename') && req.method === 'POST') {
            const body = await getBody();
            result = await handleRename(body);
          } else if (url.startsWith('/api/script/delete') && req.method === 'POST') {
            const body = await getBody();
            result = await handleDelete(body);
          } else if (url.startsWith('/api/script/validate') && req.method === 'POST') {
            const body = await getBody();
            result = await handleValidate(body);
          } else if (url.startsWith('/api/script/diff') && req.method === 'GET') {
            const urlObj = new URL(url, `http://${req.headers.host}`);
            const id = urlObj.searchParams.get('id');
            const hash = urlObj.searchParams.get('hash');
            if (!id || !hash) {
              result = { success: false, error: 'Missing id or hash parameter' };
            } else {
              result = await handleDiff(id, hash);
            }
          } else {
            result = { success: false, error: 'Unknown endpoint' };
          }

          // Send response
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = result.success === false && result.error === 'hash_mismatch' ? 409 : 200;
          res.end(JSON.stringify(result));
        } catch (error: any) {
          console.error('[vite-plugin-script-api] Error:', error);

          // Handle validation errors
          if (error instanceof z.ZodError) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                error: 'validation_error',
                details: error.errors,
              }),
            );
            return;
          }

          // Handle other errors
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              success: false,
              error: error.message || 'Internal server error',
            }),
          );
        }
      });
    },
  };
}
