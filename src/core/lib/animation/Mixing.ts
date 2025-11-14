import * as THREE from 'three';
import type { ITimelineEvaluation } from './TimelineEvaluator';

/**
 * Blend mode for animation mixing
 */
export enum BlendMode {
  OVERRIDE = 'override', // Replace completely
  ADDITIVE = 'additive', // Add to existing
  LAYER = 'layer', // Layer with weight
}

/**
 * Animation layer state
 */
export interface IAnimationLayer {
  evaluation: ITimelineEvaluation;
  weight: number;
  blendMode: BlendMode;
  layer: number;
}

/**
 * Cross-fade state between two animations
 */
export interface ICrossfadeState {
  fromEvaluation: ITimelineEvaluation;
  toEvaluation: ITimelineEvaluation;
  blendFactor: number; // 0 = from, 1 = to
}

/**
 * Mix multiple animation layers into a single result
 */
export function mixLayers(layers: IAnimationLayer[]): ITimelineEvaluation {
  if (layers.length === 0) {
    return {
      transforms: new Map(),
      morphs: new Map(),
      materials: new Map(),
      events: [],
    };
  }

  // Sort by layer index
  const sortedLayers = [...layers].sort((a, b) => a.layer - b.layer);

  // Start with first layer
  const result: ITimelineEvaluation = {
    transforms: new Map(sortedLayers[0].evaluation.transforms),
    morphs: new Map(sortedLayers[0].evaluation.morphs),
    materials: new Map(sortedLayers[0].evaluation.materials),
    events: [...sortedLayers[0].evaluation.events],
  };

  // Blend remaining layers
  for (let i = 1; i < sortedLayers.length; i++) {
    const layer = sortedLayers[i];
    blendLayer(result, layer);
  }

  return result;
}

/**
 * Blend a single layer into the result
 */
function blendLayer(result: ITimelineEvaluation, layer: IAnimationLayer): void {
  const { evaluation, weight, blendMode } = layer;

  // Blend transforms
  for (const [path, transform] of evaluation.transforms) {
    const existing = result.transforms.get(path);

    if (!existing) {
      result.transforms.set(path, transform);
      continue;
    }

    const blended = { ...existing };

    if (transform.position && existing.position) {
      blended.position = new THREE.Vector3().lerpVectors(
        existing.position,
        transform.position,
        weight
      );
    } else if (transform.position) {
      blended.position = transform.position;
    }

    if (transform.rotation && existing.rotation) {
      blended.rotation = new THREE.Quaternion().copy(existing.rotation).slerp(transform.rotation, weight);
    } else if (transform.rotation) {
      blended.rotation = transform.rotation;
    }

    if (transform.scale && existing.scale) {
      blended.scale = new THREE.Vector3().lerpVectors(existing.scale, transform.scale, weight);
    } else if (transform.scale) {
      blended.scale = transform.scale;
    }

    result.transforms.set(path, blended);
  }

  // Blend morphs
  for (const [path, morphs] of evaluation.morphs) {
    const existing = result.morphs.get(path) || {};
    const blended: Record<string, number> = { ...existing };

    for (const [name, value] of Object.entries(morphs)) {
      const existingValue = existing[name] || 0;
      blended[name] = blendMode === BlendMode.ADDITIVE
        ? existingValue + value * weight
        : existingValue * (1 - weight) + value * weight;
    }

    result.morphs.set(path, blended);
  }

  // Blend materials
  for (const [path, props] of evaluation.materials) {
    const existing = result.materials.get(path) || {};
    const blended: Record<string, number> = { ...existing };

    for (const [name, value] of Object.entries(props)) {
      const existingValue = existing[name] || 0;
      blended[name] = existingValue * (1 - weight) + value * weight;
    }

    result.materials.set(path, blended);
  }

  // Accumulate events
  result.events.push(...evaluation.events);
}

/**
 * Perform cross-fade between two animations
 */
export function crossfade(state: ICrossfadeState): ITimelineEvaluation {
  const { fromEvaluation, toEvaluation, blendFactor } = state;
  const t = Math.max(0, Math.min(1, blendFactor));

  const result: ITimelineEvaluation = {
    transforms: new Map(),
    morphs: new Map(),
    materials: new Map(),
    events: [],
  };

  // Collect all paths from both evaluations
  const allTransformPaths = new Set([
    ...fromEvaluation.transforms.keys(),
    ...toEvaluation.transforms.keys(),
  ]);

  // Blend transforms
  for (const path of allTransformPaths) {
    const from = fromEvaluation.transforms.get(path);
    const to = toEvaluation.transforms.get(path);

    const blended: { position?: THREE.Vector3; rotation?: THREE.Quaternion; scale?: THREE.Vector3 } = {};

    if (from?.position && to?.position) {
      blended.position = new THREE.Vector3().lerpVectors(from.position, to.position, t);
    } else if (to?.position) {
      blended.position = to.position;
    } else if (from?.position) {
      blended.position = from.position;
    }

    if (from?.rotation && to?.rotation) {
      blended.rotation = new THREE.Quaternion().copy(from.rotation).slerp(to.rotation, t);
    } else if (to?.rotation) {
      blended.rotation = to.rotation;
    } else if (from?.rotation) {
      blended.rotation = from.rotation;
    }

    if (from?.scale && to?.scale) {
      blended.scale = new THREE.Vector3().lerpVectors(from.scale, to.scale, t);
    } else if (to?.scale) {
      blended.scale = to.scale;
    } else if (from?.scale) {
      blended.scale = from.scale;
    }

    result.transforms.set(path, blended);
  }

  // Blend morphs
  const allMorphPaths = new Set([...fromEvaluation.morphs.keys(), ...toEvaluation.morphs.keys()]);
  for (const path of allMorphPaths) {
    const from = fromEvaluation.morphs.get(path) || {};
    const to = toEvaluation.morphs.get(path) || {};
    const blended: Record<string, number> = {};

    const allMorphNames = new Set([...Object.keys(from), ...Object.keys(to)]);
    for (const name of allMorphNames) {
      const fromValue = from[name] || 0;
      const toValue = to[name] || 0;
      blended[name] = fromValue * (1 - t) + toValue * t;
    }

    result.morphs.set(path, blended);
  }

  // Blend materials
  const allMaterialPaths = new Set([...fromEvaluation.materials.keys(), ...toEvaluation.materials.keys()]);
  for (const path of allMaterialPaths) {
    const from = fromEvaluation.materials.get(path) || {};
    const to = toEvaluation.materials.get(path) || {};
    const blended: Record<string, number> = {};

    const allPropNames = new Set([...Object.keys(from), ...Object.keys(to)]);
    for (const name of allPropNames) {
      const fromValue = from[name] || 0;
      const toValue = to[name] || 0;
      blended[name] = fromValue * (1 - t) + toValue * t;
    }

    result.materials.set(path, blended);
  }

  // Events from both animations
  result.events.push(...fromEvaluation.events, ...toEvaluation.events);

  return result;
}
