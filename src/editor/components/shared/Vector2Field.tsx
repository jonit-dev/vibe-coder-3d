import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from './AxisInput';
import { useDragAxis } from './useDragAxis';

const axisColors = {
  x: '#ff6b6b',
  z: '#45b7d1',
};

export interface IVector2FieldProps {
  label: string;
  value: [number, number]; // X, Z in editor convention
  onChange: (next: [number, number]) => void;
  step?: number;
  resetValue?: [number, number];
  sensitivity?: number;
  min?: number;
  max?: number;
}

export const Vector2Field: React.FC<IVector2FieldProps> = ({
  label,
  value,
  onChange,
  step,
  resetValue,
  sensitivity = 0.1,
  min,
  max,
}) => {
  const [localValues, setLocalValues] = useState<[number, number]>([...value]);

  useEffect(() => {
    setLocalValues([...value]);
  }, [value]);

  const handleInputChange = useCallback(
    (idx: number, val: number) => {
      if (isNaN(val)) return;
      const next: [number, number] = [...localValues];
      next[idx] = val;
      setLocalValues(next);
      onChange(next);
    },
    [localValues, onChange],
  );

  const handleReset = useCallback(
    (idx: number) => {
      const defaultVal = resetValue ? resetValue[idx] : 0;
      const next: [number, number] = [...localValues];
      next[idx] = defaultVal;
      setLocalValues(next);
      onChange(next);
    },
    [localValues, onChange, resetValue],
  );

  const handleResetAll = useCallback(() => {
    const defaultVals: [number, number] = resetValue || [0, 0];
    setLocalValues(defaultVals);
    onChange(defaultVals);
  }, [onChange, resetValue]);

  const defaultStep = step || 0.01;

  return (
    <div className="space-y-0.5">
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
        {(['x', 'z'] as const).map((axis, idx) => {
          const { dragActive, onDragStart } = useDragAxis(
            localValues[idx],
            (val) => handleInputChange(idx, val),
            sensitivity,
          );
          return (
            <AxisInput
              key={axis}
              axis={axis.toUpperCase()}
              color={axisColors[axis]}
              value={localValues[idx]}
              onChange={(val) => handleInputChange(idx, val)}
              onDragStart={onDragStart}
              onReset={() => handleReset(idx)}
              step={defaultStep}
              dragActive={dragActive}
              min={min}
              max={max}
            />
          );
        })}
      </div>
    </div>
  );
};
