import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';

import { IAnimationControls, useModelAnimations } from '@/core/hooks/useModelAnimations';
import { IModelConfig } from '@/core/types/assets';

interface IUseMixamoAnimationsOptions {
  model: THREE.Object3D | null;
  modelConfig: IModelConfig;
  debug?: boolean;
  onAnimationsReady?: (controls: IAnimationControls) => void;
}

export function useMixamoAnimations({
  model,
  modelConfig,
  debug = false,
  onAnimationsReady,
}: IUseMixamoAnimationsOptions) {
  const animationUrls = modelConfig?.animations ?? [];
  const [boneMap, setBoneMap] = useState<Record<string, string>>({});

  // Load all animation GLBs
  const animationGLTFs = animationUrls.map((url) => useGLTF(url));

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
      console.log('Model: Model bones:', modelBones);
      console.log('Model: Generated bone map:', mixamoToBoneMap);
    }

    setBoneMap(mixamoToBoneMap);
  }, [model, debug]);

  // Merge all animation clips and retarget them
  const allClips = useMemo(() => {
    if (Object.keys(boneMap).length === 0) return [];
    let clips: THREE.AnimationClip[] = [];

    // Add main model animations if they exist
    if (model && 'animations' in (model as any) && (model as any).animations) {
      clips = [...(model as any).animations];
    }

    // Add animation GLTFs and retarget them if needed
    for (const animGLTF of animationGLTFs) {
      if (animGLTF && 'animations' in animGLTF && animGLTF.animations) {
        const retargetedClips = animGLTF.animations.map((clip) => {
          // Clone the animation clip
          const retargetedClip = THREE.AnimationClip.parse(THREE.AnimationClip.toJSON(clip));

          if (debug) {
            console.log(
              'Model: Original animation tracks:',
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
              'Model: Retargeted animation tracks:',
              retargetedClip.tracks.map((track) => track.name),
            );
          }

          return retargetedClip;
        });

        clips.push(...retargetedClips);
      }
    }

    return clips;
  }, [model, animationGLTFs, boneMap, debug]);

  // Create reference for the model object
  const ref = useMemo(() => ({ current: model }), [model]);

  // Use the animation hook and capture results
  const animationControls = useModelAnimations(allClips, ref, {
    initialAnimation: modelConfig?.initialAnimation,
    onReady: (actions, names) => {
      if (debug) {
        console.log('Model: Available animation actions:', names);
      }
      if (onAnimationsReady) {
        onAnimationsReady(animationControls);
      }
    },
  });

  return { animationControls };
}
