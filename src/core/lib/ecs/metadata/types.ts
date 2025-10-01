/**
 * Entity Metadata Types
 */

export interface IEntityMetadata {
  name: string; // Human-readable name
  guid: string; // Globally unique identifier
  created: number; // Timestamp
  modified: number; // Last modification timestamp
}

export interface IMetadataIndex {
  entityMetadata: Map<number, IEntityMetadata>; // Entity ID → Metadata
  nameIndex: Map<string, Set<number>>; // Name → Entity IDs (non-unique)
  guidIndex: Map<string, number>; // GUID → Entity ID (unique)
}
