import { renderHook, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from '@editor/store/timelineStore';
import { useTimelineKeyboard } from '../useTimelineKeyboard';

describe('useTimelineKeyboard', () => {
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
      activeEntityId: 1,
      activeClip: {
        id: 'test-clip',
        name: 'Test Clip',
        duration: 2,
        loop: false,
        timeScale: 1,
        tracks: [
          {
            id: 'position-track',
            type: 'transform.position',
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'rotation-track',
            type: 'transform.rotation',
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'scale-track',
            type: 'transform.scale',
            targetPath: 'root',
            keyframes: [],
          },
          {
            id: 'material-track',
            type: 'material',
            targetPath: 'root',
            keyframes: [],
          },
        ],
      },
      history: [
        {
          id: 'history-clip-1',
          name: 'History Clip 1',
          duration: 2,
          loop: false,
          timeScale: 1,
          tracks: [],
        },
        {
          id: 'history-clip-2',
          name: 'History Clip 2',
          duration: 2,
          loop: false,
          timeScale: 1,
          tracks: [],
        },
      ],
      historyIndex: 1,
    });
  });

  it('should add keyboard event listener on mount and remove on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useTimelineKeyboard());

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });

  describe('Playback Controls', () => {
    it('should toggle play on Ctrl/Cmd + Space', () => {
      renderHook(() => useTimelineKeyboard());

      const { playing } = useTimelineStore.getState();
      expect(playing).toBe(false);

      fireEvent.keyDown(window, { code: 'Space', ctrlKey: true });

      const { playing: playingAfter } = useTimelineStore.getState();
      expect(playingAfter).toBe(true);

      fireEvent.keyDown(window, { code: 'Space', metaKey: true }); // Test Cmd key

      const { playing: playingAfterMeta } = useTimelineStore.getState();
      expect(playingAfterMeta).toBe(false);
    });

    it('should stop on Escape', () => {
      useTimelineStore.setState({
        playing: true,
        currentTime: 1.5,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 'Escape' });

      const { playing, currentTime } = useTimelineStore.getState();
      expect(playing).toBe(false);
      expect(currentTime).toBe(0);
    });
  });

  describe('Undo/Redo', () => {
    it('should undo on Ctrl/Cmd + Z', () => {
      renderHook(() => useTimelineKeyboard());

      const { historyIndex, activeClip } = useTimelineStore.getState();
      expect(historyIndex).toBe(1);
      expect(activeClip?.name).toBe('Test Clip');

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });

      const { historyIndex: indexAfterUndo, activeClip: clipAfterUndo } = useTimelineStore.getState();
      expect(indexAfterUndo).toBe(0);
      expect(clipAfterUndo?.name).toBe('History Clip 1');

      fireEvent.keyDown(window, { key: 'z', metaKey: true }); // Test Cmd key

      const { historyIndex: indexAfterMetaUndo } = useTimelineStore.getState();
      expect(indexAfterMetaUndo).toBe(-1);
    });

    it('should redo on Ctrl/Cmd + Shift + Z', () => {
      useTimelineStore.setState({ historyIndex: 0 }); // Start from earlier history state

      renderHook(() => useTimelineKeyboard());

      const { historyIndex, activeClip } = useTimelineStore.getState();
      expect(historyIndex).toBe(0);
      expect(activeClip?.name).toBe('History Clip 1');

      fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true });

      const { historyIndex: indexAfterRedo, activeClip: clipAfterRedo } = useTimelineStore.getState();
      expect(indexAfterRedo).toBe(1);
      expect(clipAfterRedo?.name).toBe('History Clip 2');

      fireEvent.keyDown(window, { key: 'z', metaKey: true, shiftKey: true }); // Test Cmd key

      const { historyIndex: indexAfterMetaRedo } = useTimelineStore.getState();
      expect(indexAfterMetaRedo).toBe(1); // Should stay at the end
    });
  });

  describe('Keyframe Operations', () => {
    it('should remove selected keyframes on Delete', () => {
      // Set up selection and keyframes
      const { selectKeyframes, activeClip } = useTimelineStore.getState();
      if (activeClip) {
        activeClip.tracks[0].keyframes = [
          { time: 0, value: 0, easing: 'linear' },
          { time: 1, value: 10, easing: 'linear' },
          { time: 2, value: 20, easing: 'linear' },
        ];
      }
      selectKeyframes('position-track', [1]); // Select middle keyframe

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 'Delete' });

      const { activeClip: clipAfterDelete } = useTimelineStore.getState();
      const track = clipAfterDelete?.tracks.find(t => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(2);
      expect(track?.keyframes[1].time).toBe(2); // Last keyframe should now be at index 1
    });

    it('should remove selected keyframes on Backspace', () => {
      // Set up selection and keyframes
      const { selectKeyframes, activeClip } = useTimelineStore.getState();
      if (activeClip) {
        activeClip.tracks[0].keyframes = [
          { time: 0, value: 0, easing: 'linear' },
          { time: 1, value: 10, easing: 'linear' },
        ];
      }
      selectKeyframes('position-track', [0, 1]); // Select both keyframes

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 'Backspace' });

      const { activeClip: clipAfterDelete } = useTimelineStore.getState();
      const track = clipAfterDelete?.tracks.find(t => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(0);
    });

    it('should not remove keyframes when no track is selected', () => {
      const { activeClip } = useTimelineStore.getState();
      if (activeClip) {
        activeClip.tracks[0].keyframes = [
          { time: 0, value: 0, easing: 'linear' },
          { time: 1, value: 10, easing: 'linear' },
        ];
      }

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 'Delete' });

      const { activeClip: clipAfterDelete } = useTimelineStore.getState();
      const track = clipAfterDelete?.tracks.find(t => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(2); // Should not change
    });

    it('should add keyframe on S key for position track', () => {
      useTimelineStore.setState({
        selection: { clipId: null, trackId: 'position-track', keyframeIndices: [] },
        currentTime: 1.5,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      const { activeClip } = useTimelineStore.getState();
      const track = activeClip?.tracks.find(t => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(1);
      expect(track?.keyframes[0]).toEqual({
        time: 1.5,
        value: [0, 0, 0], // Position default value
        easing: 'linear',
      });
    });

    it('should add keyframe on S key for rotation track', () => {
      useTimelineStore.setState({
        selection: { clipId: null, trackId: 'rotation-track', keyframeIndices: [] },
        currentTime: 0.75,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      const { activeClip } = useTimelineStore.getState();
      const track = activeClip?.tracks.find(t => t.id === 'rotation-track');
      expect(track?.keyframes).toHaveLength(1);
      expect(track?.keyframes[0]).toEqual({
        time: 0.75,
        value: [0, 0, 0, 1], // Quaternion identity
        easing: 'linear',
      });
    });

    it('should add keyframe on S key for scale track', () => {
      useTimelineStore.setState({
        selection: { clipId: null, trackId: 'scale-track', keyframeIndices: [] },
        currentTime: 2.3,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      const { activeClip } = useTimelineStore.getState();
      const track = activeClip?.tracks.find(t => t.id === 'scale-track');
      expect(track?.keyframes).toHaveLength(1);
      expect(track?.keyframes[0]).toEqual({
        time: 2.3,
        value: [0, 0, 0], // Scale default value
        easing: 'linear',
      });
    });

    it('should add keyframe on S key for material track', () => {
      useTimelineStore.setState({
        selection: { clipId: null, trackId: 'material-track', keyframeIndices: [] },
        currentTime: 1.0,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      const { activeClip } = useTimelineStore.getState();
      const track = activeClip?.tracks.find(t => t.id === 'material-track');
      expect(track?.keyframes).toHaveLength(1);
      expect(track?.keyframes[0]).toEqual({
        time: 1.0,
        value: 0, // Material default value
        easing: 'linear',
      });
    });

    it('should not add keyframe when no track is selected', () => {
      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      const { activeClip } = useTimelineStore.getState();
      const track = activeClip?.tracks.find(t => t.id === 'position-track');
      expect(track?.keyframes).toHaveLength(0);
    });

    it('should not add keyframe when no active clip', () => {
      useTimelineStore.setState({
        selection: { clipId: null, trackId: 'position-track', keyframeIndices: [] },
        activeClip: null,
      });

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(window, { key: 's' });

      // Should not error and clip should remain null
      const { activeClip } = useTimelineStore.getState();
      expect(activeClip).toBeNull();
    });
  });

  describe('Input Focus Handling', () => {
    it('should ignore keyboard events when typing in input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      renderHook(() => useTimelineKeyboard());

      const initialPlaying = useTimelineStore.getState().playing;

      fireEvent.keyDown(input, { code: 'Space', ctrlKey: true });

      expect(useTimelineStore.getState().playing).toBe(initialPlaying); // Should not toggle

      document.body.removeChild(input);
    });

    it('should ignore keyboard events when typing in textarea', () => {
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      renderHook(() => useTimelineKeyboard());

      const initialHistoryIndex = useTimelineStore.getState().historyIndex;

      fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true });

      expect(useTimelineStore.getState().historyIndex).toBe(initialHistoryIndex); // Should not undo

      document.body.removeChild(textarea);
    });

    it('should handle keyboard events when other elements are focused', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();

      renderHook(() => useTimelineKeyboard());

      fireEvent.keyDown(button, { key: 'Escape' });

      const { playing, currentTime } = useTimelineStore.getState();
      expect(playing).toBe(false);
      expect(currentTime).toBe(0);

      document.body.removeChild(button);
    });
  });

  describe('Keyboard Event Prevention', () => {
    it('should prevent default for handled shortcuts', () => {
      renderHook(() => useTimelineKeyboard());

      const event = new KeyboardEvent('keydown', { key: 'Escape', cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(window, event);

      expect(preventDefaultSpy).toHaveBeenCalled();

      preventDefaultSpy.mockRestore();
    });

    it('should not prevent default for unhandled keys', () => {
      renderHook(() => useTimelineKeyboard());

      const event = new KeyboardEvent('keydown', { key: 'a', cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      fireEvent(window, event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();

      preventDefaultSpy.mockRestore();
    });
  });
});