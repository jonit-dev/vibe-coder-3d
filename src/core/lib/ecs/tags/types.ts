/**
 * Tag System Types
 */

export interface ITagData {
  tags: Set<string>;
}

export interface ITagIndex {
  entityTags: Map<number, Set<string>>; // Entity ID → Tags
  tagEntities: Map<string, Set<number>>; // Tag → Entity IDs
}
