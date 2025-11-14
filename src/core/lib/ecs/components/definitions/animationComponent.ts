import { Types } from 'bitecs';
import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';
import type { EntityId } from '../../types';
import {
  AnimationComponentSchema,
  type IAnimationComponent,
} from '@core/components/animation/AnimationComponent';

/**
 * Animation Component Definition
 *
 * Provides animation playback control for entities with support for:
 * - Multiple animation clips
 * - Keyframe animation tracks (transform, morph, material)
 * - Blending and crossfade
 * - Timeline-based sequencing
 */
export const animationComponent = ComponentFactory.create({
  id: 'Animation',
  name: 'Animation',
  category: ComponentCategory.Rendering,
  schema: AnimationComponentSchema,
  fields: {
    blendIn: Types.f32,
    blendOut: Types.f32,
    layer: Types.ui8,
    weight: Types.f32,
    playing: Types.ui8,
    time: Types.f32,
    version: Types.ui8,
    // String hash for activeClipId
    activeClipIdHash: Types.ui32,
    // String hash for serialized clips JSON
    clipsHash: Types.ui32,
  },
  serialize: (eid: EntityId, component: any) => ({
    activeClipId: getStringFromHash(component.activeClipIdHash[eid]) || undefined,
    blendIn: component.blendIn[eid],
    blendOut: component.blendOut[eid],
    layer: component.layer[eid],
    weight: component.weight[eid],
    playing: Boolean(component.playing[eid]),
    time: component.time[eid],
    clips: (() => {
      const clipsJson = getStringFromHash(component.clipsHash[eid]);
      if (clipsJson) {
        try {
          return JSON.parse(clipsJson);
        } catch {
          return [];
        }
      }
      return [];
    })(),
    version: component.version[eid],
  }),
  deserialize: (eid: EntityId, data: any, component: any) => {
    component.blendIn[eid] = data.blendIn ?? 0.2;
    component.blendOut[eid] = data.blendOut ?? 0.2;
    component.layer[eid] = data.layer ?? 0;
    component.weight[eid] = data.weight ?? 1;
    component.playing[eid] = (data.playing ?? false) ? 1 : 0;
    component.time[eid] = data.time ?? 0;
    component.version[eid] = data.version ?? 1;

    // Store activeClipId as string hash
    component.activeClipIdHash[eid] = data.activeClipId ? storeString(data.activeClipId) : 0;

    // Store clips as JSON string hash
    component.clipsHash[eid] =
      data.clips && data.clips.length > 0 ? storeString(JSON.stringify(data.clips)) : 0;
  },
  onAdd: (_eid: EntityId, _data: unknown) => {
    // Empty callback - initialization handled in deserialize
  },
  onRemove: (_eid: EntityId) => {
    // Empty callback - cleanup if needed
  },
  metadata: {
    description: 'Animation playback control with timeline support',
    version: '1.0.0',
  },
});

export type AnimationData = IAnimationComponent;
