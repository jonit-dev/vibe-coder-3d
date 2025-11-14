import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from '@editor/store/timelineStore';
import { useTimelinePlayback } from '../useTimelinePlayback';

// Mock requestAnimationFrame
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Mock Date.now for consistent timing
const mockDateNow = vi.fn(() => 1000000);
global.Date.now = mockDateNow;

describe('useTimelinePlayback', () => {
  beforeEach(() => {
    // Reset store before each test
    useTimelineStore.setState({
      currentTime: 0,
      playing: false,
      loop: false,
      activeEntityId: 1,
      activeClip: {
        id: 'test-clip',
        name: 'Test Clip',
        duration: 2,
        loop: false,
        timeScale: 1,
        tracks: [],
      },
      history: [],
      historyIndex: -1,
    });

    // Reset Date.now mock
    mockDateNow.mockClear();
    mockDateNow.mockReturnValue(1000000);
  });

  it('should not play when playing is false', () => {
    renderHook(() => useTimelinePlayback());

    // Advance time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0);
  });

  it('should not play when there is no active clip', () => {
    useTimelineStore.setState({
      playing: true,
      activeClip: null,
    });

    renderHook(() => useTimelinePlayback());

    // Advance time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0);
  });

  it('should advance time when playing', () => {
    useTimelineStore.setState({ playing: true });

    renderHook(() => useTimelinePlayback());

    // Simulate 100ms passing
    mockDateNow.mockReturnValue(1000100);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.1); // 100ms = 0.1s
  });

  it('should respect timeScale', () => {
    useTimelineStore.setState({
      playing: true,
      activeClip: {
        id: 'test-clip',
        name: 'Test Clip',
        duration: 2,
        loop: false,
        timeScale: 2, // 2x speed
        tracks: [],
      },
    });

    renderHook(() => useTimelinePlayback());

    // Simulate 100ms passing
    mockDateNow.mockReturnValue(1000100);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.2); // 100ms * 2x = 0.2s
  });

  it('should stop at clip duration when loop is false', () => {
    useTimelineStore.setState({ playing: true });

    renderHook(() => useTimelinePlayback());

    // Simulate 2100ms passing (longer than 2s clip duration)
    mockDateNow.mockReturnValue(1002100);

    act(() => {
      jest.advanceTimersByTime(2100);
    });

    const { currentTime, playing } = useTimelineStore.getState();
    expect(currentTime).toBe(2); // Should stop at clip duration
    expect(playing).toBe(false); // Should stop playing
  });

  it('should loop when loop is true', () => {
    useTimelineStore.setState({
      playing: true,
      loop: true,
    });

    renderHook(() => useTimelinePlayback());

    // Simulate 2500ms passing (2s + 0.5s)
    mockDateNow.mockReturnValue(1002500);

    act(() => {
      jest.advanceTimersByTime(2500);
    });

    const { currentTime, playing } = useTimelineStore.getState();
    expect(currentTime).toBe(0.5); // Should wrap around: 2.5 % 2 = 0.5
    expect(playing).toBe(true); // Should continue playing
  });

  it('should handle multiple animation frames', () => {
    useTimelineStore.setState({ playing: true });

    renderHook(() => useTimelinePlayback());

    // First frame - 16ms later
    mockDateNow.mockReturnValue(1000016);
    act(() => {
      jest.advanceTimersByTime(16);
    });

    let { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.016);

    // Second frame - another 16ms later
    mockDateNow.mockReturnValue(1000032);
    act(() => {
      jest.advanceTimersByTime(16);
    });

    ({ currentTime } = useTimelineStore.getState());
    expect(currentTime).toBe(0.032);
  });

  it('should stop playback when component unmounts', () => {
    useTimelineStore.setState({ playing: true });

    const { unmount } = renderHook(() => useTimelinePlayback());

    // Advance time while mounted
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime: timeWhileMounted } = useTimelineStore.getState();
    expect(timeWhileMounted).toBe(0.1);

    // Unmount and advance time
    unmount();
    mockDateNow.mockReturnValue(1000200);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime: timeAfterUnmount } = useTimelineStore.getState();
    expect(timeAfterUnmount).toBe(0.1); // Should not have advanced
  });

  it('should handle pause during playback', () => {
    useTimelineStore.setState({ playing: true });

    renderHook(() => useTimelinePlayback());

    // Start playing
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    let { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.1);

    // Pause
    useTimelineStore.setState({ playing: false });

    // Advance time while paused
    mockDateNow.mockReturnValue(1000200);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    ({ currentTime } = useTimelineStore.getState());
    expect(currentTime).toBe(0.1); // Should not have advanced
  });

  it('should resume from paused time', () => {
    useTimelineStore.setState({
      playing: false,
      currentTime: 1.5,
    });

    renderHook(() => useTimelinePlayback());

    // Advance time while paused
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime: timeWhilePaused } = useTimelineStore.getState();
    expect(timeWhilePaused).toBe(1.5);

    // Resume playing
    useTimelineStore.setState({ playing: true });
    mockDateNow.mockReturnValue(1000200);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime: timeAfterResume } = useTimelineStore.getState();
    expect(timeAfterResume).toBe(1.6); // Should advance from 1.5
  });

  it('should handle clip change during playback', () => {
    useTimelineStore.setState({ playing: true });

    renderHook(() => useTimelinePlayback());

    // Start playing with original clip
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    let { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.1);

    // Change to different clip with different duration
    useTimelineStore.setState({
      activeClip: {
        id: 'new-clip',
        name: 'New Clip',
        duration: 5,
        loop: false,
        timeScale: 1,
        tracks: [],
      },
    });

    // Continue playing
    mockDateNow.mockReturnValue(1000200);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    ({ currentTime } = useTimelineStore.getState());
    expect(currentTime).toBe(0.2); // Should continue with new clip
  });

  it('should handle zero timeScale', () => {
    useTimelineStore.setState({
      playing: true,
      activeClip: {
        id: 'test-clip',
        name: 'Test Clip',
        duration: 2,
        loop: false,
        timeScale: 0, // Zero speed
        tracks: [],
      },
    });

    renderHook(() => useTimelinePlayback());

    // Simulate 100ms passing
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0); // Should not advance with zero timeScale
  });

  it('should handle negative timeScale', () => {
    useTimelineStore.setState({
      playing: true,
      currentTime: 1, // Start in the middle
      activeClip: {
        id: 'test-clip',
        name: 'Test Clip',
        duration: 2,
        loop: false,
        timeScale: -1, // Reverse playback
        tracks: [],
      },
    });

    renderHook(() => useTimelinePlayback());

    // Simulate 100ms passing
    mockDateNow.mockReturnValue(1000100);
    act(() => {
      jest.advanceTimersByTime(100);
    });

    const { currentTime } = useTimelineStore.getState();
    expect(currentTime).toBe(0.9); // Should go backwards
  });
});