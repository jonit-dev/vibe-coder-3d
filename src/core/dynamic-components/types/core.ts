/**
 * Core interfaces for the dynamic components system
 */

// Import core types first
import type {
  ComponentCategory,
  IComponentBatch,
  IComponentChangeEvent,
  IComponentDescriptor,
  IComponentOperationResult,
  IValidationResult,
} from '@/core/types/component-registry';

export interface IComponentHandler {
  /**
   * Handle adding a component to an entity
   */
  add(entityId: number, data?: any): Promise<void>;

  /**
   * Handle removing a component from an entity
   */
  remove(entityId: number): Promise<void>;

  /**
   * Update component data for an entity
   */
  update?(entityId: number, data: any): Promise<void>;

  /**
   * Check if entity has this component
   */
  has(entityId: number): boolean;

  /**
   * Get component data for an entity
   */
  getData?(entityId: number): any;
}

export interface IComponentProvider {
  /**
   * Get a component handler by ID
   */
  getHandler(componentId: string): IComponentHandler | undefined;

  /**
   * Check if a component is supported
   */
  supports(componentId: string): boolean;
}

export interface IValidationService {
  /**
   * Validate adding a component to an entity
   */
  validateAdd(entityId: number, componentId: string): IValidationResult;

  /**
   * Validate removing a component from an entity
   */
  validateRemove(entityId: number, componentId: string): IValidationResult;
}

export interface IDependencyService {
  /**
   * Resolve dependencies for a component
   */
  resolveDependencies(componentId: string): string[];

  /**
   * Find components that depend on this component
   */
  findDependents(componentId: string): string[];

  /**
   * Check for conflicts with existing components
   */
  checkConflicts(componentId: string, existingComponents: string[]): string[];
}

export interface IEventEmitter {
  /**
   * Emit a component change event
   */
  emit(event: IComponentChangeEvent): void;

  /**
   * Subscribe to component change events
   */
  subscribe(listener: (event: IComponentChangeEvent) => void): void;

  /**
   * Unsubscribe from component change events
   */
  unsubscribe(listener: (event: IComponentChangeEvent) => void): void;
}

// Re-export core types
export type {
  ComponentCategory,
  IComponentBatch,
  IComponentChangeEvent,
  IComponentDescriptor,
  IComponentOperationResult,
  IValidationResult,
};
