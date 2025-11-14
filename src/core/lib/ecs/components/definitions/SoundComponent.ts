/**
 * Sound Component Definition
 * Handles 3D audio playback with spatial positioning and playback controls
 */

import { Types } from 'bitecs';
import { z } from 'zod';

import { ComponentCategory, ComponentFactory } from '../../ComponentRegistry';
import { EntityId } from '../../types';
import { getStringFromHash, storeString } from '../../utils/stringHashUtils';

// Sound Schema
const SoundSchema = z.object({
  audioPath: z.string().describe('Path to the audio file'),
  enabled: z.boolean().default(true).describe('Enable/disable sound playback'),
  autoplay: z.boolean().default(false).describe('Start playing automatically'),
  loop: z.boolean().default(false).describe('Loop the audio'),
  volume: z.number().min(0).max(1).default(1).describe('Volume level (0-1)'),
  pitch: z.number().min(0.1).max(4).default(1).describe('Pitch multiplier (0.1-4)'),
  playbackRate: z.number().min(0.1).max(4).default(1).describe('Playback rate multiplier'),

  // 3D Spatial Audio Properties
  is3D: z.boolean().default(true).describe('Enable 3D spatial audio'),
  minDistance: z.number().min(0).default(1).describe('Reference distance for volume falloff'),
  maxDistance: z.number().min(0).default(10000).describe('Maximum distance where audio is audible'),
  rolloffFactor: z
    .number()
    .min(0)
    .max(1)
    .default(1)
    .describe('How quickly volume decreases with distance'),
  coneInnerAngle: z.number().min(0).max(360).default(360).describe('Inner cone angle in degrees'),
  coneOuterAngle: z.number().min(0).max(360).default(360).describe('Outer cone angle in degrees'),
  coneOuterGain: z.number().min(0).max(1).default(0).describe('Volume at outer cone'),

  // Playback State (read-only, managed by system)
  isPlaying: z.boolean().default(false).describe('Current playback state'),
  currentTime: z.number().default(0).describe('Current playback position in seconds'),
  duration: z.number().default(0).describe('Total duration of the audio in seconds'),

  // Audio Format Info (auto-detected)
  format: z.string().optional().describe('Audio format (mp3, wav, ogg, etc.)'),

  // Effects
  muted: z.boolean().default(false).describe('Mute this specific sound'),
});

// Sound Component Definition
export const soundComponent = ComponentFactory.create({
  id: 'Sound',
  name: 'Sound',
  category: ComponentCategory.Audio,
  schema: SoundSchema,
  fields: {
    // Core properties
    enabled: Types.ui8,
    autoplay: Types.ui8,
    loop: Types.ui8,
    volume: Types.f32,
    pitch: Types.f32,
    playbackRate: Types.f32,
    muted: Types.ui8,

    // 3D Audio properties
    is3D: Types.ui8,
    minDistance: Types.f32,
    maxDistance: Types.f32,
    rolloffFactor: Types.f32,
    coneInnerAngle: Types.f32,
    coneOuterAngle: Types.f32,
    coneOuterGain: Types.f32,

    // State properties
    isPlaying: Types.ui8,
    currentTime: Types.f32,
    duration: Types.f32,

    // String hashes for audio path and format
    audioPathHash: Types.ui32,
    formatHash: Types.ui32,

    // Update flags for system optimization
    needsUpdate: Types.ui8,
    needsReload: Types.ui8,
  },
  serialize: (eid: EntityId, component: any) => ({
    audioPath: getStringFromHash(component.audioPathHash[eid]),
    enabled: Boolean(component.enabled[eid]),
    autoplay: Boolean(component.autoplay[eid]),
    loop: Boolean(component.loop[eid]),
    volume: component.volume[eid],
    pitch: component.pitch[eid],
    playbackRate: component.playbackRate[eid],
    muted: Boolean(component.muted[eid]),

    // 3D properties
    is3D: Boolean(component.is3D[eid]),
    minDistance: component.minDistance[eid],
    maxDistance: component.maxDistance[eid],
    rolloffFactor: component.rolloffFactor[eid],
    coneInnerAngle: component.coneInnerAngle[eid],
    coneOuterAngle: component.coneOuterAngle[eid],
    coneOuterGain: component.coneOuterGain[eid],

    // State properties
    isPlaying: Boolean(component.isPlaying[eid]),
    currentTime: component.currentTime[eid],
    duration: component.duration[eid],

    format: getStringFromHash(component.formatHash[eid]) || undefined,
  }),
  deserialize: (eid: EntityId, data, component: any) => {
    // Core properties
    component.enabled[eid] = (data.enabled ?? true) ? 1 : 0;
    component.autoplay[eid] = (data.autoplay ?? false) ? 1 : 0;
    component.loop[eid] = (data.loop ?? false) ? 1 : 0;
    component.volume[eid] = data.volume ?? 1;
    component.pitch[eid] = data.pitch ?? 1;
    component.playbackRate[eid] = data.playbackRate ?? 1;
    component.muted[eid] = (data.muted ?? false) ? 1 : 0;

    // 3D properties
    component.is3D[eid] = (data.is3D ?? true) ? 1 : 0;
    component.minDistance[eid] = data.minDistance ?? 1;
    component.maxDistance[eid] = data.maxDistance ?? 10000;
    component.rolloffFactor[eid] = data.rolloffFactor ?? 1;
    component.coneInnerAngle[eid] = data.coneInnerAngle ?? 360;
    component.coneOuterAngle[eid] = data.coneOuterAngle ?? 360;
    component.coneOuterGain[eid] = data.coneOuterGain ?? 0;

    // State properties (usually managed by system)
    component.isPlaying[eid] = (data.isPlaying ?? false) ? 1 : 0;
    component.currentTime[eid] = data.currentTime ?? 0;
    component.duration[eid] = data.duration ?? 0;

    // String properties
    component.audioPathHash[eid] = storeString(data.audioPath || '');
    component.formatHash[eid] = data.format ? storeString(data.format) : 0;

    // Mark for update when component data changes
    component.needsUpdate[eid] = 1;

    // Mark for reload if audio path changed
    if (data.audioPath) {
      component.needsReload[eid] = 1;
    }
  },
  dependencies: ['Transform'], // Need transform for 3D positioning
  onAdd: () => {},
  onRemove: () => {},
  metadata: {
    description: '3D spatial audio system with playback controls and effects',
    version: '1.0.0',
    tags: ['audio', '3d', 'spatial', 'howler'],
  },
});

export type SoundData = z.infer<typeof SoundSchema>;
