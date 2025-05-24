import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/AxisInput';
import { axisColors } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/axisColors';
import { useDragAxis } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/useDragAxis';

export interface IColliderFieldsProps {
  label: string;
  value: [number, number, number];
  onChange: (next: [number, number, number]) => void;
  step?: number;
  sensitivity?: number;
}

export const ColliderFields: React.FC<IColliderFieldsProps> = ({
  label,
  value,
  onChange,
  step = 0.1,
  sensitivity = 0.1,
}) => {
  // Ensure value is always a valid array to prevent "not iterable" errors
  const safeValue: [number, number, number] =
    Array.isArray(value) && value.length === 3 ? value : [0, 0, 0];

  const [localValues, setLocalValues] = useState<[number, number, number]>([...safeValue]);

  useEffect(() => {
    const newSafeValue: [number, number, number] =
      Array.isArray(value) && value.length === 3 ? value : [0, 0, 0];
    setLocalValues([...newSafeValue]);
  }, [value]);

  const handleInputChange = useCallback(
    (idx: number, val: number) => {
      if (isNaN(val)) return;
      const next: [number, number, number] = [...localValues];
      next[idx] = val;
      setLocalValues(next);
      onChange(next);
    },
    [localValues, onChange],
  );

  const handleReset = useCallback(
    (idx: number) => {
      const defaultVal = label === 'Size' ? 1 : 0;
      const next: [number, number, number] = [...localValues];
      next[idx] = defaultVal;
      setLocalValues(next);
      onChange(next);
    },
    [label, localValues, onChange],
  );

  return (
    <div className="space-y-0.5">
      {/* Label */}
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
        <button
          className="text-[9px] text-gray-400 hover:text-green-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-green-500/30 rounded-sm px-1 py-px transition-all duration-200"
          onClick={() => {
            const defaultVals: [number, number, number] = label === 'Size' ? [1, 1, 1] : [0, 0, 0];
            setLocalValues(defaultVals);
            onChange(defaultVals);
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
