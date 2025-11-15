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
 * - Timeline-based sequencing
 */
export const animationComponent = ComponentFactory.create({
  id: 'Animation',
  name: 'Animation',
  category: ComponentCategory.Rendering,
  schema: AnimationComponentSchema,
  fields: {
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
    component.playing[eid] = (data.playing ?? false) ? 1 : 0;
    component.time[eid] = data.time ?? 0;
    component.version[eid] = data.version ?? 1;

    // Store activeClipId as string hash
    component.activeClipIdHash[eid] = data.activeClipId ? storeString(data.activeClipId) : 0;

    // Store clips as JSON string hash
    component.clipsHash[eid] =
      data.clips && data.clips.length > 0 ? storeString(JSON.stringify(data.clips)) : 0;
  },
  onAdd: () => {
    // Empty callback - initialization handled in deserialize
  },
  onRemove: () => {
    // Empty callback - cleanup if needed
  },
  metadata: {
    description: 'Animation playback control with timeline support',
    version: '1.0.0',
  },
});

export type AnimationData = IAnimationComponent;
