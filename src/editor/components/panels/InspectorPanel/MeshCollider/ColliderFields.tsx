import React from 'react';

import { Vector3Field } from '@/editor/components/shared/Vector3Field';

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

  const resetValue: [number, number, number] = label === 'Size' ? [1, 1, 1] : [0, 0, 0];

  return (
    <Vector3Field
      label={label}
      value={safeValue}
      onChange={onChange}
      step={step}
      sensitivity={sensitivity}
      resetValue={resetValue}
    />
  );
};
