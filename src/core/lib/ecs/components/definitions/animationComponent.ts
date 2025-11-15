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
    // String hash for activeBindingId
    activeBindingIdHash: Types.ui32,
    // String hash for serialized clipBindings JSON
    clipBindingsHash: Types.ui32,
  },
  serialize: (eid: EntityId, component: any) => ({
    activeBindingId: getStringFromHash(component.activeBindingIdHash[eid]) || undefined,
    playing: Boolean(component.playing[eid]),
    time: component.time[eid],
    clipBindings: (() => {
      const bindingsJson = getStringFromHash(component.clipBindingsHash[eid]);
      if (bindingsJson) {
        try {
          return JSON.parse(bindingsJson);
        } catch {
          return [];
        }
      }
      return [];
    })(),
  }),
  deserialize: (eid: EntityId, data: any, component: any) => {
    component.playing[eid] = (data.playing ?? false) ? 1 : 0;
    component.time[eid] = data.time ?? 0;

    // Store activeBindingId as string hash
    component.activeBindingIdHash[eid] = data.activeBindingId
      ? storeString(data.activeBindingId)
      : 0;

    // Store clipBindings as JSON string hash
    component.clipBindingsHash[eid] =
      data.clipBindings && data.clipBindings.length > 0
        ? storeString(JSON.stringify(data.clipBindings))
        : 0;
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
