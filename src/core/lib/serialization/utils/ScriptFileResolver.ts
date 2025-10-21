import * as fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

export interface IResolvedScriptData {
  code: string;
  path: string;
  codeHash: string;
  lastModified: number;
}

function normalizeScriptPath(scriptPath: string): string {
  if (!scriptPath) return scriptPath;
  if (path.isAbsolute(scriptPath)) return scriptPath;
  if (scriptPath.startsWith('@/')) {
    const normalized = scriptPath.replace('@/', '');
    return path.resolve('src/game', normalized);
  }
  return path.resolve(scriptPath);
}

export async function readScriptFromFilesystem(scriptPath: string): Promise<IResolvedScriptData | null> {
  const resolvedPath = normalizeScriptPath(scriptPath);

  try {
    const code = await fs.readFile(resolvedPath, 'utf-8');
    const stats = await fs.stat(resolvedPath);
    const hash = createHash('sha256').update(code, 'utf8').digest('hex');
    const lastModified =
      typeof stats.mtimeMs === 'number' && !Number.isNaN(stats.mtimeMs)
        ? stats.mtimeMs
        : stats.mtime?.getTime?.() ?? Date.now();

    return {
      code,
      path: resolvedPath,
      codeHash: hash,
      lastModified,
    };
  } catch (error) {
    console.warn('[ScriptFileResolver] Failed to read script file', {
      path: scriptPath,
      error,
    });
    return null;
  }
}

export { normalizeScriptPath };
