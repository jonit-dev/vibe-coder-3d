import { IComponentDescriptor, IValidationResult } from '../types';

export class DependencyResolver {
  static resolveDependencies(
    componentIds: string[],
    getComponent: (id: string) => IComponentDescriptor | undefined,
  ): string[] {
    const resolved = new Set<string>(componentIds);
    const toProcess = [...componentIds];

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const component = getComponent(currentId);

      if (!component || !component.dependencies) continue;

      for (const depId of component.dependencies) {
        if (!resolved.has(depId)) {
          resolved.add(depId);
          toProcess.push(depId);
        }
      }
    }

    return Array.from(resolved);
  }

  static findDependentComponents(
    targetComponentId: string,
    entityComponents: string[],
    getComponent: (id: string) => IComponentDescriptor | undefined,
  ): string[] {
    const dependents: string[] = [];

    for (const componentId of entityComponents) {
      const component = getComponent(componentId);
      if (component?.dependencies?.includes(targetComponentId)) {
        dependents.push(componentId);
      }
    }

    return dependents;
  }

  static validateDependencies(
    componentIds: string[],
    getComponent: (id: string) => IComponentDescriptor | undefined,
  ): IValidationResult {
    const result: IValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      missingDependencies: [],
      conflicts: [],
    };

    const resolvedDeps = new Set<string>();
    const conflicts = new Set<string>();

    for (const componentId of componentIds) {
      const component = getComponent(componentId);
      if (!component) {
        result.errors.push(`Component '${componentId}' not found`);
        result.valid = false;
        continue;
      }

      // Check dependencies
      if (component.dependencies) {
        for (const depId of component.dependencies) {
          if (!componentIds.includes(depId) && !resolvedDeps.has(depId)) {
            result.missingDependencies?.push(depId);
            result.warnings.push(
              `Component '${componentId}' requires '${depId}' but it's not included`,
            );
          }
          resolvedDeps.add(depId);
        }
      }

      // Check conflicts
      if (component.conflicts) {
        for (const conflictId of component.conflicts) {
          if (componentIds.includes(conflictId)) {
            conflicts.add(conflictId);
            result.conflicts?.push(conflictId);
            result.errors.push(`Component '${componentId}' conflicts with '${conflictId}'`);
            result.valid = false;
          }
        }
      }
    }

    return result;
  }
}
