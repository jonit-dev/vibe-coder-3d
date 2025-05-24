import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from './AxisInput';
import { axisColors } from './axisColors';
import { useDragAxis } from './useDragAxis';

export interface ITransformFieldsProps {
  label: string;
  value: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}

export const TransformFields: React.FC<ITransformFieldsProps> = ({ label, value, onChange }) => {
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
      console.log('[TransformFields] label:', label, 'idx:', idx, 'val:', val, 'next:', next);
      onChange(next);
    },
    [localValues, onChange],
  );

  const handleReset = useCallback(
    (idx: number) => {
      const defaultVal = label === 'Scale' ? 1 : 0;
      const next: [number, number, number] = [...localValues];
      next[idx] = defaultVal;
      setLocalValues(next);
      onChange(next);
    },
    [label, localValues, onChange],
  );

  // Sensitivity for drag
  const sensitivity = label === 'Scale' ? 0.01 : 0.1;

  return (
    <div className="space-y-1">
      {/* Label */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-gray-300">{label}</span>
        <button
          className="text-[10px] text-gray-400 hover:text-cyan-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-cyan-500/30 rounded px-1.5 py-0.5 transition-all duration-200"
          onClick={() => {
            const defaultVals: [number, number, number] = label === 'Scale' ? [1, 1, 1] : [0, 0, 0];
            setLocalValues(defaultVals);
            onChange(defaultVals);
          }}
        >
          Reset
        </button>
      </div>

      <div className="space-y-0.5">
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
              step={label === 'Scale' ? 0.1 : 0.01}
              dragActive={dragActive}
            />
          );
        })}
      </div>
    </div>
  );
};
