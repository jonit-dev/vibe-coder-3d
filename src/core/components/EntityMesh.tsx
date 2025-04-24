// OptimizedEntityMesh component
// Enhanced version of EntityMesh with additional performance optimizations
import { useFrame } from '@react-three/fiber';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Group, Mesh, Vector3 } from 'three';

import {
  Transform,
  createEntity,
  destroyEntity,
  entityToObject,
  objectToEntity,
} from '@core/lib/ecs';
import { isCulled } from '@core/lib/rendering';

const FRUSTUM_CULLING_RANGE = 50; // How far to cull objects

// Props for the component
export interface IEntityMeshProps {
  position?: [number, number, number];
  rotation?: [number, number, number, number]; // Quaternion
  scale?: [number, number, number];
  visible?: boolean;
  frustumCulled?: boolean;
  castShadow?: boolean;
  receiveShadow?: boolean;
  children?: React.ReactNode;
  entityId?: number;
  onUpdate?: (mesh: Mesh) => void;
  performance?: 'low' | 'medium' | 'high';
  lodLevels?: Array<{
    distance: number;
    detail: React.ReactNode;
  }>;
  instanced?: boolean;
  instanceCount?: number;
  instanceMatrix?: Float32Array;
}

/**
 * An optimized mesh component integrated with the ECS system
 * Includes frustum culling, LOD, and instancing optimizations
 */
export const EntityMesh = forwardRef<Mesh, IEntityMeshProps>(
  (
    {
      position = [0, 0, 0],
      rotation = [0, 0, 0, 1],
      scale = [1, 1, 1],
      visible = true,
      frustumCulled = true,
      castShadow = false,
      receiveShadow = false,
      children,
      entityId: providedEntityId,
      onUpdate,
      performance = 'medium',
      lodLevels = [],
      instanced = false,
      instanceCount = 1,
      instanceMatrix,
    },
    ref,
  ) => {
    // Reference to the mesh
    const meshRef = useRef<Mesh>(null);

    // Group ref for optimization
    const groupRef = useRef<Group>(null);

    // Performance optimizations
    const [distanceToCamera, setDistanceToCamera] = useState<number>(0);
    const [isFrustumCulled, setIsFrustumCulled] = useState<boolean>(false);

    // LOD references
    const lodChildrenRefs = useRef<Map<number, Group>>(new Map());
    const [activeLODLevel, setActiveLODLevel] = useState<number>(0);

    // Use entity ID from props or create a new one
    const [entityId, setEntityId] = useState<number | null>(providedEntityId || null);

    // Create entity if not provided
    useEffect(() => {
      if (providedEntityId) {
        setEntityId(providedEntityId);
      } else {
        // Create a new entity
        const newEntityId = createEntity();
        setEntityId(newEntityId);
      }

      // Cleanup function
      return () => {
        // Only destroy the entity if we created it (not if it was provided)
        if (entityId && !providedEntityId) {
          destroyEntity(entityId);
        }
      };
    }, [providedEntityId]);

    // Skip some frames for non-essential updates based on performance setting
    const frameSkip = useMemo(() => {
      switch (performance) {
        case 'low':
          return 3; // Update every 4th frame
        case 'medium':
          return 1; // Update every other frame
        case 'high':
          return 0; // Update every frame
        default:
          return 1;
      }
    }, [performance]);

    // Counter for frame skipping
    const frameCounter = useRef<number>(0);

    // Forward the ref to parent components
    useImperativeHandle(ref, () => meshRef.current!);

    // Process LOD levels if provided
    const processedLODLevels = useMemo(() => {
      return lodLevels
        .map((level, index) => ({
          index,
          distance: level.distance,
          detail: level.detail,
        }))
        .sort((a, b) => b.distance - a.distance); // Sort by distance (furthest first)
    }, [lodLevels]);

    // Store LOD refs when children mount
    const storeLODRef = (index: number, ref: Group | null) => {
      if (ref) {
        lodChildrenRefs.current.set(index, ref);
      } else {
        lodChildrenRefs.current.delete(index);
      }
    };

    // Setup: Link the mesh to the entity
    useEffect(() => {
      if (meshRef.current && entityId) {
        // If we already have an entity for this object, update it
        const existingId = objectToEntity.get(meshRef.current);
        if (existingId && existingId !== entityId) {
          // Clean up the existing entity
          destroyEntity(existingId);
        }

        // Link the new entity to the mesh
        entityToObject.set(entityId, meshRef.current);
        objectToEntity.set(meshRef.current, entityId);

        // Set initial transform values
        Transform.position[entityId][0] = position[0];
        Transform.position[entityId][1] = position[1];
        Transform.position[entityId][2] = position[2];

        Transform.rotation[entityId][0] = rotation[0];
        Transform.rotation[entityId][1] = rotation[1];
        Transform.rotation[entityId][2] = rotation[2];
        Transform.rotation[entityId][3] = rotation[3];

        Transform.scale[entityId][0] = scale[0];
        Transform.scale[entityId][1] = scale[1];
        Transform.scale[entityId][2] = scale[2];

        // Mark transform for update
        Transform.needsUpdate[entityId] = 1;

        // Call the onUpdate callback if provided
        if (onUpdate && meshRef.current) {
          onUpdate(meshRef.current);
        }
      }
    }, [entityId, position, rotation, scale, onUpdate]);

    // Update the mesh transform from ECS state and handle culling/LOD
    useFrame(({ camera }) => {
      frameCounter.current = (frameCounter.current + 1) % (frameSkip + 1);

      // Skip frames based on performance setting
      if (frameCounter.current !== 0) return;

      if (meshRef.current && entityId) {
        // Only update if transform needs update
        if (Transform.needsUpdate[entityId] === 1) {
          // Update the mesh transform directly
          meshRef.current.position.set(
            Transform.position[entityId][0],
            Transform.position[entityId][1],
            Transform.position[entityId][2],
          );

          meshRef.current.quaternion.set(
            Transform.rotation[entityId][0],
            Transform.rotation[entityId][1],
            Transform.rotation[entityId][2],
            Transform.rotation[entityId][3],
          );

          meshRef.current.scale.set(
            Transform.scale[entityId][0],
            Transform.scale[entityId][1],
            Transform.scale[entityId][2],
          );

          // Reset the needsUpdate flag
          Transform.needsUpdate[entityId] = 0;
        }

        // Handle LOD and frustum culling
        if (groupRef.current) {
          // Get object position and compute distance to camera
          const objPos = new Vector3().setFromMatrixPosition(groupRef.current.matrixWorld);
          const newDistance = camera.position.distanceTo(objPos);

          // Only update if distance changed significantly
          if (Math.abs(newDistance - distanceToCamera) > 1) {
            setDistanceToCamera(newDistance);

            // Update LOD if we have levels
            if (processedLODLevels.length > 0) {
              // Find appropriate LOD level
              let newLODLevel = 0;
              for (const level of processedLODLevels) {
                if (newDistance >= level.distance) {
                  newLODLevel = level.index;
                  break;
                }
              }

              // Update active LOD level if changed
              if (newLODLevel !== activeLODLevel) {
                setActiveLODLevel(newLODLevel);

                // Update visibility of LOD children
                lodChildrenRefs.current.forEach((group, index) => {
                  group.visible = index === newLODLevel;
                });
              }
            }

            // Handle frustum culling
            if (frustumCulled) {
              // Cull distant objects
              if (newDistance > FRUSTUM_CULLING_RANGE) {
                if (!isFrustumCulled) setIsFrustumCulled(true);
              } else {
                // Check if in camera frustum for closer objects
                const culled = isCulled(groupRef.current, camera);
                if (culled !== isFrustumCulled) {
                  setIsFrustumCulled(culled);
                }
              }
            }
          }
        }
      }
    });

    // Render the appropriate LOD level or standard mesh
    if (processedLODLevels.length > 0) {
      return (
        <group ref={groupRef} visible={visible && !isFrustumCulled}>
          <mesh
            ref={meshRef}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
            frustumCulled={false} // We handle this ourselves
          >
            {/* Render LOD levels with visibility controlled by state */}
            {processedLODLevels.map((level) => (
              <group
                key={level.index}
                ref={(ref) => storeLODRef(level.index, ref)}
                visible={level.index === activeLODLevel}
              >
                {level.detail}
              </group>
            ))}
          </mesh>
        </group>
      );
    }

    // Default without LOD
    return (
      <group ref={groupRef} visible={visible && !isFrustumCulled}>
        <mesh
          ref={meshRef}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          frustumCulled={false} // We handle this ourselves
        >
          {children}
        </mesh>
      </group>
    );
  },
);

// Add a display name for debugging
EntityMesh.displayName = 'OptimizedEntityMesh';
