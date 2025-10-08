import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GamepadSettings } from '../GamepadSettings';

describe('GamepadSettings', () => {
  it('renders gamepad settings header', () => {
    render(<GamepadSettings />);
    expect(screen.getByText('Gamepad Settings')).toBeInTheDocument();
  });

  it('renders coming soon notice', () => {
    render(<GamepadSettings />);
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.getByText(/Gamepad support is planned for a future release/)).toBeInTheDocument();
  });

  it('renders disabled gamepad controls', () => {
    render(<GamepadSettings />);

    expect(screen.getByText('Enable gamepad support')).toBeInTheDocument();
    expect(screen.getByText(/Dead zone/)).toBeInTheDocument();
    expect(screen.getByText('Vibration')).toBeInTheDocument();
  });

  it('all controls are disabled', () => {
    render(<GamepadSettings />);

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });

    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });
});
