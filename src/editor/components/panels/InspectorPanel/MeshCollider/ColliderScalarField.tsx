import React from 'react';

import { ComponentField } from '@/editor/components/shared/ComponentField';

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
  return (
    <ComponentField
      label={label}
      type="number"
      value={value}
      onChange={(value) => onChange(value as number)}
      resetValue={defaultValue}
      min={min}
      step={step}
      enableDrag={true}
      dragSensitivity={sensitivity}
      dragColor="#ffff00"
    />
  );
};
