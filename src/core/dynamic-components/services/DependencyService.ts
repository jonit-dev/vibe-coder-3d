/**
 * Service for handling component dependencies and conflicts
 */

import type { IDependencyService } from '../types/core';
import { ErrorLogger } from '../utils/errors';

import type { RegistryService } from './RegistryService';

export class DependencyService implements IDependencyService {
  constructor(private registry: RegistryService) {}

  /**
   * Resolve all dependencies for a component (recursive)
   */
  resolveDependencies(componentId: string): string[] {
    const resolved = new Set<string>();
    const toProcess = [componentId];
    const processing = new Set<string>();

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;

      // Check for circular dependencies
      if (processing.has(currentId)) {
        ErrorLogger.warn(`Circular dependency detected for component '${currentId}'`, {
          componentId: currentId,
        });
        continue;
      }

      processing.add(currentId);

      const component = this.registry.get(currentId);
      if (!component) {
        ErrorLogger.warn(`Component '${currentId}' not found while resolving dependencies`, {
          componentId: currentId,
        });
        processing.delete(currentId);
        continue;
      }

      resolved.add(currentId);

      if (component.dependencies) {
        for (const depId of component.dependencies) {
          if (!resolved.has(depId)) {
            toProcess.push(depId);
          }
        }
      }

      processing.delete(currentId);
    }

    // Remove the original component from dependencies
    resolved.delete(componentId);
    return Array.from(resolved);
  }

  /**
   * Find components that depend on the given component
   */
  findDependents(componentId: string): string[] {
    const dependents: string[] = [];

    for (const id of this.registry.getAllIds()) {
      const component = this.registry.get(id);
      if (component?.dependencies?.includes(componentId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Check for conflicts with existing components
   */
  checkConflicts(componentId: string, existingComponents: string[]): string[] {
    const component = this.registry.get(componentId);
    if (!component?.conflicts) {
      return [];
    }

    return component.conflicts.filter((conflictId) => existingComponents.includes(conflictId));
  }

  /**
   * Get missing dependencies for a component given existing components
   */
  getMissingDependencies(componentId: string, existingComponents: string[]): string[] {
    const component = this.registry.get(componentId);
    if (!component?.dependencies) {
      return [];
    }

    return component.dependencies.filter((depId) => !existingComponents.includes(depId));
  }

  /**
   * Check if dependencies can be satisfied
   */
  canSatisfyDependencies(componentId: string, availableComponents: string[] = []): boolean {
    const allComponents = [...availableComponents, ...this.registry.getAllIds()];
    const missingDeps = this.getMissingDependencies(componentId, allComponents);
    return missingDeps.length === 0;
  }

  /**
   * Get the optimal order to add components based on dependencies
   */
  getAdditionOrder(componentIds: string[]): string[] {
    const ordered: string[] = [];
    const remaining = new Set(componentIds);
    const addedComponents = new Set<string>();

    while (remaining.size > 0) {
      let addedInThisIteration = false;

      for (const componentId of remaining) {
        const dependencies = this.resolveDependencies(componentId);
        const canAdd = dependencies.every(
          (depId) => addedComponents.has(depId) || !componentIds.includes(depId),
        );

        if (canAdd) {
          ordered.push(componentId);
          addedComponents.add(componentId);
          remaining.delete(componentId);
          addedInThisIteration = true;
        }
      }

      // If we can't add any component in this iteration, we have circular dependencies
      if (!addedInThisIteration && remaining.size > 0) {
        ErrorLogger.error(
          `Cannot resolve dependency order for components: ${Array.from(remaining).join(', ')}`,
        );
        // Add remaining components in original order
        ordered.push(...Array.from(remaining));
        break;
      }
    }

    return ordered;
  }
}
