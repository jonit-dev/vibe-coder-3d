import { Logger } from '@/core/lib/logger';
import { v4 as uuidv4 } from 'uuid';

import type { IEntityMetadata } from './types';

const logger = Logger.create('EntityMetadataManager');

/**
 * EntityMetadataManager - Manage entity names and GUIDs
 *
 * Features:
 * - Human-readable entity names
 * - Globally unique identifiers (GUIDs)
 * - Lookup by name or GUID
 * - Serialization support
 */
export class EntityMetadataManager {
  private static instance: EntityMetadataManager | null = null;

  private entityMetadata: Map<number, IEntityMetadata>;
  private nameIndex: Map<string, Set<number>>;
  private guidIndex: Map<string, number>;

  private constructor() {
    this.entityMetadata = new Map();
    this.nameIndex = new Map();
    this.guidIndex = new Map();
  }

  public static getInstance(): EntityMetadataManager {
    if (!EntityMetadataManager.instance) {
      EntityMetadataManager.instance = new EntityMetadataManager();
    }
    return EntityMetadataManager.instance;
  }

  /**
   * Set entity name
   */
  public setName(entityId: number, name: string): void {
    const metadata = this.ensureMetadata(entityId);
    const oldName = metadata.name;

    // Update name
    metadata.name = name;
    metadata.modified = Date.now();

    // Update name index
    if (oldName) {
      const oldNameSet = this.nameIndex.get(oldName);
      if (oldNameSet) {
        oldNameSet.delete(entityId);
        if (oldNameSet.size === 0) {
          this.nameIndex.delete(oldName);
        }
      }
    }

    if (!this.nameIndex.has(name)) {
      this.nameIndex.set(name, new Set());
    }
    this.nameIndex.get(name)!.add(entityId);

    logger.debug(`Set entity ${entityId} name to "${name}"`);
  }

  /**
   * Get entity name
   */
  public getName(entityId: number): string | null {
    const metadata = this.entityMetadata.get(entityId);
    return metadata ? metadata.name : null;
  }

  /**
   * Set entity GUID
   */
  public setGuid(entityId: number, guid: string): void {
    const metadata = this.ensureMetadata(entityId);

    // Check if GUID already exists
    const existingEntityId = this.guidIndex.get(guid);
    if (existingEntityId !== undefined && existingEntityId !== entityId) {
      logger.error(`GUID collision: ${guid} already assigned to entity ${existingEntityId}`);
      return;
    }

    // Remove old GUID
    if (metadata.guid) {
      this.guidIndex.delete(metadata.guid);
    }

    // Set new GUID
    metadata.guid = guid;
    metadata.modified = Date.now();
    this.guidIndex.set(guid, entityId);

    logger.debug(`Set entity ${entityId} GUID to ${guid}`);
  }

  /**
   * Get entity GUID
   */
  public getGuid(entityId: number): string | null {
    const metadata = this.entityMetadata.get(entityId);
    return metadata ? metadata.guid : null;
  }

  /**
   * Get full metadata for entity
   */
  public getMetadata(entityId: number): IEntityMetadata | null {
    return this.entityMetadata.get(entityId) || null;
  }

  /**
   * Generate a new GUID
   */
  public generateGuid(): string {
    return uuidv4();
  }

  /**
   * Ensure entity has GUID (create if missing)
   */
  public ensureGuid(entityId: number): string {
    const metadata = this.ensureMetadata(entityId);

    if (!metadata.guid) {
      metadata.guid = this.generateGuid();
      this.guidIndex.set(metadata.guid, entityId);
    }

    return metadata.guid;
  }

  /**
   * Find entities by name (case-sensitive)
   */
  public findByName(name: string): number[] {
    const nameSet = this.nameIndex.get(name);
    return nameSet ? Array.from(nameSet) : [];
  }

  /**
   * Find entity by GUID
   */
  public findByGuid(guid: string): number | null {
    return this.guidIndex.get(guid) ?? null;
  }

  /**
   * Create entity with metadata
   */
  public createEntity(entityId: number, name?: string): void {
    const metadata: IEntityMetadata = {
      name: name || `Entity ${entityId}`,
      guid: this.generateGuid(),
      created: Date.now(),
      modified: Date.now(),
    };

    this.entityMetadata.set(entityId, metadata);
    this.guidIndex.set(metadata.guid, entityId);

    if (!this.nameIndex.has(metadata.name)) {
      this.nameIndex.set(metadata.name, new Set());
    }
    this.nameIndex.get(metadata.name)!.add(entityId);

    logger.debug(
      `Created entity ${entityId} with name "${metadata.name}" and GUID ${metadata.guid}`,
    );
  }

  /**
   * Destroy entity and clean up metadata
   */
  public destroyEntity(entityId: number): void {
    const metadata = this.entityMetadata.get(entityId);
    if (!metadata) return;

    // Remove from name index
    const nameSet = this.nameIndex.get(metadata.name);
    if (nameSet) {
      nameSet.delete(entityId);
      if (nameSet.size === 0) {
        this.nameIndex.delete(metadata.name);
      }
    }

    // Remove from GUID index
    this.guidIndex.delete(metadata.guid);

    // Remove metadata
    this.entityMetadata.delete(entityId);

    logger.debug(`Destroyed entity ${entityId} metadata`);
  }

  /**
   * Clear all metadata (scene reset)
   */
  public clear(): void {
    this.entityMetadata.clear();
    this.nameIndex.clear();
    this.guidIndex.clear();
    logger.info('Cleared all entity metadata');
  }

  /**
   * Serialize metadata for scene saving
   */
  public serialize(): Record<number, IEntityMetadata> {
    const data: Record<number, IEntityMetadata> = {};

    for (const [entityId, metadata] of this.entityMetadata.entries()) {
      data[entityId] = { ...metadata };
    }

    return data;
  }

  /**
   * Deserialize metadata from scene loading
   */
  public deserialize(data: Record<number, IEntityMetadata>): void {
    this.clear();

    for (const [entityIdStr, metadata] of Object.entries(data)) {
      const entityId = parseInt(entityIdStr, 10);

      this.entityMetadata.set(entityId, metadata);

      // Rebuild name index
      if (!this.nameIndex.has(metadata.name)) {
        this.nameIndex.set(metadata.name, new Set());
      }
      this.nameIndex.get(metadata.name)!.add(entityId);

      // Rebuild GUID index
      this.guidIndex.set(metadata.guid, entityId);
    }

    logger.info(`Deserialized metadata for ${Object.keys(data).length} entities`);
  }

  /**
   * Ensure metadata exists for entity (create if missing)
   */
  private ensureMetadata(entityId: number): IEntityMetadata {
    let metadata = this.entityMetadata.get(entityId);

    if (!metadata) {
      this.createEntity(entityId);
      metadata = this.entityMetadata.get(entityId)!;
    }

    return metadata;
  }
}
