import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MouseSettings } from '../MouseSettings';
import * as useInputSettingsModule from '@editor/hooks/useInputSettings';

vi.mock('@editor/hooks/useInputSettings');

describe('MouseSettings', () => {
  const mockUpdateSetting = vi.fn();
  const mockSettings = {
    preventDefaultArrows: true,
    preventDefaultSpace: true,
    preventDefaultTab: false,
    keyRepeatDelay: 250,
    mouseSensitivity: 2.5,
    invertY: false,
    invertX: false,
    smoothMouse: true,
    scrollSensitivity: 1.5,
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

  it('renders mouse settings header', () => {
    render(<MouseSettings />);
    expect(screen.getByText('Mouse Settings')).toBeInTheDocument();
  });

  it('renders all mouse settings controls', () => {
    render(<MouseSettings />);

    expect(screen.getByText(/Mouse Sensitivity/)).toBeInTheDocument();
    expect(screen.getByText('Invert Y-axis')).toBeInTheDocument();
    expect(screen.getByText('Invert X-axis')).toBeInTheDocument();
    expect(screen.getByText('Smooth mouse movement')).toBeInTheDocument();
    expect(screen.getByText(/Scroll sensitivity/)).toBeInTheDocument();
  });

  it('displays current setting values', () => {
    render(<MouseSettings />);

    expect(screen.getByText(/Mouse Sensitivity: 2.5x/)).toBeInTheDocument();
    expect(screen.getByText(/Scroll sensitivity: 1.5x/)).toBeInTheDocument();

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).not.toBeChecked(); // invertY
    expect(checkboxes[1]).not.toBeChecked(); // invertX
    expect(checkboxes[2]).toBeChecked(); // smoothMouse
  });

  it('calls updateSetting when mouseSensitivity is changed', () => {
    render(<MouseSettings />);

    const slider = screen.getAllByRole('slider')[0];
    fireEvent.change(slider, { target: { value: '3.5' } });

    expect(mockUpdateSetting).toHaveBeenCalledWith('mouseSensitivity', 3.5);
  });

  it('calls updateSetting when invertY is toggled', async () => {
    const user = userEvent.setup();
    render(<MouseSettings />);

    const checkbox = screen.getByLabelText(/Invert Y-axis/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('invertY', true);
  });

  it('calls updateSetting when invertX is toggled', async () => {
    const user = userEvent.setup();
    render(<MouseSettings />);

    const checkbox = screen.getByLabelText(/Invert X-axis/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('invertX', true);
  });

  it('calls updateSetting when smoothMouse is toggled', async () => {
    const user = userEvent.setup();
    render(<MouseSettings />);

    const checkbox = screen.getByLabelText(/Smooth mouse movement/);
    await user.click(checkbox);

    expect(mockUpdateSetting).toHaveBeenCalledWith('smoothMouse', false);
  });

  it('calls updateSetting when scrollSensitivity is changed', () => {
    render(<MouseSettings />);

    const slider = screen.getAllByRole('slider')[1];
    fireEvent.change(slider, { target: { value: '2.0' } });

    expect(mockUpdateSetting).toHaveBeenCalledWith('scrollSensitivity', 2.0);
  });
});
