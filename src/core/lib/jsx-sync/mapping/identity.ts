/**
 * Identity Mapping Interfaces - Manages PersistentId ↔ AST anchor ↔ EntityId mappings
 * These interfaces define how entities are mapped between ECS world and TSX code representation
 */

import { z } from 'zod';

import type { EntityId } from '../../ecs/types';

// PersistentId type for stable entity identity
export type PersistentId = string;

// AST anchor for locating elements within TSX files
export const AstAnchorSchema = z.object({
  start: z.number().min(0), // Byte offset start position in file
  end: z.number().min(0), // Byte offset end position in file
  path: z.array(z.string()), // Array of node identifiers for stable path (e.g., ['Entity', 'Transform'])
  line: z.number().min(1).optional(), // Line number for human-readable location
  column: z.number().min(0).optional(), // Column number for human-readable location
});

export type AstAnchor = z.infer<typeof AstAnchorSchema>;

// Entity binding that maps between different identity systems
export const EntityBindingSchema = z.object({
  filePath: z.string(), // Absolute path to TSX file
  persistentId: z.string(), // Stable entity identifier
  entityId: z.number().optional(), // Runtime ECS entity ID (undefined if not loaded)
  ast: AstAnchorSchema.optional(), // AST location (undefined if not parsed)
  metadata: z
    .object({
      name: z.string().optional(), // Entity name
      parentPersistentId: z.string().optional(), // Parent entity's persistent ID
      lastModified: z.string().optional(), // ISO timestamp of last modification
      hash: z.string().optional(), // Content hash for change detection
    })
    .optional(),
});

export type EntityBinding = z.infer<typeof EntityBindingSchema>;

// Core identity mapping store interface
export interface IIdentityMappingStore {
  /**
   * Bind an entity across identity systems
   */
  bind(binding: EntityBinding): void;

  /**
   * Find entity binding by persistent ID
   */
  findById(filePath: string, id: PersistentId): EntityBinding | undefined;

  /**
   * Find entity binding by runtime entity ID
   */
  findByEntityId(entityId: EntityId): EntityBinding | undefined;

  /**
   * Find entity bindings by AST location
   */
  findByAstAnchor(filePath: string, anchor: AstAnchor): EntityBinding | undefined;

  /**
   * Remove entity binding by persistent ID
   */
  removeById(filePath: string, id: PersistentId): void;

  /**
   * Clear all bindings for a specific file
   */
  clearForFile(filePath: string): void;

  /**
   * Get all bindings for a file
   */
  getFileBindings(filePath: string): EntityBinding[];

  /**
   * Update AST anchor for an existing binding
   */
  updateAstAnchor(filePath: string, id: PersistentId, anchor: AstAnchor): boolean;

  /**
   * Update runtime entity ID for an existing binding
   */
  updateEntityId(filePath: string, id: PersistentId, entityId: EntityId): boolean;

  /**
   * Validate all bindings for consistency
   */
  validate(): { errors: string[]; warnings: string[] };

  /**
   * Export bindings for persistence
   */
  export(): EntityBinding[];

  /**
   * Import bindings from persistence
   */
  import(bindings: EntityBinding[]): void;

  /**
   * Subscribe to binding changes
   */
  subscribe(listener: (event: IdentityMappingEvent) => void): () => void;
}

// Events emitted by the identity mapping store
export const IdentityMappingEventSchema = z.object({
  type: z.enum(['bind', 'update', 'remove', 'clear']),
  filePath: z.string(),
  persistentId: z.string().optional(),
  entityId: z.number().optional(),
  binding: EntityBindingSchema.optional(),
  timestamp: z.string(),
});

export type IdentityMappingEvent = z.infer<typeof IdentityMappingEventSchema>;

// File-specific identity mapping for a single TSX scene file
export interface IFileIdentityMapping {
  /** File path this mapping is for */
  readonly filePath: string;

  /** All bindings in this file */
  readonly bindings: Map<PersistentId, EntityBinding>;

  /**
   * Add or update a binding
   */
  set(binding: EntityBinding): void;

  /**
   * Get binding by persistent ID
   */
  get(id: PersistentId): EntityBinding | undefined;

  /**
   * Remove binding by persistent ID
   */
  delete(id: PersistentId): boolean;

  /**
   * Clear all bindings
   */
  clear(): void;

  /**
   * Check if binding exists
   */
  has(id: PersistentId): boolean;

  /**
   * Get all persistent IDs
   */
  keys(): IterableIterator<PersistentId>;

  /**
   * Get all bindings
   */
  values(): IterableIterator<EntityBinding>;

  /**
   * Get binding count
   */
  size(): number;

  /**
   * Find bindings by predicate
   */
  filter(predicate: (binding: EntityBinding) => boolean): EntityBinding[];

  /**
   * Update file hash for change detection
   */
  updateFileHash(hash: string): void;

  /**
   * Get file modification info
   */
  getFileInfo(): { hash?: string; lastModified?: string };
}

// Factory for creating identity mapping implementations
export interface IIdentityMappingFactory {
  /**
   * Create a new identity mapping store
   */
  createStore(): IIdentityMappingStore;

  /**
   * Create a file-specific identity mapping
   */
  createFileMapping(filePath: string): IFileIdentityMapping;

  /**
   * Create identity mapping from existing data
   */
  fromData(data: EntityBinding[]): IIdentityMappingStore;
}

// Utility functions for working with identity mappings
export const IdentityMappingUtils = {
  /**
   * Create a stable AST path for an entity element
   */
  createAstPath(entityName: string, componentNames: string[]): string[] {
    return ['Entity', entityName, ...componentNames];
  },

  /**
   * Generate content hash for change detection
   */
  hashContent(content: string): string {
    // Simple hash implementation - could be replaced with more robust solution
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  },

  /**
   * Check if two AST anchors refer to the same location
   */
  anchorsEqual(a: AstAnchor, b: AstAnchor): boolean {
    return (
      a.start === b.start &&
      a.end === b.end &&
      a.path.length === b.path.length &&
      a.path.every((segment, i) => segment === b.path[i])
    );
  },

  /**
   * Create a normalized file path for consistent mapping
   */
  normalizeFilePath(filePath: string): string {
    return filePath.replace(/\\/g, '/'); // Normalize path separators
  },

  /**
   * Validate entity binding data
   */
  validateBinding(binding: EntityBinding): { valid: boolean; errors: string[] } {
    try {
      EntityBindingSchema.parse(binding);
      const errors: string[] = [];

      // Additional validation rules
      if (binding.ast) {
        if (binding.ast.start >= binding.ast.end) {
          errors.push('AST anchor start position must be less than end position');
        }
        if (binding.ast.path.length === 0) {
          errors.push('AST anchor path cannot be empty');
        }
      }

      return { valid: errors.length === 0, errors };
    } catch (error) {
      return {
        valid: false,
        errors: [`Schema validation failed: ${error.message}`],
      };
    }
  },

  /**
   * Find conflicting bindings (same persistent ID in different files)
   */
  findConflicts(bindings: EntityBinding[]): Array<{
    persistentId: string;
    conflictingFiles: string[];
  }> {
    const idToFiles = new Map<string, Set<string>>();

    bindings.forEach((binding) => {
      if (!idToFiles.has(binding.persistentId)) {
        idToFiles.set(binding.persistentId, new Set());
      }
      idToFiles.get(binding.persistentId)!.add(binding.filePath);
    });

    const conflicts: Array<{ persistentId: string; conflictingFiles: string[] }> = [];

    idToFiles.forEach((files, persistentId) => {
      if (files.size > 1) {
        conflicts.push({
          persistentId,
          conflictingFiles: Array.from(files),
        });
      }
    });

    return conflicts;
  },
};