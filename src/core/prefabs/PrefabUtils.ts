import type { IPrefabEntity, IPrefabDefinition } from './Prefab.types';
import { Logger } from '@/core/lib/logger';

const logger = Logger.create('PrefabUtils');

/**
 * Generate a stable hash for prefab content
 */
export function generatePrefabHash(prefab: IPrefabDefinition): string {
  const content = JSON.stringify({
    root: prefab.root,
    version: prefab.version,
    dependencies: prefab.dependencies,
  });

  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(36);
}

/**
 * Validate prefab structure
 */
export function validatePrefab(prefab: IPrefabDefinition): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!prefab.id || prefab.id.trim() === '') {
    errors.push('Prefab ID is required');
  }

  if (!prefab.name || prefab.name.trim() === '') {
    errors.push('Prefab name is required');
  }

  if (!prefab.root) {
    errors.push('Prefab must have a root entity');
  }

  if (prefab.version < 1) {
    errors.push('Prefab version must be >= 1');
  }

  // Check for circular dependencies
  const deps = new Set(prefab.dependencies || []);
  if (deps.has(prefab.id)) {
    errors.push('Prefab cannot depend on itself');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Detect cycles in nested prefabs
 */
export function detectCycle(
  prefabId: string,
  getPrefab: (id: string) => IPrefabDefinition | undefined,
  visited: Set<string> = new Set(),
): boolean {
  if (visited.has(prefabId)) {
    return true; // Cycle detected
  }

  const prefab = getPrefab(prefabId);
  if (!prefab) {
    return false;
  }

  visited.add(prefabId);

  for (const depId of prefab.dependencies || []) {
    if (detectCycle(depId, getPrefab, new Set(visited))) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate max depth of nested prefab hierarchy
 */
export function calculateMaxDepth(entity: IPrefabEntity, currentDepth: number = 0): number {
  if (!entity.children || entity.children.length === 0) {
    return currentDepth;
  }

  let maxChildDepth = currentDepth;
  for (const child of entity.children) {
    const childDepth = calculateMaxDepth(child, currentDepth + 1);
    maxChildDepth = Math.max(maxChildDepth, childDepth);
  }

  return maxChildDepth;
}

/**
 * Traverse prefab entity tree
 */
export function traversePrefabEntity(
  entity: IPrefabEntity,
  callback: (entity: IPrefabEntity, depth: number) => void,
  depth: number = 0,
): void {
  callback(entity, depth);

  if (entity.children) {
    for (const child of entity.children) {
      traversePrefabEntity(child, callback, depth + 1);
    }
  }
}

/**
 * Clone prefab entity tree
 */
export function clonePrefabEntity(entity: IPrefabEntity): IPrefabEntity {
  return {
    name: entity.name,
    components: JSON.parse(JSON.stringify(entity.components)),
    children: entity.children?.map((child) => clonePrefabEntity(child)),
  };
}

/**
 * Merge two prefab entities (for variants)
 */
export function mergePrefabEntities(
  base: IPrefabEntity,
  patch: Partial<IPrefabEntity>,
): IPrefabEntity {
  return {
    name: patch.name ?? base.name,
    components: {
      ...base.components,
      ...(patch.components || {}),
    },
    children: patch.children ?? base.children,
  };
}

/**
 * Generate unique entity ID mapping for instantiation
 */
export function generateIdMapping(entity: IPrefabEntity): Map<string, number> {
  const mapping = new Map<string, number>();
  let currentId = 0;

  traversePrefabEntity(entity, () => {
    mapping.set(`prefab_${currentId}`, currentId);
    currentId++;
  });

  return mapping;
}

/**
 * Sanitize prefab ID (make it filesystem-safe)
 */
export function sanitizePrefabId(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Generate prefab file path
 */
export function generatePrefabPath(id: string, variant: boolean = false): string {
  const extension = variant ? '.variant.json' : '.prefab.json';
  return `/assets/prefabs/${sanitizePrefabId(id)}${extension}`;
}

/**
 * Check if max depth is exceeded
 */
export function isMaxDepthExceeded(entity: IPrefabEntity, maxDepth: number = 10): boolean {
  const depth = calculateMaxDepth(entity);
  if (depth > maxDepth) {
    logger.warn(`Prefab depth ${depth} exceeds maximum ${maxDepth}`);
    return true;
  }
  return false;
}
