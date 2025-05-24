import React, { useCallback, useEffect, useState } from 'react';

import { AxisInput } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/AxisInput';
import { useDragAxis } from '@/editor/components/panels/InspectorPanel/Transform/TransformFields/useDragAxis';

export interface IColliderScalarFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  sensitivity?: number;
  min?: number;
  defaultValue?: number;
}

export const ColliderScalarField: React.FC<IColliderScalarFieldProps> = ({
  label,
  value,
  onChange,
  step = 0.1,
  sensitivity = 0.1,
  min = 0.01,
  defaultValue = 1,
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleInputChange = useCallback(
    (val: number) => {
      if (isNaN(val) || val < min) return;
      setLocalValue(val);
      onChange(val);
    },
    [onChange, min],
  );

  const handleReset = useCallback(() => {
    setLocalValue(defaultValue);
    onChange(defaultValue);
  }, [defaultValue, onChange]);

  const { dragActive, onDragStart } = useDragAxis(localValue, handleInputChange, sensitivity);

  return (
    <div className="space-y-0.5">
      {/* Label */}
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[11px] font-medium text-gray-300">{label}</span>
        <button
          className="text-[9px] text-gray-400 hover:text-green-300 bg-black/30 hover:bg-gray-700/50 border border-gray-600/30 hover:border-green-500/30 rounded-sm px-1 py-px transition-all duration-200"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>

      <div className="space-y-px">
        <AxisInput
          axis="R"
          color="#ffff00" // Yellow for radius
          value={localValue}
          onChange={handleInputChange}
          onDragStart={onDragStart}
          onReset={handleReset}
          step={step}
          dragActive={dragActive}
        />
      </div>
    </div>
  );
};
