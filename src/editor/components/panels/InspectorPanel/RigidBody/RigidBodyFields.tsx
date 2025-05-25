import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from '../Transform/TransformFields/AxisInput';
import { axisColors } from '../Transform/TransformFields/axisColors';
import { useDragAxis } from '../Transform/TransformFields/useDragAxis';

export interface IRigidBodyFieldsProps {
  label: string;
  value: [number, number, number];
  onChange: (index: number, value: number) => void;
  step?: number;
  sensitivity?: number;
}

export const RigidBodyFields: React.FC<IRigidBodyFieldsProps> = ({
  label,
  value,
  onChange,
  step = 0.1,
  sensitivity = 0.1,
}) => {
  const [localValues, setLocalValues] = useState<[number, number, number]>([...value]);

  useEffect(() => {
    setLocalValues([...value]);
  }, [value]);

  const handleInputChange = useCallback(
    (idx: number, val: number) => {
      if (isNaN(val)) return;
      const next: [number, number, number] = [...localValues];
      next[idx] = val;
      setLocalValues(next);
      onChange(idx, val);
    },
    [localValues, onChange],
  );

  const handleReset = useCallback(
    (idx: number) => {
      const defaultVal = 0;
      const next: [number, number, number] = [...localValues];
      next[idx] = defaultVal;
      setLocalValues(next);
      onChange(idx, defaultVal);
    },
    [localValues, onChange],
  );

  return (
    <div className="space-y-0.5">
      {/* Label */}
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
        <button
          className="text-[9px] text-gray-400 hover:text-orange-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-orange-500/30 rounded-sm px-1 py-px transition-all duration-200"
          onClick={() => {
            const defaultVals: [number, number, number] = [0, 0, 0];
            setLocalValues(defaultVals);
            defaultVals.forEach((val, idx) => onChange(idx, val));
          }}
        >
          Reset
        </button>
      </div>

      <div className="space-y-px">
        {(['x', 'y', 'z'] as const).map((axis, idx) => {
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
              step={step}
              dragActive={dragActive}
            />
          );
        })}
      </div>
    </div>
  );
};
