import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyboardSettings } from '../KeyboardSettings';
import * as useInputSettingsModule from '@editor/hooks/useInputSettings';

vi.mock('@editor/hooks/useInputSettings');

describe('KeyboardSettings', () => {
  const mockUpdateSetting = vi.fn();
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
      resetToDefaults: vi.fn(),
    });
  });

  it('renders keyboard settings header', () => {
    render(<KeyboardSettings />);
    expect(screen.getByText('Keyboard Settings')).toBeInTheDocument();
  });

  it('renders all keyboard settings controls', () => {
    render(<KeyboardSettings />);

    expect(screen.getByText('Prevent default on arrow keys')).toBeInTheDocument();
    expect(screen.getByText('Prevent default on space')).toBeInTheDocument();
    expect(screen.getByText('Prevent default on Tab')).toBeInTheDocument();
    expect(screen.getByText(/Key repeat delay/)).toBeInTheDocument();
  });

  it('displays current setting values', () => {
    render(<KeyboardSettings />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked(); // preventDefaultArrows
    expect(checkboxes[1]).toBeChecked(); // preventDefaultSpace
    expect(checkboxes[2]).not.toBeChecked(); // preventDefaultTab

    expect(screen.getByText(/Key repeat delay: 250ms/)).toBeInTheDocument();
  });

  it('calls updateSetting when preventDefaultArrows is toggled', async () => {
    const user = userEvent.setup();
    render(<KeyboardSettings />);

    const checkbox = screen.getByLabelText(/Prevent default on arrow keys/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('preventDefaultArrows', false);
  });

  it('calls updateSetting when preventDefaultSpace is toggled', async () => {
    const user = userEvent.setup();
    render(<KeyboardSettings />);

    const checkbox = screen.getByLabelText(/Prevent default on space/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('preventDefaultSpace', false);
  });

  it('calls updateSetting when preventDefaultTab is toggled', async () => {
    const user = userEvent.setup();
    render(<KeyboardSettings />);

    const checkbox = screen.getByLabelText(/Prevent default on Tab/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('preventDefaultTab', true);
  });

  it('calls updateSetting when keyRepeatDelay is changed', () => {
    render(<KeyboardSettings />);

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });

    expect(mockUpdateSetting).toHaveBeenCalledWith('keyRepeatDelay', 500);
  });
});
