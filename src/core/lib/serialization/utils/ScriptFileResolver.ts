// NOTE: Do not import Node modules at the top level.
// This file must be safe to load in the browser.

/**
 * Browser-compatible SHA-256 hash function
 */
async function computeHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface IResolvedScriptData {
  code: string;
  path: string;
  codeHash: string;
  lastModified: number;
}

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Best-effort path normalization that is safe in both browser and Node.
 * - '@/foo/bar' -> 'src/game/foo/bar'
 * - './foo' stays './foo' (Node branch will resolve to absolute later)
 */
function normalizeScriptPath(scriptPath: string): string {
  if (!scriptPath) return scriptPath;
  if (scriptPath.startsWith('@/')) {
    return `src/game/${scriptPath.slice(2)}`;
  }
  // Drop leading './' for consistency; leave other paths as-is
  return scriptPath.replace(/^\.\//, '');
}

/**
 * Derive scriptId from a typical scripts path (e.g. 'src/game/scripts/<id>.ts').
 * Returns null if it cannot derive a stable id.
 */
function deriveScriptIdFromPath(scriptPath: string): string | null {
  const normalized = normalizeScriptPath(scriptPath);
  // Try to find '/scripts/' segment
  const idx = normalized.lastIndexOf('/scripts/');
  const after = idx >= 0 ? normalized.substring(idx + '/scripts/'.length) : normalized;
  const basename = after.split('/').pop() || after;
  if (!basename) return null;
  // Strip extension
  const withoutExt = basename.replace(/\.(ts|tsx|js|jsx)$/i, '');
  if (!withoutExt) return null;
  return withoutExt;
}

export async function readScriptFromFilesystem(
  scriptPath: string,
): Promise<IResolvedScriptData | null> {
  const normalizedPath = normalizeScriptPath(scriptPath);

  // Browser/dev: use the Vite script API to load by script ID
  if (isBrowser) {
    try {
      const scriptId = deriveScriptIdFromPath(normalizedPath);
      if (!scriptId) {
        console.warn('[ScriptFileResolver] Could not derive scriptId from path in browser', {
          path: scriptPath,
        });
        return null;
      }

      const response = await fetch(`/api/script/load?id=${encodeURIComponent(scriptId)}`);
      if (!response.ok) {
        console.warn('[ScriptFileResolver] Script API load failed', {
          path: scriptPath,
          status: response.status,
        });
        return null;
      }
      const result = await response.json();
      if (!result?.success || typeof result.code !== 'string') {
        console.warn('[ScriptFileResolver] Invalid Script API response', { path: scriptPath });
        return null;
      }

      const code: string = result.code;
      const hash = await computeHash(code);
      const lastModifiedStr: string | undefined = result.modified;
      const lastModified = lastModifiedStr ? Date.parse(lastModifiedStr) || Date.now() : Date.now();

      return {
        code,
        path: result.path || normalizedPath,
        codeHash: hash,
        lastModified,
      };
    } catch (error) {
      console.warn('[ScriptFileResolver] Browser load failed', { path: scriptPath, error });
      return null;
    }
  }

  // Node: read from filesystem (used by scene APIs and tests)
  try {
    const nodePath = await import('node:path');
    const nodeFs = await import('node:fs/promises');

    const absolutePath = nodePath.isAbsolute(normalizedPath)
      ? normalizedPath
      : nodePath.resolve(normalizedPath);

    const code = await nodeFs.readFile(absolutePath, 'utf-8');
    const stats = await nodeFs.stat(absolutePath);
    const hash = await computeHash(code);
    const lastModified =
      typeof (stats as any).mtimeMs === 'number' && !Number.isNaN((stats as any).mtimeMs)
        ? (stats as any).mtimeMs
        : (stats.mtime?.getTime?.() ?? Date.now());

    return {
      code,
      path: absolutePath,
      codeHash: hash,
      lastModified,
    };
  } catch (error) {
    console.warn('[ScriptFileResolver] Failed to read script file (Node)', {
      path: scriptPath,
      error,
    });
    return null;
  }
}

export { normalizeScriptPath };
