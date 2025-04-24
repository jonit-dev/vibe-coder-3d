// Core rendering utilities
import {
  BufferGeometry,
  Camera,
  Frustum,
  Material,
  Matrix4,
  Mesh,
  Object3D,
  Sphere,
  Texture,
  Vector3,
} from 'three';

// Cached frustum and matrix to avoid repeated allocations
const _frustum = new Frustum();
const _projScreenMatrix = new Matrix4();
const _position = new Vector3();
const _sphere = new Sphere();

/**
 * Check if an object is culled by the camera frustum
 * @param object The object to check
 * @param camera The camera to check against
 * @returns True if the object is culled (not visible)
 */
export function isCulled(object: Object3D, camera: Camera): boolean {
  // Skip if object is not visible
  if (!object.visible) return true;

  // Update world matrix of the object to ensure accurate position
  if (!object.matrixWorldAutoUpdate) object.updateMatrixWorld();

  // Update projection matrix
  _projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);

  // Update the frustum
  _frustum.setFromProjectionMatrix(_projScreenMatrix);

  // Get object position
  _position.setFromMatrixPosition(object.matrixWorld);

  // Get object's bounding sphere radius (or estimate if not available)
  let boundingSphereRadius = 1;
  if (object instanceof Mesh && object.geometry?.boundingSphere) {
    boundingSphereRadius = object.geometry.boundingSphere.radius;
  } else {
    // Estimate from scale
    boundingSphereRadius = Math.max(object.scale.x, object.scale.y, object.scale.z) * 2;
  }

  // Set up the sphere for intersection test
  _sphere.set(_position, boundingSphereRadius);

  // Check if object is in frustum using its position and radius
  return !_frustum.containsPoint(_position) && !_frustum.intersectsSphere(_sphere);
}

/**
 * Compute a culling volume for a point in space
 * Useful for spatial partitioning and visibility checks
 * @param position The position to compute culling for
 * @param radius The radius of the culling volume
 * @returns A bounding volume for culling checks
 */
export function computeCullingVolume(position: Vector3, radius: number) {
  return {
    position: position.clone(),
    radius,

    // Check if a point is within this volume
    contains: (point: Vector3) => {
      return point.distanceToSquared(position) <= radius * radius;
    },

    // Check if this volume intersects another
    intersects: (other: { position: Vector3; radius: number }) => {
      const distance = position.distanceTo(other.position);
      return distance <= radius + other.radius;
    },
  };
}

// LOD (Level of Detail) utility
export type LODLevel = {
  distance: number;
  object: Object3D | null;
};

/**
 * Create a LOD (Level of Detail) manager for an object
 * Automatically swaps between different detail levels based on camera distance
 * @param levels Array of LOD levels (distance and corresponding object)
 * @param defaultObject Default object to show when no level matches
 */
export function createLODManager(levels: LODLevel[], defaultObject: Object3D | null = null) {
  // Sort levels by distance (furthest first)
  const sortedLevels = [...levels].sort((a, b) => b.distance - a.distance);
  let currentLevel: LODLevel | null = null;

  return {
    // Update visible level based on distance to camera
    update: (distanceToCamera: number) => {
      let newLevel: LODLevel | null = null;

      // Find the appropriate level for this distance
      for (const level of sortedLevels) {
        if (distanceToCamera >= level.distance) {
          newLevel = level;
          break;
        }
      }

      // If no level matches, use the default object
      if (!newLevel && defaultObject) {
        newLevel = { distance: Infinity, object: defaultObject };
      }

      // Only update visibility if level changed
      if (newLevel !== currentLevel) {
        // Hide previous level
        if (currentLevel && currentLevel.object) {
          currentLevel.object.visible = false;
        }

        // Show new level
        if (newLevel && newLevel.object) {
          newLevel.object.visible = true;
        }

        currentLevel = newLevel;
      }

      return newLevel;
    },

    // Get current active LOD level
    getCurrentLevel: () => currentLevel,

    // Clean up resources
    dispose: () => {
      currentLevel = null;
    },
  };
}

// Instancing helper
export function prepareForInstancing(geometries: BufferGeometry[]): BufferGeometry {
  // Placeholder for instancing helper - would merge geometries for instanced rendering
  // This would be implemented based on the specific needs of the project
  return geometries[0];
}

// Material optimization (reduce draw calls)
export function optimizeMaterials(materials: Material[]): Material[] {
  // Group similar materials to reduce draw calls
  // This would deduplicate materials with the same properties
  return materials;
}

// Texture memory optimization
export const textureUtils = {
  // Texture size power of two check
  isPowerOfTwo: (value: number): boolean => {
    return (value & (value - 1)) === 0 && value !== 0;
  },

  // Ensure texture has power-of-two dimensions for better performance
  ensurePowerOfTwo: (texture: Texture): boolean => {
    if (!texture.image) return false;

    const width = texture.image.width;
    const height = texture.image.height;

    return textureUtils.isPowerOfTwo(width) && textureUtils.isPowerOfTwo(height);
  },
};
