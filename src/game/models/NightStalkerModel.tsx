import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

import { useAsset } from '@/core/hooks/useAsset';
import { IAnimationControls, useModelAnimations } from '@/core/hooks/useModelAnimations';
import { AssetKeys, IModelConfig } from '@/core/types/assets';

function logObject3DHierarchy(obj: THREE.Object3D, depth = 0) {
  const pad = '  '.repeat(depth);
  // @ts-expect-error isSkinnedMesh and isMesh are not standard on Object3D, but present on Mesh/SkinnedMesh
  const extra = obj.isSkinnedMesh ? ' (SkinnedMesh)' : obj.isMesh ? ' (Mesh)' : '';
  console.log(`${pad}${obj.name} [${obj.type}]${extra}`);
  if (obj.type === 'SkinnedMesh') {
    // @ts-expect-error skeleton is not standard on Object3D, but present on SkinnedMesh
    const skeleton = obj.skeleton;
    if (skeleton) {
      console.log(
        `${pad}  SkinnedMesh bones:`,
        skeleton.bones.map((b: any) => b.name),
      );
    }
  }
  obj.children.forEach((child) => logObject3DHierarchy(child, depth + 1));
}

interface INightStalkerModelProps {
  onAnimationsReady?: (controls: IAnimationControls) => void;
  debug?: boolean;
}

export function NightStalkerModel({ onAnimationsReady, debug = false }: INightStalkerModelProps) {
  const { gltf, model, ref, config } = useAsset(AssetKeys.NightStalkerModel);
  const modelConfig = config as IModelConfig;
  const animationUrls = modelConfig?.animations ?? [];
  // Load all animation GLBs
  const animationGLTFs = animationUrls.map((url) => useGLTF(url));
  const [boneMap, setBoneMap] = useState<Record<string, string>>({});

  // EXTENDED DEBUG: Log the full GLTF and model hierarchy
  useEffect(() => {
    if (!model || !debug) return;
    console.log('NightStalkerModel: FULL gltf', gltf);
    console.log('NightStalkerModel: model object', model);
    logObject3DHierarchy(model);
    // Log all meshes and skinned meshes
    model.traverse((obj: THREE.Object3D) => {
      // @ts-expect-error isSkinnedMesh is not standard on Object3D, but present on SkinnedMesh
      if (obj.isSkinnedMesh) {
        console.log('NightStalkerModel: Found SkinnedMesh:', obj.name, obj);
        // @ts-expect-error skeleton is not standard on Object3D, but present on SkinnedMesh
        if (obj.skeleton) {
          // @ts-expect-error skeleton is not standard on Object3D, but present on SkinnedMesh
          console.log(
            'NightStalkerModel: SkinnedMesh bones:',
            obj.skeleton.bones.map((b: any) => b.name),
          );
        }
      } else if ((obj as any).isMesh) {
        console.log('NightStalkerModel: Found Mesh:', obj.name, obj);
      }
    });
  }, [model, gltf, debug]);

  // Create a map of mixamo bones to actual model bones
  useEffect(() => {
    if (!model) return;
    const mixamoPrefix = 'mixamorig';
    const modelBones: string[] = [];
    const mixamoToBoneMap: Record<string, string> = {};

    model.traverse((obj: THREE.Object3D) => {
      if (obj.type === 'Bone') {
        modelBones.push(obj.name);

        // If this is a mixamo-prefixed bone, add it to the map
        if (obj.name.startsWith(mixamoPrefix)) {
          // The bone names might already match or might need retargeting
          mixamoToBoneMap[obj.name] = obj.name;
        }
      }
    });

    if (debug) {
      console.log('NightStalkerModel: Model bones:', modelBones);
      console.log('NightStalkerModel: Generated bone map:', mixamoToBoneMap);
    }

    setBoneMap(mixamoToBoneMap);
  }, [model, debug]);

  // Merge all animation clips and retarget them
  const allClips = useMemo(() => {
    if (Object.keys(boneMap).length === 0) return [];
    let clips: THREE.AnimationClip[] = [];

    // Add main model animations if they exist
    if (gltf && 'animations' in gltf && gltf.animations) {
      clips = [...gltf.animations];
    }

    // Add animation GLTFs and retarget them if needed
    for (const animGLTF of animationGLTFs) {
      if (animGLTF && 'animations' in animGLTF && animGLTF.animations) {
        const retargetedClips = animGLTF.animations.map((clip) => {
          // Clone the animation clip
          const retargetedClip = THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(clip));

          if (debug) {
            console.log(
              'NightStalkerModel: Original animation tracks:',
              clip.tracks.map((track) => track.name),
            );
          }

          // Update each track for bone retargeting if needed
          retargetedClip.tracks = retargetedClip.tracks.map((track) => {
            const trackSplit = track.name.split('.');
            if (trackSplit.length < 2) return track;

            const boneName = trackSplit[0];
            const property = trackSplit[1];

            // Use the bone map to retarget if needed
            if (boneMap[boneName]) {
              const newTrackName = `${boneMap[boneName]}.${property}`;
              const newTrack = track.clone();
              newTrack.name = newTrackName;
              return newTrack;
            }

            return track;
          });

          if (debug) {
            console.log(
              'NightStalkerModel: Retargeted animation tracks:',
              retargetedClip.tracks.map((track) => track.name),
            );
          }

          return retargetedClip;
        });

        clips.push(...retargetedClips);
      }
    }

    return clips;
  }, [gltf, animationGLTFs, boneMap, debug]);

  // Use the animation hook and capture results
  const animationControls = useModelAnimations(allClips, ref, {
    initialAnimation: modelConfig?.initialAnimation,
    onReady: (actions, names) => {
      if (debug) {
        console.log('NightStalkerModel: Available animation actions:', names);
      }
      if (onAnimationsReady) {
        onAnimationsReady(animationControls);
      }
    },
  });

  // Determine positioning based on config
  const groupPosition: [number, number, number] = modelConfig?.position ?? [0, 0, 0];

  return model ? (
    <group position={groupPosition}>
      <primitive object={model} ref={ref} />
    </group>
  ) : null;
}
