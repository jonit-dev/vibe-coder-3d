import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface IColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ value, onChange, label }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isMouseDownRef = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [localValue, setLocalValue] = useState(value);

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Throttled update function to improve performance
  const throttledOnChange = useCallback(
    (color: string) => {
      // Clear any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      // Update immediately for the UI responsiveness
      setLocalValue(color);

      // Throttle the actual onChange call to prevent excessive updates
      updateTimeoutRef.current = setTimeout(() => {
        // Always pass valid hex colors through
        if (color.startsWith('#') && color.length === 7) {
          onChange(color);
        } else if (color.match(/^#[0-9A-Fa-f]{3}$/)) {
          // Convert 3-char hex to 6-char hex
          const expandedColor =
            '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
          onChange(expandedColor);
        } else if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
          onChange(color);
        }
      }, 50); // 50ms throttle for smooth performance
    },
    [onChange],
  );

  const handleColorChange = useCallback(
    (color: string) => {
      throttledOnChange(color);
    },
    [throttledOnChange],
  );

  // Track mouse events for better real-time updates
  const handleMouseDown = useCallback(() => {
    isMouseDownRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
    // Force final update on mouse up
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
      throttledOnChange(localValue);
    }
  }, [localValue, throttledOnChange]);

  const handleMouseMove = useCallback(() => {
    if (isMouseDownRef.current && colorInputRef.current) {
      // Use throttled update during mouse move
      const currentValue = colorInputRef.current.value;
      if (currentValue !== localValue) {
        handleColorChange(currentValue);
      }
    }
  }, [localValue, handleColorChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <div className="flex items-center space-x-2">
          <input
            ref={colorInputRef}
            type="color"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            onInput={(e) => handleColorChange((e.target as HTMLInputElement).value)}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="w-8 h-6 rounded bg-black/30 border border-gray-600/30 cursor-pointer"
          />
          <input
            type="text"
            value={localValue}
            onChange={(e) => handleColorChange(e.target.value)}
            className="bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200 w-20"
            placeholder="#FFFFFF"
          />
        </div>
      </div>
    </div>
  );
};
