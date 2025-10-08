import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { TopBar } from '../TopBar';

describe('TopBar', () => {
  const mockProps = {
    entityCount: 5,
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onLoad: vi.fn(),
    onClear: vi.fn(),
    onAddObject: vi.fn(),
    onToggleAddMenu: vi.fn(),
    onPlay: vi.fn(),
    onPause: vi.fn(),
    onStop: vi.fn(),
    onToggleChat: vi.fn(),
    onToggleMaterials: vi.fn(),
    onOpenPreferences: vi.fn(),
    onCreatePrefab: vi.fn(),
    onBrowsePrefabs: vi.fn(),
    currentSceneName: 'TestScene',
    isPlaying: false,
    isChatOpen: false,
    isMaterialsOpen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the logo and branding', () => {
      render(<TopBar {...mockProps} />);
      expect(screen.getByText('VibeEngine')).toBeInTheDocument();
      expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    });

    it('should display entity count correctly', () => {
      render(<TopBar {...mockProps} />);
      expect(screen.getByText('5 Objects')).toBeInTheDocument();
    });

    it('should display current scene name', () => {
      render(<TopBar {...mockProps} />);
      expect(screen.getByText('Scene: TestScene')).toBeInTheDocument();
    });

    it('should display "None" when no scene is loaded', () => {
      render(<TopBar {...mockProps} currentSceneName={null} />);
      expect(screen.getByText('Scene: None')).toBeInTheDocument();
    });

    it('should show Ready status', () => {
      render(<TopBar {...mockProps} />);
      expect(screen.getByText('Ready')).toBeInTheDocument();
    });
  });

  describe('playback controls', () => {
    it('should enable Play button when not playing', () => {
      render(<TopBar {...mockProps} isPlaying={false} />);
      const playButton = screen.getByTitle('Play (Space)');
      expect(playButton).not.toBeDisabled();
    });

    it('should disable Play button when playing', () => {
      render(<TopBar {...mockProps} isPlaying={true} />);
      const playButton = screen.getByTitle('Play (Space)');
      expect(playButton).toBeDisabled();
    });

    it('should disable Pause button when not playing', () => {
      render(<TopBar {...mockProps} isPlaying={false} />);
      const pauseButton = screen.getByTitle('Pause');
      expect(pauseButton).toBeDisabled();
    });

    it('should enable Pause button when playing', () => {
      render(<TopBar {...mockProps} isPlaying={true} />);
      const pauseButton = screen.getByTitle('Pause');
      expect(pauseButton).not.toBeDisabled();
    });

    it('should call onPlay when Play button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Play (Space)'));
      expect(mockProps.onPlay).toHaveBeenCalledTimes(1);
    });

    it('should call onStop when Stop button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Stop'));
      expect(mockProps.onStop).toHaveBeenCalledTimes(1);
    });
  });

  describe('action buttons', () => {
    it('should call onToggleAddMenu when Add button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByText('Add'));
      expect(mockProps.onToggleAddMenu).toHaveBeenCalledTimes(1);
    });

    it('should call onLoad when Load button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Load Scene'));
      expect(mockProps.onLoad).toHaveBeenCalledTimes(1);
    });

    it('should call onClear when Clear button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Clear Scene'));
      expect(mockProps.onClear).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleChat when Chat button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Toggle AI Chat (Ctrl+/)'));
      expect(mockProps.onToggleChat).toHaveBeenCalledTimes(1);
    });
  });

  describe('save functionality', () => {
    it('should show scene name in save tooltip when scene is loaded', () => {
      render(<TopBar {...mockProps} currentSceneName="TestScene" />);
      expect(screen.getByTitle('Save TestScene (Ctrl+S)')).toBeInTheDocument();
    });

    it('should show generic save tooltip when no scene is loaded', () => {
      render(<TopBar {...mockProps} currentSceneName={null} />);
      expect(screen.getByTitle('Save Scene (Ctrl+S)')).toBeInTheDocument();
    });

    it('should call onSave when Save button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Save TestScene (Ctrl+S)'));
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('Materials panel toggle', () => {
    it('should call onToggleMaterials when Materials button is clicked', () => {
      render(<TopBar {...mockProps} />);
      fireEvent.click(screen.getByTitle('Toggle Materials Panel'));
      expect(mockProps.onToggleMaterials).toHaveBeenCalledTimes(1);
    });

    it('should not render Materials button when onToggleMaterials is undefined', () => {
      render(<TopBar {...mockProps} onToggleMaterials={undefined} />);
      expect(screen.queryByTitle('Toggle Materials Panel')).not.toBeInTheDocument();
    });
  });
});
