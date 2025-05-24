/**
 * Service for validating component operations
 */

import { hasComponent } from 'bitecs';

import { world } from '@/core/lib/ecs';

import type { IValidationResult, IValidationService } from '../types/core';
import { createErrorResult, createValidationResult, ErrorLogger } from '../utils/errors';

import type { DependencyService } from './DependencyService';
import type { RegistryService } from './RegistryService';

export class ValidationService implements IValidationService {
  constructor(
    private registry: RegistryService,
    private dependencyService: DependencyService,
    private getEntityComponents: (entityId: number) => string[],
  ) {}

  /**
   * Validate adding a component to an entity
   */
  validateAdd(entityId: number, componentId: string): IValidationResult {
    try {
      const component = this.registry.get(componentId);
      if (!component) {
        return createErrorResult([`Component '${componentId}' not found`]);
      }

      // Check if component already exists on entity
      if (component.component && hasComponent(world, component.component, entityId)) {
        return createErrorResult([`Entity ${entityId} already has component '${componentId}'`]);
      }

      const currentComponents = this.getEntityComponents(entityId);

      // Check for conflicts
      const conflicts = this.dependencyService.checkConflicts(componentId, currentComponents);
      if (conflicts.length > 0) {
        const conflictMessages = conflicts.map(
          (conflictId) => `Component '${componentId}' conflicts with '${conflictId}'`,
        );
        return createValidationResult(false, conflictMessages, [], [], conflicts);
      }

      // Check dependencies
      const missingDeps = this.dependencyService.getMissingDependencies(
        componentId,
        currentComponents,
      );
      const warnings = missingDeps.map((depId) => `Component '${componentId}' requires '${depId}'`);

      return createValidationResult(true, [], warnings, missingDeps);
    } catch (error) {
      ErrorLogger.error(`Validation failed for adding '${componentId}' to entity ${entityId}`, {
        componentId,
        entityId,
        operation: 'validateAdd',
        additionalData: { error: String(error) },
      });

      return createErrorResult([`Validation failed: ${String(error)}`]);
    }
  }

  /**
   * Validate removing a component from an entity
   */
  validateRemove(entityId: number, componentId: string): IValidationResult {
    try {
      const component = this.registry.get(componentId);
      if (!component) {
        return createErrorResult([`Component '${componentId}' not found`]);
      }

      // Check if component exists on entity
      if (component.component && !hasComponent(world, component.component, entityId)) {
        return createErrorResult([`Entity ${entityId} does not have component '${componentId}'`]);
      }

      // Check if this component is required by other components
      const currentComponents = this.getEntityComponents(entityId);
      const dependents = this.dependencyService
        .findDependents(componentId)
        .filter((depId) => currentComponents.includes(depId));

      if (dependents.length > 0) {
        const dependentMessages = dependents.map(
          (depId) => `Cannot remove component '${componentId}' because '${depId}' depends on it`,
        );
        return createErrorResult(dependentMessages);
      }

      return createValidationResult(true);
    } catch (error) {
      ErrorLogger.error(`Validation failed for removing '${componentId}' from entity ${entityId}`, {
        componentId,
        entityId,
        operation: 'validateRemove',
        additionalData: { error: String(error) },
      });

      return createErrorResult([`Validation failed: ${String(error)}`]);
    }
  }

  /**
   * Validate updating component data
   */
  validateUpdate(entityId: number, componentId: string, data: any): IValidationResult {
    try {
      const component = this.registry.get(componentId);
      if (!component) {
        return createErrorResult([`Component '${componentId}' not found`]);
      }

      // Check if component exists on entity
      if (component.component && !hasComponent(world, component.component, entityId)) {
        return createErrorResult([`Entity ${entityId} does not have component '${componentId}'`]);
      }

      // Validate data against schema
      const schemaValidation = component.schema.safeParse(data);
      if (!schemaValidation.success) {
        const errors = schemaValidation.error.issues.map(
          (issue) =>
            `Invalid data for '${componentId}': ${issue.message} at ${issue.path.join('.')}`,
        );
        return createErrorResult(errors);
      }

      return createValidationResult(true);
    } catch (error) {
      ErrorLogger.error(`Validation failed for updating '${componentId}' on entity ${entityId}`, {
        componentId,
        entityId,
        operation: 'validateUpdate',
        additionalData: { error: String(error) },
      });

      return createErrorResult([`Validation failed: ${String(error)}`]);
    }
  }

  /**
   * Validate a batch of component operations
   */
  validateBatch(
    entityId: number,
    operations: Array<{ type: 'add' | 'remove' | 'update'; componentId: string; data?: any }>,
  ): IValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const operation of operations) {
      let result: IValidationResult;

      switch (operation.type) {
        case 'add':
          result = this.validateAdd(entityId, operation.componentId);
          break;
        case 'remove':
          result = this.validateRemove(entityId, operation.componentId);
          break;
        case 'update':
          result = this.validateUpdate(entityId, operation.componentId, operation.data);
          break;
        default:
          result = createErrorResult([`Unknown operation type: ${(operation as any).type}`]);
      }

      if (!result.valid) {
        allErrors.push(...result.errors);
      }
      allWarnings.push(...(result.warnings || []));
    }

    return createValidationResult(allErrors.length === 0, allErrors, allWarnings);
  }
}
