/**
 * Two-Way Sync Contracts - Interfaces for future pull/apply operations
 * Defines the contract for synchronizing between Editor (ECS world) and TSX scene files
 */

import { z } from 'zod';

import type { PersistentId } from '../mapping/identity';
import type { EntityId } from '../../ecs/types';

// Result schemas for sync operations
export const PullFromCodeResultSchema = z.object({
  created: z.number().min(0), // Number of entities created
  updated: z.number().min(0), // Number of entities updated
  removed: z.number().min(0), // Number of entities removed
  conflicts: z.number().min(0), // Number of conflicts encountered
  errors: z.array(z.string()).optional(), // Error messages
  warnings: z.array(z.string()).optional(), // Warning messages
  entityMappings: z.map(z.string(), z.number()).optional(), // PersistentId -> EntityId mappings
});

export const ApplyToCodeResultSchema = z.object({
  edits: z.number().min(0), // Number of AST edits made
  conflicts: z.number().min(0), // Number of conflicts encountered
  filesModified: z.array(z.string()).optional(), // List of modified file paths
  errors: z.array(z.string()).optional(), // Error messages
  warnings: z.array(z.string()).optional(), // Warning messages
  backupPaths: z.array(z.string()).optional(), // Backup file paths created
});

export const SyncStatusSchema = z.object({
  isEnabled: z.boolean(), // Whether auto-sync is enabled
  lastSync: z.string().optional(), // ISO timestamp of last sync
  pendingChanges: z.number().min(0), // Number of pending changes
  conflicts: z.number().min(0), // Number of active conflicts
  status: z.enum(['idle', 'syncing', 'error', 'conflict']), // Current sync status
  currentFile: z.string().optional(), // File currently being synced
});

// Type exports
export type PullFromCodeResult = z.infer<typeof PullFromCodeResultSchema>;
export type ApplyToCodeResult = z.infer<typeof ApplyToCodeResultSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

// Sync configuration options
export interface ISyncOptions {
  /** Whether to create backups before modifying files */
  createBackups?: boolean;
  /** Whether to auto-format code after edits */
  formatCode?: boolean;
  /** Conflict resolution strategy */
  conflictResolution?: 'manual' | 'code-wins' | 'editor-wins' | 'merge';
  /** Files to exclude from sync operations */
  excludeFiles?: string[];
  /** Maximum number of conflicts to handle in one operation */
  maxConflicts?: number;
  /** Timeout for sync operations in milliseconds */
  timeout?: number;
}

// Conflict information
export interface ISyncConflict {
  /** Unique identifier for this conflict */
  id: string;
  /** Type of conflict */
  type: 'entity-missing' | 'property-mismatch' | 'hierarchy-change' | 'duplicate-id';
  /** File path where conflict occurred */
  filePath: string;
  /** Entity persistent ID involved in conflict */
  persistentId: PersistentId;
  /** Description of the conflict */
  description: string;
  /** Current value in editor/ECS world */
  editorValue: unknown;
  /** Current value in code/TSX file */
  codeValue: unknown;
  /** Suggested resolution */
  suggestedResolution?: 'use-editor' | 'use-code' | 'manual';
  /** Timestamp when conflict was detected */
  timestamp: string;
}

// Change tracking for sync operations
export interface IChangeInfo {
  /** Type of change */
  type: 'create' | 'update' | 'delete' | 'move';
  /** Entity persistent ID */
  persistentId: PersistentId;
  /** Entity runtime ID (if loaded) */
  entityId?: EntityId;
  /** File path */
  filePath: string;
  /** Changed properties */
  changedProperties?: string[];
  /** Old values (for updates) */
  oldValues?: Record<string, unknown>;
  /** New values */
  newValues?: Record<string, unknown>;
  /** Timestamp of change */
  timestamp: string;
}

// Main two-way sync interface (placeholders for future implementation)
export interface ITwoWaySync {
  /**
   * Pull changes from TSX code files into the ECS world
   * @param filePath Optional specific file to pull from
   * @param options Sync configuration options
   */
  pullFromCode(filePath?: string, options?: ISyncOptions): Promise<PullFromCodeResult>;

  /**
   * Apply ECS world changes to TSX code files
   * @param filePath Optional specific file to apply to
   * @param options Sync configuration options
   */
  applyToCode(filePath?: string, options?: ISyncOptions): Promise<ApplyToCodeResult>;

  /**
   * Enable or disable automatic synchronization
   * @param enable Whether to enable auto-sync
   * @param interval Auto-sync interval in milliseconds (default: 5000)
   */
  enableAutoSync(enable: boolean, interval?: number): void;

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus;

  /**
   * Get list of pending changes
   */
  getPendingChanges(): IChangeInfo[];

  /**
   * Get list of active conflicts
   */
  getConflicts(): ISyncConflict[];

  /**
   * Resolve a specific conflict
   * @param conflictId Conflict identifier
   * @param resolution How to resolve the conflict
   */
  resolveConflict(
    conflictId: string,
    resolution: 'use-editor' | 'use-code' | 'manual',
    manualValue?: unknown
  ): Promise<boolean>;

  /**
   * Clear all conflicts (marks them as resolved)
   */
  clearConflicts(): void;

  /**
   * Subscribe to sync events
   */
  subscribe(listener: (event: SyncEvent) => void): () => void;

  /**
   * Start watching for file changes
   */
  startWatching(): void;

  /**
   * Stop watching for file changes
   */
  stopWatching(): void;

  /**
   * Manually trigger change detection
   */
  detectChanges(): Promise<IChangeInfo[]>;
}

// Events emitted by the sync system
export const SyncEventSchema = z.object({
  type: z.enum([
    'sync-started',
    'sync-completed',
    'sync-failed',
    'conflict-detected',
    'conflict-resolved',
    'file-changed',
    'entity-changed',
    'status-changed',
  ]),
  filePath: z.string().optional(),
  persistentId: z.string().optional(),
  entityId: z.number().optional(),
  conflictId: z.string().optional(),
  data: z.unknown().optional(),
  timestamp: z.string(),
});

export type SyncEvent = z.infer<typeof SyncEventSchema>;

// File watching interface
export interface IFileWatcher {
  /**
   * Start watching files for changes
   */
  watch(filePaths: string[]): void;

  /**
   * Stop watching files
   */
  stop(): void;

  /**
   * Subscribe to file change events
   */
  subscribe(listener: (event: IFileChangeEvent) => void): () => void;

  /**
   * Check if currently watching
   */
  isWatching(): boolean;

  /**
   * Get list of watched files
   */
  getWatchedFiles(): string[];
}

export interface IFileChangeEvent {
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  filePath: string;
  oldPath?: string; // For rename events
  timestamp: string;
}

// Error types for sync operations
export class SyncError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly filePath?: string,
    public readonly persistentId?: PersistentId
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class ConflictError extends SyncError {
  constructor(
    message: string,
    public readonly conflicts: ISyncConflict[],
    filePath?: string
  ) {
    super(message, 'CONFLICT', filePath);
    this.name = 'ConflictError';
  }
}

export class ParseError extends SyncError {
  constructor(
    message: string,
    public readonly parseErrors: string[],
    filePath?: string
  ) {
    super(message, 'PARSE_ERROR', filePath);
    this.name = 'ParseError';
  }
}

// Utility functions for sync operations
export const SyncUtils = {
  /**
   * Create a unique conflict ID
   */
  createConflictId(filePath: string, persistentId: PersistentId): string {
    return `${filePath}:${persistentId}:${Date.now()}`;
  },

  /**
   * Check if two values are equivalent for sync purposes
   */
  valuesEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => valuesEqual(item, b[index]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const aKeys = Object.keys(a as object);
      const bKeys = Object.keys(b as object);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) =>
        valuesEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
      );
    }

    return false;
  },

  /**
   * Merge sync results
   */
  mergeResults(results: PullFromCodeResult[]): PullFromCodeResult {
    return {
      created: results.reduce((sum, r) => sum + r.created, 0),
      updated: results.reduce((sum, r) => sum + r.updated, 0),
      removed: results.reduce((sum, r) => sum + r.removed, 0),
      conflicts: results.reduce((sum, r) => sum + r.conflicts, 0),
      errors: results.flatMap((r) => r.errors || []),
      warnings: results.flatMap((r) => r.warnings || []),
      entityMappings: new Map(
        results.flatMap((r) => Array.from(r.entityMappings?.entries() || []))
      ),
    };
  },

  /**
   * Create a change info object
   */
  createChangeInfo(
    type: IChangeInfo['type'],
    persistentId: PersistentId,
    filePath: string,
    additionalProps: Partial<IChangeInfo> = {}
  ): IChangeInfo {
    return {
      type,
      persistentId,
      filePath,
      timestamp: new Date().toISOString(),
      ...additionalProps,
    };
  },

  /**
   * Validate sync options
   */
  validateSyncOptions(options: ISyncOptions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (options.maxConflicts !== undefined && options.maxConflicts < 0) {
      errors.push('maxConflicts must be non-negative');
    }

    if (options.timeout !== undefined && options.timeout <= 0) {
      errors.push('timeout must be positive');
    }

    const validResolutions = ['manual', 'code-wins', 'editor-wins', 'merge'];
    if (options.conflictResolution && !validResolutions.includes(options.conflictResolution)) {
      errors.push(`conflictResolution must be one of: ${validResolutions.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  },
};