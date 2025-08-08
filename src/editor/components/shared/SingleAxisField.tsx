import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from './AxisInput';
import { useDragAxisCamera } from './useDragAxisCamera';

export interface ISingleAxisFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  resetValue?: number;
  sensitivity?: number;
  min?: number;
  max?: number;
  axisLabel?: string;
  axisColor?: string;
  precision?: number;
}

export const SingleAxisField: React.FC<ISingleAxisFieldProps> = ({
  label,
  value,
  onChange,
  step = 0.1,
  resetValue,
  sensitivity = 0.1,
  min,
  max,
  axisLabel,
  axisColor = '#9b59b6', // Purple default for camera fields
  precision = 2,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (val: number) => {
      if (isNaN(val)) return;
      setLocalValue(val);
      onChange(val);
    },
    [onChange],
  );

  const handleReset = useCallback(() => {
    const defaultVal = resetValue !== undefined ? resetValue : 0;
    setLocalValue(defaultVal);
    onChange(defaultVal);
  }, [resetValue, onChange]);

  const handleResetAll = useCallback(() => {
    const defaultVal = resetValue !== undefined ? resetValue : 0;
    setLocalValue(defaultVal);
    onChange(defaultVal);
  }, [resetValue, onChange]);

  const { dragActive, onDragStart } = useDragAxisCamera(localValue, handleInputChange, sensitivity);

  // Use the label as axis label if not provided
  const displayAxisLabel = axisLabel || label.substring(0, 3).toUpperCase();

  return (
    <div className="space-y-0.5">
      {/* Label */}
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
        <button
          className="text-[9px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded-sm px-1 py-px transition-all duration-200"
          onClick={handleResetAll}
        >
          Reset
        </button>
      </div>

      <div className="space-y-px">
        <AxisInput
          axis={displayAxisLabel}
          color={axisColor}
          value={localValue}
          onChange={handleInputChange}
          onDragStart={onDragStart}
          onReset={handleReset}
          step={step}
          dragActive={dragActive}
          min={min}
          max={max}
          precision={precision}
        />
      </div>
    </div>
  );
};
