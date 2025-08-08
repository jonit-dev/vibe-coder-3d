import React, { useEffect, useMemo, useState } from 'react';
import { MdDragIndicator } from 'react-icons/md';

export interface IAxisInputProps {
  axis: string;
  color: string;
  value: number;
  onChange: (val: number) => void;
  onDragStart: (e: React.MouseEvent) => void;
  onReset: () => void;
  step: number;
  dragActive: boolean;
  min?: number;
  max?: number;
  precision?: number;
}

export const AxisInput: React.FC<IAxisInputProps> = ({
  axis,
  color,
  value,
  onChange,
  onDragStart,
  onReset,
  step,
  dragActive,
  min,
  max,
  precision = 2,
}) => {
  const [text, setText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  const formatted = useMemo(
    () => (Number.isFinite(value) ? value.toFixed(Math.max(0, precision)) : ''),
    [value, precision],
  );

  // Keep local text in sync when not actively editing or during drags
  useEffect(() => {
    if (!isEditing || dragActive) {
      setText(formatted);
    }
  }, [formatted, isEditing, dragActive]);

  const clamp = (n: number): number => {
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextText = e.target.value;
    setText(nextText);
    // Allow transitional states like '-', '4.', '' while typing
    const parsed = parseFloat(nextText);
    if (!Number.isNaN(parsed)) {
      onChange(clamp(parsed));
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseFloat(text);
    const finalNum = Number.isNaN(parsed) ? value : clamp(parsed);
    onChange(finalNum);
    setText(Number.isFinite(finalNum) ? finalNum.toFixed(Math.max(0, precision)) : '');
  };

  const handleFocus = () => setIsEditing(true);
  const getAxisColorClass = (axisColor: string) => {
    switch (axisColor) {
      case '#ff6b6b':
        return 'border-red-500/30';
      case '#4ecdc4':
        return 'border-green-500/30';
      case '#45b7d1':
        return 'border-blue-500/30';
      case '#9b59b6':
        return 'border-purple-500/30';
      case '#ffff00':
        return 'border-yellow-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  const axisColorClass = getAxisColorClass(color);

  return (
    <div className="flex items-center space-x-1 bg-black/20 rounded-sm p-1 border border-gray-700/30">
      <div
        className={`w-4 h-4 rounded-sm bg-gradient-to-br from-gray-800 to-gray-900 border ${axisColorClass} flex items-center justify-center font-bold text-[10px]`}
        style={{ color }}
      >
        {axis}
      </div>

      <div className="flex-1 flex items-center space-x-1">
        <input
          className="flex-1 bg-black/30 border border-gray-600/30 rounded-sm px-1.5 py-0.5 text-[11px] text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200"
          type="number"
          step={step}
          min={min}
          max={max}
          value={text}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />

        <div
          className={`w-4 h-4 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/50 rounded-sm cursor-ew-resize select-none transition-all duration-200 relative group shadow-sm ${
            dragActive ? 'ring-1 ring-cyan-500/50 scale-105' : ''
          }`}
          onMouseDown={onDragStart}
          tabIndex={0}
          role="button"
          aria-label={`Drag to change ${axis} value`}
        >
          <MdDragIndicator
            className="text-gray-300 group-hover:text-white transition-colors duration-200"
            size={8}
          />
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1.5 px-1 py-px text-[9px] bg-black/80 text-white rounded-sm opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 backdrop-blur-sm border border-gray-600/30 transition-opacity duration-200">
            Drag {axis}
          </div>
        </div>

        <button
          className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-cyan-300 hover:bg-gray-700/50 rounded-sm transition-all duration-200 text-[10px]"
          onClick={onReset}
        >
          ⟲
        </button>
      </div>
    </div>
  );
};
