// EntityMesh Component
// Connects a Three.js mesh with an ECS entity
import { createEntity, destroyEntity, entityToObject, objectToEntity, Transform } from '@core/lib/ecs';
import React, { useEffect, useRef } from 'react';
import { Object3D } from 'three';

// Props for the EntityMesh component
interface EntityMeshProps {
  // Initial transform properties
  position?: [number, number, number];
  rotation?: [number, number, number, number]; // Quaternion
  scale?: [number, number, number];

  // Mesh-specific properties
  geometry?: React.ReactNode;
  material?: React.ReactNode;
  children?: React.ReactNode;

  // Standard props passed to the mesh
  castShadow?: boolean;
  receiveShadow?: boolean;

  // Additional props will be passed to the mesh
  [key: string]: any;
}

/**
 * A mesh that is automatically linked to an ECS entity
 * This creates an entity with a Transform component and connects
 * the mesh to that entity in the ECS
 */
export function EntityMesh({
  // Transform props
  position = [0, 0, 0],
  rotation = [0, 0, 0, 1], // Default quaternion [x, y, z, w]
  scale = [1, 1, 1],

  // Mesh props
  geometry,
  material,
  children,
  castShadow = true,
  receiveShadow = true,

  // Rest will be passed to the mesh
  ...props
}: EntityMeshProps) {
  // Reference to the mesh object and entity ID
  const meshRef = useRef<Object3D | null>(null);
  const entityRef = useRef<number>(-1);

  // Effect to create the entity on mount and destroy on unmount
  useEffect(() => {
    // Create an entity for this mesh
    const entity = createEntity();
    entityRef.current = entity;

    // Set the initial transform values
    Transform.position[entity][0] = position[0];
    Transform.position[entity][1] = position[1];
    Transform.position[entity][2] = position[2];

    Transform.rotation[entity][0] = rotation[0];
    Transform.rotation[entity][1] = rotation[1];
    Transform.rotation[entity][2] = rotation[2];
    Transform.rotation[entity][3] = rotation[3];

    Transform.scale[entity][0] = scale[0];
    Transform.scale[entity][1] = scale[1];
    Transform.scale[entity][2] = scale[2];

    // Mark for update to ensure the transform system applies the values
    Transform.needsUpdate[entity] = 1;

    if (import.meta.env.DEV) {
      console.log(`Created entity ${entity} for mesh`);
    }

    // Clean up on unmount
    return () => {
      if (entityRef.current >= 0) {
        destroyEntity(entityRef.current);

        if (import.meta.env.DEV) {
          console.log(`Destroyed entity ${entityRef.current}`);
        }
      }
    };
  }, []); // Only run on mount/unmount

  // Handle mesh ref callback - when the mesh is created by Three.js
  const handleMeshRef = (mesh: Object3D | null) => {
    if (!mesh) return;

    // Store the mesh reference
    meshRef.current = mesh;

    // If we have an entity, connect it to the mesh
    if (entityRef.current >= 0) {
      entityToObject.set(entityRef.current, mesh);
      objectToEntity.set(mesh, entityRef.current);
      Transform.needsUpdate[entityRef.current] = 1;
    }
  };

  // Update transforms when props change
  useEffect(() => {
    const entity = entityRef.current;
    if (entity < 0) return; // No entity yet

    // Update transform values
    Transform.position[entity][0] = position[0];
    Transform.position[entity][1] = position[1];
    Transform.position[entity][2] = position[2];

    Transform.rotation[entity][0] = rotation[0];
    Transform.rotation[entity][1] = rotation[1];
    Transform.rotation[entity][2] = rotation[2];
    Transform.rotation[entity][3] = rotation[3];

    Transform.scale[entity][0] = scale[0];
    Transform.scale[entity][1] = scale[1];
    Transform.scale[entity][2] = scale[2];

    // Mark for update
    Transform.needsUpdate[entity] = 1;
  }, [position, rotation, scale]); // Update when transform props change

  return (
    <mesh
      ref={handleMeshRef}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      {...props}
    >
      {/* Default geometry if none provided */}
      {!geometry && <boxGeometry />}
      {geometry}

      {/* Default material if none provided */}
      {!material && <meshStandardMaterial color="white" />}
      {material}

      {children}
    </mesh>
  );
} 
