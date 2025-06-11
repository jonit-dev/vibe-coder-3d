import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockOnChange = vi.fn();
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with label and color inputs', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      expect(screen.getByText('Test Color')).toBeInTheDocument();
      expect(screen.getAllByDisplayValue('#ff0000')).toHaveLength(2); // Both color and text inputs
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should display the correct initial value', () => {
      render(<ColorPicker label="Background Color" value="#00ff00" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('#00ff00');
      const colorInput = inputs.find((input) => input.getAttribute('type') === 'color');
      const textInput = screen.getByRole('textbox');

      expect(colorInput).toHaveAttribute('type', 'color');
      expect(textInput).toHaveValue('#00ff00');
    });

    it('should update when value prop changes', () => {
      const { rerender } = render(
        <ColorPicker label="Dynamic Color" value="#ff0000" onChange={mockOnChange} />,
      );

      expect(screen.getAllByDisplayValue('#ff0000')).toHaveLength(2);

      rerender(<ColorPicker label="Dynamic Color" value="#0000ff" onChange={mockOnChange} />);

      expect(screen.getAllByDisplayValue('#0000ff')).toHaveLength(2);
    });
  });

  describe('color input interactions', () => {
    it('should call onChange when color input changes', async () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getAllByDisplayValue('#ff0000')[0];

      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });

    it('should call onChange on input event', async () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getAllByDisplayValue('#ff0000')[0];

      fireEvent.input(colorInput, { target: { value: '#0000ff' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#0000ff');
    });

    it('should handle mouse events for real-time updates', async () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getAllByDisplayValue('#ff0000')[0];

      fireEvent.mouseDown(colorInput);
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });
      fireEvent.mouseUp(colorInput);

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });
  });

  describe('text input interactions', () => {
    it('should call onChange when text input changes', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#00ff00' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });

    it('should handle partial input gracefully', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#ff' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      // Should not call onChange for incomplete hex color
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should expand 3-character hex colors to 6 characters', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#f0a' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#ff00aa');
    });

    it('should accept valid 6-character hex colors', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#123abc' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#123abc');
    });

    it('should reject invalid hex colors', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: 'invalid' } });

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('throttling behavior', () => {
    it('should throttle onChange calls', async () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      // Make rapid changes
      fireEvent.change(textInput, { target: { value: '#00ff00' } });
      fireEvent.change(textInput, { target: { value: '#0000ff' } });
      fireEvent.change(textInput, { target: { value: '#ff00ff' } });

      // Before throttle timeout
      expect(mockOnChange).not.toHaveBeenCalled();

      // After throttle timeout
      vi.advanceTimersByTime(50);

      // Should only be called once with the final value
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('#ff00ff');
    });

    it.skip('should clear throttle timeout on mouse up', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getAllByDisplayValue('#ff0000')[0];

      fireEvent.mouseDown(colorInput);
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      // The change event should trigger a throttled update, but not call onChange yet
      expect(mockOnChange).not.toHaveBeenCalled();

      // Advance just a bit to ensure the timeout is set but not triggered
      vi.advanceTimersByTime(10);
      expect(mockOnChange).not.toHaveBeenCalled();

      fireEvent.mouseUp(colorInput);

      // Mouse up should immediately trigger the onChange if there was a pending update
      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });

    it('should handle mouse move events during drag', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const colorInput = screen.getAllByDisplayValue('#ff0000')[0];

      fireEvent.mouseDown(colorInput);

      // Mock the input value change
      Object.defineProperty(colorInput, 'value', {
        writable: true,
        value: '#00ff00',
      });

      fireEvent.mouseMove(colorInput);

      // Wait for throttled update
      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });
  });

  describe('local state management', () => {
    it('should update local value immediately for UI responsiveness', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#00ff00' } });

      // Local value should be updated immediately
      expect(textInput).toHaveValue('#00ff00');

      // But onChange should be throttled
      expect(mockOnChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(mockOnChange).toHaveBeenCalledWith('#00ff00');
    });

    it('should sync local value with prop changes', () => {
      const { rerender } = render(
        <ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />,
      );

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveValue('#ff0000');

      rerender(<ColorPicker label="Test Color" value="#0000ff" onChange={mockOnChange} />);

      expect(textInput).toHaveValue('#0000ff');
    });
  });

  describe('accessibility and styling', () => {
    it('should render with correct CSS classes', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const inputs = screen.getAllByDisplayValue('#ff0000');
      const colorInput = inputs.find((input) => input.getAttribute('type') === 'color');
      const textInput = screen.getByRole('textbox');

      expect(colorInput).toHaveClass('w-8', 'h-6', 'rounded', 'cursor-pointer');
      expect(textInput).toHaveClass('bg-black/30', 'border', 'rounded', 'px-2');
    });

    it('should have placeholder text for text input', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByPlaceholderText('#FFFFFF');
      expect(textInput).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      // Focus the text input directly
      textInput.focus();
      expect(textInput).toHaveFocus();
    });
  });

  describe('cleanup', () => {
    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      const { unmount } = render(
        <ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />,
      );

      const textInput = screen.getByRole('textbox');
      fireEvent.change(textInput, { target: { value: '#00ff00' } });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it('should handle multiple rapid changes and cleanup properly', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      // Rapid changes should clear previous timeouts
      fireEvent.change(textInput, { target: { value: '#00ff00' } });
      fireEvent.change(textInput, { target: { value: '#0000ff' } });
      fireEvent.change(textInput, { target: { value: '#ff00ff' } });

      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenLastCalledWith('#ff00ff');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      render(<ColorPicker label="Test Color" value="" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveValue('');
    });

    it('should handle invalid initial values', () => {
      render(<ColorPicker label="Test Color" value="invalid" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');
      expect(textInput).toHaveValue('invalid');
    });

    it('should handle hex colors without # prefix', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: 'ff0000' } });

      vi.advanceTimersByTime(50);

      expect(mockOnChange).not.toHaveBeenCalled(); // Invalid without #
    });

    it('should handle case-insensitive hex colors', () => {
      render(<ColorPicker label="Test Color" value="#ff0000" onChange={mockOnChange} />);

      const textInput = screen.getByRole('textbox');

      fireEvent.change(textInput, { target: { value: '#ABCDEF' } });

      vi.advanceTimersByTime(50);

      expect(mockOnChange).toHaveBeenCalledWith('#ABCDEF');
    });
  });
});
