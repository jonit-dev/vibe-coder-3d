import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { TimelinePanel } from '../TimelinePanel';
import { useTimelineStore } from '@editor/store/timelineStore';

// Mock sub-components
vi.mock('../components/Toolbar', () => ({
  Toolbar: () => <div data-testid="toolbar">Toolbar</div>,
}));

vi.mock('../components/Ruler', () => ({
  Ruler: () => <div data-testid="ruler">Ruler</div>,
}));

vi.mock('../components/TrackList', () => ({
  TrackList: () => <div data-testid="track-list">Track List</div>,
}));

vi.mock('../components/Playhead', () => ({
  Playhead: () => <div data-testid="playhead">Playhead</div>,
}));

vi.mock('../hooks/useTimelineKeyboard', () => ({
  useTimelineKeyboard: vi.fn(),
}));

vi.mock('../hooks/useTimelinePlayback', () => ({
  useTimelinePlayback: vi.fn(),
}));

// Mock the timeline store
vi.mock('@editor/store/timelineStore');

const mockUseTimelineStore = useTimelineStore as any;

const mockActiveClip = {
  id: 'test-clip',
  name: 'Walk Animation',
  duration: 2.5,
  loop: true,
  timeScale: 1,
  tracks: [],
};

describe('TimelinePanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    mockUseTimelineStore.mockReturnValue({
      currentTime: 1.23,
      playing: true,
      activeClip: mockActiveClip,
      zoom: 100,
      pan: 0,
      loop: false,
      snapEnabled: true,
      snapInterval: 0.1,
      selection: {
        clipId: null,
        trackId: null,
        keyframeIndices: [],
      },
      activeEntityId: 1,
      history: [],
      historyIndex: -1,
      setCurrentTime: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      togglePlay: vi.fn(),
      setLoop: vi.fn(),
      setZoom: vi.fn(),
      setPan: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      toggleSnap: vi.fn(),
      setSnapInterval: vi.fn(),
      frameView: vi.fn(),
      selectKeyframes: vi.fn(),
      clearSelection: vi.fn(),
      selectTrack: vi.fn(),
      setActiveEntity: vi.fn(),
      updateClip: vi.fn(),
      addKeyframe: vi.fn(),
      removeKeyframe: vi.fn(),
      moveKeyframe: vi.fn(),
      updateKeyframeValue: vi.fn(),
      undo: vi.fn(),
      redo: vi.fn(),
      canUndo: vi.fn(),
      canRedo: vi.fn(),
      pushHistory: vi.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when closed', () => {
    render(<TimelinePanel {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Animation Timeline')).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(<TimelinePanel {...defaultProps} />);

    expect(screen.getByText('Animation Timeline')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('ruler')).toBeInTheDocument();
    expect(screen.getByTestId('track-list')).toBeInTheDocument();
    expect(screen.getByTestId('playhead')).toBeInTheDocument();
  });

  it('should render with correct title', () => {
    render(<TimelinePanel {...defaultProps} />);

    const title = screen.getByText('Animation Timeline');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });

  it('should display active clip information when available', () => {
    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText('Walk Animation (2.50s)');
    expect(clipInfo).toBeInTheDocument();
  });

  it('should format duration correctly', () => {
    const mockClipWithDuration = {
      ...mockActiveClip,
      duration: 0.123456,
    };

    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      activeClip: mockClipWithDuration,
    } as any);

    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText('Walk Animation (0.12s)');
    expect(clipInfo).toBeInTheDocument();
  });

  it('should not display clip info when no active clip', () => {
    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      activeClip: null,
    } as any);

    render(<TimelinePanel {...defaultProps} />);

    expect(screen.queryByText(/\(\d+\.\d+s\)/)).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = jest.fn();
    render(<TimelinePanel {...defaultProps} onClose={mockOnClose} />);

    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should render with overlay background', () => {
    render(<TimelinePanel {...defaultProps} />);

    const overlay = screen.getByText('Animation Timeline').closest('.fixed');
    expect(overlay).toHaveClass('bg-black', 'bg-opacity-50');
  });

  it('should render panel with correct dimensions and positioning', () => {
    render(<TimelinePanel {...defaultProps} />);

    const panel = screen.getByText('Animation Timeline').closest('.fixed')?.querySelector('.bg-gray-900');
    expect(panel).toHaveClass('w-full', 'h-2/3');
  });

  it('should render header with correct styling', () => {
    render(<TimelinePanel {...defaultProps} />);

    const header = screen.getByText('Animation Timeline').closest('.flex');
    expect(header).toHaveClass('items-center', 'justify-between', 'px-4', 'py-2', 'bg-gray-800', 'border-b', 'border-gray-700');
  });

  it('should render title with correct styling', () => {
    render(<TimelinePanel {...defaultProps} />);

    const title = screen.getByText('Animation Timeline');
    expect(title).toHaveClass('text-lg', 'font-semibold', 'text-white');
  });

  it('should render clip info with correct styling', () => {
    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText('Walk Animation (2.50s)');
    expect(clipInfo).toHaveClass('text-sm', 'text-gray-400');
  });

  it('should render close button with correct styling', () => {
    render(<TimelinePanel {...defaultProps} />);

    const closeButton = screen.getByText('Close');
    expect(closeButton).toHaveClass('px-3', 'py-1', 'text-sm', 'bg-gray-700', 'hover:bg-gray-600', 'rounded');
  });

  it('should setup keyboard shortcuts on mount', () => {
    const mockUseTimelineKeyboard = require('../hooks/useTimelineKeyboard').useTimelineKeyboard;

    render(<TimelinePanel {...defaultProps} />);

    expect(mockUseTimelineKeyboard).toHaveBeenCalledTimes(1);
  });

  it('should setup playback on mount', () => {
    const mockUseTimelinePlayback = require('../hooks/useTimelinePlayback').useTimelinePlayback;

    render(<TimelinePanel {...defaultProps} />);

    expect(mockUseTimelinePlayback).toHaveBeenCalledTimes(1);
  });

  it('should render panel at bottom of screen', () => {
    render(<TimelinePanel {...defaultProps} />);

    const container = screen.getByText('Animation Timeline').closest('.fixed');
    expect(container).toHaveClass('items-end', 'justify-center');
  });

  it('should have correct z-index for overlay', () => {
    render(<TimelinePanel {...defaultProps} />);

    const container = screen.getByText('Animation Timeline').closest('.fixed');
    expect(container).toHaveClass('z-50');
  });

  it('should render with proper border styling', () => {
    render(<TimelinePanel {...defaultProps} />);

    const panel = screen.getByText('Animation Timeline').closest('.fixed')?.querySelector('.bg-gray-900');
    expect(panel).toHaveClass('border-t-2', 'border-gray-700');
  });

  it('should handle different active clip names', () => {
    const longNameClip = {
      ...mockActiveClip,
      name: 'Very Long Animation Name That Might Be Truncated',
    };

    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      activeClip: longNameClip,
    } as any);

    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText(/Very Long Animation Name/);
    expect(clipInfo).toBeInTheDocument();
  });

  it('should handle very short duration clips', () => {
    const shortClip = {
      ...mockActiveClip,
      duration: 0.001,
    };

    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      activeClip: shortClip,
    } as any);

    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText(/\(0\.00s\)/);
    expect(clipInfo).toBeInTheDocument();
  });

  it('should handle very long duration clips', () => {
    const longClip = {
      ...mockActiveClip,
      duration: 999.999,
    };

    mockUseTimelineStore.mockReturnValue({
      ...mockUseTimelineStore(),
      activeClip: longClip,
    } as any);

    render(<TimelinePanel {...defaultProps} />);

    const clipInfo = screen.getByText(/\(1000\.00s\)/);
    expect(clipInfo).toBeInTheDocument();
  });

  it('should render header actions in correct order', () => {
    render(<TimelinePanel {...defaultProps} />);

    const header = screen.getByText('Animation Timeline').parentElement as HTMLElement;
    const flexContainer = header.querySelector('.flex');
    const children = Array.from(flexContainer?.children || []);

    // Title should be first, actions container should be second
    expect(children[0]).toHaveTextContent('Animation Timeline');
    expect(children[1]).toContainElement(screen.getByText('Walk Animation (2.50s)'));
    expect(children[1]).toContainElement(screen.getByText('Close'));
  });

  it('should pass container ref correctly', () => {
    render(<TimelinePanel {...defaultProps} />);

    // The component should mount without errors when using containerRef
    expect(screen.getByText('Animation Timeline')).toBeInTheDocument();
  });

  it('should handle rapid open/close transitions', () => {
    const { rerender } = render(<TimelinePanel {...defaultProps} />);

    expect(screen.getByText('Animation Timeline')).toBeInTheDocument();

    rerender(<TimelinePanel {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Animation Timeline')).not.toBeInTheDocument();

    rerender(<TimelinePanel {...defaultProps} isOpen={true} />);
    expect(screen.getByText('Animation Timeline')).toBeInTheDocument();
  });
});