import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ToggleSetting, RangeSetting, NumberSetting } from '../SettingControls';

describe('ToggleSetting', () => {
  it('renders label and description', () => {
    render(
      <ToggleSetting
        label="Test Setting"
        description="Test description"
        checked={false}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<ToggleSetting label="Test Setting" checked={false} onChange={vi.fn()} />);

    expect(screen.getByText('Test Setting')).toBeInTheDocument();
    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('calls onChange when toggled', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<ToggleSetting label="Test Setting" checked={false} onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('respects checked state', () => {
    const { rerender } = render(
      <ToggleSetting label="Test Setting" checked={false} onChange={vi.fn()} />,
    );

    expect(screen.getByRole('checkbox')).not.toBeChecked();

    rerender(<ToggleSetting label="Test Setting" checked={true} onChange={vi.fn()} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('respects disabled state', () => {
    render(<ToggleSetting label="Test Setting" checked={false} onChange={vi.fn()} disabled />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});

describe('RangeSetting', () => {
  it('renders label with formatted value', () => {
    render(
      <RangeSetting label="Test Range" value={2.5} min={0} max={5} step={0.1} onChange={vi.fn()} />,
    );

    expect(screen.getByText(/Test Range: 2.5/)).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <RangeSetting
        label="Test Range"
        description="Test description"
        value={2.5}
        min={0}
        max={5}
        step={0.1}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('uses custom formatValue function', () => {
    render(
      <RangeSetting
        label="Test Range"
        value={2.5}
        min={0}
        max={5}
        step={0.1}
        onChange={vi.fn()}
        formatValue={(v) => `${v.toFixed(2)}x`}
      />,
    );

    expect(screen.getByText(/Test Range: 2.50x/)).toBeInTheDocument();
  });

  it('calls onChange when slider value changes', () => {
    const handleChange = vi.fn();

    render(
      <RangeSetting
        label="Test Range"
        value={2.5}
        min={0}
        max={5}
        step={0.1}
        onChange={handleChange}
      />,
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3.5' } });

    expect(handleChange).toHaveBeenCalledWith(3.5);
  });

  it('respects disabled state', () => {
    render(
      <RangeSetting
        label="Test Range"
        value={2.5}
        min={0}
        max={5}
        step={0.1}
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('slider')).toBeDisabled();
  });
});

describe('NumberSetting', () => {
  it('renders label with value and unit', () => {
    render(
      <NumberSetting
        label="Test Number"
        value={100}
        min={0}
        max={1000}
        step={50}
        onChange={vi.fn()}
        unit="ms"
      />,
    );

    expect(screen.getByText(/Test Number: 100ms/)).toBeInTheDocument();
  });

  it('renders without unit', () => {
    render(
      <NumberSetting
        label="Test Number"
        value={100}
        min={0}
        max={1000}
        step={50}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByText(/Test Number: 100$/)).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const handleChange = vi.fn();

    render(
      <NumberSetting
        label="Test Number"
        value={100}
        min={0}
        max={1000}
        step={50}
        onChange={handleChange}
      />,
    );

    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '200' } });

    expect(handleChange).toHaveBeenCalledWith(200);
  });

  it('respects disabled state', () => {
    render(
      <NumberSetting
        label="Test Number"
        value={100}
        min={0}
        max={1000}
        step={50}
        onChange={vi.fn()}
        disabled
      />,
    );

    expect(screen.getByRole('spinbutton')).toBeDisabled();
  });
});
