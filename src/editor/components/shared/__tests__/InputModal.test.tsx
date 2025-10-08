import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputModal } from '../InputModal';
import * as useInputSettingsModule from '@editor/hooks/useInputSettings';

vi.mock('@editor/hooks/useInputSettings');

describe('InputModal', () => {
  const mockUpdateSetting = vi.fn();
  const mockResetToDefaults = vi.fn();
  const mockOnClose = vi.fn();

  const mockSettings = {
    preventDefaultArrows: true,
    preventDefaultSpace: true,
    preventDefaultTab: false,
    keyRepeatDelay: 250,
    mouseSensitivity: 1.0,
    invertY: false,
    invertX: false,
    smoothMouse: true,
    scrollSensitivity: 1.0,
    showInputDebug: false,
    logInputEvents: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(useInputSettingsModule, 'useInputSettings').mockReturnValue({
      settings: mockSettings,
      updateSetting: mockUpdateSetting,
      resetToDefaults: mockResetToDefaults,
    });
  });

  it('does not render when isOpen is false', () => {
    render(<InputModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Input Settings')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(<InputModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Input Settings')).toBeInTheDocument();
  });

  it('renders all section tabs', () => {
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Keyboard')).toBeInTheDocument();
    expect(screen.getByText('Mouse')).toBeInTheDocument();
    expect(screen.getByText('Action Maps')).toBeInTheDocument();
    expect(screen.getByText('Gamepad')).toBeInTheDocument();
  });

  it('renders keyboard settings by default', () => {
    render(<InputModal isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('Keyboard Settings')).toBeInTheDocument();
  });

  it('switches to mouse settings when mouse tab is clicked', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByText('Mouse'));

    expect(screen.getByText('Mouse Settings')).toBeInTheDocument();
    expect(screen.queryByText('Keyboard Settings')).not.toBeInTheDocument();
  });

  it('switches to gamepad settings when gamepad tab is clicked', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByText('Gamepad'));

    expect(screen.getByText('Gamepad Settings')).toBeInTheDocument();
    expect(screen.queryByText('Keyboard Settings')).not.toBeInTheDocument();
  });

  it('renders footer action buttons', () => {
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.getByText('Apply')).toBeInTheDocument();
  });

  it('calls onClose when Close button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByText('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Apply button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    const applyButton = screen.getByText('Apply');
    await user.click(applyButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTitle('Close');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('allows interaction with settings in keyboard tab', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    const checkbox = screen.getByLabelText(/Prevent default on arrow keys/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('preventDefaultArrows', false);
  });

  it('allows interaction with settings in mouse tab', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    await user.click(screen.getByText('Mouse'));

    const checkbox = screen.getByLabelText(/Invert Y-axis/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('invertY', true);
  });

  it('persists tab selection when switching tabs', async () => {
    const user = userEvent.setup();
    render(<InputModal isOpen={true} onClose={mockOnClose} />);

    // Switch to Mouse tab
    await user.click(screen.getByText('Mouse'));
    expect(screen.getByText('Mouse Settings')).toBeInTheDocument();

    // Switch to Gamepad tab
    await user.click(screen.getByText('Gamepad'));
    expect(screen.getByText('Gamepad Settings')).toBeInTheDocument();

    // Switch back to Mouse tab
    await user.click(screen.getByText('Mouse'));
    expect(screen.getByText('Mouse Settings')).toBeInTheDocument();
  });
});
