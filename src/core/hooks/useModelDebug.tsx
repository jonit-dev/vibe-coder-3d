import { Box } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

import { IModelConfig } from '@/core/types/assets';

interface IUseModelDebugOptions {
  model: THREE.Object3D | null;
  config?: IModelConfig;
  debug?: boolean;
}

export function useModelDebug({ model, config, debug = false }: IUseModelDebugOptions) {
  // Create refs for debug visualizations
  const boxRef = useRef<THREE.Box3>(new THREE.Box3());

  // Check if debugMode is enabled
  const debugMode = config?.debugMode ? config.debugMode.enabled : debug;
  const debugSettings = config?.debugMode;
  const debugColor = debugSettings?.debugColor
    ? new THREE.Color(
        debugSettings.debugColor[0],
        debugSettings.debugColor[1],
        debugSettings.debugColor[2],
      )
    : new THREE.Color(0, 1, 0);

  // Log model hierarchy
  useEffect(() => {
    if (!model || !debugMode) return;

    // Only log to console if configured or if debug prop is true
    if (debugSettings?.logToConsole || debug) {

      logObject3DHierarchy(model);

      // Log all meshes and skinned meshes
      model.traverse((obj: THREE.Object3D) => {
        // @ts-expect-error isSkinnedMesh and isMesh are not standard on Object3D, but present on Mesh/SkinnedMesh
        if (obj.isSkinnedMesh) {

          // Use proper type assertion for SkinnedMesh
          const skinnedMesh = obj as THREE.SkinnedMesh;
          if (skinnedMesh.skeleton) {
                    // Log SkinnedMesh bones for debugging
              skinnedMesh.skeleton.bones.map((b: THREE.Bone) => b.name);
          }
        } else if ((obj as THREE.Mesh).isMesh) {

        }
      });
    }

    // Calculate bounding box for visualization
    if (model) {
      const box = new THREE.Box3().setFromObject(model);
      boxRef.current = box;

      if (debugSettings?.logToConsole || debug) {
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        box.getCenter(center);
        box.getSize(size);

      }
    }
  }, [model, debugMode, debugSettings, debug]);

  // Calculate bounding box dimensions safely
  const boundingBoxDimensions = useMemo(() => {
    if (!model || !boxRef.current) return null;

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    boxRef.current.getSize(size);
    boxRef.current.getCenter(center);

    // Check for invalid values
    if (
      isNaN(size.x) ||
      isNaN(size.y) ||
      isNaN(size.z) ||
      isNaN(center.x) ||
      isNaN(center.y) ||
      isNaN(center.z)
    ) {
      console.warn('Model: Invalid bounding box dimensions detected');
      return null;
    }

    return {
      width: size.x,
      height: size.y,
      depth: size.z,
      center: [center.x, center.y, center.z] as [number, number, number],
    };
  }, [model, boxRef.current]);

  // Render debug visualizations
  const renderDebugElements = useMemo(() => {
    if (!debugMode || !model) return null;

    // Wireframe material creator
    const createWireframeMaterial = () => {
      return new THREE.MeshBasicMaterial({
        color: debugColor,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      });
    };

    return (
      <>
        {/* Bounding Box */}
        {debugSettings?.showBoundingBox && boundingBoxDimensions && (
          <Box
            args={[
              boundingBoxDimensions.width,
              boundingBoxDimensions.height,
              boundingBoxDimensions.depth,
            ]}
            position={boundingBoxDimensions.center}
          >
            <meshBasicMaterial color={debugColor} wireframe transparent opacity={0.5} />
          </Box>
        )}

        {/* Show Colliders */}
        {debugSettings?.showColliders && config?.collision?.enabled && (
          <>
            {config.collision.shape === 'capsule' && (
              <group
                position={[
                  config.collision.offset[0],
                  config.collision.offset[1],
                  config.collision.offset[2],
                ]}
              >
                <mesh>
                  <capsuleGeometry
                    args={[config.collision.radius || 0.3, config.collision.height || 1.8]}
                  />
                  <meshBasicMaterial color={debugColor} wireframe transparent opacity={0.5} />
                </mesh>
              </group>
            )}

            {config.collision.shape === 'sphere' && (
              <group
                position={[
                  config.collision.offset[0],
                  config.collision.offset[1],
                  config.collision.offset[2],
                ]}
              >
                <mesh>
                  <sphereGeometry args={[config.collision.radius || 0.5]} />
                  <meshBasicMaterial color={debugColor} wireframe transparent opacity={0.5} />
                </mesh>
              </group>
            )}

            {config.collision.shape === 'box' && (
              <Box
                args={[1, 1, 1]} // Default box size
                position={[
                  config.collision.offset[0],
                  config.collision.offset[1],
                  config.collision.offset[2],
                ]}
              >
                <meshBasicMaterial color={debugColor} wireframe transparent opacity={0.5} />
              </Box>
            )}
          </>
        )}

        {/* Wireframe */}
        {debugSettings?.showWireframe && model && (
          <group>
            {(() => {
              const clone = model.clone();
              clone.traverse((obj: THREE.Object3D) => {
                if ((obj as THREE.Mesh).isMesh) {
                  const mesh = obj as THREE.Mesh;
                  if (mesh.material) {
                    mesh.material = createWireframeMaterial();
                  }
                }
              });
              return <primitive object={clone} />;
            })()}
          </group>
        )}

        {/* Skeleton */}
        {debugSettings?.showSkeleton && model && (
          <group>
            {(() => {
              // Create skeleton helpers for all skinned meshes in the model
              const skeletonHelpers: THREE.SkeletonHelper[] = [];

              model.traverse((obj: THREE.Object3D) => {
                // Check if object is a skinned mesh
                if ((obj as THREE.SkinnedMesh).isSkinnedMesh) {
                  const skinnedMesh = obj as THREE.SkinnedMesh;

                  // Only create helper if the mesh has a skeleton with bones
                  if (skinnedMesh.skeleton && skinnedMesh.skeleton.bones.length > 0) {
                    // Create a new skeleton helper using the first bone as root
                    const rootBone = skinnedMesh.skeleton.bones[0];
                    const helper = new THREE.SkeletonHelper(rootBone);

                    // Set the material color
                    (helper.material as THREE.LineBasicMaterial).color = debugColor;

                    // Add to our list of helpers
                    skeletonHelpers.push(helper);
                  }
                }
              });

              // Return all skeleton helpers
              return skeletonHelpers.map((helper, index) => (
                <primitive key={`skeleton-helper-${index}`} object={helper} />
              ));
            })()}
          </group>
        )}

        {/* Object Pivot */}
        {debugSettings?.showObjectPivot && (
          <group>
            <mesh>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color={debugColor} />
            </mesh>
            {/* X axis */}
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.2, 0.01, 0.01]} />
              <meshBasicMaterial color="red" />
            </mesh>
            {/* Y axis */}
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.01, 0.2, 0.01]} />
              <meshBasicMaterial color="green" />
            </mesh>
            {/* Z axis */}
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[0.01, 0.01, 0.2]} />
              <meshBasicMaterial color="blue" />
            </mesh>
          </group>
        )}
      </>
    );
  }, [debugMode, model, debugSettings, boundingBoxDimensions, config, debugColor]);

  return { renderDebugElements };
}

// Helper function to log the object hierarchy
function logObject3DHierarchy(obj: THREE.Object3D, depth = 0) {
  // @ts-expect-error isSkinnedMesh and isMesh are not standard on Object3D, but present on Mesh/SkinnedMesh
  const extra = obj.isSkinnedMesh ? ' (SkinnedMesh)' : obj.isMesh ? ' (Mesh)' : '';

  if (obj.type === 'SkinnedMesh') {
    // @ts-expect-error skeleton is not standard on Object3D, but present on SkinnedMesh
    const skeleton = obj.skeleton;
    if (skeleton) {
      // Log SkinnedMesh bones hierarchy
      skeleton.bones.map((b: THREE.Bone) => b.name);
    }
  }
  obj.children.forEach((child) => logObject3DHierarchy(child, depth + 1));
}
