import type { IResolvedScriptData } from './ScriptFileResolver';

/**
 * Script serialization utilities shared across scene serializers.
 */

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return typeof value === 'object' && value !== null;
}

/**
 * Sanitize script component data before serialization.
 * Removes large or runtime-only fields while preserving references.
 */
export function sanitizeScriptComponentData(data: RecordLike): RecordLike {
  const sanitized: RecordLike = { ...data };

  // Always drop compiled code cache – it can be regenerated.
  if ('compiledCode' in sanitized) {
    delete sanitized.compiledCode;
  }

  const scriptRef = sanitized.scriptRef;
  if (isRecord(scriptRef) && scriptRef.source === 'external') {
    if ('code' in sanitized) {
      delete sanitized.code;
    }

    const scriptId = typeof scriptRef.scriptId === 'string' ? scriptRef.scriptId : undefined;
    if (scriptId && typeof scriptRef.scriptId === 'string') {
      const sanitizeFilename = (id: string): string => id.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
      sanitized.scriptPath = `${sanitizeFilename(scriptRef.scriptId)}.lua`;
    }
  }

  return sanitized;
}

/**
 * Extract script ID for external script references.
 */
export function extractExternalScriptId(data: RecordLike): string | null {
  const scriptRef = data.scriptRef;
  if (!isRecord(scriptRef)) return null;

  const { source, scriptId } = scriptRef as { source?: unknown; scriptId?: unknown };
  if (source !== 'external') return null;
  if (typeof scriptId !== 'string' || scriptId.trim().length === 0) return null;

  return scriptId;
}

/**
 * Collect all unique external script asset references from a list of entities.
 * Returns canonical '@/scripts/<scriptId>' references sorted alphabetically.
 */
export function collectExternalScriptReferencesFromEntities<
  T extends { components?: Record<string, unknown> },
>(entities: T[]): string[] {
  const ids = new Set<string>();

  for (const entity of entities) {
    const scriptComponent = entity.components?.Script;
    if (!isRecord(scriptComponent)) continue;

    const scriptId = extractExternalScriptId(scriptComponent);
    if (scriptId) {
      ids.add(scriptId);
    }
  }

  return Array.from(ids)
    .sort()
    .map((id) => `@/scripts/${id}`);
}

export function applyResolvedScriptData(
  scriptComponent: Record<string, unknown>,
  resolved: IResolvedScriptData,
): Record<string, unknown> {
  const currentRef = scriptComponent.scriptRef;
  const scriptRef = isRecord(currentRef) ? currentRef : {};
  const scriptId = typeof scriptRef?.scriptId === 'string' ? scriptRef.scriptId : undefined;

  const sanitizeFilename = (id: string): string => id.replace(/[^a-z0-9._-]/gi, '-').toLowerCase();
  const luaPath = scriptId ? `${sanitizeFilename(scriptId)}.lua` : resolved.path;

  return {
    ...scriptComponent,
    code: resolved.code,
    scriptRef: {
      ...scriptRef,
      source: 'external',
      path: resolved.path,
      codeHash: resolved.codeHash,
      lastModified: resolved.lastModified,
    },
    scriptPath: luaPath,
  };
}
