import React from 'react';
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
}) => {
  const getAxisColorClass = (axisColor: string) => {
    switch (axisColor) {
      case '#ff6b6b':
        return 'border-red-500/30';
      case '#4ecdc4':
        return 'border-green-500/30';
      case '#45b7d1':
        return 'border-blue-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  const axisColorClass = getAxisColorClass(color);

  return (
    <div className="flex items-center space-x-2 bg-black/20 rounded p-1.5 border border-gray-700/30">
      <div
        className={`w-5 h-5 rounded bg-gradient-to-br from-gray-800 to-gray-900 border ${axisColorClass} flex items-center justify-center font-bold text-xs`}
        style={{ color }}
      >
        {axis}
      </div>

      <div className="flex-1 flex items-center space-x-1.5">
        <input
          className="flex-1 bg-black/30 border border-gray-600/30 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50 focus:bg-black/50 transition-all duration-200"
          type="number"
          step={step}
          value={value.toFixed(2)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />

        <div
          className={`w-5 h-5 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 border border-gray-600/50 rounded cursor-ew-resize select-none transition-all duration-200 relative group shadow-sm ${
            dragActive ? 'ring-1 ring-cyan-500/50 scale-105' : ''
          }`}
          onMouseDown={onDragStart}
          tabIndex={0}
          role="button"
          aria-label={`Drag to change ${axis} value`}
        >
          <MdDragIndicator
            className="text-gray-300 group-hover:text-white transition-colors duration-200"
            size={10}
          />
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-1.5 py-0.5 text-[10px] bg-black/80 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 backdrop-blur-sm border border-gray-600/30 transition-opacity duration-200">
            Drag {axis}
          </div>
        </div>

        <button
          className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-cyan-300 hover:bg-gray-700/50 rounded transition-all duration-200 text-xs"
          onClick={onReset}
        >
          ⟲
        </button>
      </div>
    </div>
  );
};
