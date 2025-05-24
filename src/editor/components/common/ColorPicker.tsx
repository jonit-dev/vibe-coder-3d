import React, { useCallback, useRef } from 'react';

export interface IColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
}

export const ColorPicker: React.FC<IColorPickerProps> = ({ value, onChange, label }) => {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isMouseDownRef = useRef(false);

  const handleColorChange = useCallback(
    (color: string, eventType?: string) => {
      console.log(`[ColorPicker] ${eventType || 'change'} event with color:`, color);

      // Always pass valid hex colors through
      // Native color input always returns 7-character hex
      if (color.startsWith('#') && color.length === 7) {
        onChange(color);
      } else if (color.match(/^#[0-9A-Fa-f]{3}$/)) {
        // Convert 3-char hex to 6-char hex
        const expandedColor = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
        onChange(expandedColor);
      } else if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
        onChange(color);
      }
    },
    [onChange],
  );

  // Track mouse events for better real-time updates
  const handleMouseDown = useCallback(() => {
    isMouseDownRef.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  const handleMouseMove = useCallback(() => {
    if (isMouseDownRef.current && colorInputRef.current) {
      // Force update during mouse move while dragging
      const currentValue = colorInputRef.current.value;
      if (currentValue !== value) {
        handleColorChange(currentValue, 'onMouseMove');
      }
    }
  }, [value, handleColorChange]);

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs">{label}</span>
        <div className="flex items-center gap-2">
          <input
            ref={colorInputRef}
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value, 'onChange')}
            onInput={(e) => handleColorChange((e.target as HTMLInputElement).value, 'onInput')}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="h-6 w-12 rounded border-none p-0 cursor-pointer"
          />
          <input
            type="text"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className="input input-xs input-bordered w-16"
            placeholder="#FFFFFF"
          />
        </div>
      </div>
    </div>
  );
};
