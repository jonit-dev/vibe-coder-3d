import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ITransformFieldsProps {
  label: string;
  value: [number, number, number];
  onChange: (next: [number, number, number]) => void;
}

// Unity-style colors for axes
const axisColors = {
  x: '#ff5555',
  y: '#55ff55',
  z: '#5555ff',
};

const TransformFields: React.FC<ITransformFieldsProps> = ({ label, value, onChange }) => {
  // State to track the dragging operations
  const [dragAxis, setDragAxis] = useState<number | null>(null);
  const [dragStartValue, setDragStartValue] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [localValues, setLocalValues] = useState<[number, number, number]>([...value]);

  // Refs to always have latest state in handlers
  const dragAxisRef = useRef<number | null>(dragAxis);
  const dragStartValueRef = useRef(dragStartValue);
  const dragStartXRef = useRef(dragStartX);
  const localValuesRef = useRef<[number, number, number]>(localValues);

  useEffect(() => {
    dragAxisRef.current = dragAxis;
  }, [dragAxis]);
  useEffect(() => {
    dragStartValueRef.current = dragStartValue;
  }, [dragStartValue]);
  useEffect(() => {
    dragStartXRef.current = dragStartX;
  }, [dragStartX]);
  useEffect(() => {
    localValuesRef.current = localValues;
  }, [localValues]);

  // When value prop changes, update local values
  useEffect(() => {
    setLocalValues([...value]);
  }, [value]);

  // Handle input change from the text field
  const handleInputChange = useCallback(
    (idx: number, val: string) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) return;
      const next: [number, number, number] = [...localValuesRef.current];
      next[idx] = parsed;
      setLocalValues(next);
      onChange(next);
    },
    [onChange],
  );

  // Handle dragging
  const handleDragMove = useCallback(
    (e: MouseEvent) => {
      const axis = dragAxisRef.current;
      if (axis === null) return;
      const sensitivity = label === 'Scale' ? 0.01 : 0.1;
      const delta = (e.clientX - dragStartXRef.current) * sensitivity;
      const next: [number, number, number] = [...localValuesRef.current];
      next[axis] = Number((dragStartValueRef.current + delta).toFixed(2));
      console.log('DragMove', { axis, delta, next });
      setLocalValues(next);
      onChange(next);
    },
    [label, onChange],
  );

  // End dragging operation
  const handleDragEnd = useCallback(() => {
    console.log('DragEnd');
    setDragAxis(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  }, [handleDragMove]);

  // Start dragging operation
  const handleDragStart = useCallback(
    (idx: number, e: React.MouseEvent) => {
      console.log('DragStart', { idx, x: e.clientX, value: localValuesRef.current[idx] });
      setDragAxis(idx);
      setDragStartValue(localValuesRef.current[idx]);
      setDragStartX(e.clientX);
      // Attach listeners
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
    },
    [handleDragMove, handleDragEnd],
  );

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Reset a specific axis to default value
  const resetValue = useCallback(
    (idx: number) => {
      const defaultVal = label === 'Scale' ? 1 : 0;
      const next: [number, number, number] = [...localValuesRef.current];
      next[idx] = defaultVal;
      setLocalValues(next);
      onChange(next);
    },
    [label, onChange],
  );

  // Styling for input fields with Unity-like appearance
  const inputBaseStyle =
    'bg-[#383838] border border-[#555] rounded px-2 py-1 text-xs text-white w-20 focus:outline-none focus:ring-1';
  const xStyle = `${inputBaseStyle} focus:ring-[${axisColors.x}]`;
  const yStyle = `${inputBaseStyle} focus:ring-[${axisColors.y}]`;
  const zStyle = `${inputBaseStyle} focus:ring-[${axisColors.z}]`;

  return (
    <div className="mb-3">
      {/* Label */}
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-300 font-medium">{label}</span>
        <button
          className="text-[10px] text-gray-400 hover:text-white bg-[#444] hover:bg-[#555] rounded px-1"
          onClick={() => {
            const defaultVals: [number, number, number] = label === 'Scale' ? [1, 1, 1] : [0, 0, 0];
            setLocalValues(defaultVals);
            onChange(defaultVals);
          }}
        >
          Reset
        </button>
      </div>

      {/* X field */}
      <div className="flex justify-between items-center mb-1">
        <span className="w-6 text-xs font-medium text-center" style={{ color: axisColors.x }}>
          X
        </span>
        <div className="flex-1 flex items-center">
          <input
            className={xStyle}
            type="number"
            step={label === 'Scale' ? 0.1 : 0.01}
            value={localValues[0].toFixed(2)}
            onChange={(e) => handleInputChange(0, e.target.value)}
          />
          <div
            className="w-4 h-4 ml-1 bg-[#444] hover:bg-[#555] rounded cursor-ew-resize flex items-center justify-center"
            onMouseDown={(e) => handleDragStart(0, e)}
            style={{ cursor: dragAxis === 0 ? 'ew-resize' : 'pointer' }}
          >
            <span className="text-[8px]">⋮</span>
          </div>
          <button
            className="w-4 h-4 ml-1 text-[10px] text-gray-400 hover:text-white"
            onClick={() => resetValue(0)}
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Y field */}
      <div className="flex justify-between items-center mb-1">
        <span className="w-6 text-xs font-medium text-center" style={{ color: axisColors.y }}>
          Y
        </span>
        <div className="flex-1 flex items-center">
          <input
            className={yStyle}
            type="number"
            step={label === 'Scale' ? 0.1 : 0.01}
            value={localValues[1].toFixed(2)}
            onChange={(e) => handleInputChange(1, e.target.value)}
          />
          <div
            className="w-4 h-4 ml-1 bg-[#444] hover:bg-[#555] rounded cursor-ew-resize flex items-center justify-center"
            onMouseDown={(e) => handleDragStart(1, e)}
            style={{ cursor: dragAxis === 1 ? 'ew-resize' : 'pointer' }}
          >
            <span className="text-[8px]">⋮</span>
          </div>
          <button
            className="w-4 h-4 ml-1 text-[10px] text-gray-400 hover:text-white"
            onClick={() => resetValue(1)}
          >
            ⟲
          </button>
        </div>
      </div>

      {/* Z field */}
      <div className="flex justify-between items-center">
        <span className="w-6 text-xs font-medium text-center" style={{ color: axisColors.z }}>
          Z
        </span>
        <div className="flex-1 flex items-center">
          <input
            className={zStyle}
            type="number"
            step={label === 'Scale' ? 0.1 : 0.01}
            value={localValues[2].toFixed(2)}
            onChange={(e) => handleInputChange(2, e.target.value)}
          />
          <div
            className="w-4 h-4 ml-1 bg-[#444] hover:bg-[#555] rounded cursor-ew-resize flex items-center justify-center"
            onMouseDown={(e) => handleDragStart(2, e)}
            style={{ cursor: dragAxis === 2 ? 'ew-resize' : 'pointer' }}
          >
            <span className="text-[8px]">⋮</span>
          </div>
          <button
            className="w-4 h-4 ml-1 text-[10px] text-gray-400 hover:text-white"
            onClick={() => resetValue(2)}
          >
            ⟲
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransformFields;
