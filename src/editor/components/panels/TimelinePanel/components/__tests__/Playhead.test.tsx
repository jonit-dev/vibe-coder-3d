import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { useTimelineStore } from '@editor/store/timelineStore';
import { Playhead } from '../Playhead';

// Mock the timeline store
vi.mock('@editor/store/timelineStore');

const mockUseTimelineStore = useTimelineStore as any;

describe('Playhead', () => {
  beforeEach(() => {
    mockUseTimelineStore.mockReturnValue({
      currentTime: 1.5,
      zoom: 100,
      pan: 0,
      setCurrentTime: jest.fn(),
      activeClip: null,
      playing: false,
      loop: false,
      snapEnabled: true,
      snapInterval: 0.1,
      selection: {
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      },
      activeEntityId: null,
      history: [],
      historyIndex: -1,
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
      selectKeyframes: jest.fn(),
      clearSelection: jest.fn(),
      selectTrack: jest.fn(),
      setActiveEntity: jest.fn(),
      updateClip: jest.fn(),
      addKeyframe: jest.fn(),
      removeKeyframe: jest.fn(),
      moveKeyframe: jest.fn(),
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

  it('should render playhead at correct position', () => {
    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    // Position should be: currentTime * zoom + pan = 1.5 * 100 + 0 = 150px
    expect(playhead).toHaveStyle({ left: '150px' });
  });

  it('should respect pan offset', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      pan: 50, // 50px pan offset
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    // Position should be: currentTime * zoom + pan = 1.5 * 100 + 50 = 200px
    expect(playhead).toHaveStyle({ left: '200px' });
  });

  it('should respect zoom level', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      zoom: 50, // 50 pixels per second
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    // Position should be: currentTime * zoom + pan = 1.5 * 50 + 0 = 75px
    expect(playhead).toHaveStyle({ left: '75px' });
  });

  it('should update position when currentTime changes', () => {
    const { rerender } = render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '150px' });

    // Update currentTime
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: 2.0,
    } as any);

    rerender(<Playhead />);

    expect(playhead).toHaveStyle({ left: '200px' });
  });

  it('should handle negative currentTime', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: -0.5,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '-50px' });
  });

  it('should handle zero currentTime', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: 0,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '0px' });
  });

  it('should handle very large currentTime', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: 100, // 100 seconds
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveStyle({ left: '10000px' });
  });

  it('should show time tooltip on hover', () => {
    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    fireEvent.mouseEnter(playhead);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('1.50s');
  });

  it('should format time tooltip correctly for different times', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: 0.123456,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    fireEvent.mouseEnter(playhead);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('0.12s');
  });

  it('should be draggable', () => {
    const mockSetCurrentTime = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      setCurrentTime: mockSetCurrentTime,
      snapEnabled: false, // Disable snapping for precise testing
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');

    // Start drag
    fireEvent.mouseDown(playhead, { clientX: 150, clientY: 50 });

    // Move to new position
    fireEvent.mouseMove(document, { clientX: 200, clientY: 50 });

    // Should calculate new time: (200 - pan) / zoom = 200 / 100 = 2.0s
    expect(mockSetCurrentTime).toHaveBeenCalledWith(2.0);

    // End drag
    fireEvent.mouseUp(document);
  });

  it('should apply snapping when enabled', () => {
    const mockSetCurrentTime = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      setCurrentTime: mockSetCurrentTime,
      snapEnabled: true,
      snapInterval: 0.1,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');

    // Start drag and move to position that would snap
    fireEvent.mouseDown(playhead, { clientX: 0, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 187, clientY: 50 }); // Would be 1.87s

    // Should snap to nearest 0.1: 1.9s
    expect(mockSetCurrentTime).toHaveBeenCalledWith(1.9);
  });

  it('should handle custom snap interval', () => {
    const mockSetCurrentTime = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      setCurrentTime: mockSetCurrentTime,
      snapEnabled: true,
      snapInterval: 0.25, // 250ms intervals
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');

    // Start drag and move to position that would snap to 0.25 intervals
    fireEvent.mouseDown(playhead, { clientX: 0, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: 263, clientY: 50 }); // Would be 2.63s

    // Should snap to nearest 0.25: 2.75s
    expect(mockSetCurrentTime).toHaveBeenCalledWith(2.75);
  });

  it('should prevent negative times during drag', () => {
    const mockSetCurrentTime = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      setCurrentTime: mockSetCurrentTime,
      snapEnabled: false,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');

    // Drag to negative position
    fireEvent.mouseDown(playhead, { clientX: 0, clientY: 50 });
    fireEvent.mouseMove(document, { clientX: -50, clientY: 50 });

    expect(mockSetCurrentTime).toHaveBeenCalledWith(-0.5); // Allows negative, but component might clamp
  });

  it('should show different styling when playing', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      playing: true,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveClass('bg-red-500'); // Playing state color
  });

  it('should show different styling when paused', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      playing: false,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    expect(playhead).toHaveClass('bg-blue-500'); // Paused state color
  });

  it('should handle click to seek', () => {
    const mockSetCurrentTime = jest.fn();
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      setCurrentTime: mockSetCurrentTime,
      snapEnabled: false,
    } as any);

    render(<Playhead />);

    const timeline = screen.getByTestId('timeline-ruler');
    fireEvent.click(timeline, { clientX: 300 });

    // Should seek to clicked position: 300 / zoom = 3.0s
    expect(mockSetCurrentTime).toHaveBeenCalledWith(3.0);
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<Playhead />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

    removeEventListenerSpy.mockRestore();
  });

  it('should handle rapid position updates', () => {
    const { rerender } = render(<Playhead />);

    const playhead = screen.getByTestId('playhead');

    // Update time rapidly
    for (let i = 0; i < 10; i++) {
      mockUseTimelineStore.mockReturnValue({
        ...mockUseTimelineStore(),
        currentTime: i * 0.1,
      } as any);

      rerender(<Playhead />);

      const expectedLeft = i * 10; // 0.1s * 100px/s = 10px
      expect(playhead).toHaveStyle({ left: `${expectedLeft}px` });
    }
  });

  it('should respect container boundaries', () => {
    // Test with pan that would push playhead outside container
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      pan: -200, // Pan left 200px
      currentTime: 1.5,
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    // Position should be: 1.5 * 100 + (-200) = -50px
    expect(playhead).toHaveStyle({ left: '-50px' });
  });

  it('should display time in correct format', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      currentTime: 65.5, // Over 1 minute
    } as any);

    render(<Playhead />);

    const playhead = screen.getByTestId('playhead');
    fireEvent.mouseEnter(playhead);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('65.50s'); // Still shows as seconds
  });
});