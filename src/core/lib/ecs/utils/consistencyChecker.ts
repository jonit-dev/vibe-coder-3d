import { EntityManager } from '../EntityManager';
import { ComponentManager } from '../ComponentManager';
import { EntityQueries } from '../queries/entityQueries';

export interface IConsistencyReport {
  isConsistent: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    entitiesInWorld: number;
    entitiesInIndex: number;
    componentTypes: number;
    totalComponents: number;
    hierarchyRelationships: number;
  };
}

/**
 * ConsistencyChecker - Development utility to validate index consistency
 * Only enabled in development builds to avoid performance impact
 */
export class ConsistencyChecker {
  private static readonly IS_DEV = process.env.NODE_ENV === 'development';

  /**
   * Perform comprehensive consistency check between ECS world and indices
   */
  static check(): IConsistencyReport {
    if (!this.IS_DEV) {
      return {
        isConsistent: true,
        errors: [],
        warnings: ['Consistency checks disabled in production'],
        stats: { entitiesInWorld: 0, entitiesInIndex: 0, componentTypes: 0, totalComponents: 0, hierarchyRelationships: 0 }
      };
    }

    const entityManager = EntityManager.getInstance();
    const componentManager = ComponentManager.getInstance();
    const queries = EntityQueries.getInstance();

    const errors: string[] = [];
    const warnings: string[] = [];

    // Get baseline data
    const worldEntities = entityManager.getAllEntities();
    const indexedEntities = queries.listAllEntities();
    const componentTypes = componentManager.getRegisteredComponentTypes();

    const stats = {
      entitiesInWorld: worldEntities.length,
      entitiesInIndex: indexedEntities.length,
      componentTypes: componentTypes.length,
      totalComponents: 0,
      hierarchyRelationships: 0,
    };

    // Check entity consistency
    this.checkEntityConsistency(worldEntities, indexedEntities, errors, warnings);

    // Check hierarchy consistency
    stats.hierarchyRelationships = this.checkHierarchyConsistency(worldEntities, queries, errors, warnings);

    // Check component consistency
    stats.totalComponents = this.checkComponentConsistency(worldEntities, componentTypes, componentManager, queries, errors, warnings);

    // Check for orphaned data
    this.checkOrphanedData(queries, errors, warnings);

    return {
      isConsistent: errors.length === 0,
      errors,
      warnings,
      stats,
    };
  }

  private static checkEntityConsistency(
    worldEntities: any[],
    indexedEntities: number[],
    errors: string[],
    warnings: string[]
  ): void {
    const worldSet = new Set(worldEntities.map(e => e.id));
    const indexSet = new Set(indexedEntities);

    // Entities in world but not in index
    worldSet.forEach(entityId => {
      if (!indexSet.has(entityId)) {
        errors.push(`Entity ${entityId} exists in world but not in EntityIndex`);
      }
    });

    // Entities in index but not in world
    indexSet.forEach(entityId => {
      if (!worldSet.has(entityId)) {
        errors.push(`Entity ${entityId} exists in EntityIndex but not in world`);
      }
    });

    if (worldSet.size !== indexSet.size) {
      warnings.push(`Entity count mismatch: world=${worldSet.size}, index=${indexSet.size}`);
    }
  }

  private static checkHierarchyConsistency(
    worldEntities: any[],
    queries: EntityQueries,
    errors: string[],
    warnings: string[]
  ): number {
    let relationshipCount = 0;

    worldEntities.forEach(entity => {
      // Check parent consistency
      const indexedParent = queries.getParent(entity.id);
      if (indexedParent !== entity.parentId) {
        errors.push(`Entity ${entity.id} parent mismatch: world=${entity.parentId}, index=${indexedParent}`);
      }

      // Check children consistency
      const indexedChildren = new Set(queries.getChildren(entity.id));
      const worldChildren = new Set(entity.children);

      if (indexedChildren.size !== worldChildren.size) {
        errors.push(`Entity ${entity.id} children count mismatch: world=${worldChildren.size}, index=${indexedChildren.size}`);
      }

      worldChildren.forEach(childId => {
        if (!indexedChildren.has(childId)) {
          errors.push(`Entity ${entity.id} missing child ${childId} in HierarchyIndex`);
        }
      });

      indexedChildren.forEach(childId => {
        if (!worldChildren.has(childId)) {
          errors.push(`Entity ${entity.id} has extra child ${childId} in HierarchyIndex`);
        }
      });

      relationshipCount += entity.children.length;
    });

    return relationshipCount;
  }

  private static checkComponentConsistency(
    worldEntities: any[],
    componentTypes: string[],
    componentManager: ComponentManager,
    queries: EntityQueries,
    errors: string[],
    warnings: string[]
  ): number {
    let totalComponents = 0;

    componentTypes.forEach(componentType => {
      const worldEntities = componentManager.getEntitiesWithComponent(componentType);
      const indexedEntities = queries.listEntitiesWithComponent(componentType);

      const worldSet = new Set(worldEntities);
      const indexedSet = new Set(indexedEntities);

      totalComponents += worldEntities.length;

      // Check for missing entities in index
      worldSet.forEach(entityId => {
        if (!indexedSet.has(entityId)) {
          errors.push(`Entity ${entityId} has component ${componentType} in world but not in ComponentIndex`);
        }
      });

      // Check for extra entities in index
      indexedSet.forEach(entityId => {
        if (!worldSet.has(entityId)) {
          errors.push(`Entity ${entityId} has component ${componentType} in ComponentIndex but not in world`);
        }
      });
    });

    return totalComponents;
  }

  private static checkOrphanedData(
    queries: EntityQueries,
    errors: string[],
    warnings: string[]
  ): void {
    // Check for circular dependencies in hierarchy
    const allEntities = queries.listAllEntities();

    allEntities.forEach(entityId => {
      const visited = new Set<number>();
      let current: number | undefined = entityId;

      while (current !== undefined && !visited.has(current)) {
        visited.add(current);
        current = queries.getParent(current);

        if (current === entityId) {
          errors.push(`Circular dependency detected in hierarchy starting from entity ${entityId}`);
          break;
        }
      }
    });

    // Check for component types with no entities
    const componentTypes = queries.getComponentTypes();
    componentTypes.forEach(componentType => {
      const count = queries.getComponentCount(componentType);
      if (count === 0) {
        warnings.push(`Component type ${componentType} has no entities`);
      }
    });
  }

  /**
   * Log consistency report to console with appropriate styling
   */
  static logReport(report: IConsistencyReport): void {
    if (!this.IS_DEV) return;

    console.group('🔍 ECS Index Consistency Report');

    if (report.isConsistent) {
      console.log('✅ All indices are consistent with ECS world state');
    } else {
      console.log('❌ Inconsistencies detected!');
    }

    // Log stats
    console.log('📊 Statistics:', report.stats);

    // Log errors
    if (report.errors.length > 0) {
      console.group('🚨 Errors:');
      report.errors.forEach(error => console.error(`  ${error}`));
      console.groupEnd();
    }

    // Log warnings
    if (report.warnings.length > 0) {
      console.group('⚠️ Warnings:');
      report.warnings.forEach(warning => console.warn(`  ${warning}`));
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Run consistency check and throw if errors found (useful for tests)
   */
  static assert(): void {
    const report = this.check();
    if (!report.isConsistent) {
      throw new Error(`ECS Index consistency check failed: ${report.errors.join(', ')}`);
    }
  }

  /**
   * Schedule periodic consistency checks (development only)
   */
  static startPeriodicChecks(intervalMs: number = 30000): () => void {
    if (!this.IS_DEV) {
      return () => {}; // No-op in production
    }

    const interval = setInterval(() => {
      const report = this.check();
      if (!report.isConsistent) {
        console.error('🚨 Periodic consistency check failed!');
        this.logReport(report);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }
}