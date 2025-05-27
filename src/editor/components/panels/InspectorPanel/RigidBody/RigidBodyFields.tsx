import React from 'react';

import { Vector3Field } from '@/editor/components/shared/Vector3Field';

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
  const handleVectorChange = (newValue: [number, number, number]) => {
    // Convert back to the expected onChange format (index, value)
    newValue.forEach((val, idx) => {
      if (val !== value[idx]) {
        onChange(idx, val);
      }
    });
  };

  return (
    <Vector3Field
      label={label}
      value={value}
      onChange={handleVectorChange}
      step={step}
      sensitivity={sensitivity}
      resetValue={[0, 0, 0]}
    />
  );
};
