/**
 * Component provider that manages different component handlers
 */

import { BitEcsHandler } from '../handlers/BitEcsHandler';
import { EditorStoreHandler } from '../handlers/EditorStoreHandler';
import type { RegistryService } from '../services/RegistryService';
import type { IComponentHandler, IComponentProvider } from '../types/core';
import { ErrorLogger } from '../utils/errors';

export class ComponentProvider implements IComponentProvider {
  private handlers = new Map<string, IComponentHandler>();
  private editorStoreComponents = new Set(['rigidBody', 'meshCollider', 'meshRenderer']);

  constructor(
    private registry: RegistryService,
    private getEditorStore: () => any,
  ) {}

  /**
   * Get a component handler by ID
   */
  getHandler(componentId: string): IComponentHandler | undefined {
    // Check if handler is already cached
    if (this.handlers.has(componentId)) {
      return this.handlers.get(componentId);
    }

    // Create handler based on component type
    const handler = this.createHandler(componentId);
    if (handler) {
      this.handlers.set(componentId, handler);
    }

    return handler;
  }

  /**
   * Check if a component is supported
   */
  supports(componentId: string): boolean {
    return this.registry.has(componentId) || this.editorStoreComponents.has(componentId);
  }

  /**
   * Clear cached handlers
   */
  clearCache(): void {
    this.handlers.clear();
    ErrorLogger.debug('Component handler cache cleared');
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.handlers.size;
  }

  private createHandler(componentId: string): IComponentHandler | undefined {
    try {
      // Handle editor store components
      if (this.editorStoreComponents.has(componentId)) {
        return new EditorStoreHandler(componentId, this.getEditorStore);
      }

      // Handle BitECS components
      const descriptor = this.registry.get(componentId);
      if (descriptor) {
        return new BitEcsHandler(descriptor);
      }

      ErrorLogger.warn(`No handler available for component '${componentId}'`, {
        componentId,
      });
      return undefined;
    } catch (error) {
      ErrorLogger.error(`Failed to create handler for component '${componentId}'`, {
        componentId,
        additionalData: { error: String(error) },
      });
      return undefined;
    }
  }

  /**
   * Preload handlers for commonly used components
   */
  preloadHandlers(componentIds: string[]): void {
    for (const componentId of componentIds) {
      if (!this.handlers.has(componentId)) {
        this.getHandler(componentId);
      }
    }
    ErrorLogger.debug(`Preloaded ${componentIds.length} component handlers`);
  }

  /**
   * Get all cached handler IDs
   */
  getCachedHandlerIds(): string[] {
    return Array.from(this.handlers.keys());
  }
}
