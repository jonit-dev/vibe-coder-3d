import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useTimelineStore } from '@editor/store/timelineStore';
import type { IClip, IAnimationComponent } from '@core/components/animation/AnimationComponent';
import type { ITrack, IKeyframe } from '@core/components/animation/tracks/TrackTypes';
import { componentRegistry } from '@core/lib/ecs/ComponentRegistry';
import { KnownComponentTypes } from '@core/lib/ecs/IComponent';
import type { ITransformData } from '@core/lib/ecs/components/TransformComponent';

vi.mock('@core/lib/ecs/ComponentRegistry', () => ({
  componentRegistry: {
    getComponentData: vi.fn(),
    updateComponent: vi.fn(),
  },
}));

const mockComponentRegistry = vi.mocked(componentRegistry);

// Mock animation clip for testing
const mockClip: IClip = {
  id: 'test-clip',
  name: 'Test Clip',
  duration: 2,
  loop: true,
  timeScale: 1,
  tracks: [
    {
      id: 'position-track',
      type: 'transform.position',
      targetPath: 'root',
      keyframes: [
        { time: 0, value: 0, easing: 'linear' },
        { time: 1, value: 10, easing: 'linear' },
        { time: 2, value: 20, easing: 'linear' },
      ],
    },
    {
      id: 'rotation-track',
      type: 'transform.rotation',
      targetPath: 'root',
      keyframes: [
        { time: 0, value: [0, 0, 0, 1], easing: 'linear' },
        { time: 1, value: [0, 1, 0, 1], easing: 'linear' },
      ],
    },
  ],
};

const defaultTransform: ITransformData = {
  position: [1, 2, 3],
  rotation: [10, 20, 30],
  scale: [1, 1, 1],
};

const createAnimationComponent = (): IAnimationComponent => ({
  activeClipId: mockClip.id,
  blendIn: 0.2,
  blendOut: 0.2,
  layer: 0,
  weight: 1,
  playing: false,
  time: 0,
  clips: [JSON.parse(JSON.stringify(mockClip))],
  version: 1,
});

describe('useTimelineStore', () => {
  beforeEach(() => {
    mockComponentRegistry.getComponentData.mockReset();
    mockComponentRegistry.updateComponent.mockReset();
    mockComponentRegistry.getComponentData.mockImplementation(() => null);
  });
  beforeEach(() => {
    // Reset store before each test
    useTimelineStore.setState({
      currentTime: 0,
      playing: false,
      loop: false,
      zoom: 100,
      pan: 0,
      snapEnabled: true,
      snapInterval: 0.1,
      selection: {
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      },
      activeEntityId: null,
      activeClip: null,
      history: [],
      historyIndex: -1,
    });
  });

  describe('Playback Controls', () => {
    it('should initialize with default playback state', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.currentTime).toBe(0);
      expect(result.current.playing).toBe(false);
      expect(result.current.loop).toBe(false);
    });

    it('should set current time', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setCurrentTime(1.5);
      });

      expect(result.current.currentTime).toBe(1.5);
    });

    it('should not allow negative time', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setCurrentTime(-1);
      });

      expect(result.current.currentTime).toBe(0);
    });

    it('should play and pause', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.play();
      });

      expect(result.current.playing).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.playing).toBe(false);
    });

    it('should stop and reset time', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setCurrentTime(2);
        result.current.play();
        result.current.stop();
      });

      expect(result.current.playing).toBe(false);
      expect(result.current.currentTime).toBe(0);
    });

    it('should toggle play state', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.playing).toBe(false);

      act(() => {
        result.current.togglePlay();
      });

      expect(result.current.playing).toBe(true);

      act(() => {
        result.current.togglePlay();
      });

      expect(result.current.playing).toBe(false);
    });

    it('should set loop state', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.loop).toBe(false);

      act(() => {
        result.current.setLoop(true);
      });

      expect(result.current.loop).toBe(true);
    });
  });

  describe('View Controls', () => {
    it('should initialize with default view state', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.zoom).toBe(100);
      expect(result.current.pan).toBe(0);
      expect(result.current.snapEnabled).toBe(true);
      expect(result.current.snapInterval).toBe(0.1);
    });

    it('should set zoom within bounds', () => {
      const { result } = renderHook(() => useTimelineStore());

      // Normal zoom
      act(() => {
        result.current.setZoom(200);
      });
      expect(result.current.zoom).toBe(200);

      // Below minimum
      act(() => {
        result.current.setZoom(5);
      });
      expect(result.current.zoom).toBe(10);

      // Above maximum
      act(() => {
        result.current.setZoom(2000);
      });
      expect(result.current.zoom).toBe(1000);
    });

    it('should zoom in and out', () => {
      const { result } = renderHook(() => useTimelineStore());

      const initialZoom = result.current.zoom;

      act(() => {
        result.current.zoomIn();
      });

      expect(result.current.zoom).toBe(initialZoom * 1.5);

      act(() => {
        result.current.zoomOut();
      });

      expect(result.current.zoom).toBe(initialZoom);
    });

    it('should set pan', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setPan(50);
      });

      expect(result.current.pan).toBe(50);
    });

    it('should toggle snap', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.snapEnabled).toBe(true);

      act(() => {
        result.current.toggleSnap();
      });

      expect(result.current.snapEnabled).toBe(false);
    });

    it('should set snap interval with minimum', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.setSnapInterval(0.05);
      });

      expect(result.current.snapInterval).toBe(0.05);

      act(() => {
        result.current.setSnapInterval(0.005); // Below minimum
      });

      expect(result.current.snapInterval).toBe(0.01);
    });

    it('should frame view to fit duration', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.frameView(4); // 4 second duration
      });

      // Should fit 4 seconds in 800px viewport = 200px/second zoom
      expect(result.current.zoom).toBe(200);
      expect(result.current.pan).toBe(0);
    });
  });

  describe('Selection Management', () => {
    it('should initialize with empty selection', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.selection.clipId).toBeNull();
      expect(result.current.selection.trackId).toBeNull();
      expect(result.current.selection.keyframeIndices).toEqual([]);
    });

    it('should select keyframes', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.selectKeyframes('position-track', [0, 2]);
      });

      expect(result.current.selection.trackId).toBe('position-track');
      expect(result.current.selection.keyframeIndices).toEqual([0, 2]);
    });

    it('should select track', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.selectTrack('rotation-track');
      });

      expect(result.current.selection.trackId).toBe('rotation-track');
      expect(result.current.selection.keyframeIndices).toEqual([]);
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.selectKeyframes('position-track', [0, 1]);
        result.current.clearSelection();
      });

      expect(result.current.selection).toEqual({
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      });
    });
  });

  describe('Editing Operations', () => {
    beforeEach(() => {
      mockComponentRegistry.getComponentData.mockImplementation((entityId, type) => {
        if (type === KnownComponentTypes.TRANSFORM) {
          return defaultTransform;
        }
        if (type === KnownComponentTypes.ANIMATION) {
          return createAnimationComponent();
        }
        return null;
      });
      mockComponentRegistry.updateComponent.mockImplementation(() => {});

      useTimelineStore.setState({
        activeEntityId: 1,
        activeClip: JSON.parse(JSON.stringify(mockClip)), // Deep clone
        history: [],
        historyIndex: -1,
      });
    });

    it('should set active entity and clip', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.activeEntityId).toBe(1);
      expect(result.current.activeClip?.id).toBe('test-clip');
    });

    it('should add keyframe to track using current transform', () => {
      const { result } = renderHook(() => useTimelineStore());

      const newKeyframe: IKeyframe = {
        time: 0.5,
        value: [0, 0, 0],
        easing: 'linear',
      };

      act(() => {
        result.current.addKeyframe('position-track', newKeyframe);
      });

      const track = result.current.activeClip?.tracks.find((t) => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(4);
      expect(track?.keyframes[1].value).toEqual(defaultTransform.position);
      expect(mockComponentRegistry.updateComponent).toHaveBeenCalled();
    });

    it('should sync clip mutations to the animation component', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.addKeyframe('position-track', {
          time: 0.25,
          value: [0, 0, 0],
          easing: 'linear',
        });
      });

      expect(mockComponentRegistry.updateComponent).toHaveBeenCalledWith(
        1,
        KnownComponentTypes.ANIMATION,
        expect.objectContaining({
          clips: expect.arrayContaining([
            expect.objectContaining({
              id: mockClip.id,
            }),
          ]),
        }),
      );
    });

    it('should remove keyframe from track', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.removeKeyframe('position-track', 1); // Remove keyframe at index 1
      });

      const track = result.current.activeClip?.tracks.find((t) => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(2);
      expect(track?.keyframes[1].time).toBe(2); // Keyframe at index 2 should now be at index 1
    });

    it('should move keyframe with snapping', () => {
      const { result } = renderHook(() => useTimelineStore());

      // Move keyframe from time 1 to 1.23
      act(() => {
        result.current.moveKeyframe('position-track', 1, 1.23);
      });

      const track = result.current.activeClip?.tracks.find((t) => t.id === 'position-track');
      expect(track?.keyframes[1].time).toBeCloseTo(1.2, 1); // Should snap to nearest 0.1
    });

    it('should move keyframe without snapping', () => {
      const { result } = renderHook(() => useTimelineStore());

      act(() => {
        result.current.toggleSnap(); // Disable snapping
        result.current.moveKeyframe('position-track', 1, 1.23);
      });

      const track = result.current.activeClip?.tracks.find((t) => t.id === 'position-track');
      expect(track?.keyframes[1].time).toBe(1.23); // Should remain exact value
    });

    it('should update keyframe value', () => {
      const { result } = renderHook(() => useTimelineStore());

      const newValue = [0, 0.5, 0, 1];
      act(() => {
        result.current.updateKeyframeValue('rotation-track', 0, newValue);
      });

      const track = result.current.activeClip?.tracks.find((t) => t.id === 'rotation-track');
      expect(track?.keyframes[0].value).toEqual(newValue);
    });

    it('should not modify keyframes on invalid track', () => {
      const { result } = renderHook(() => useTimelineStore());

      const originalClip = JSON.parse(JSON.stringify(result.current.activeClip));

      act(() => {
        result.current.addKeyframe('invalid-track', { time: 1, value: 1, easing: 'linear' });
        result.current.removeKeyframe('invalid-track', 0);
        result.current.moveKeyframe('invalid-track', 0, 2);
        result.current.updateKeyframeValue('invalid-track', 0, 5);
      });

      expect(result.current.activeClip).toEqual(originalClip);
    });
  });

  describe('Undo/Redo System', () => {
    beforeEach(() => {
      // Set up active clip for undo/redo tests
      useTimelineStore.setState({
        activeEntityId: 1,
        activeClip: JSON.parse(JSON.stringify(mockClip)), // Deep clone
      });
    });

    it('should push history on update', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.history).toHaveLength(0);

      // Set initial clip
      act(() => {
        result.current.setActiveEntity(1, mockClip);
      });

      const updatedClip = { ...mockClip, name: 'Updated Clip' };
      act(() => {
        result.current.updateClip(updatedClip);
      });

      expect(result.current.history).toHaveLength(2); // Initial clip + updated clip
      expect(result.current.historyIndex).toBe(1);
    });

    it('should undo changes', () => {
      const { result } = renderHook(() => useTimelineStore());

      // Set initial clip and create history
      act(() => {
        result.current.setActiveEntity(1, mockClip);
      });

      const updatedClip = { ...mockClip, name: 'Updated Clip' };
      act(() => {
        result.current.updateClip(updatedClip);
      });

      expect(result.current.activeClip?.name).toBe('Updated Clip');
      expect(result.current.canUndo()).toBe(true); // Should be able to undo after first update

      // Undo
      act(() => {
        result.current.undo();
      });

      expect(result.current.activeClip?.name).toBe('Test Clip');
      expect(result.current.historyIndex).toBe(0); // Should be at 0 after undo (back to initial)
    });

    it('should redo changes', () => {
      const { result } = renderHook(() => useTimelineStore());

      // Create history and undo
      act(() => {
        result.current.setActiveEntity(1, mockClip);
      });

      const updatedClip = { ...mockClip, name: 'Updated Clip' };
      act(() => {
        result.current.updateClip(updatedClip);
        result.current.undo();
      });

      expect(result.current.canRedo()).toBe(true); // After undo, should be able to redo

      // Redo
      act(() => {
        result.current.redo();
      });

      expect(result.current.activeClip?.name).toBe('Updated Clip');
      expect(result.current.historyIndex).toBe(1);
    });

    it('should limit history size', () => {
      const { result } = renderHook(() => useTimelineStore());

      // Add many clips to exceed history limit
      for (let i = 0; i < 55; i++) {
        const clip = { ...mockClip, name: `Clip ${i}` };
        act(() => {
          result.current.updateClip(clip);
        });
      }

      expect(result.current.history).toHaveLength(50); // Should be limited to 50
      expect(result.current.historyIndex).toBe(49);
    });

    it('should handle undo at beginning of history', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.canUndo()).toBe(false);

      act(() => {
        result.current.undo();
      });

      // Should not error and should not change state
      expect(result.current.activeClip?.name).toBe('Test Clip');
    });

    it('should handle redo at end of history', () => {
      const { result } = renderHook(() => useTimelineStore());

      expect(result.current.canRedo()).toBe(false);

      act(() => {
        result.current.redo();
      });

      // Should not error and should not change state
      expect(result.current.activeClip?.name).toBe('Test Clip');
    });
  });
});
