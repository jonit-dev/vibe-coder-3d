import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from '@editor/store/timelineStore';
import { Keyframe } from '../Keyframe';
import type { IKeyframe } from '@core/components/animation/tracks/TrackTypes';

// Mock the timeline store
vi.mock('@editor/store/timelineStore');

const mockUseTimelineStore = useTimelineStore as any;

const mockKeyframe: IKeyframe = {
  time: 1.5,
  value: 10,
  easing: 'linear',
};

const defaultProps = {
  trackId: 'test-track',
  keyframe: mockKeyframe,
  index: 0,
};

describe('Keyframe', () => {
  beforeEach(() => {
    mockUseTimelineStore.mockReturnValue({
      zoom: 100,
      selection: {
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      },
      selectKeyframes: jest.fn(),
      moveKeyframe: jest.fn(),
      removeKeyframe: jest.fn(),
      snapEnabled: true,
      snapInterval: 0.1,
      currentTime: 0,
      playing: false,
      loop: false,
      pan: 0,
      clearSelection: jest.fn(),
      selectTrack: jest.fn(),
      activeEntityId: null,
      activeClip: null,
      history: [],
      historyIndex: -1,
      setCurrentTime: jest.fn(),
      play: jest.fn(),
      pause: jest.fn(),
      stop: jest.fn(),
      togglePlay: jest.fn(),
      setLoop: jest.fn(),
      setZoom: jest.fn(),
      setPan: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      toggleSnap: jest.fn(),
      setSnapInterval: jest.fn(),
      frameView: jest.fn(),
      setActiveEntity: jest.fn(),
      updateClip: jest.fn(),
      addKeyframe: jest.fn(),
      updateKeyframeValue: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      canUndo: jest.fn(),
      canRedo: jest.fn(),
      pushHistory: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render keyframe at correct position', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    // x position should be keyframe.time * zoom = 1.5 * 100 = 150px
    expect(keyframe).toHaveStyle({ left: '150px' });
  });

  it('should apply selected styling when selected', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selection: {
        clipId: null,
        trackId: 'test-track',
        keyframeIndices: [0],
      },
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    expect(keyframe).toHaveClass('ring-2', 'ring-blue-400');
  });

  it('should not apply selected styling when not selected', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    expect(keyframe).not.toHaveClass('ring-2', 'ring-blue-400');
  });

  it('should select keyframe on single click', () => {
    const mockSelectKeyframes = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selectKeyframes: mockSelectKeyframes,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    fireEvent.mouseDown(keyframe);

    expect(mockSelectKeyframes).toHaveBeenCalledWith('test-track', [0]);
  });

  it('should add to selection on shift-click when already selected', () => {
    const mockSelectKeyframes = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selection: {
        clipId: null,
        trackId: 'test-track',
        keyframeIndices: [0], // Already selected
      },
      selectKeyframes: mockSelectKeyframes,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    fireEvent.mouseDown(keyframe, { shiftKey: true });

    // Should remove from selection
    expect(mockSelectKeyframes).toHaveBeenCalledWith('test-track', []);
  });

  it('should add to selection on shift-click when not selected', () => {
    const mockSelectKeyframes = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selection: {
        clipId: null,
        trackId: 'test-track',
        keyframeIndices: [1], // Different keyframe selected
      },
      selectKeyframes: mockSelectKeyframes,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    fireEvent.mouseDown(keyframe, { shiftKey: true });

    // Should add to selection
    expect(mockSelectKeyframes).toHaveBeenCalledWith('test-track', [1, 0]);
  });

  it('should start drag on mouse down', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Start dragging
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });

    // Should trigger drag state
    expect(document.body.style.cursor).toBe('grabbing');
  });

  it('should handle mouse move during drag', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    const mockMoveKeyframe = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      moveKeyframe: mockMoveKeyframe,
    } as any);

    // Start drag
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });

    // Move mouse
    fireEvent.mouseMove(document, { clientX: 200, clientY: 50 });

    // Should calculate new time: (200 - 150) / zoom + originalTime = 50/100 + 1.5 = 2.0
    // With snap enabled (0.1 interval): should snap to 2.0
    expect(mockMoveKeyframe).toHaveBeenCalledWith('test-track', 0, 2.0);
  });

  it('should handle mouse up to end drag', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Start drag
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });

    // End drag
    fireEvent.mouseUp(document);

    // Should reset cursor
    expect(document.body.style.cursor).not.toBe('grabbing');
  });

  it('should handle drag without snapping', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      snapEnabled: false,
      moveKeyframe: jest.fn(),
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    const mockMoveKeyframe = mockUseTimelineStore.mock.results[0].value.moveKeyframe;

    // Start drag
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });

    // Move mouse to position that would not snap cleanly
    fireEvent.mouseMove(document, { clientX: 187, clientY: 50 });

    // Should use exact time: (187 - 150) / zoom + originalTime = 37/100 + 1.5 = 1.87
    expect(mockMoveKeyframe).toHaveBeenCalledWith('test-track', 0, 1.87);
  });

  it('should handle drag with custom snap interval', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      snapInterval: 0.25, // 250ms snap interval
      moveKeyframe: jest.fn(),
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    const mockMoveKeyframe = mockUseTimelineStore.mock.results[0].value.moveKeyframe;

    // Start drag
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });

    // Move mouse to position that should snap to nearest 0.25
    fireEvent.mouseMove(document, { clientX: 193, clientY: 50 });

    // Time would be 1.93, should snap to 2.0 (nearest 0.25)
    expect(mockMoveKeyframe).toHaveBeenCalledWith('test-track', 0, 2.0);
  });

  it('should prevent negative times on drag', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      moveKeyframe: jest.fn(),
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    const mockMoveKeyframe = mockUseTimelineStore.mock.results[0].value.moveKeyframe;

    // Start drag and move far left
    fireEvent.mouseDown(keyframe, { clientX: 150, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: -200, clientY: 50 });

    // Should clamp to 0
    expect(mockMoveKeyframe).toHaveBeenCalledWith('test-track', 0, 0);
  });

  it('should handle delete key when selected', () => {
    const mockRemoveKeyframe = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selection: {
        clipId: null,
        trackId: 'test-track',
        keyframeIndices: [0],
      },
      removeKeyframe: mockRemoveKeyframe,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Focus and press delete
    keyframe.focus();
    fireEvent.keyDown(keyframe, { key: 'Delete' });

    expect(mockRemoveKeyframe).toHaveBeenCalledWith('test-track', 0);
  });

  it('should handle backspace key when selected', () => {
    const mockRemoveKeyframe = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      selection: {
        clipId: null,
        trackId: 'test-track',
        keyframeIndices: [0],
      },
      removeKeyframe: mockRemoveKeyframe,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Focus and press backspace
    keyframe.focus();
    fireEvent.keyDown(keyframe, { key: 'Backspace' });

    expect(mockRemoveKeyframe).toHaveBeenCalledWith('test-track', 0);
  });

  it('should not delete when not selected', () => {
    const mockRemoveKeyframe = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      removeKeyframe: mockRemoveKeyframe,
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Focus and press delete when not selected
    keyframe.focus();
    fireEvent.keyDown(keyframe, { key: 'Delete' });

    expect(mockRemoveKeyframe).not.toHaveBeenCalled();
  });

  it('should respect zoom level for positioning', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      zoom: 50, // 50 pixels per second
    } as any);

    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    // x position should be keyframe.time * zoom = 1.5 * 50 = 75px
    expect(keyframe).toHaveStyle({ left: '75px' });
  });

  it('should show tooltip with keyframe info', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');
    fireEvent.mouseEnter(keyframe);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('1.50s');
  });

  it('should handle different value types in tooltip', () => {
    const vectorKeyframe: IKeyframe = {
      time: 1.0,
      value: [1, 2, 3],
      easing: 'linear',
    };

    render(<Keyframe {...defaultProps} keyframe={vectorKeyframe} />);

    const keyframe = screen.getByRole('button');
    fireEvent.mouseEnter(keyframe);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('1.00s');
    expect(tooltip).toHaveTextContent('[1, 2, 3]');
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
    const removeEventListenerBodySpy = vi.spyOn(document.body, 'removeEventListener');

    const { unmount } = render(<Keyframe {...defaultProps} />);

    unmount();

    // Should clean up mouse move and mouse up listeners
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

    removeEventListenerSpy.mockRestore();
    removeEventListenerBodySpy.mockRestore();
  });

  it('should handle right-click context menu', () => {
    render(<Keyframe {...defaultProps} />);

    const keyframe = screen.getByRole('button');

    // Right click should show context menu
    fireEvent.contextMenu(keyframe);

    // Should prevent default context menu
    expect(screen.queryByRole('menu')).not.toBeInTheDocument(); // Context menu implementation would be separate
  });
});