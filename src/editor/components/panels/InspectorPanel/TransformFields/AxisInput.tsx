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
  const inputBaseStyle =
    'bg-[#383838] border border-[#555] rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:ring-1';
  const axisStyle = `${inputBaseStyle} focus:ring-[${color}]`;

  return (
    <div className="flex justify-between items-center mb-1">
      <span className="w-6 text-xs font-medium text-center" style={{ color }}>
        {axis}
      </span>
      <div className="flex-1 flex items-center">
        <input
          className={axisStyle}
          type="number"
          step={step}
          value={value.toFixed(2)}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div
          className="w-5 h-5 ml-2 flex items-center justify-center bg-[#23272e] hover:bg-[#353942] border border-[#444] rounded-full cursor-ew-resize select-none transition-colors duration-150 relative group shadow-sm p-0"
          onMouseDown={onDragStart}
          tabIndex={0}
          role="button"
          aria-label={`Drag to change ${axis} value`}
          style={{ outline: dragActive ? '2px solid #6c7a89' : 'none' }}
        >
          <MdDragIndicator className="text-gray-300" size={16} />
          <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 shadow-lg transition-opacity duration-150">
            Drag to change {axis} value
          </span>
        </div>
        <button
          className="w-4 h-4 ml-1 text-[10px] text-gray-400 hover:text-white"
          onClick={onReset}
        >
          ⟲
        </button>
      </div>
    </div>
  );
};
