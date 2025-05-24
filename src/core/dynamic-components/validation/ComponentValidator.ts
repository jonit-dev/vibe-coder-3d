import { hasComponent } from 'bitecs';

import { world } from '@/core/lib/ecs';

import { IComponentDescriptor, IValidationResult } from '../types';

export class ComponentValidator {
  static validateComponentAddition(
    entityId: number,
    componentId: string,
    descriptor: IComponentDescriptor,
    currentComponents: string[],
  ): IValidationResult {
    const result: IValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      conflicts: [],
    };

    // Check if component is already present
    if (descriptor.component && hasComponent(world, descriptor.component, entityId)) {
      result.valid = false;
      result.errors.push(`Entity ${entityId} already has component '${componentId}'`);
      return result;
    }

    // Check dependencies
    if (descriptor.dependencies) {
      for (const depId of descriptor.dependencies) {
        if (!currentComponents.includes(depId)) {
          result.missingDependencies?.push(depId);
          result.warnings.push(`Component '${componentId}' requires '${depId}'`);
        }
      }
    }

    // Check conflicts
    if (descriptor.conflicts) {
      for (const conflictId of descriptor.conflicts) {
        if (currentComponents.includes(conflictId)) {
          result.valid = false;
          result.conflicts?.push(conflictId);
          result.errors.push(`Component '${componentId}' conflicts with '${conflictId}'`);
        }
      }
    }

    return result;
  }

  static validateComponentRemoval(
    entityId: number,
    componentId: string,
    descriptor: IComponentDescriptor,
    _currentComponents: string[],
    dependentComponents: string[],
  ): IValidationResult {
    const result: IValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    };

    // Check if component exists
    if (descriptor.component && !hasComponent(world, descriptor.component, entityId)) {
      result.valid = false;
      result.errors.push(`Entity ${entityId} does not have component '${componentId}'`);
      return result;
    }

    // Check if removing this component would break dependencies
    if (dependentComponents.length > 0) {
      result.valid = false;
      result.errors.push(
        `Cannot remove component '${componentId}' because these components depend on it: ${dependentComponents.join(', ')}`,
      );
    }

    return result;
  }
}
