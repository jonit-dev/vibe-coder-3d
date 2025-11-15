import { create } from 'zustand';
import * as THREE from 'three';
import type { IClip } from '@core/components/animation/AnimationComponent';
import type { IKeyframe, KeyframeValue } from '@core/components/animation/tracks/TrackTypes';
import {
  TrackType,
  getDefaultKeyframeValueForTrackType,
} from '@core/components/animation/tracks/TrackTypes';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import type { ITransformData } from '@core/lib/ecs/components/TransformComponent';
import { AnimationRegistry } from '@core/animation/AnimationRegistry';
import type { IAnimationAsset } from '@core/animation/assets/defineAnimations';

export interface ITimelineSelection {
  clipId: string | null;
  trackId: string | null;
  keyframeIndices: number[];
}

export interface ITimelineState {
  // UI State
  isOpen: boolean;

  // Playback
  currentTime: number;
  playing: boolean;
  loop: boolean;

  // View
  zoom: number; // Pixels per second
  pan: number; // Scroll offset in pixels
  snapEnabled: boolean;
  snapInterval: number; // In seconds

  // Selection
  selection: ITimelineSelection;

  // Active editing
  activeEntityId: number | null;
  activeClip: IClip | null;

  // Clipboard
  clipboard: IKeyframe[] | null;

  // Undo/Redo history
  history: IClip[];
  historyIndex: number;
  initialClip: IClip | null; // Store initial state for undo

  // Actions - UI
  setIsOpen: (isOpen: boolean) => void;

  // Actions - Playback
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  togglePlay: () => void;
  setLoop: (loop: boolean) => void;

  // Actions - View
  setZoom: (zoom: number) => void;
  setPan: (pan: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleSnap: () => void;
  setSnapInterval: (interval: number) => void;
  frameView: (duration: number) => void; // Fit entire timeline to view

  // Actions - Selection
  selectKeyframes: (trackId: string, indices: number[]) => void;
  clearSelection: () => void;
  selectTrack: (trackId: string) => void;

  // Actions - Editing
  setActiveEntity: (entityId: number | null, clip: IClip | null) => void;
  updateClip: (clip: IClip) => void;
  addKeyframe: (trackId: string, keyframe: IKeyframe) => void;
  removeKeyframe: (trackId: string, index: number) => void;
  moveKeyframe: (trackId: string, index: number, newTime: number) => void;
  updateKeyframeValue: (trackId: string, index: number, value: unknown) => void;

  // Actions - Clipboard
  copyKeyframes: () => void;
  pasteKeyframes: () => void;

  // Actions - Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (clip: IClip) => void;
}

function getEntityTransform(entityId: number | null): ITransformData | null {
  if (entityId == null) return null;
  return (
    componentRegistry.getComponentData<ITransformData>(entityId, KnownComponentTypes.TRANSFORM) ||
    null
  );
}

function toQuaternion(rotation: [number, number, number]): [number, number, number, number] {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(rotation[0] || 0),
    THREE.MathUtils.degToRad(rotation[1] || 0),
    THREE.MathUtils.degToRad(rotation[2] || 0),
    'XYZ',
  );
  const quat = new THREE.Quaternion().setFromEuler(euler);
  return [quat.x, quat.y, quat.z, quat.w];
}

function sampleValueForTrackType(
  trackType: string,
  entityId: number | null,
  fallback: KeyframeValue,
): KeyframeValue {
  if (!entityId) {
    return fallback ?? getDefaultKeyframeValueForTrackType(trackType);
  }

  const transform = getEntityTransform(entityId);
  if (!transform) {
    return fallback ?? getDefaultKeyframeValueForTrackType(trackType);
  }

  if (trackType === TrackType.TRANSFORM_POSITION && transform.position) {
    return [...transform.position] as [number, number, number];
  }

  if (trackType === TrackType.TRANSFORM_SCALE && transform.scale) {
    return [...transform.scale] as [number, number, number];
  }

  if (trackType === TrackType.TRANSFORM_ROTATION && transform.rotation) {
    return toQuaternion(transform.rotation as [number, number, number]);
  }

  return fallback ?? getDefaultKeyframeValueForTrackType(trackType);
}

function cloneClip(clip: IClip): IClip {
  return JSON.parse(JSON.stringify(clip)) as IClip;
}

function syncClipToAnimationComponent(entityId: number | null, clip: IClip | null): void {
  if (entityId == null || !clip) return;

  // Update clip in AnimationRegistry
  const registry = AnimationRegistry.getInstance();
  // Convert IClip to IAnimationAsset (add required tags property with default)
  const asset: IAnimationAsset = {
    ...clip,
    tags: [],
  };
  registry.upsert(asset);

  // Get current animation component to trigger update
  const animationComponent = componentRegistry.getComponentData(entityId, KnownComponentTypes.ANIMATION);
  if (animationComponent) {
    // Update the component to trigger change detection
    componentRegistry.updateComponent(entityId, KnownComponentTypes.ANIMATION, animationComponent);
  }
}

export const useTimelineStore = create<ITimelineState>((set, get) => ({
  // Initial state
  isOpen: false,
  currentTime: 0,
  playing: false,
  loop: false,
  zoom: 100, // 100 pixels per second
  pan: 0,
  snapEnabled: true,
  snapInterval: 0.1, // 100ms grid
  selection: {
    clipId: null,
    trackId: null,
    keyframeIndices: [],
  },
  activeEntityId: null,
  activeClip: null,
  clipboard: null,
  history: [],
  historyIndex: -1,
  initialClip: null,

  // UI actions
  setIsOpen: (isOpen) => {
    // When closing the timeline, clear the active entity to properly cleanup focus effects
    if (!isOpen) {
      set({ isOpen, activeEntityId: null, activeClip: null, playing: false });
    } else {
      set({ isOpen });
    }
  },

  // Playback actions
  setCurrentTime: (time) => set({ currentTime: Math.max(0, time) }),

  play: () => set({ playing: true }),

  pause: () => set({ playing: false }),

  stop: () => set({ playing: false, currentTime: 0 }),

  togglePlay: () => set((state) => ({ playing: !state.playing })),

  setLoop: (loop) => set({ loop }),

  // View actions
  setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(1000, zoom)) }),

  setPan: (pan) => set({ pan }),

  zoomIn: () => set((state) => ({ zoom: Math.min(1000, state.zoom * 1.5) })),

  zoomOut: () => set((state) => ({ zoom: Math.max(10, state.zoom / 1.5) })),

  toggleSnap: () => set((state) => ({ snapEnabled: !state.snapEnabled })),

  setSnapInterval: (interval) => set({ snapInterval: Math.max(0.01, interval) }),

  frameView: (duration) => {
    // Calculate zoom to fit duration in view (assume 800px wide viewport)
    const viewportWidth = 800;
    const zoom = viewportWidth / duration;
    set({ zoom: Math.max(10, Math.min(1000, zoom)), pan: 0 });
  },

  // Selection actions
  selectKeyframes: (trackId, indices) =>
    set((state) => ({
      selection: {
        ...state.selection,
        trackId,
        keyframeIndices: indices,
      },
    })),

  clearSelection: () =>
    set({
      selection: {
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      },
    }),

  selectTrack: (trackId) =>
    set((state) => ({
      selection: {
        ...state.selection,
        trackId,
        keyframeIndices: [],
      },
    })),

  // Editing actions
  setActiveEntity: (entityId, clip) => {
    const clipClone = clip ? cloneClip(clip) : null;
    set({
      activeEntityId: entityId,
      activeClip: clipClone,
      currentTime: 0,
      playing: false,
      // Reset history state when setting a new entity
      history: [],
      historyIndex: -1,
      initialClip: null,
    });

    // Don't automatically push to history - let updateClip handle that
  },

  updateClip: (clip) => {
    const { activeClip, initialClip } = get();

    // Store initial clip if not already stored and push it to history
    if (!initialClip && activeClip) {
      set({ initialClip: cloneClip(activeClip) });
      // Push the initial state to history as the first entry
      get().pushHistory(activeClip);
    }

    // Push new state to history if it's different from the current state
    if (activeClip && JSON.stringify(activeClip) !== JSON.stringify(clip)) {
      get().pushHistory(clip);
    }

    set({ activeClip: clip });
    syncClipToAnimationComponent(get().activeEntityId, clip);
  },

  addKeyframe: (trackId, keyframe) => {
    const { activeClip, activeEntityId } = get();
    if (!activeClip) return;

    const newClip = cloneClip(activeClip);
    const track = newClip.tracks.find((t) => t.id === trackId);

    if (track) {
      const sampledValue = sampleValueForTrackType(track.type, activeEntityId, keyframe.value);
      const nextKeyframe: IKeyframe = {
        ...keyframe,
        value: sampledValue,
      };
      track.keyframes = [...track.keyframes, nextKeyframe].sort((a, b) => a.time - b.time);
      get().updateClip(newClip);
    }
  },

  removeKeyframe: (trackId, index) => {
    const { activeClip } = get();
    if (!activeClip) return;

    const newClip = cloneClip(activeClip);
    const track = newClip.tracks.find((t) => t.id === trackId);

    if (track) {
      track.keyframes = track.keyframes.filter((_, i) => i !== index);
      get().updateClip(newClip);
    }
  },

  moveKeyframe: (trackId, index, newTime) => {
    const { activeClip, snapEnabled, snapInterval } = get();
    if (!activeClip) return;

    // Apply snapping if enabled
    let finalTime = newTime;
    if (snapEnabled) {
      finalTime = Math.round(newTime / snapInterval) * snapInterval;
    }

    const newClip = cloneClip(activeClip);
    const track = newClip.tracks.find((t) => t.id === trackId);

    if (track && track.keyframes[index]) {
      track.keyframes[index] = {
        ...track.keyframes[index],
        time: Math.max(0, finalTime),
      };
      track.keyframes.sort((a, b) => a.time - b.time);
      get().updateClip(newClip);
    }
  },

  updateKeyframeValue: (trackId, index, value) => {
    const { activeClip } = get();
    if (!activeClip) return;

    const newClip = cloneClip(activeClip);
    const track = newClip.tracks.find((t) => t.id === trackId);

    if (track && track.keyframes[index]) {
      track.keyframes[index] = {
        ...track.keyframes[index],
        value: value as
          | number
          | [number, number, number]
          | [number, number, number, number]
          | Record<string, number>,
      };
      get().updateClip(newClip);
    }
  },

  // Clipboard actions
  copyKeyframes: () => {
    const { activeClip, selection } = get();
    if (!activeClip || !selection.trackId || selection.keyframeIndices.length === 0) return;

    const track = activeClip.tracks.find((t) => t.id === selection.trackId);
    if (!track) return;

    const copiedKeyframes = selection.keyframeIndices
      .map((index) => track.keyframes[index])
      .filter((kf) => kf !== undefined)
      .map((kf) => JSON.parse(JSON.stringify(kf))); // Deep clone

    set({ clipboard: copiedKeyframes });
  },

  pasteKeyframes: () => {
    const { activeClip, selection, clipboard, currentTime } = get();
    if (!activeClip || !selection.trackId || !clipboard || clipboard.length === 0) return;

    const track = activeClip.tracks.find((t) => t.id === selection.trackId);
    if (!track) return;

    // Find the earliest time in clipboard
    const minTime = Math.min(...clipboard.map((kf) => kf.time));
    const timeOffset = currentTime - minTime;

    // Paste keyframes at current time
    const pastedKeyframes = clipboard.map((kf) => ({
      ...JSON.parse(JSON.stringify(kf)),
      time: Math.max(0, kf.time + timeOffset),
    }));

    const newClip = { ...activeClip };
    const newTrack = newClip.tracks.find((t) => t.id === selection.trackId);
    if (newTrack) {
      newTrack.keyframes = [...newTrack.keyframes, ...pastedKeyframes].sort(
        (a, b) => a.time - b.time,
      );
      get().updateClip(newClip);
    }
  },

  // Undo/Redo
  pushHistory: (clip) =>
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneClip(clip)); // Deep clone

      // Keep last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
      }

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  undo: () => {
    const { history, historyIndex, initialClip, activeClip } = get();

    // If we have a current state that's not in history, push it to history first
    if (historyIndex >= 0 && activeClip) {
      get().pushHistory(activeClip);
    }

    if (historyIndex >= 0) {
      const newIndex = historyIndex - 1;
      if (newIndex >= 0) {
        // Restore from history
        set({
          activeClip: cloneClip(history[newIndex]),
          historyIndex: newIndex,
        });
      } else {
        // No more history, restore from initial clip
        set({
          activeClip: initialClip ? cloneClip(initialClip) : null,
          historyIndex: -1,
        });
      }
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        activeClip: cloneClip(history[newIndex]),
        historyIndex: newIndex,
      });
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex >= 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
}));
