import React from 'react';

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
          className="w-4 h-4 ml-1 bg-[#444] hover:bg-[#555] rounded cursor-ew-resize flex items-center justify-center"
          onMouseDown={onDragStart}
          style={{ cursor: dragActive ? 'ew-resize' : 'pointer' }}
        >
          <span className="text-[8px]">⋮</span>
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
