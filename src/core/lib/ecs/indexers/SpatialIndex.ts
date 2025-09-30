/**
 * Spatial Index for efficient spatial queries on entities with Transform components
 * Uses a 3D grid-based spatial hashing approach for O(1) queries
 */

export interface IVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IBounds {
  min: IVector3;
  max: IVector3;
}

export interface ISpatialIndexConfig {
  cellSize: number; // Size of each grid cell (default: 10 units)
  enableDebugLogging: boolean;
}

/**
 * SpatialIndex - Efficient spatial queries for Transform components
 *
 * Features:
 * - O(1) spatial lookups using grid hashing
 * - Supports radius and bounding box queries
 * - Automatic grid cell management
 * - Handles entities moving between cells
 *
 * Usage:
 * ```typescript
 * const spatialIndex = new SpatialIndex({ cellSize: 10 });
 * spatialIndex.updateEntity(entityId, { x: 5, y: 0, z: 5 });
 * const nearby = spatialIndex.queryRadius({ x: 0, y: 0, z: 0 }, 15);
 * ```
 */
export class SpatialIndex {
  private grid = new Map<string, Set<number>>();
  private entityToCell = new Map<number, string>();
  private entityPositions = new Map<number, IVector3>();
  private config: ISpatialIndexConfig;

  constructor(config: Partial<ISpatialIndexConfig> = {}) {
    this.config = {
      cellSize: config.cellSize ?? 10,
      enableDebugLogging: config.enableDebugLogging ?? false,
    };
  }

  /**
   * Get grid cell key for a position
   */
  private getCellKey(position: IVector3): string {
    const cellSize = this.config.cellSize;
    const x = Math.floor(position.x / cellSize);
    const y = Math.floor(position.y / cellSize);
    const z = Math.floor(position.z / cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Update entity position in spatial grid
   */
  updateEntity(entityId: number, position: IVector3): void {
    const newCellKey = this.getCellKey(position);
    const oldCellKey = this.entityToCell.get(entityId);

    // If entity moved to different cell, update grid
    if (oldCellKey !== newCellKey) {
      // Remove from old cell
      if (oldCellKey) {
        const oldCell = this.grid.get(oldCellKey);
        if (oldCell) {
          oldCell.delete(entityId);
          if (oldCell.size === 0) {
            this.grid.delete(oldCellKey);
          }
        }
      }

      // Add to new cell
      let newCell = this.grid.get(newCellKey);
      if (!newCell) {
        newCell = new Set();
        this.grid.set(newCellKey, newCell);
      }
      newCell.add(entityId);

      // Update tracking
      this.entityToCell.set(entityId, newCellKey);
    }

    // Update position cache
    this.entityPositions.set(entityId, { ...position });

    if (this.config.enableDebugLogging) {
      console.log(`[SpatialIndex] Updated entity ${entityId} to cell ${newCellKey}`);
    }
  }

  /**
   * Remove entity from spatial index
   */
  removeEntity(entityId: number): void {
    const cellKey = this.entityToCell.get(entityId);
    if (cellKey) {
      const cell = this.grid.get(cellKey);
      if (cell) {
        cell.delete(entityId);
        if (cell.size === 0) {
          this.grid.delete(cellKey);
        }
      }
    }

    this.entityToCell.delete(entityId);
    this.entityPositions.delete(entityId);

    if (this.config.enableDebugLogging) {
      console.log(`[SpatialIndex] Removed entity ${entityId}`);
    }
  }

  /**
   * Query entities within a bounding box
   */
  queryBounds(bounds: IBounds): number[] {
    const { min, max } = bounds;
    const cellSize = this.config.cellSize;

    // Calculate grid cell range
    const minCell = {
      x: Math.floor(min.x / cellSize),
      y: Math.floor(min.y / cellSize),
      z: Math.floor(min.z / cellSize),
    };
    const maxCell = {
      x: Math.floor(max.x / cellSize),
      y: Math.floor(max.y / cellSize),
      z: Math.floor(max.z / cellSize),
    };

    const results = new Set<number>();

    // Iterate through all cells in range
    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        for (let z = minCell.z; z <= maxCell.z; z++) {
          const cellKey = `${x},${y},${z}`;
          const cell = this.grid.get(cellKey);
          if (cell) {
            // Check each entity in cell for actual bounds intersection
            cell.forEach((entityId) => {
              const pos = this.entityPositions.get(entityId);
              if (
                pos &&
                pos.x >= min.x &&
                pos.x <= max.x &&
                pos.y >= min.y &&
                pos.y <= max.y &&
                pos.z >= min.z &&
                pos.z <= max.z
              ) {
                results.add(entityId);
              }
            });
          }
        }
      }
    }

    return Array.from(results);
  }

  /**
   * Query entities within radius of a point
   */
  queryRadius(center: IVector3, radius: number): number[] {
    const bounds: IBounds = {
      min: {
        x: center.x - radius,
        y: center.y - radius,
        z: center.z - radius,
      },
      max: {
        x: center.x + radius,
        y: center.y + radius,
        z: center.z + radius,
      },
    };

    // Get candidates from bounding box
    const candidates = this.queryBounds(bounds);

    // Filter by actual distance
    const radiusSquared = radius * radius;
    return candidates.filter((entityId) => {
      const pos = this.entityPositions.get(entityId);
      if (!pos) return false;

      const dx = pos.x - center.x;
      const dy = pos.y - center.y;
      const dz = pos.z - center.z;
      const distSquared = dx * dx + dy * dy + dz * dz;

      return distSquared <= radiusSquared;
    });
  }

  /**
   * Get entity position if tracked
   */
  getEntityPosition(entityId: number): IVector3 | undefined {
    return this.entityPositions.get(entityId);
  }

  /**
   * Check if entity is tracked in spatial index
   */
  hasEntity(entityId: number): boolean {
    return this.entityToCell.has(entityId);
  }

  /**
   * Get all tracked entities
   */
  getAllEntities(): number[] {
    return Array.from(this.entityToCell.keys());
  }

  /**
   * Clear all entities from index
   */
  clear(): void {
    this.grid.clear();
    this.entityToCell.clear();
    this.entityPositions.clear();
  }

  /**
   * Get statistics about spatial index
   */
  getStats() {
    return {
      totalEntities: this.entityToCell.size,
      totalCells: this.grid.size,
      cellSize: this.config.cellSize,
      averageEntitiesPerCell: this.grid.size > 0 ? this.entityToCell.size / this.grid.size : 0,
    };
  }
}
